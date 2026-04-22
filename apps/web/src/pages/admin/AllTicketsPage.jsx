
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
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
import { Search, Filter, RefreshCcw, Trash2, Eye, MoreHorizontal } from 'lucide-react';
import StatusBadge from '@/components/StatusBadge.jsx';
import UrgencyBadge from '@/components/UrgencyBadge.jsx';
import { format } from 'date-fns';
import { toast } from 'sonner';
import SectionHeader from '@/components/SectionHeader.jsx';

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
  const [tickets, setTickets] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [urgencyFilter, setUrgencyFilter] = useState('all');
  const [techFilter, setTechFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);

  useEffect(() => {
    api.get('/users', { params: { role: 'Teknisi', sort: 'name', order: 'asc', perPage: 200 } })
      .then(({ data }) => setTechnicians(extractItems(data)))
      .catch(console.error);
  }, []);

  const fetchTickets = async () => {
    setIsLoading(true);
    try {
      let filterStr = `id != ""`;
      
      if (statusFilter !== 'all') filterStr += ` && status = "${statusFilter}"`;
      if (urgencyFilter !== 'all') filterStr += ` && urgency = "${urgencyFilter}"`;
      if (techFilter !== 'all') filterStr += ` && assigned_technician_id = "${techFilter}"`;
      if (searchTerm) filterStr += ` && (title ~ "${searchTerm}" || ticket_number ~ "${searchTerm}")`;
      if (dateFrom) filterStr += ` && created >= "${dateFrom} 00:00:00"`;
      if (dateTo) filterStr += ` && created <= "${dateTo} 23:59:59"`;

      const { data } = await api.get('/tickets', {
        params: {
          page: 1,
          perPage: 50,
          status: statusFilter !== 'all' ? statusFilter : undefined,
          urgency: urgencyFilter !== 'all' ? urgencyFilter : undefined,
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
  }, [searchTerm, statusFilter, urgencyFilter, techFilter, dateFrom, dateTo]);

  const resetFilters = () => {
    setSearchTerm(''); setStatusFilter('all'); setUrgencyFilter('all');
    setTechFilter('all'); setDateFrom(''); setDateTo('');
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/tickets/${id}`);
      toast.success('Tiket berhasil dihapus');
      fetchTickets();
    } catch (error) {
      console.error('Delete error:', error.response || error);
      toast.error('Gagal menghapus tiket: ' + (error.response?.message || error.message));
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <SectionHeader
        title="Semua Tiket"
        subtitle="Kelola dan pantau seluruh tiket bantuan dalam sistem."
      />

      <Card className="border-border shadow-sm overflow-hidden">
        <div className="p-4 bg-muted/50 border-b space-y-4">
          <div className="flex flex-col xl:flex-row gap-4">
            <div className="relative flex-1 min-w-[250px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Cari ID tiket atau judul..." className="pl-9 bg-background" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px] bg-background"><SelectValue placeholder="Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Status</SelectItem>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="Proses">Proses</SelectItem>
                  <SelectItem value="Selesai">Selesai</SelectItem>
                  <SelectItem value="Dibatalkan">Dibatalkan</SelectItem>
                  <SelectItem value="Ditolak">Ditolak</SelectItem>
                </SelectContent>
              </Select>
              <Select value={urgencyFilter} onValueChange={setUrgencyFilter}>
                <SelectTrigger className="w-[140px] bg-background"><SelectValue placeholder="Urgensi" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Urgensi</SelectItem>
                  <SelectItem value="Rendah">Rendah</SelectItem>
                  <SelectItem value="Sedang">Sedang</SelectItem>
                  <SelectItem value="Tinggi">Tinggi</SelectItem>
                  <SelectItem value="Darurat">Darurat</SelectItem>
                </SelectContent>
              </Select>
              <Select value={techFilter} onValueChange={setTechFilter}>
                <SelectTrigger className="w-[160px] bg-background"><SelectValue placeholder="Teknisi" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Teknisi</SelectItem>
                  {technicians.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 text-sm"><span className="text-muted-foreground">Dari:</span><Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="w-[140px] h-9 bg-background"/></div>
            <div className="flex items-center gap-2 text-sm"><span className="text-muted-foreground">Sampai:</span><Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="w-[140px] h-9 bg-background"/></div>
            <Button variant="ghost" size="sm" onClick={resetFilters} className="text-muted-foreground"><RefreshCcw className="h-4 w-4 mr-2" /> Reset</Button>
          </div>
        </div>

        <CardContent className="p-0">
          <div className="overflow-x-auto rounded-lg border border-border">
            <Table className="min-w-full">
              <TableHeader className="bg-muted/30">
                <TableRow>
                  <TableHead className="w-[120px] px-6">ID Tiket</TableHead>
                  <TableHead>Judul</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Urgensi</TableHead>
                  <TableHead>Pelapor</TableHead>
                  <TableHead>Teknisi</TableHead>
                  <TableHead>Tanggal</TableHead>
                  <TableHead className="text-right px-6">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array(5).fill(0).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell className="px-6"><Skeleton className="h-5 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-40" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
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
                      <TableCell><UrgencyBadge urgency={ticket.urgency} /></TableCell>
                      <TableCell className="text-sm truncate max-w-[120px]">{ticket.reporter_name || ticket.user_id || '-'}</TableCell>
                      <TableCell className="text-sm truncate max-w-[120px]">{ticket.technician_name || ticket.assigned_technician_id || '-'}</TableCell>
                      <TableCell className="text-sm text-muted-foreground whitespace-nowrap">{safeFormatDate(ticket.created_at || ticket.created)}</TableCell>
                      <TableCell className="text-right px-6">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">Buka menu</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link to={`/admin/tickets/${ticket.id}`}>
                                <Eye className="mr-2 h-4 w-4" />
                                Lihat Detail
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={() => setDeleteTarget(ticket)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Hapus Permanen
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
                        title="Tidak ada tiket ditemukan"
                        description="Coba ubah filter atau kata kunci pencarian Anda."
                      />
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Tiket</AlertDialogTitle>
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
