
import React, { useState, useEffect } from 'react';
import api from '@/lib/api.js';
import { Card, CardContent } from '@/components/ui/card.jsx';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table.jsx';
import { Input } from '@/components/ui/input.jsx';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.jsx';
import { Button } from '@/components/ui/button.jsx';
import { Skeleton } from '@/components/ui/skeleton.jsx';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog.jsx';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription as AlertDialogDescriptionText,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle as AlertDialogTitleText,
} from '@/components/ui/alert-dialog.jsx';
import { Search, Filter, RefreshCcw, Activity, CheckCircle2, Clock, Eye, Trash2, MapPin, User, Calendar, Loader2 } from 'lucide-react';
import StatusBadge from '@/components/StatusBadge.jsx';
import UrgencyBadge from '@/components/UrgencyBadge.jsx';
import { Empty, EMPTY_STATE_VARIANTS } from '@/components/ui/empty.jsx';
import SectionHeader from '@/components/SectionHeader.jsx';
import { format, differenceInDays, startOfMonth } from 'date-fns';
import { toast } from 'sonner';

const extractItems = (payload) => {
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload)) return payload;
  return [];
};

const safeDate = (value) => {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const safeFormat = (value, pattern = 'dd MMM yy') => {
  const date = safeDate(value);
  return date ? format(date, pattern) : '-';
};

export default function TicketHistoryPage() {
  const [tickets, setTickets] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [analytics, setAnalytics] = useState({ completedMonth: 0, avgDuration: 0, completionRate: 0 });

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('Selesai');
  const [urgencyFilter, setUrgencyFilter] = useState('all');
  const [techFilter, setTechFilter] = useState('all');

  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

  useEffect(() => {
    api.get('/users', { params: { role: 'Teknisi', sort: 'name', order: 'asc', perPage: 200 } })
      .then(({ data }) => setTechnicians(extractItems(data)))
      .catch(console.error);
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const startOfMonthStr = format(startOfMonth(new Date()), 'yyyy-MM-dd');
      const { data: allClosedMonthRes } = await api.get('/tickets', {
        params: {
          from: startOfMonthStr,
          perPage: 500
        }
      });

      const allClosedMonth = extractItems(allClosedMonthRes);
      const completed = allClosedMonth.filter(t => t.status === 'Selesai');
      const completedCount = completed.length;
      
      let totalDays = 0;
      completed.forEach(t => {
        const closedDate = safeDate(t.closed_at);
        const createdDate = safeDate(t.created_at || t.created);
        if (!closedDate || !createdDate) return;
        const days = differenceInDays(closedDate, createdDate);
        totalDays += (days > 0 ? days : 1);
      });

      const avg = completedCount > 0 ? (totalDays / completedCount).toFixed(1) : 0;
      const rate = allClosedMonth.length > 0 ? ((completedCount / allClosedMonth.length) * 100).toFixed(0) : 0;

      setAnalytics({ completedMonth: completedCount, avgDuration: avg, completionRate: rate });
    } catch (e) { console.error('Analytics err', e); }
  };

  const fetchTickets = async () => {
    setIsLoading(true);
    try {
      let filterStr = `(status="Selesai" || status="Dibatalkan" || status="Ditolak")`;
      if (statusFilter !== 'all') filterStr = `status = "${statusFilter}"`;
      if (urgencyFilter !== 'all') filterStr += ` && urgency = "${urgencyFilter}"`;
      if (techFilter !== 'all') filterStr += ` && assigned_technician_id = "${techFilter}"`;
      if (searchTerm) filterStr += ` && (title ~ "${searchTerm}" || ticket_number ~ "${searchTerm}")`;

      const { data } = await api.get('/tickets', {
        params: {
          page: 1,
          perPage: 50,
          status: statusFilter !== 'all' ? statusFilter : undefined,
          urgency: urgencyFilter !== 'all' ? urgencyFilter : undefined,
          technician_id: techFilter !== 'all' ? techFilter : undefined,
          search: searchTerm || undefined
        }
      });
      setTickets(extractItems(data));
    } catch (err) {
      console.error(err);
      toast.error('Gagal memuat riwayat tiket');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchTickets(); }, [searchTerm, statusFilter, urgencyFilter, techFilter]);

  const handleOpenDetail = (ticket) => {
    setSelectedTicket(ticket);
    setDetailModalOpen(true);
  };

  const handleDeleteTicket = async () => {
    if (!selectedTicket) return;
    
    setIsDeleting(true);
    try {
      const { data: chatsRes } = await api.get('/chats', { 
        params: { filter: `ticket_id="${selectedTicket.id}"`, perPage: 500 } 
      });

      for (const chat of (chatsRes?.items || [])) {
        const { data: messagesRes } = await api.get('/messages', { 
          params: { filter: `chat_id="${chat.id}"`, perPage: 1000 } 
        });
        
        for (const msg of (messagesRes?.items || [])) {
          await api.delete(`/messages/${msg.id}`);
        }
        await api.delete(`/chats/${chat.id}`);
      }

      await api.delete(`/tickets/${selectedTicket.id}`);
      
      toast.success('Tiket dan semua data terkait berhasil dihapus');
      setDetailModalOpen(false);
      fetchTickets();
      fetchAnalytics();
    } catch (error) {
      console.error('Error deleting ticket:', error);
      toast.error(error.response?.message || 'Gagal menghapus tiket. Pastikan Anda memiliki hak akses Admin.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12">
      <SectionHeader
        title="Riwayat Tiket"
        subtitle="Data historis tiket yang telah selesai, dibatalkan, atau ditolak."
      />

      <div className="grid md:grid-cols-3 gap-4 mb-6">
        <Card className="border-border shadow-sm"><CardContent className="p-5 flex gap-4 items-center"><div className="p-3 bg-green-500/10 text-green-500 rounded-xl"><CheckCircle2 className="h-6 w-6"/></div><div><p className="text-sm font-medium text-muted-foreground">Selesai Bulan Ini</p><h3 className="text-2xl font-bold">{analytics.completedMonth}</h3></div></CardContent></Card>
        <Card className="border-border shadow-sm"><CardContent className="p-5 flex gap-4 items-center"><div className="p-3 bg-blue-500/10 text-blue-500 rounded-xl"><Clock className="h-6 w-6"/></div><div><p className="text-sm font-medium text-muted-foreground">Rata-rata Durasi</p><h3 className="text-2xl font-bold">{analytics.avgDuration} <span className="text-sm font-normal text-muted-foreground">Hari</span></h3></div></CardContent></Card>
        <Card className="border-border shadow-sm"><CardContent className="p-5 flex gap-4 items-center"><div className="p-3 bg-primary/10 text-primary rounded-xl"><Activity className="h-6 w-6"/></div><div><p className="text-sm font-medium text-muted-foreground">Rasio Kesuksesan</p><h3 className="text-2xl font-bold">{analytics.completionRate}%</h3></div></CardContent></Card>
      </div>

      <Card className="border-border shadow-sm overflow-hidden">
        <div className="p-4 bg-muted/50 border-b flex flex-wrap gap-4">
          <Input placeholder="Cari tiket..." className="w-[200px] bg-background" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px] bg-background"><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="all">Semua Status</SelectItem><SelectItem value="Selesai">Selesai</SelectItem><SelectItem value="Dibatalkan">Dibatalkan</SelectItem><SelectItem value="Ditolak">Ditolak</SelectItem></SelectContent>
          </Select>
          <Select value={techFilter} onValueChange={setTechFilter}>
            <SelectTrigger className="w-[160px] bg-background"><SelectValue placeholder="Teknisi" /></SelectTrigger>
            <SelectContent><SelectItem value="all">Semua Teknisi</SelectItem>{technicians.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent>
          </Select>
          <Button variant="ghost" onClick={() => {setSearchTerm(''); setStatusFilter('all'); setTechFilter('all');}}><RefreshCcw className="h-4 w-4 mr-2" /> Reset</Button>
        </div>
        <CardContent className="p-0">
          <div className="overflow-x-auto rounded-lg border border-border">
            <Table className="min-w-full">
              <TableHeader className="bg-muted/30">
                <TableRow>
                  <TableHead className="px-6">ID & Judul</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Urgensi</TableHead>
                  <TableHead>Teknisi</TableHead>
                  <TableHead>Tgl Selesai</TableHead>
                  <TableHead>Durasi</TableHead>
                  <TableHead className="text-right px-6">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={7} className="text-center h-24">Memuat data...</TableCell></TableRow>
                ) : tickets.length > 0 ? (
                  tickets.map((t) => {
                    const closedDate = safeDate(t.closed_at);
                    const createdDate = safeDate(t.created_at || t.created);
                    const days = closedDate && createdDate ? differenceInDays(closedDate, createdDate) : null;
                    return (
                      <TableRow key={t.id} className="hover:bg-muted/30 transition-colors">
                        <TableCell className="px-6 py-3">
                          <div className="font-medium truncate max-w-[200px]">{t.title}</div>
                          <div className="text-xs text-muted-foreground font-mono">{t.ticket_number}</div>
                        </TableCell>
                        <TableCell><StatusBadge status={t.status} /></TableCell>
                        <TableCell><UrgencyBadge urgency={t.urgency} /></TableCell>
                        <TableCell className="text-sm">{t.technician_name || t.assigned_technician_id || '-'}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{safeFormat(t.closed_at)}</TableCell>
                        <TableCell className="text-sm">{days === null ? '-' : (days > 0 ? `${days} hari` : '< 1 hari')}</TableCell>
                        <TableCell className="text-right px-6">
                          <Button variant="outline" size="sm" onClick={() => handleOpenDetail(t)}>
                            <Eye className="h-4 w-4 mr-1.5" /> Detail
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="h-32">
                      <Empty
                        variant={EMPTY_STATE_VARIANTS.NO_RESULTS}
                        title="Tidak ada riwayat"
                        description="Belum ada tiket yang cocok dengan filter saat ini."
                      />
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={detailModalOpen} onOpenChange={(open) => !open && setDetailModalOpen(false)}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detail Riwayat Tiket</DialogTitle>
            <DialogDescription>Informasi lengkap tiket yang telah ditutup.</DialogDescription>
          </DialogHeader>
          
          {selectedTicket && (
            <div className="space-y-6 mt-4">
              <div className="flex flex-wrap items-center gap-3">
                <span className="font-mono text-sm font-semibold bg-muted px-2.5 py-1 rounded-md text-muted-foreground border">
                  {selectedTicket.ticket_number}
                </span>
                <StatusBadge status={selectedTicket.status} />
                <UrgencyBadge urgency={selectedTicket.urgency} />
              </div>
              
              <div>
                <h3 className="text-xl font-bold text-foreground mb-2">{selectedTicket.title}</h3>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap bg-muted/30 p-4 rounded-xl border">
                  {selectedTicket.description}
                </p>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Pelapor:</span>
                    <span className="text-muted-foreground">{selectedTicket.reporter_name || selectedTicket.user_id || '-'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Lokasi:</span>
                    <span className="text-muted-foreground">{selectedTicket.location || '-'}</span>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Dibuat:</span>
                    <span className="text-muted-foreground">{safeFormat(selectedTicket.created_at || selectedTicket.created, 'dd MMM yyyy HH:mm')}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Ditutup:</span>
                    <span className="text-muted-foreground">{safeFormat(selectedTicket.closed_at, 'dd MMM yyyy HH:mm')}</span>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t">
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-medium">Teknisi Penanggung Jawab:</span>
                  <span className="text-muted-foreground">{selectedTicket.technician_name || selectedTicket.assigned_technician_id || '-'}</span>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="mt-6 flex sm:justify-between items-center border-t pt-4">
            <Button 
              variant="destructive" 
              onClick={() => setConfirmDeleteOpen(true)}
              disabled={isDeleting}
              className="gap-2"
            >
              {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
              {isDeleting ? 'Menghapus...' : 'Hapus Tiket'}
            </Button>
            <Button variant="outline" onClick={() => setDetailModalOpen(false)} disabled={isDeleting}>
              Tutup
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmDeleteOpen} onOpenChange={setConfirmDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitleText>Konfirmasi Hapus Tiket</AlertDialogTitleText>
            <AlertDialogDescriptionText>
              Hapus tiket ini? Semua data terkait chat dan pesan juga akan dihapus. Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescriptionText>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setConfirmDeleteOpen(false)}>Batal</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                setConfirmDeleteOpen(false);
                handleDeleteTicket();
              }}
            >
              Ya, Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
