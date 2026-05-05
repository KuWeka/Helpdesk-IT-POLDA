import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext.jsx';
import socket from '@/lib/socket.js';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.jsx';
import { Button } from '@/components/ui/button.jsx';
import { Badge } from '@/components/ui/badge.jsx';
import { Empty, EMPTY_STATE_VARIANTS } from '@/components/ui/empty.jsx';
import SectionHeader from '@/components/common/SectionHeader.jsx';
import {
  Bell, Trash2, X, TicketCheck, UserCheck, MessageSquareMore,
  RefreshCcw, Star, StarHalf, Info,
} from 'lucide-react';

const STORAGE_KEY = 'helpdesk_notifications_v1';

const EVENT_CONFIG = {
  'ticket:new': {
    label: 'Tiket Baru',
    icon: TicketCheck,
    color: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    badge: 'bg-blue-500/10 text-blue-600 border-blue-500/30',
  },
  'ticket:assigned': {
    label: 'Assignment Masuk',
    icon: UserCheck,
    color: 'bg-violet-500/10 text-violet-500 border-violet-500/20',
    badge: 'bg-violet-500/10 text-violet-600 border-violet-500/30',
  },
  'ticket:assignment_responded': {
    label: 'Respon Assignment',
    icon: MessageSquareMore,
    color: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
    badge: 'bg-amber-500/10 text-amber-600 border-amber-500/30',
  },
  'ticket:status_changed': {
    label: 'Status Tiket',
    icon: RefreshCcw,
    color: 'bg-green-500/10 text-green-500 border-green-500/20',
    badge: 'bg-green-500/10 text-green-600 border-green-500/30',
  },
  'ticket:rating_required': {
    label: 'Rating Diperlukan',
    icon: StarHalf,
    color: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
    badge: 'bg-orange-500/10 text-orange-600 border-orange-500/30',
  },
  'ticket:rating_received': {
    label: 'Rating Diterima',
    icon: Star,
    color: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
    badge: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/30',
  },
};

const DEFAULT_CONFIG = {
  label: 'Notifikasi',
  icon: Info,
  color: 'bg-muted/50 text-muted-foreground border-border',
  badge: 'bg-muted text-muted-foreground border-border',
};

