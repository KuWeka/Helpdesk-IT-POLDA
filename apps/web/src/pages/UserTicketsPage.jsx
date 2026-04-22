
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext.jsx';
import api from '@/lib/api.js';
import { Card, CardContent } from '@/components/ui/card.jsx';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table.jsx';
import { Input } from '@/components/ui/input.jsx';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.jsx';
import { Button } from '@/components/ui/button.jsx';
import { Skeleton } from '@/components/ui/skeleton.jsx';
import { Empty, EMPTY_STATE_VARIANTS } from '@/components/ui/empty.jsx';
import { Search, Filter, PlusCircle, MessageSquare, RefreshCcw, ChevronRight, ChevronLeft } from 'lucide-react';
import StatusBadge from '@/components/StatusBadge.jsx';
import UrgencyBadge from '@/components/UrgencyBadge.jsx';
import { format } from 'date-fns';
import SectionHeader from '@/components/SectionHeader.jsx';

const extractItems = (payload) => {
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload)) return payload;
  return [];
};

const safeFormatDate = (value, pattern = 'dd MMM yyyy') => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return format(date, pattern);
};

export default function UserTicketsPage() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [tickets, setTickets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortOrder, setSortOrder] = useState('urgency_desc');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState('20');
  const [pagination, setPagination] = useState({
    page: 1,
    perPage: 20,
    total: 0,
    totalPages: 1,
  });

  const mapSortOrder = (value) => {
    switch (value) {
      case 'newest':
        return { sort: 'created_at', order: 'desc' };
      case 'oldest':
        return { sort: 'created_at', order: 'asc' };
      case 'urgency_desc':
        return { sort: 'urgency', order: 'desc' };
      case 'completed_first':
        return { sort: 'status', order: 'desc' };
      default:
        return { sort: 'created_at', order: 'desc' };
    }
  };

  const fetchTickets = async () => {
    setIsLoading(true);
    try {
      const { sort, order } = mapSortOrder(sortOrder);
      const { data } = await api.get('/tickets', {
        params: {
          page: currentPage,
          perPage: Number(perPage),
          status: statusFilter !== 'all' ? statusFilter : undefined,
          search: searchTerm || undefined,
          sort,
          order,
          from: dateFrom || undefined,
          to: dateTo || undefined,
        }
      });

      const items = extractItems(data);
      const paging = data?.meta?.pagination || {
        page: currentPage,
        perPage: Number(perPage),
        total: items.length,
        totalPages: 1,
      };

      setTickets(items);
      setPagination(paging);
    } catch (err) {
      console.error('Error fetching tickets:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [currentUser?.id, searchTerm, statusFilter, sortOrder, dateFrom, dateTo, perPage]);

  useEffect(() => {
    fetchTickets();
  }, [currentUser?.id, currentPage, perPage, searchTerm, statusFilter, sortOrder, dateFrom, dateTo]);

  const resetFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setSortOrder('urgency_desc');
    setDateFrom('');
    setDateTo('');
    setCurrentPage(1);
    setPerPage('20');
  };

  const canChat = (ticket) => {
    return ticket.status === 'Proses' || (ticket.status === 'Pending' && ticket.urgency === 'Darurat');
  };

  return (
    <div className="animate-in fade-in flex flex-col gap-6 duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center text-sm text-muted-foreground mb-1">
            <Link to="/user/dashboard" className="hover:text-primary transition-colors">Dashboard</Link>
            <ChevronRight className="h-3 w-3 mx-1" />
            <span className="text-foreground font-medium">Tiket Saya</span>
          </div>
          <SectionHeader
            title="Tiket Saya"
            subtitle="Pantau status dan riwayat semua tiket yang Anda laporkan."
          />
        </div>
        <Button asChild className="shrink-0 gap-2 shadow-md shadow-primary/20">
          <Link to="/user/create-ticket">
            <PlusCircle className="h-4 w-4" />
            Buat Tiket Baru
          </Link>
        </Button>
      </div>

      <Card className="overflow-hidden border-border bg-card/95 shadow-sm">
        <div className="flex flex-col gap-4 border-b bg-card/70 p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Cari ID tiket atau judul..." 
                className="pl-9 bg-background"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex flex-wrap sm:flex-nowrap items-center gap-3">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px] bg-background">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Status</SelectItem>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="Proses">Proses</SelectItem>
                  <SelectItem value="Selesai">Selesai</SelectItem>
                  <SelectItem value="Dibatalkan">Dibatalkan</SelectItem>
                  <SelectItem value="Ditolak">Ditolak</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sortOrder} onValueChange={setSortOrder}>
                <SelectTrigger className="w-[160px] bg-background">
                  <SelectValue placeholder="Urutkan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="urgency_desc">Darurat → Rendah</SelectItem>
                  <SelectItem value="newest">Terbaru</SelectItem>
                  <SelectItem value="oldest">Tertua</SelectItem>
                  <SelectItem value="completed_first">Selesai Dulu</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">Dari:</span>
              <Input 
                type="date" 
                value={dateFrom} 
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-[140px] h-9 bg-background"
              />
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">Sampai:</span>
              <Input 
                type="date" 
                value={dateTo} 
                onChange={(e) => setDateTo(e.target.value)}
                className="w-[140px] h-9 bg-background"
              />
            </div>
            <Button variant="ghost" size="sm" onClick={resetFilters} className="text-muted-foreground hover:text-foreground">
              <RefreshCcw className="h-4 w-4 mr-2" />
              Reset Filter
            </Button>
          </div>
        </div>

        <CardContent className="p-0">
          <div className="overflow-x-auto rounded-lg border border-border">
            <Table className="min-w-full">
              <TableHeader className="bg-muted/40">
                <TableRow>
                  <TableHead className="w-[130px] px-6">ID Tiket</TableHead>
                  <TableHead>Judul</TableHead>
                  <TableHead>Urgensi</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Teknisi</TableHead>
                  <TableHead>Tanggal</TableHead>
                  <TableHead className="text-right px-6">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array(5).fill(0).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell className="px-6"><Skeleton className="h-5 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-48" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-24 rounded-full" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                      <TableCell className="text-right px-6"><Skeleton className="h-8 w-24 ml-auto" /></TableCell>
                    </TableRow>
                  ))
                ) : tickets.length > 0 ? (
                  tickets.map((ticket) => (
                    <TableRow key={ticket.id} className="group transition-colors hover:bg-muted/30">
                      <TableCell className="font-medium font-mono text-sm px-6">{ticket.ticket_number}</TableCell>
                      <TableCell className="max-w-[250px] truncate font-medium" title={ticket.title}>{ticket.title}</TableCell>
                      <TableCell>
                        <UrgencyBadge urgency={ticket.urgency} />
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={ticket.status} />
                      </TableCell>
                      <TableCell className="text-sm">
                        {ticket.technician_name || (
                          <span className="text-muted-foreground italic">Belum ditugaskan</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                        {safeFormatDate(ticket.created_at || ticket.created)}
                      </TableCell>
                      <TableCell className="text-right px-6">
                        <div className="flex items-center justify-end gap-2 opacity-80 transition-opacity group-hover:opacity-100">
                          {canChat(ticket) && (
                            <Button variant="outline" size="sm" className="h-8 px-2 text-primary border-primary/20 hover:bg-primary/10" onClick={() => navigate('/user/chats')}>
                              <MessageSquare className="h-4 w-4" />
                            </Button>
                          )}
                          <Button variant="secondary" size="sm" asChild className="h-8">
                            <Link to={`/user/tickets/${ticket.id}`}>Detail</Link>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="h-48 text-center">
                      <Empty
                        variant={EMPTY_STATE_VARIANTS.NO_RESULTS}
                        title="Tidak ada tiket ditemukan"
                        description="Coba sesuaikan filter pencarian Anda."
                      />
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {!isLoading && tickets.length > 0 && (
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 border-t bg-muted/30">
              <div className="text-sm text-muted-foreground">
                Menampilkan {Math.max(1, (pagination.page - 1) * pagination.perPage + 1)}-
                {Math.min(pagination.page * pagination.perPage, pagination.total)} dari {pagination.total} tiket
              </div>

              <div className="flex items-center gap-2">
                <Select value={perPage} onValueChange={setPerPage}>
                  <SelectTrigger className="w-[110px] h-8 bg-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10 / halaman</SelectItem>
                    <SelectItem value="20">20 / halaman</SelectItem>
                    <SelectItem value="50">50 / halaman</SelectItem>
                  </SelectContent>
                </Select>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={pagination.page <= 1}
                  className="h-8"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>

                <span className="text-sm min-w-[80px] text-center">
                  {pagination.page} / {pagination.totalPages || 1}
                </span>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.min(pagination.totalPages || 1, p + 1))}
                  disabled={pagination.page >= (pagination.totalPages || 1)}
                  className="h-8"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
