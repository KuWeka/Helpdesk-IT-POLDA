import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '@/lib/api.js';
import { Card, CardContent } from '@/components/ui/card.jsx';
import { Button } from '@/components/ui/button.jsx';
import { Badge } from '@/components/ui/badge.jsx';
import { Textarea } from '@/components/ui/textarea.jsx';
import { Bell, Check, X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

/**
 * Komponen yang menampilkan notifikasi assignment masuk untuk Padal.
 * Diberikan props `assignments` (array dari pending assignments) dan `onResponded` callback.
 *
 * Setiap item assignment minimal memiliki: { ticket_id, ticket_number, title, assigned_by }
 */
export default function AssignmentNotificationBanner({ assignments = [], onResponded }) {
  const navigate = useNavigate();
  const [loadingId, setLoadingId] = useState(null);
  const [rejectNoteId, setRejectNoteId] = useState(null);
  const [rejectNote, setRejectNote] = useState('');

  if (assignments.length === 0) return null;

  const handleRespond = async (ticketId, accepted, note) => {
    setLoadingId(ticketId);
    try {
      await api.patch(`/tickets/${ticketId}/assignment/respond`, {
        accepted,
        note: note || undefined,
      });
      toast.success(accepted ? 'Assignment diterima. Tiket masuk ke status Proses.' : 'Assignment ditolak.');
      setRejectNoteId(null);
      setRejectNote('');
      onResponded?.();
      if (accepted) navigate(`/padal/tickets/${ticketId}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal merespons assignment');
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="space-y-3">
      {assignments.map((item) => (
        <Card key={item.ticket_id} className="border-amber-400 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-700">
          <CardContent className="pt-4 pb-3">
            <div className="flex items-start gap-3">
              <Bell className="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-sm">Assignment Masuk</span>
                  <Badge variant="outline" className="font-mono text-xs">{item.ticket_number}</Badge>
                </div>
                <p className="text-sm text-foreground mt-1 font-medium truncate">{item.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">Dari: {item.assigned_by}</p>

                {rejectNoteId === item.ticket_id ? (
                  <div className="mt-3 space-y-2">
                    <Textarea
                      placeholder="Alasan penolakan (opsional)..."
                      rows={2}
                      value={rejectNote}
                      onChange={(e) => setRejectNote(e.target.value)}
                      className="text-sm"
                    />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="destructive"
                        disabled={loadingId === item.ticket_id}
                        onClick={() => handleRespond(item.ticket_id, false, rejectNote)}
                      >
                        {loadingId === item.ticket_id ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4 mr-1" />}
                        Konfirmasi Tolak
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={loadingId === item.ticket_id}
                        onClick={() => { setRejectNoteId(null); setRejectNote(''); }}
                      >
                        Batal
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-2 mt-3">
                    <Button
                      size="sm"
                      className="bg-green-600 hover:bg-green-700 text-white"
                      disabled={loadingId === item.ticket_id}
                      onClick={() => handleRespond(item.ticket_id, true)}
                    >
                      {loadingId === item.ticket_id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4 mr-1" />}
                      Terima
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={loadingId === item.ticket_id}
                      onClick={() => { setRejectNoteId(item.ticket_id); setRejectNote(''); }}
                    >
                      <X className="h-4 w-4 mr-1" />
                      Tolak
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
