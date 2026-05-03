
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '@/lib/api.js';
import { useAuth } from '@/contexts/AuthContext.jsx';
import socket from '@/lib/socket.js';
import { Button } from '@/components/ui/button.jsx';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card.jsx';
import { Skeleton } from '@/components/ui/skeleton.jsx';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog.jsx';
import StatusBadge from '@/components/tickets/StatusBadge.jsx';
import SectionHeader from '@/components/common/SectionHeader.jsx';
import { ArrowLeft, Phone, Calendar, User, MapPin, Download, AlertCircle, Star } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

const extractItems = (payload) => {
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload)) return payload;
  return [];
};

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

export default function TicketDetailPage() {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  
  const [ticket, setTicket] = useState(null);
  const [attachments, setAttachments] = useState([]);
  const [notes, setNotes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [waNumber, setWaNumber] = useState('');
  const [reporterName, setReporterName] = useState('');
  const [hasRated, setHasRated] = useState(false);
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);

  // Socket.IO: dengarkan event status_changed (untuk Satker)
  useEffect(() => {
    const handleStatusChanged = (data) => {
      if (data.ticket_id !== id) return;
      // Update ticket state agar UI langsung reflect status baru
      setTicket((prev) => prev ? { ...prev, status: data.new_status, rejection_reason: data.reason || prev.rejection_reason } : prev);
      if (data.new_status === 'Ditolak') {
        toast.error(
          data.reason
            ? `Permohonan ${data.ticket_number || ''} ditolak. Alasan: ${data.reason}`
            : `Permohonan ${data.ticket_number || ''} telah ditolak.`,
          { duration: 8000 }
        );
      } else {
        toast.info(`Status permohonan ${data.ticket_number || ''} berubah menjadi ${data.new_status}.`);
      }
    };

    socket.on('ticket:status_changed', handleStatusChanged);
    return () => socket.off('ticket:status_changed', handleStatusChanged);
  }, [id]);

  useEffect(() => {
    const fetchTicketData = async () => {
      try {
        const { data: ticketData } = await api.get(`/tickets/${id}`);
        setTicket(ticketData);

        setReporterName(ticketData.reporter_name || t('tickets.unknown_user'));

        const { data: settingsData } = await api.get('/settings');
        setWaNumber(settingsData?.settings?.whatsapp_number || '');

        const { data: attachData } = await api.get(`/uploads/ticket/${id}`);
        setAttachments(Array.isArray(attachData?.attachments) ? attachData.attachments : []);

        const { data: notesData } = await api.get(`/tickets/${id}/notes`);
        setNotes(notesData || []);

        // Cek apakah permohonan ini sudah dirating (hanya relevan untuk Satker)
        try {
          const { data: ratingCheck } = await api.get('/tickets/pending-rating');
          // Jika tidak ada pending rating, berarti permohonan ini (jika Selesai) sudah dirating
          if (ticketData.status === 'Selesai') {
            setHasRated(!ratingCheck.pending || ratingCheck.ticket?.id !== id);
          }
        } catch (_) {/* tidak kritis */}

      } catch (err) {
        console.error('Error fetching ticket details:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTicketData();
  }, [id, t]);

  const handleWhatsApp = () => {
    if (!waNumber) {
      toast.error('Nomor WhatsApp Subtekinfo belum dikonfigurasi.');
      return;
    }
    window.open(`https://wa.me/${waNumber}`, '_blank', 'noopener,noreferrer');
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <AlertCircle className="h-12 w-12 text-destructive" />
        <h2 className="text-2xl font-bold">Permohonan tidak ditemukan</h2>
        <Button onClick={() => navigate(-1)}>{t('buttons.back')}</Button>
      </div>
    );
  }

  const isPadalAssigned = !!ticket.padal_id;
  const canEditOrCancel = currentUser?.role === 'Satker' && ticket.user_id === currentUser?.id && ticket.status === 'Pending';

  const handleCancelTicket = async () => {
    try {
      await api.patch(`/tickets/${ticket.id}`, {
        status: 'Dibatalkan',
        closed_at: new Date().toISOString(),
      });
      toast.success('Permohonan berhasil dibatalkan');
      navigate('/satker/tickets');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Gagal membatalkan permohonan');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-500">
      <Button variant="ghost" onClick={() => navigate(-1)} className="pl-0 hover:bg-transparent hover:underline text-muted-foreground">
        <ArrowLeft className="mr-2 h-4 w-4" />
        {t('buttons.back')}
      </Button>

      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className="font-mono text-sm font-semibold bg-muted px-2 py-1 rounded text-muted-foreground border">
              {ticket.ticket_number}
            </span>
            <StatusBadge status={ticket.status} />
          </div>
          <SectionHeader title={ticket.title} />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            onClick={handleWhatsApp}
            className="gap-2 shrink-0"
          >
            <Phone className="h-4 w-4" />
            Hubungi via WhatsApp
          </Button>
          {canEditOrCancel && (
            <>
              <Button
                variant="outline"
                className="shrink-0"
                onClick={() => navigate(`/satker/tickets/${ticket.id}/edit`)}
              >
                Edit Permohonan
              </Button>
              <Button
                variant="destructive"
                className="shrink-0"
                onClick={() => setIsCancelDialogOpen(true)}
              >
                Batalkan Permohonan
              </Button>
            </>
          )}
          {ticket.status === 'Selesai' && !hasRated && (currentUser?.role === 'Satker' || currentUser?.role === 'Teknisi') && (
            <Button
              variant="outline"
              className="gap-2 shrink-0 border-amber-400 text-amber-600 hover:bg-amber-50"
              onClick={() => navigate(`/satker/rating?ticket_id=${ticket.id}`)}
            >
              <Star className="h-4 w-4" />
              Beri Rating
            </Button>
          )}
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          {ticket.status === 'Ditolak' && ticket.rejection_reason && (
            <Card className="border-destructive/50 bg-destructive/5 shadow-sm">
              <CardContent className="p-5">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-destructive mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-destructive mb-1">Permohonan Ditolak</p>
                    <p className="text-sm text-foreground">{ticket.rejection_reason}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
          <Card className="border-border shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Deskripsi Kendala</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-foreground whitespace-pre-wrap leading-relaxed">
                {ticket.description}
              </p>

              {attachments.length > 0 && (
                <div className="mt-8 pt-6 border-t">
                  <h3 className="text-sm font-semibold mb-3">Lampiran ({attachments.length})</h3>
                  <div className="grid sm:grid-cols-2 gap-3">
                    {attachments.map((file) => (
                      <div key={file.id} className="flex items-center justify-between p-3 bg-muted rounded-lg border border-border">
                        <span className="text-sm font-medium truncate pr-4">{file.file_name}</span>
                        <Button variant="secondary" size="icon" className="h-8 w-8 shrink-0 hover:bg-primary/20 hover:text-primary" asChild>
                          <a href={buildAttachmentUrl(file.file_path)} target="_blank" rel="noopener noreferrer" download={file.file_name}>
                            <Download className="h-4 w-4" />
                          </a>
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {notes.length > 0 && (
            <Card className="border-border shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg">Catatan Teknisi</CardTitle>
                <CardDescription>Catatan internal proses pengerjaan (Read-only)</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {notes.map(note => (
                  <div key={note.id} className="p-4 bg-muted/50 rounded-xl border border-border">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-sm">{note.technician_name || t('roles.technician')}</span>
                      <span className="text-xs text-muted-foreground">{safeFormatDate(note.created_at || note.created, 'dd MMM yyyy HH:mm')}</span>
                    </div>
                    <p className="text-sm text-foreground">{note.note_content}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card className="border-border shadow-sm bg-muted/30">
            <CardContent className="p-5 space-y-4">
              <div className="space-y-1.5">
                <div className="flex items-center text-muted-foreground text-sm">
                  <User className="mr-2 h-4 w-4" /> {t('tickets.reporter')}
                </div>
                <div className="font-medium">{reporterName}</div>
              </div>
              
              <div className="space-y-1.5">
                <div className="flex items-center text-muted-foreground text-sm">
                  <MapPin className="mr-2 h-4 w-4" /> Lokasi
                </div>
                <div className="font-medium">{ticket.location}</div>
              </div>

              <div className="pt-4 border-t space-y-1.5">
                <div className="flex items-center text-muted-foreground text-sm">
                  <User className="mr-2 h-4 w-4" /> Padal Ditugaskan
                </div>
                <div className="font-medium">
                  {ticket.padal_name ? (
                    ticket.padal_name
                  ) : (
                    <span className="text-muted-foreground italic font-normal">Menunggu penugasan</span>
                  )}
                </div>
              </div>

              <div className="pt-4 border-t space-y-3">
                <div>
                  <div className="flex items-center text-muted-foreground text-xs uppercase tracking-wider mb-1">
                    <Calendar className="mr-1.5 h-3 w-3" /> Dibuat pada
                  </div>
                  <div className="text-sm font-medium">{safeFormatDate(ticket.created_at || ticket.created)}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <AlertDialog open={isCancelDialogOpen} onOpenChange={setIsCancelDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Batalkan Permohonan?</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin membatalkan permohonan ini? Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Tidak, Kembali</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleCancelTicket}
            >
              Ya, Batalkan
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
