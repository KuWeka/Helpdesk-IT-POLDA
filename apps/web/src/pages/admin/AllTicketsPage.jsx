
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '@/lib/api.js';
import { Card, CardContent } from '@/components/ui/card.jsx';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table.jsx';
import { Input } from '@/components/ui/input.jsx';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.jsx';
import { Button } from '@/components/ui/button.jsx';
import { Skeleton } from '@/components/ui/skeleton.jsx';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu.jsx';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog.jsx';
import { Empty, EMPTY_STATE_VARIANTS } from '@/components/ui/empty.jsx';
import { Search, Filter, RefreshCcw, Trash2, Eye, MoreHorizontal, UserPlus, UserMinus, XCircle } from 'lucide-react';
import StatusBadge from '@/components/tickets/StatusBadge.jsx';
import { format } from 'date-fns';
import { toast } from 'sonner';
import SectionHeader from '@/components/common/SectionHeader.jsx';
import AssignPadalModal from '@/components/modals/AssignPadalModal.jsx';
import RejectTicketModal from '@/components/modals/RejectTicketModal.jsx';

const extractItems = (payload) => {
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload)) return payload;
  return [];
};

const safeFormatDate = (value, pattern = 'dd MMM yy') => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return format(date, pattern);
};

export default function AllTicketsPage() {
  const { t } = useTranslation();
  const [tickets, setTickets] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [techFilter, setTechFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [assignTarget, setAssignTarget] = useState(null);
  const [rejectTarget, setRejectTarget] = useState(null);

  useEffect(() => {
    api.get('/users', { params: { role: 'Padal', sort: 'name', order: 'asc', perPage: 100 } })
      .then(({ data }) => setTechnicians(extractItems(data)))
      .catch(console.error);
  }, []);

  const fetchTickets = async () => {
    setIsLoading(true);
    try {
      let filterStr = `id != ""`;
      
      if (statusFilter !== 'all') filterStr += ` && status = "${statusFilter}"`;
      if (techFilter !== 'all') filterStr += ` && assigned_technician_id = "${techFilter}"`;
      if (searchTerm) filterStr += ` && (title ~ "${searchTerm}" || ticket_number ~ "${searchTerm}")`;
      if (dateFrom) filterStr += ` && created >= "${dateFrom} 00:00:00"`;
      if (dateTo) filterStr += ` && created <= "${dateTo} 23:59:59"`;

      const { data } = await api.get('/tickets', {
        params: {
          page: 1,
          perPage: 50,
          status: statusFilter !== 'all' ? statusFilter : undefined,
          technician_id: techFilter !== 'all' ? techFilter : undefined,
          search: searchTerm || undefined,
          from: dateFrom || undefined,
          to: dateTo || undefined
        }
      });
      
      setTickets(extractItems(data));
    } catch (err) {
      console.error('Error fetching tickets:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, [searchTerm, statusFilter, techFilter, dateFrom, dateTo]);

  const resetFilters = () => {
    setSearchTerm(''); setStatusFilter('all');
    setTechFilter('all'); setDateFrom(''); setDateTo('');
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/tickets/${id}`);
      toast.success('Tiket berhasil dihapus');
      fetchTickets();
    } catch (error) {
      console.error('Delete error:', error.response || error);
      toast.error(t('adminTickets.deleteFailed', 'Failed to delete ticket') + ': ' + (error.response?.message || error.message));
    }
  };

  const handleUnassign = async (ticketId) => {
    try {
      await api.delete(`/tickets/${ticketId}/assign`);
      toast.success('Assignment berhasil dihapus');
      fetchTickets();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Gagal menghapus assignment');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <SectionHeader
        title={t('nav.item.Semua Tiket', 'All Tickets')}
        subtitle={t('adminTickets.subtitle', 'Manage and monitor all helpdesk tickets in the system.')}
      />

      <div className="space-y-4">
        <div className="space-y-4">
          <div className="flex flex-col xl:flex-row gap-4">
            <div className="relative flex-1 min-w-[250px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder={t('userTickets.searchPlaceholder', 'Search ticket ID or title...')} className="pl-9 bg-background" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px] bg-background"><SelectValue placeholder={t('common.status', 'Status')} /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('userTickets.allStatus', 'All Status')}</SelectItem>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="Proses">Proses</SelectItem>
                  <SelectItem value="Selesai">Selesai</SelectItem>
                  <SelectItem value="Dibatalkan">Dibatalkan</SelectItem>
                  <SelectItem value="Ditolak">Ditolak</SelectItem>
                </SelectContent>
              </Select>
              <Select value={techFilter} onValueChange={setTechFilter}>
                <SelectTrigger className="w-[160px] bg-background"><SelectValue placeholder={t('roles.technician', 'Technician')} /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('adminTickets.allTechnicians', 'All Technicians')}</SelectItem>
                  {technicians.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 text-sm"><span className="text-muted-foreground">{t('common.from', 'From')}:</span><Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="w-[140px] h-9 bg-background"/></div>
            <div className="flex items-center gap-2 text-sm"><span className="text-muted-foreground">{t('common.to', 'To')}:</span><Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="w-[140px] h-9 bg-background"/></div>
            <Button variant="ghost" size="sm" onClick={resetFilters} className="text-muted-foreground"><RefreshCcw className="h-4 w-4 mr-2" /> {t('common.reset', 'Reset')}</Button>
          </div>
        </div>

        <div className="overflow-x-auto rounded-lg border border-border">
            <Table className="min-w-full">
              <TableHeader className="bg-muted/30">
                <TableRow>
                  <TableHead className="w-[120px] px-6">{t('common.ticketId', 'Ticket ID')}</TableHead>
                  <TableHead>{t('common.title', 'Title')}</TableHead>
                  <TableHead>{t('common.status', 'Status')}</TableHead>
                  <TableHead>{t('tickets.reporter', 'Reporter')}</TableHead>
                  <TableHead>{t('roles.technician', 'Technician')}</TableHead>
                  <TableHead>{t('common.date', 'Date')}</TableHead>
                  <TableHead className="text-right px-6">{t('common.actions', 'Actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array(5).fill(0).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell className="px-6"><Skeleton className="h-5 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-40" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                      <TableCell className="text-right px-6"><Skeleton className="h-8 w-16 ml-auto" /></TableCell>
                    </TableRow>
                  ))
                ) : tickets.length > 0 ? (
                  tickets.map((ticket) => (
                    <TableRow key={ticket.id} className="hover:bg-muted/30 transition-colors">
                      <TableCell className="font-medium font-mono text-xs px-6 text-muted-foreground">{ticket.ticket_number}</TableCell>
                      <TableCell className="max-w-[200px] truncate font-medium text-foreground" title={ticket.title}>{ticket.title}</TableCell>
                      <TableCell><StatusBadge status={ticket.status} /></TableCell>
                      <TableCell className="text-sm truncate max-w-[120px]">{ticket.reporter_name || ticket.user_id || '-'}</TableCell>
                      <TableCell className="text-sm truncate max-w-[120px]">{ticket.padal_name || '-'}</TableCell>
                      <TableCell className="text-sm text-muted-foreground whitespace-nowrap">{safeFormatDate(ticket.created_at || ticket.created)}</TableCell>
                      <TableCell className="text-right px-6">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">{t('common.openMenu', 'Open menu')}</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link to={`/subtekinfo/tickets/${ticket.id}`}>
                                <Eye className="mr-2 h-4 w-4" />
                                {t('common.viewDetail', 'View Detail')}
                              </Link>
                            </DropdownMenuItem>
                            {(ticket.status === 'Pending' || !ticket.padal_id) && (
                              <DropdownMenuItem onClick={() => setAssignTarget(ticket)}>
                                <UserPlus className="mr-2 h-4 w-4" />
                                Assign Padal
                              </DropdownMenuItem>
                            )}
                            {ticket.status === 'Pending' && (
                              <DropdownMenuItem
                                className="text-amber-600 focus:text-amber-600"
                                onClick={() => setRejectTarget(ticket)}
                              >
                                <XCircle className="mr-2 h-4 w-4" />
                                Tolak Tiket
                              </DropdownMenuItem>
                            )}
                            {ticket.padal_id && ticket.status !== 'Selesai' && ticket.status !== 'Dibatalkan' && (
                              <DropdownMenuItem onClick={() => handleUnassign(ticket.id)}>
                                <UserMinus className="mr-2 h-4 w-4" />
                                Hapus Assignment
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={() => setDeleteTarget(ticket)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              {t('common.deletePermanent', 'Delete Permanently')}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} className="h-48 text-center">
                      <Empty
                        variant={EMPTY_STATE_VARIANTS.NO_RESULTS}
                        title={t('userTickets.emptyTitle', 'No tickets found')}
                        description={t('userTickets.emptyDesc', 'Try adjusting your search filters.')}
                      />
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
      </div>

      <AssignPadalModal
        open={!!assignTarget}
        onOpenChange={(open) => !open && setAssignTarget(null)}
        ticket={assignTarget}
        onSuccess={fetchTickets}
      />

      <RejectTicketModal
        open={!!rejectTarget}
        onOpenChange={(open) => !open && setRejectTarget(null)}
        ticket={rejectTarget}
        onSuccess={fetchTickets}
      />

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('adminTickets.deleteTitle', 'Delete Ticket')}</AlertDialogTitle>
            <AlertDialogDescription>
              Yakin ingin menghapus tiket {deleteTarget?.ticket_number ? `"${deleteTarget.ticket_number}"` : 'ini'} secara permanen?
              Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteTarget(null)}>Batal</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (deleteTarget?.id) {
                  handleDelete(deleteTarget.id);
                }
                setDeleteTarget(null);
              }}
            >
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
