import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext.jsx';
import api from '@/lib/api.js';
import { Button } from '@/components/ui/button.jsx';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.jsx';
import { Skeleton } from '@/components/ui/skeleton.jsx';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog.jsx';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.jsx';
import StatusBadge from '@/components/tickets/StatusBadge.jsx';
import UrgencyBadge from '@/components/tickets/UrgencyBadge.jsx';
import SectionHeader from '@/components/common/SectionHeader.jsx';
import { ArrowLeft, Calendar, User, MapPin, AlertCircle, CheckCircle2, Trash2, UserPlus, Loader2, Download, FileImage as FileIcon } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

const extractItems = (payload) => {
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload)) return payload;
  return [];
};

const extractTechnicians = (payload) => {
  if (Array.isArray(payload?.data?.technicians)) return payload.data.technicians;
  if (Array.isArray(payload?.technicians)) return payload.technicians;
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

export default function AdminTicketDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  
  const [ticket, setTicket] = useState(null);
  const [attachments, setAttachments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [technicians, setTechnicians] = useState([]);

  const [isCompleteModalOpen, setIsCompleteModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  
  const [selectedTechId, setSelectedTechId] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const fetchTicketData = async () => {
    setIsLoading(true);
    try {
      const { data: ticketData } = await api.get(`/tickets/${id}`);
      setTicket(ticketData);

      const { data: attachData } = await api.get(`/uploads/ticket/${id}`);
      setAttachments(Array.isArray(attachData?.attachments) ? attachData.attachments : []);
    } catch (err) {
      console.error('Error fetching ticket:', err);
      toast.error('Gagal memuat detail tiket');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTechnicians = async () => {
    try {
      const { data } = await api.get('/technicians');
      const techs = extractTechnicians(data).filter((tech) => tech.is_active !== false);
      setTechnicians(techs);
    } catch (err) {
      console.error('Error fetching technicians:', err);
    }
  };

  useEffect(() => {
    fetchTicketData();
    if (currentUser?.role === 'Admin') {
      fetchTechnicians();
    }
  }, [id, currentUser]);

  const handleForceComplete = async () => {
    setIsProcessing(true);
    try {
      await api.patch(`/tickets/${id}`, {
        status: 'Selesai',
        closed_at: new Date().toISOString()
      });
      
      toast.success('Tiket berhasil diselesaikan');
      setIsCompleteModalOpen(false);
      fetchTicketData();
    } catch (error) {
      console.error('Force complete error:', error.response || error);
      toast.error('Gagal menyelesaikan tiket: ' + (error.response?.message || error.message));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDelete = async () => {
    setIsProcessing(true);
    try {
      await api.delete(`/tickets/${id}`);
      toast.success('Tiket berhasil dihapus');
      setIsDeleteModalOpen(false);
      navigate('/admin/tickets');
    } catch (error) {
      console.error('Delete error:', error.response || error);
      toast.error('Gagal menghapus tiket: ' + (error.response?.message || error.message));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAssignTech = async () => {
    if (!selectedTechId) {
      toast.error('Pilih teknisi terlebih dahulu');
      return;
    }
    setIsProcessing(true);
    try {
      await api.patch(`/tickets/${id}`, {
        assigned_technician_id: selectedTechId,
        status: ticket.status === 'Pending' ? 'Proses' : ticket.status
      });
      
      toast.success('Teknisi berhasil diassign');
      setIsAssignModalOpen(false);
      fetchTicketData();
    } catch (error) {
      console.error('Assign error details:', error.response || error);
      toast.error('Gagal mengassign teknisi: ' + (error.response?.message || error.message));
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto">
        <Skeleton className="h-8 w-64" />
        <Card><CardContent className="p-6"><Skeleton className="h-64 w-full" /></CardContent></Card>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <AlertCircle className="h-12 w-12 text-destructive" />
        <h2 className="text-2xl font-bold">Tiket tidak ditemukan</h2>
        <Button onClick={() => navigate('/admin/tickets')}>Kembali ke Daftar Tiket</Button>
      </div>
    );
  }

  const isAdmin = currentUser?.role === 'Admin';
  const reporterName = ticket.reporter_name || ticket.user_id || 'Unknown';
  const techName = ticket.technician_name || ticket.assigned_technician_id || 'Belum ada teknisi';

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-500 pb-12">
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
        <Link to="/admin/tickets" className="hover:text-primary transition-colors flex items-center gap-1">
          <ArrowLeft className="h-4 w-4" /> Semua Tiket
        </Link>
        <span>/</span>
        <span className="text-foreground font-medium">{ticket.ticket_number}</span>
      </div>

      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-3 mb-2">
            <span className="font-mono text-sm font-semibold bg-muted px-2 py-1 rounded-md text-muted-foreground border">
              {ticket.ticket_number}
            </span>
            <StatusBadge status={ticket.status} />
            <UrgencyBadge urgency={ticket.urgency} />
          </div>
          <SectionHeader title={ticket.title} />
        </div>
        
        {isAdmin && (
          <div className="flex flex-wrap gap-2 shrink-0">
            <Button 
              variant="outline" 
              className="border-blue-200 text-blue-600 hover:bg-blue-50"
              onClick={() => setIsAssignModalOpen(true)}
            >
              <UserPlus className="h-4 w-4 mr-2" /> Assign Teknisi
            </Button>
            {ticket.status !== 'Selesai' && ticket.status !== 'Dibatalkan' && ticket.status !== 'Ditolak' && (
              <Button 
                variant="destructive" 
                className="bg-red-600 hover:bg-red-700"
                onClick={() => setIsCompleteModalOpen(true)}
              >
                <CheckCircle2 className="h-4 w-4 mr-2" /> Paksa Selesai
              </Button>
            )}
            <Button 
              variant="destructive" 
              className="gap-2"
              onClick={() => setIsDeleteModalOpen(true)}
            >
              <Trash2 className="h-4 w-4" /> Hapus
            </Button>
          </div>
        )}
      </div>

      <Card className="border-border shadow-sm">
        <CardHeader className="pb-4 border-b bg-muted/30">
          <CardTitle className="text-lg">Detail Informasi</CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <div>
            <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">Deskripsi</h4>
            <p className="text-foreground whitespace-pre-wrap leading-relaxed">
              {ticket.description}
            </p>
          </div>

          {attachments.length > 0 && (
            <div className="pt-4 border-t">
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

          <div className="grid sm:grid-cols-2 gap-6 pt-4 border-t">
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-1">Lokasi</h4>
                <div className="flex items-center gap-2 text-foreground font-medium">
                  <MapPin className="h-4 w-4 text-muted-foreground" /> {ticket.location || '-'}
                </div>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-1">Pelapor</h4>
                <div className="flex items-center gap-2 text-foreground font-medium">
                  <User className="h-4 w-4 text-muted-foreground" /> {reporterName}
                </div>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-1">Teknisi Assigned</h4>
                <div className="flex items-center gap-2 text-foreground font-medium">
                  <User className="h-4 w-4 text-primary" /> {techName}
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-1">Tanggal Dibuat</h4>
                <div className="flex items-center gap-2 text-foreground font-medium">
                  <Calendar className="h-4 w-4 text-muted-foreground" /> {safeFormatDate(ticket.created_at || ticket.created)}
                </div>
              </div>
              {ticket.closed_at && (
                <div>
                  <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-1">Tanggal Ditutup</h4>
                  <div className="flex items-center gap-2 text-foreground font-medium">
                    <Calendar className="h-4 w-4 text-muted-foreground" /> {safeFormatDate(ticket.closed_at)}
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Modals */}
      <Dialog open={isCompleteModalOpen} onOpenChange={setIsCompleteModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Konfirmasi Paksa Selesai</DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin memaksa tiket ini menjadi status "Selesai"? Tindakan ini akan mencatat waktu penutupan saat ini.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setIsCompleteModalOpen(false)} disabled={isProcessing}>Batal</Button>
            <Button variant="destructive" onClick={handleForceComplete} disabled={isProcessing}>
              {isProcessing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              {isProcessing ? 'Memproses...' : 'Ya, Paksa Selesai'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Konfirmasi Hapus Tiket</DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin menghapus tiket ini secara permanen? Data yang dihapus tidak dapat dikembalikan.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)} disabled={isProcessing}>Batal</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isProcessing} className="gap-2">
              {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
              {isProcessing ? 'Menghapus...' : 'Ya, Hapus Tiket'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isAssignModalOpen} onOpenChange={setIsAssignModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Teknisi</DialogTitle>
            <DialogDescription>
              Pilih teknisi untuk menangani tiket ini.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Select value={selectedTechId} onValueChange={setSelectedTechId}>
              <SelectTrigger>
                <SelectValue placeholder="Pilih Teknisi" />
              </SelectTrigger>
              <SelectContent>
                {technicians.map(tech => (
                  <SelectItem key={tech.id} value={tech.id}>{tech.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAssignModalOpen(false)} disabled={isProcessing}>Batal</Button>
            <Button onClick={handleAssignTech} disabled={isProcessing || !selectedTechId} className="bg-blue-600 hover:bg-blue-700 text-white">
              {isProcessing ? 'Menyimpan...' : 'Simpan Assign'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
