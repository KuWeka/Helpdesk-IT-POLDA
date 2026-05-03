import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '@/lib/api.js';
import { Button } from '@/components/ui/button.jsx';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.jsx';
import { Skeleton } from '@/components/ui/skeleton.jsx';
import { Empty, EMPTY_STATE_VARIANTS } from '@/components/ui/empty.jsx';
import StatusBadge from '@/components/tickets/StatusBadge.jsx';
import SectionHeader from '@/components/common/SectionHeader.jsx';
import { Calendar, User, MapPin, Download, FileImage as FileIcon, Activity } from 'lucide-react';
import { format } from 'date-fns';

const safeFormatDate = (value, pattern = 'dd MMM yyyy, HH:mm') => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return format(date, pattern);
};

const buildAttachmentUrl = (filePath = '') => {
  const apiBase = (api.defaults.baseURL || '').replace(/\/api\/?$/, '');
  return `${apiBase}/uploads${filePath}`;
};

export default function TeknisiTicketDetailPage() {
  const { id } = useParams();
  const [ticket, setTicket] = useState(null);
  const [attachments, setAttachments] = useState([]);
  const [notes, setNotes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [ticketError, setTicketError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [ticketRes, attachRes, noteRes] = await Promise.allSettled([
          api.get(`/tickets/${id}`),
          api.get(`/tickets/${id}/attachments`),
          api.get(`/tickets/${id}/notes`),
        ]);
        if (ticketRes.status === 'fulfilled') {
          setTicket(ticketRes.value.data?.data || ticketRes.value.data);
        } else {
          setTicketError('Permohonan tidak ditemukan.');
        }
        if (attachRes.status === 'fulfilled') {
          const d = attachRes.value.data;
          setAttachments(Array.isArray(d?.data) ? d.data : Array.isArray(d) ? d : []);
        }
        if (noteRes.status === 'fulfilled') {
          const d = noteRes.value.data;
          setNotes(Array.isArray(d?.data) ? d.data : Array.isArray(d) ? d : []);
        }
      } catch (err) {
        setTicketError('Gagal memuat detail permohonan.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [id]);

  if (isLoading) {
    return (
      <div className="space-y-6 animate-in fade-in duration-500">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-4">
            <Skeleton className="h-48 w-full rounded-xl" />
            <Skeleton className="h-32 w-full rounded-xl" />
          </div>
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  if (ticketError || !ticket) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Empty variant={EMPTY_STATE_VARIANTS.ERROR} title="Permohonan tidak ditemukan" description={ticketError} />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <SectionHeader
        title={`Detail Permohonan — ${ticket.ticket_number}`}
        subtitle="Tampilan read-only untuk Teknisi."
      />

      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link to="/teknisi/tickets" className="hover:text-primary transition-colors font-medium">Semua Permohonan</Link>
        <span>/</span>
        <span className="text-foreground font-medium">{ticket.ticket_number}</span>
      </nav>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <CardTitle className="text-xl leading-tight">{ticket.title}</CardTitle>
                <StatusBadge status={ticket.status} />
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">{ticket.description}</p>

              {ticket.status === 'Ditolak' && ticket.rejection_reason && (
                <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-4">
                  <p className="text-sm font-semibold text-destructive mb-1">Alasan Penolakan</p>
                  <p className="text-sm text-destructive/80">{ticket.rejection_reason}</p>
                </div>
              )}

              {attachments.length > 0 && (
                <div>
                  <p className="text-sm font-semibold mb-2">Lampiran</p>
                  <div className="flex flex-wrap gap-2">
                    {attachments.map((att) => (
                      <a
                        key={att.id}
                        href={buildAttachmentUrl(att.file_path)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm border rounded-lg px-3 py-2 hover:bg-muted transition-colors"
                      >
                        <FileIcon className="h-4 w-4 text-muted-foreground" />
                        <span>{att.original_name || att.file_name}</span>
                        <Download className="h-3.5 w-3.5 text-muted-foreground" />
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Notes */}
          {notes.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Activity className="h-4 w-4" /> Catatan Teknisi
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {notes.map((note) => (
                  <div key={note.id} className="border rounded-lg p-3 bg-muted/20">
                    <p className="text-sm">{note.content}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {note.author_name} — {safeFormatDate(note.created_at)}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar info */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Informasi Permohonan</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-start gap-3">
                <User className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Pelapor</p>
                  <p className="font-medium">{ticket.reporter_name || '-'}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <User className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Padal</p>
                  <p className="font-medium">{ticket.padal_name || 'Belum ditentukan'}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Satuan Kerja</p>
                  <p className="font-medium">{ticket.satker_name || ticket.division_name || '-'}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Calendar className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Tanggal Dibuat</p>
                  <p className="font-medium">{safeFormatDate(ticket.created_at || ticket.created)}</p>
                </div>
              </div>
              {ticket.updated_at && (
                <div className="flex items-start gap-3">
                  <Calendar className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">Terakhir Diperbarui</p>
                    <p className="font-medium">{safeFormatDate(ticket.updated_at)}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Button variant="outline" className="w-full" asChild>
            <Link to="/teknisi/tickets">Kembali ke Daftar Permohonan</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
