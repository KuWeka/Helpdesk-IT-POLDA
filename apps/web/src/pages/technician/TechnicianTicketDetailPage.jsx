
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext.jsx';
import api from '@/lib/api.js';
import { Button } from '@/components/ui/button.jsx';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.jsx';
import { Skeleton } from '@/components/ui/skeleton.jsx';
import { Empty, EMPTY_STATE_VARIANTS } from '@/components/ui/empty.jsx';
import { Textarea } from '@/components/ui/textarea.jsx';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog.jsx';
import StatusBadge from '@/components/StatusBadge.jsx';
import UrgencyBadge from '@/components/UrgencyBadge.jsx';
import SectionHeader from '@/components/SectionHeader.jsx';
import { MessageSquare, Calendar, User, MapPin, Download, AlertCircle, Phone, CheckCircle2, XCircle, FileImage as FileIcon, Activity, Loader2, FileText, Hand } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

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

export default function TechnicianTicketDetailPage() {
  const { ticketId } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  
  const [ticket, setTicket] = useState(null);
  const [attachments, setAttachments] = useState([]);
  const [notes, setNotes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [ticketError, setTicketError] = useState(null);

  const [noteContent, setNoteContent] = useState('');
  const [isSavingNote, setIsSavingNote] = useState(false);
  const [isTakingTicket, setIsTakingTicket] = useState(false);
  
  const [actionModal, setActionModal] = useState({ type: null, isOpen: false }); 
  const [actionReason, setActionReason] = useState('');
  const [isProcessingAction, setIsProcessingAction] = useState(false);

  const fetchTicketData = async () => {
    setIsLoading(true);
    setTicketError(null);
    
    try {
      const { data: ticketData } = await api.get(`/tickets/${ticketId}`);
      
      setTicket(ticketData);

      const { data: attachData } = await api.get(`/uploads/ticket/${ticketId}`);
      setAttachments(Array.isArray(attachData?.attachments) ? attachData.attachments : []);

      const { data: notesData } = await api.get(`/tickets/${ticketId}/notes`);
      setNotes(notesData || []);

    } catch (err) {
      console.error('Error fetching ticket ID:', ticketId, err.response || err);
      
      if (err.status === 404 || err.status === 403) {
        setTicketError('Tiket tidak ditemukan atau Anda tidak memiliki akses.');
      } else {
        setTicketError('Gagal memuat tiket. Silakan coba lagi.');
        toast.error('Gagal memuat detail tiket');
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (ticketId) {
      fetchTicketData();
    }
  }, [ticketId]);

  const handleTakeTicket = async () => {
    if (!ticket || !currentUser) return;
    
    setIsTakingTicket(true);
    try {
      await api.patch(`/tickets/${ticket.id}`, {
        assigned_technician_id: currentUser.id,
        status: 'Proses'
      });
      
      toast.success('Tiket berhasil diambil dan dipindahkan ke daftar Proses Anda.');
      
      setTimeout(() => {
        fetchTicketData();
      }, 500);
      
    } catch (error) {
      console.error('Error taking ticket:', error.response || error);
      if (error.status === 404) {
        toast.error('Gagal: Tiket tidak ditemukan atau sudah diambil teknisi lain.');
      } else {
        toast.error('Gagal mengambil tiket: ' + (error.response?.message || error.message));
      }
    } finally {
      setIsTakingTicket(false);
    }
  };

  const handleSaveNote = async () => {
    if (!noteContent.trim()) return;
    setIsSavingNote(true);
    try {
      await api.post(`/tickets/${ticketId}/notes`, {
        note_content: noteContent.trim()
      });
      
      toast.success('Catatan berhasil disimpan');
      setNoteContent('');
      fetchTicketData();
    } catch (error) {
      console.error('Error saving note:', error);
      toast.error('Gagal menyimpan catatan');
    } finally {
      setIsSavingNote(false);
    }
  };

  const handleAction = async () => {
    if ((actionModal.type === 'tolak' || actionModal.type === 'batalkan') && !actionReason.trim()) {
      toast.error('Alasan wajib diisi');
      return;
    }

    setIsProcessingAction(true);
    let newStatus = '';
    let statusMessage = '';

    if (actionModal.type === 'selesai') {
      newStatus = 'Selesai';
      statusMessage = 'Tiket berhasil diselesaikan';
    } else if (actionModal.type === 'tolak') {
      newStatus = 'Ditolak';
      statusMessage = 'Tiket ditolak';
    } else if (actionModal.type === 'batalkan') {
      newStatus = 'Dibatalkan';
      statusMessage = 'Tiket dibatalkan';
    }

    try {
      if (actionReason.trim()) {
        const prefix = actionModal.type === 'tolak' ? '[ALASAN PENOLAKAN] ' : '[ALASAN PEMBATALAN] ';
        await api.post(`/tickets/${ticketId}/notes`, {
          note_content: prefix + actionReason.trim()
        });
      }

      await api.patch(`/tickets/${ticketId}`, {
        status: newStatus,
        closed_at: new Date().toISOString()
      });

      toast.success(statusMessage);
      setActionModal({ type: null, isOpen: false });
      setActionReason('');
      fetchTicketData();
    } catch (error) {
      console.error('Error updating ticket action:', error.response || error);
      if (error.status === 404) {
        toast.error('Tiket tidak ditemukan atau Anda tidak memiliki akses (404)');
      } else {
        toast.error('Terjadi kesalahan saat memproses tiket: ' + (error.response?.message || error.message));
      }
    } finally {
      setIsProcessingAction(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-6xl mx-auto">
        <Skeleton className="h-8 w-64" />
        <div className="grid lg:grid-cols-3 gap-6">
          <Skeleton className="h-96 lg:col-span-2 rounded-2xl" />
          <Skeleton className="h-96 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (ticketError || !ticket) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-5 animate-in fade-in">
        <div className="h-20 w-20 bg-destructive/10 rounded-full flex items-center justify-center">
          <AlertCircle className="h-10 w-10 text-destructive" />
        </div>
        <div className="text-center space-y-1.5">
          <h2 className="text-2xl font-bold tracking-tight">Terjadi Kesalahan</h2>
          <p className="text-muted-foreground max-w-md mx-auto">
            {ticketError || 'Tiket sedang diproses atau Anda tidak memiliki akses. Kembali ke dashboard dan coba lagi.'}
          </p>
        </div>
        <div className="flex gap-3 mt-4">
          <Button variant="outline" onClick={() => navigate('/technician/dashboard')}>Kembali ke Dashboard</Button>
          <Button onClick={fetchTicketData}>Coba Lagi</Button>
        </div>
      </div>
    );
  }

  const isMyProcess = ticket.status === 'Proses' && ticket.assigned_technician_id === currentUser.id;
  const isAvailableToTake = ticket.status === 'Pending' && !ticket.assigned_technician_id;
  const userNameDisplay = ticket.reporter_name || ticket.user_id || 'Unknown User';

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-500 pb-12">
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
        <Link to="/technician/tickets" className="hover:text-primary transition-colors font-medium">Tiket Saya</Link>
        <span>/</span>
        <span className="text-foreground font-medium">{ticket.ticket_number}</span>
      </div>

      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-3 mb-3">
            <span className="font-mono text-sm font-semibold bg-muted px-2.5 py-1 rounded-md text-muted-foreground border">
              {ticket.ticket_number}
            </span>
            <StatusBadge status={ticket.status} />
            <UrgencyBadge urgency={ticket.urgency} />
          </div>
          <SectionHeader title={ticket.title} />
        </div>
        
        <div className="flex items-center gap-3 shrink-0">
          {ticket.status === 'Proses' && (
            <Button variant="outline" className="gap-2 border-primary text-primary hover:bg-primary/10 shadow-sm" onClick={() => navigate('/technician/chats')}>
              <MessageSquare className="h-4 w-4" />
              Chat Pelapor
            </Button>
          )}
          
          {isAvailableToTake && (
            <Button 
              onClick={handleTakeTicket} 
              disabled={isTakingTicket}
              className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90 shadow-md"
            >
              {isTakingTicket ? <Loader2 className="h-4 w-4 animate-spin" /> : <Hand className="h-4 w-4" />}
              Ambil Tiket Ini
            </Button>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6 items-start">
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-border shadow-sm overflow-hidden">
            <CardHeader className="pb-4 border-b bg-muted/20">
              <CardTitle className="text-lg">Informasi Tiket</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div>
                <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">Deskripsi Kendala</h4>
                <p className="text-foreground whitespace-pre-wrap leading-relaxed text-base">
                  {ticket.description}
                </p>
              </div>

              <div className="grid sm:grid-cols-2 gap-5 pt-5 border-t">
                <div className="space-y-1.5">
                  <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Lokasi</h4>
                  <div className="flex items-center gap-2 text-foreground font-medium">
                    <MapPin className="h-4 w-4 text-muted-foreground" /> {ticket.location}
                  </div>
                </div>
                <div className="space-y-1.5">
                  <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Tanggal Dibuat</h4>
                  <div className="flex items-center gap-2 text-foreground font-medium">
                    <Calendar className="h-4 w-4 text-muted-foreground" /> {safeFormatDate(ticket.created_at || ticket.created)}
                  </div>
                </div>
              </div>

              {attachments.length > 0 && (
                <div className="pt-5 border-t">
                  <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Lampiran ({attachments.length})</h4>
                  <div className="grid sm:grid-cols-2 gap-3">
                    {attachments.map((file) => (
                      <div key={file.id} className="flex items-center justify-between p-3 bg-muted/40 rounded-xl border border-border transition-colors hover:bg-muted/60">
                        <div className="flex items-center gap-3 overflow-hidden">
                          <FileIcon className="h-5 w-5 text-muted-foreground shrink-0" />
                          <span className="text-sm font-medium truncate">{file.file_name}</span>
                        </div>
                        <Button variant="ghost" size="icon" className="shrink-0 hover:text-primary" asChild>
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

          {isMyProcess && (
            <Card className="border-primary/20 shadow-md shadow-primary/5 bg-primary/5 overflow-hidden">
              <CardHeader className="pb-4 border-b border-primary/10">
                <CardTitle className="text-lg flex items-center gap-2 text-primary font-bold">
                  <Activity className="h-5 w-5" /> Panel Aksi Teknisi
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-5">
                <div className="space-y-3">
                  <label className="text-sm font-semibold text-primary/80">Catatan Progres Perbaikan</label>
                  <Textarea 
                    placeholder="Tambahkan update status perbaikan atau catatan internal..." 
                    className="min-h-[100px] bg-background resize-y shadow-sm border-primary/20 focus-visible:ring-primary/30"
                    value={noteContent}
                    onChange={(e) => setNoteContent(e.target.value)}
                  />
                  <div className="flex justify-end">
                    <Button onClick={handleSaveNote} disabled={isSavingNote || !noteContent.trim()} size="sm" className="gap-2 shadow-sm">
                      {isSavingNote ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                      Simpan Catatan
                    </Button>
                  </div>
                </div>

                <div className="pt-5 border-t border-primary/10 flex flex-wrap gap-3">
                  <Button 
                    className="bg-[#10b981] hover:bg-[#059669] text-white gap-2 flex-1 sm:flex-none shadow-sm"
                    onClick={() => setActionModal({ type: 'selesai', isOpen: true })}
                  >
                    <CheckCircle2 className="h-4 w-4" /> Selesai
                  </Button>
                  <Button 
                    variant="destructive" 
                    className="gap-2 flex-1 sm:flex-none shadow-sm"
                    onClick={() => setActionModal({ type: 'tolak', isOpen: true })}
                  >
                    <XCircle className="h-4 w-4" /> Tolak
                  </Button>
                  <Button 
                    variant="outline" 
                    className="gap-2 border-[#f97316] text-[#f97316] hover:bg-[#fff7ed] flex-1 sm:flex-none shadow-sm"
                    onClick={() => setActionModal({ type: 'batalkan', isOpen: true })}
                  >
                    Batalkan
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          <Card className="border-border shadow-sm">
            <CardHeader className="pb-4 border-b bg-muted/20">
              <CardTitle className="text-lg">Riwayat Catatan Internal</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {notes.length === 0 ? (
                <Empty
                  variant={EMPTY_STATE_VARIANTS.NO_RESULTS}
                  title="Belum ada catatan"
                  description="Belum ada catatan yang ditambahkan."
                />
              ) : (
                <div className="space-y-5">
                  {notes.map(note => (
                    <div key={note.id} className="relative pl-6 pb-2 border-l-2 border-muted/60 last:border-transparent">
                      <div className="absolute left-[-5px] top-1.5 h-2.5 w-2.5 rounded-full bg-primary ring-4 ring-background"></div>
                      <div className="bg-muted/30 p-4 rounded-xl border border-border">
                        <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
                          <span className="font-semibold text-sm text-foreground">{note.technician_name || note.technician_id || 'Teknisi'}</span>
                          <span className="text-xs font-medium text-muted-foreground bg-background px-2 py-0.5 rounded border">{safeFormatDate(note.created_at || note.created, 'dd MMM yyyy HH:mm')}</span>
                        </div>
                        <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{note.note_content}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="border-border shadow-sm overflow-hidden">
            <CardHeader className="pb-4 border-b bg-muted/20">
              <CardTitle className="text-lg flex items-center gap-2">
                <User className="h-5 w-5 text-primary" /> Data Pelapor
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-5">
              <div className="space-y-1.5">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Nama Lengkap</p>
                <p className="font-medium text-foreground text-base">{userNameDisplay}</p>
              </div>
              <div className="space-y-1.5">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Email</p>
                <p className="font-medium text-foreground truncate" title={ticket.reporter_email}>{ticket.reporter_email || '-'}</p>
              </div>
              <div className="space-y-1.5">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">No. Telepon / WA</p>
                <p className="font-medium text-foreground">{ticket.reporter_phone || '-'}</p>
              </div>
              
              {ticket.reporter_phone && (
                <Button className="w-full gap-2 bg-[#25D366] hover:bg-[#20bd5a] text-white mt-4 shadow-sm" asChild>
                  <a href={`https://wa.me/${ticket.reporter_phone.replace(/[^0-9]/g, '')}?text=Halo%20${ticket.reporter_name || 'user'},%20saya%20teknisi%20IT%20menghubungi%20terkait%20tiket%20${ticket.ticket_number}`} target="_blank" rel="noopener noreferrer">
                    <Phone className="h-4 w-4" /> Hubungi via WhatsApp
                  </a>
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={actionModal.isOpen} onOpenChange={(open) => !open && setActionModal({ type: null, isOpen: false })}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {actionModal.type === 'selesai' && 'Selesaikan Tiket'}
              {actionModal.type === 'tolak' && 'Tolak Tiket'}
              {actionModal.type === 'batalkan' && 'Batalkan Tiket'}
            </DialogTitle>
            <DialogDescription>
              {actionModal.type === 'selesai' && 'Pastikan perbaikan sudah benar-benar selesai. Status akan berubah menjadi Selesai.'}
              {actionModal.type === 'tolak' && 'Berikan alasan mengapa tiket ini ditolak. Status akan berubah menjadi Ditolak.'}
              {actionModal.type === 'batalkan' && 'Berikan alasan mengapa tiket ini dibatalkan. Status akan berubah menjadi Dibatalkan.'}
            </DialogDescription>
          </DialogHeader>
          
          {(actionModal.type === 'tolak' || actionModal.type === 'batalkan') && (
            <div className="space-y-3 mt-4">
              <label className="text-sm font-semibold text-foreground">
                Alasan <span className="text-destructive">*</span>
              </label>
              <Textarea 
                placeholder="Masukkan alasan detail secara lengkap..." 
                value={actionReason}
                onChange={(e) => setActionReason(e.target.value)}
                className="bg-background min-h-[100px] shadow-sm"
              />
            </div>
          )}
          
          <DialogFooter className="mt-6 gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setActionModal({ type: null, isOpen: false })} disabled={isProcessingAction}>
              Batal
            </Button>
            <Button 
              onClick={handleAction} 
              disabled={isProcessingAction}
              variant={actionModal.type === 'selesai' ? 'default' : 'destructive'}
              className="gap-2"
            >
              {isProcessingAction && <Loader2 className="h-4 w-4 animate-spin" />}
              {isProcessingAction ? 'Memproses...' : 'Konfirmasi'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
