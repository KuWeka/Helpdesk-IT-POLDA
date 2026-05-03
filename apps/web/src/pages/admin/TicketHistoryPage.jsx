
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
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
import StatusBadge from '@/components/tickets/StatusBadge.jsx';
import { Empty, EMPTY_STATE_VARIANTS } from '@/components/ui/empty.jsx';
import SectionHeader from '@/components/common/SectionHeader.jsx';
import { format, differenceInDays, startOfMonth, isAfter, isEqual } from 'date-fns';
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
  const { t } = useTranslation();
  const [tickets, setTickets] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [analytics, setAnalytics] = useState({ completedMonth: 0, avgDuration: 0, completionRate: 0 });

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('Selesai');
  const [techFilter, setTechFilter] = useState('all');

  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

  useEffect(() => {
    api.get('/users', { params: { role: 'Teknisi', sort: 'name', order: 'asc', perPage: 100 } })
      .then(({ data }) => setTechnicians(extractItems(data)))
      .catch(console.error);
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const monthStart = startOfMonth(new Date());
      const { data: allTicketsRes } = await api.get('/tickets', {
        params: {
          perPage: 500
        }
      });

      const monthTickets = extractItems(allTicketsRes).filter((t) => {
        const closedDate = safeDate(t.closed_at);
        return closedDate && (isAfter(closedDate, monthStart) || isEqual(closedDate, monthStart));
      });
      const completed = monthTickets.filter((t) => t.status === 'Selesai');
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
      const rate = monthTickets.length > 0 ? ((completedCount / monthTickets.length) * 100).toFixed(0) : 0;

      setAnalytics({ completedMonth: completedCount, avgDuration: avg, completionRate: rate });
    } catch (e) { console.error('Analytics err', e); }
  };

  const fetchTickets = async () => {
    setIsLoading(true);
    try {
      let filterStr = `(status="Selesai" || status="Dibatalkan" || status="Ditolak")`;
      if (statusFilter !== 'all') filterStr = `status = "${statusFilter}"`;
      if (techFilter !== 'all') filterStr += ` && assigned_technician_id = "${techFilter}"`;
      if (searchTerm) filterStr += ` && (title ~ "${searchTerm}" || ticket_number ~ "${searchTerm}")`;

      const { data } = await api.get('/tickets', {
        params: {
          page: 1,
          perPage: 50,
          status: statusFilter !== 'all' ? statusFilter : undefined,
          technician_id: techFilter !== 'all' ? techFilter : undefined,
          search: searchTerm || undefined
        }
      });
      setTickets(extractItems(data));
    } catch (err) {
      console.error(err);
      toast.error(t('ticketHistory.loadFailed', 'Failed to load ticket history'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchTickets(); }, [searchTerm, statusFilter, techFilter]);

  const handleOpenDetail = (ticket) => {
    setSelectedTicket(ticket);
    setDetailModalOpen(true);
  };

  const handleDeleteTicket = async () => {
    if (!selectedTicket) return;
    
    setIsDeleting(true);
    try {
      await api.delete(`/tickets/${selectedTicket.id}`);
      
      toast.success(t('ticketHistory.deleteSuccess', 'Ticket and related data deleted successfully'));
      setDetailModalOpen(false);
      fetchTickets();
      fetchAnalytics();
    } catch (error) {
      console.error('Error deleting ticket:', error);
      toast.error(error.response?.message || t('adminTickets.deleteFailed', 'Failed to delete ticket'));
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12">
      <SectionHeader
        title={t('nav.item.Riwayat Tiket', 'Ticket History')}
        subtitle={t('ticketHistory.subtitle', 'Historical data of completed, canceled, or rejected tickets.')}
      />

      <div className="grid md:grid-cols-3 gap-4 mb-6">
        <Card className="border-border shadow-sm"><CardContent className="p-5 flex gap-4 items-center"><div className="p-3 bg-green-500/10 text-green-500 rounded-xl"><CheckCircle2 className="h-6 w-6"/></div><div><p className="text-sm font-medium text-muted-foreground">{t('ticketHistory.completedThisMonth', 'Completed This Month')}</p><h3 className="text-2xl font-bold">{analytics.completedMonth}</h3></div></CardContent></Card>
        <Card className="border-border shadow-sm"><CardContent className="p-5 flex gap-4 items-center"><div className="p-3 bg-blue-500/10 text-blue-500 rounded-xl"><Clock className="h-6 w-6"/></div><div><p className="text-sm font-medium text-muted-foreground">{t('ticketHistory.avgDuration', 'Average Duration')}</p><h3 className="text-2xl font-bold">{analytics.avgDuration} <span className="text-sm font-normal text-muted-foreground">{t('ticketHistory.days', 'Days')}</span></h3></div></CardContent></Card>
        <Card className="border-border shadow-sm"><CardContent className="p-5 flex gap-4 items-center"><div className="p-3 bg-primary/10 text-primary rounded-xl"><Activity className="h-6 w-6"/></div><div><p className="text-sm font-medium text-muted-foreground">{t('ticketHistory.successRate', 'Success Rate')}</p><h3 className="text-2xl font-bold">{analytics.completionRate}%</h3></div></CardContent></Card>
      </div>

      <div className="space-y-4">
        <div className="flex flex-wrap gap-4">
          <Input placeholder={t('ticketHistory.searchPlaceholder', 'Search tickets...')} className="w-[200px] bg-background" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px] bg-background"><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="all">{t('userTickets.allStatus', 'All Status')}</SelectItem><SelectItem value="Selesai">{t('status.selesai', 'Completed')}</SelectItem><SelectItem value="Dibatalkan">{t('status.dibatalkan', 'Cancelled')}</SelectItem><SelectItem value="Ditolak">{t('status.ditolak', 'Rejected')}</SelectItem></SelectContent>
          </Select>
          <Select value={techFilter} onValueChange={setTechFilter}>
            <SelectTrigger className="w-[160px] bg-background"><SelectValue placeholder={t('roles.technician', 'Technician')} /></SelectTrigger>
            <SelectContent><SelectItem value="all">{t('adminTickets.allTechnicians', 'All Technicians')}</SelectItem>{technicians.map(tk => <SelectItem key={tk.id} value={tk.id}>{tk.name}</SelectItem>)}</SelectContent>
          </Select>
          <Button variant="ghost" onClick={() => {setSearchTerm(''); setStatusFilter('all'); setTechFilter('all');}}><RefreshCcw className="h-4 w-4 mr-2" /> {t('common.reset', 'Reset')}</Button>
        </div>
        <div className="overflow-x-auto rounded-lg border border-border">
            <Table className="min-w-full">
              <TableHeader className="bg-muted/30">
                <TableRow>
                  <TableHead className="px-6">{t('common.titleAndId', 'Title & ID')}</TableHead>
                  <TableHead>{t('common.status', 'Status')}</TableHead>
                  <TableHead>{t('roles.technician', 'Technician')}</TableHead>
                  <TableHead>{t('ticketHistory.closedDate', 'Closed Date')}</TableHead>
                  <TableHead>{t('ticketHistory.duration', 'Duration')}</TableHead>
                  <TableHead className="text-right px-6">{t('common.actions', 'Actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={6} className="text-center h-24">{t('common.processing', 'Processing...')}</TableCell></TableRow>
                ) : tickets.length > 0 ? (
                  tickets.map((ticket) => {
                    const closedDate = safeDate(ticket.closed_at);
                    const createdDate = safeDate(ticket.created_at || ticket.created);
                    const days = closedDate && createdDate ? differenceInDays(closedDate, createdDate) : null;
                    return (
                      <TableRow key={ticket.id} className="hover:bg-muted/30 transition-colors">
                        <TableCell className="px-6 py-3">
                          <div className="font-medium truncate max-w-[200px]">{ticket.title}</div>
                          <div className="text-xs text-muted-foreground font-mono">{ticket.ticket_number}</div>
                        </TableCell>
                        <TableCell><StatusBadge status={ticket.status} /></TableCell>
                        <TableCell className="text-sm">{ticket.padal_name || '-'}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{safeFormat(ticket.closed_at)}</TableCell>
                        <TableCell className="text-sm">{days === null ? '-' : (days > 0 ? `${days} hari` : '< 1 hari')}</TableCell>
                        <TableCell className="text-right px-6">
                          <Button variant="outline" size="sm" onClick={() => handleOpenDetail(ticket)}>
                            <Eye className="h-4 w-4 mr-1.5" /> {t('common.detail', 'Detail')}
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="h-32">
                      <Empty
                        variant={EMPTY_STATE_VARIANTS.NO_RESULTS}
                        title={t('ticketHistory.emptyTitle', 'No history')}
                        description="Belum ada tiket yang cocok dengan filter saat ini."
                      />
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
      </div>

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
                    <span className="font-medium">Padal Penanggung Jawab:</span>
                    <span className="text-muted-foreground">{selectedTicket.padal_name || '-'}</span>
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
              Hapus tiket ini? Semua data terkait tiket juga akan dihapus. Tindakan ini tidak dapat dibatalkan.
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
