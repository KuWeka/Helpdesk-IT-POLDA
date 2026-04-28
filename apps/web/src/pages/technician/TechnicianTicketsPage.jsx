
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext.jsx';
import api from '@/lib/api.js';
import { Card, CardContent } from '@/components/ui/card.jsx';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table.jsx';
import { Input } from '@/components/ui/input.jsx';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.jsx';
import { Button } from '@/components/ui/button.jsx';
import { Skeleton } from '@/components/ui/skeleton.jsx';
import { Empty, EMPTY_STATE_VARIANTS } from '@/components/ui/empty.jsx';
import { Search, Filter, RefreshCcw } from 'lucide-react';
import StatusBadge from '@/components/tickets/StatusBadge.jsx';
import UrgencyBadge from '@/components/tickets/UrgencyBadge.jsx';
import { format } from 'date-fns';
import { TICKET_STATUS } from '@/lib/constants.js';
import SectionHeader from '@/components/common/SectionHeader.jsx';

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

export default function TechnicianTicketsPage() {
  const { t } = useTranslation();
  const { currentUser } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [urgencyFilter, setUrgencyFilter] = useState('all');
  const [sortOrder, setSortOrder] = useState('urgency_desc');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const fetchTickets = async () => {
    setIsLoading(true);
    try {
      const { data } = await api.get('/tickets', {
        params: {
          page: 1,
          perPage: 50,
          technician_id: currentUser.id,
          status: statusFilter !== 'all' ? statusFilter : undefined,
          urgency: urgencyFilter !== 'all' ? urgencyFilter : undefined,
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
  }, [currentUser, searchTerm, statusFilter, urgencyFilter, sortOrder, dateFrom, dateTo]);

  const resetFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setUrgencyFilter('all');
    setSortOrder('urgency_desc');
    setDateFrom('');
    setDateTo('');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <SectionHeader
        title={t('nav.item.Tiket Saya', 'My Tickets')}
        subtitle={t('techTickets.subtitle', 'List of tickets assigned to you.')}
      />

      <div className="space-y-4">
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder={t('userTickets.searchPlaceholder', 'Search ticket ID or title...')} 
                className="pl-9 bg-background"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex flex-wrap sm:flex-nowrap items-center gap-3">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px] bg-background">
                  <SelectValue placeholder={t('common.status', 'Status')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('userTickets.allStatus', 'All Status')}</SelectItem>
                  <SelectItem value={TICKET_STATUS.PROSES}>{t('status.proses')}</SelectItem>
                  <SelectItem value={TICKET_STATUS.SELESAI}>{t('status.selesai')}</SelectItem>
                  <SelectItem value={TICKET_STATUS.DIBATALKAN}>{t('status.dibatalkan')}</SelectItem>
                  <SelectItem value={TICKET_STATUS.DITOLAK}>{t('status.ditolak')}</SelectItem>
                </SelectContent>
              </Select>

              <Select value={urgencyFilter} onValueChange={setUrgencyFilter}>
                <SelectTrigger className="w-[140px] bg-background">
                  <SelectValue placeholder={t('common.urgency', 'Urgency')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('techTickets.allUrgency', 'All Urgency')}</SelectItem>
                  <SelectItem value="Rendah">Rendah</SelectItem>
                  <SelectItem value="Sedang">Sedang</SelectItem>
                  <SelectItem value="Tinggi">Tinggi</SelectItem>
                  <SelectItem value="Kritis">Kritis</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sortOrder} onValueChange={setSortOrder}>
                <SelectTrigger className="w-[160px] bg-background">
                  <SelectValue placeholder={t('common.sort', 'Sort')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="urgency_desc">{t('userTickets.sortUrgencyDesc', 'Critical -> Low')}</SelectItem>
                  <SelectItem value="newest">{t('common.newest', 'Newest')}</SelectItem>
                  <SelectItem value="oldest">{t('common.oldest', 'Oldest')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">{t('common.from', 'From')}:</span>
              <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="w-[140px] h-9 bg-background"/>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">{t('common.to', 'To')}:</span>
              <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="w-[140px] h-9 bg-background"/>
            </div>
            <Button variant="ghost" size="sm" onClick={resetFilters} className="text-muted-foreground hover:text-foreground">
              <RefreshCcw className="h-4 w-4 mr-2" /> {t('common.reset', 'Reset')}
            </Button>
          </div>
        </div>

        <div className="overflow-x-auto rounded-lg border border-border">
            <Table className="min-w-full">
              <TableHeader className="bg-muted/30">
                <TableRow>
                  <TableHead className="w-[130px] px-6">{t('common.ticketId', 'Ticket ID')}</TableHead>
                  <TableHead>{t('common.title', 'Title')}</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Urgensi</TableHead>
                  <TableHead>{t('tickets.reporter')}</TableHead>
                  <TableHead>{t('common.date', 'Date')}</TableHead>
                  <TableHead className="text-right px-6">{t('common.actions', 'Actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array(5).fill(0).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell className="px-6"><Skeleton className="h-5 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-48" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                      <TableCell className="text-right px-6"><Skeleton className="h-8 w-20 ml-auto" /></TableCell>
                    </TableRow>
                  ))
                ) : tickets.length > 0 ? (
                  tickets.map((ticket) => (
                    <TableRow key={ticket.id} className="hover:bg-muted/30 transition-colors">
                      <TableCell className="font-medium font-mono text-sm px-6 text-muted-foreground">{ticket.ticket_number}</TableCell>
                      <TableCell className="max-w-[200px] truncate font-medium text-foreground" title={ticket.title}>{ticket.title}</TableCell>
                      <TableCell><StatusBadge status={ticket.status} /></TableCell>
                      <TableCell><UrgencyBadge urgency={ticket.urgency} /></TableCell>
                      <TableCell className="text-sm">{ticket.reporter_name || t('tickets.unknown_user')}</TableCell>
                      <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                        {safeFormatDate(ticket.created_at || ticket.created)}
                      </TableCell>
                      <TableCell className="text-right px-6">
                        <Button variant="secondary" size="sm" asChild>
                          <Link to={`/technician/tickets/${ticket.id}`}>{t('common.detail', 'Detail')}</Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="h-48 text-center">
                      <Empty
                        variant={EMPTY_STATE_VARIANTS.NO_RESULTS}
                        title={t('tickets.no_tickets')}
                        description={t('userTickets.emptyDesc', 'Try adjusting your search filters.')}
                      />
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
      </div>
    </div>
  );
}