function getRelativeTime(iso) {
  const diff = Date.now() - new Date(iso).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60) return 'Baru saja';
  const m = Math.floor(s / 60);
  if (m < 60) return `${m} mnt lalu`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} jam lalu`;
  const d = Math.floor(h / 24);
  return `${d} hari lalu`;
}

function formatPayload(type, payload = {}) {
  const lines = [];
  if (payload.ticket_number) lines.push({ key: 'Nomor Tiket', val: payload.ticket_number });
  if (payload.title) lines.push({ key: 'Judul', val: payload.title });
  if (payload.new_status) lines.push({ key: 'Status Baru', val: payload.new_status });
  if (payload.reason) lines.push({ key: 'Alasan', val: payload.reason });
  if (payload.padal_name) lines.push({ key: 'Padal', val: payload.padal_name });
  if (payload.teknisi_name) lines.push({ key: 'Teknisi', val: payload.teknisi_name });
  if (typeof payload.rating === 'number') lines.push({ key: 'Rating', val: '★'.repeat(payload.rating) + '☆'.repeat(5 - payload.rating) });
  if (payload.response) lines.push({ key: 'Respon', val: payload.response });
  if (payload.message) lines.push({ key: 'Pesan', val: payload.message });
  return lines;
}

function loadInitial() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export default function NotificationsPage() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState(loadInitial);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items.slice(0, 200)));
  }, [items]);

  useEffect(() => {
    const trackedEvents = Object.keys(EVENT_CONFIG);

    const makeHandler = (type) => (payload = {}) => {
      setItems((prev) => [
        {
          id: `${type}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          type,
          payload,
          created_at: new Date().toISOString(),
        },
        ...prev,
      ]);
    };

    const subscriptions = trackedEvents.map((type) => ({ type, handler: makeHandler(type) }));
    subscriptions.forEach(({ type, handler }) => socket.on(type, handler));

    return () => {
      subscriptions.forEach(({ type, handler }) => socket.off(type, handler));
    };
  }, []);

  const title = useMemo(() => {
    const role = currentUser?.role || 'User';
    return `Notifikasi ${role}`;
  }, [currentUser?.role]);

  const clearAll = () => setItems([]);
  const dismiss = (id) => setItems((prev) => prev.filter((n) => n.id !== id));

  const getTicketDetailPath = (payload = {}) => {
    const ticketId = payload.ticket_id || payload.id || null;
    if (!ticketId) return null;

    const role = String(currentUser?.role || '').toLowerCase();
    if (role === 'subtekinfo' || role === 'admin') return `/subtekinfo/tickets/${ticketId}`;
    if (role === 'padal' || role === 'teknisi') return `/padal/tickets/${ticketId}`;
    return `/satker/tickets/${ticketId}`;
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <SectionHeader
        title={title}
        subtitle="Daftar notifikasi realtime dari aktivitas tiket di sistem."
      />

      <Card className="border-border shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Bell className="h-4 w-4 text-primary" />
            Daftar Notifikasi
            {items.length > 0 && (
              <Badge variant="secondary" className="ml-1 text-xs px-1.5 py-0.5">
                {items.length}
              </Badge>
            )}
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={clearAll}
            disabled={items.length === 0}
            className="gap-2 text-destructive border-destructive/30 hover:bg-destructive/10 hover:text-destructive"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Bersihkan Semua
          </Button>
        </CardHeader>
        <CardContent className="pt-0">
          {items.length === 0 ? (
            <Empty
              className="border-0 shadow-none py-16"
              variant={EMPTY_STATE_VARIANTS.NO_RESULTS}
              title="Belum ada notifikasi"
              description="Notifikasi baru akan muncul otomatis saat ada event tiket."
            />
          ) : (
            <div className="space-y-2">
              {items.map((item) => {
                const cfg = EVENT_CONFIG[item.type] || DEFAULT_CONFIG;
                const Icon = cfg.icon;
                const lines = formatPayload(item.type, item.payload);
                const detailPath = getTicketDetailPath(item.payload);
                return (
                  <div
                    key={item.id}
                    className={`group relative flex gap-3 rounded-xl border p-4 transition-colors hover:bg-muted/30 ${cfg.color}`}
                  >
                    {/* Icon */}
                    <div className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border ${cfg.color}`}>
                      <Icon className="h-4 w-4" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge className={`text-xs font-medium border ${cfg.badge}`} variant="outline">
                          {cfg.label}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {getRelativeTime(item.created_at)}
                        </span>
                        <span className="text-xs text-muted-foreground hidden sm:inline">
                          · {new Date(item.created_at).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' })}
                        </span>
                      </div>

                      {lines.length > 0 ? (
                        <dl className="mt-1.5 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-0.5">
                          {lines.map(({ key, val }) => (
                            <div key={key} className="flex items-baseline gap-1.5 text-sm">
                              <dt className="text-xs text-muted-foreground shrink-0">{key}:</dt>
                              <dd className="truncate font-medium text-foreground">{val}</dd>
                            </div>
                          ))}
                        </dl>
                      ) : (
                        <p className="text-xs text-muted-foreground italic">Tidak ada detail tambahan.</p>
                      )}

                      {detailPath && (
                        <div className="mt-3">
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => navigate(detailPath)}
                          >
                            Lihat Detail
                          </Button>
                        </div>
                      )}
                    </div>

                    {/* Dismiss */}
                    <button
                      onClick={() => dismiss(item.id)}
                      className="absolute right-3 top-3 opacity-0 group-hover:opacity-100 transition-opacity rounded-md p-0.5 hover:bg-muted text-muted-foreground"
                      aria-label="Hapus notifikasi"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
