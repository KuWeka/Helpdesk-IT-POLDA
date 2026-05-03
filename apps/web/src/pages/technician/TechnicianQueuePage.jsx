
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '@/lib/api.js';
import { Card, CardContent } from '@/components/ui/card.jsx';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table.jsx';
import { Button } from '@/components/ui/button.jsx';
import { Skeleton } from '@/components/ui/skeleton.jsx';
import { Empty, EMPTY_STATE_VARIANTS } from '@/components/ui/empty.jsx';
import { ListOrdered, Eye } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import SectionHeader from '@/components/common/SectionHeader.jsx';

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

const extractApiErrorMessage = (err, fallback) => {
  const details = err?.response?.data?.details;
  if (Array.isArray(details) && details.length > 0 && details[0]?.message) {
    return details[0].message;
  }

  return err?.response?.data?.message || fallback;
};

export default function TechnicianQueuePage() {
  const { t } = useTranslation();
  const [tickets, setTickets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchTickets = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { data } = await api.get('/tickets', {
        params: {
          page: 1,
          perPage: 50,
          status: 'Pending',
          unassigned: true
        }
      });
      
      setTickets(extractItems(data));
    } catch (err) {
      console.error('Error fetching queue:', err);
      const message = extractApiErrorMessage(err, t('techQueue.loadFailed', 'Failed to load ticket queue. Please try again.'));
      setError(message);
      toast.error(t('techQueue.loadFailedShort', 'Failed to load ticket queue'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <SectionHeader
        title={t('tickets.queue', 'Antrian Tiket')}
        subtitle={t('techQueue.subtitle', 'List of pending unassigned tickets ready to be processed.')}
      />

      {error && (
        <div className="p-4 bg-destructive/10 text-destructive rounded-xl border border-destructive/20 font-medium">
          {error}
        </div>
      )}

      <div className="overflow-x-auto rounded-lg border border-border">
            <Table className="min-w-full">
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="w-[130px] px-6">{t('common.ticketId', 'Ticket ID')}</TableHead>
                  <TableHead>{t('common.title', 'Title')}</TableHead>
                  <TableHead>{t('common.division', 'Division')}</TableHead>
                  <TableHead>{t('tickets.reporter', 'Pelapor')}</TableHead>
                  <TableHead>{t('techQueue.createdDate', 'Created Date')}</TableHead>
                  <TableHead className="text-right px-6">{t('common.actions', 'Actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array(5).fill(0).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell className="px-6"><Skeleton className="h-5 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-48" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                      <TableCell className="text-right px-6"><Skeleton className="h-8 w-24 ml-auto" /></TableCell>
                    </TableRow>
                  ))
                ) : tickets.length > 0 ? (
                  tickets.map((ticket) => (
                    <TableRow key={ticket.id} className="hover:bg-muted/30 transition-colors">
                      <TableCell className="font-medium font-mono text-sm px-6 text-muted-foreground">{ticket.ticket_number}</TableCell>
                      <TableCell className="max-w-[200px] truncate font-medium text-foreground" title={ticket.title}>{ticket.title}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {ticket.reporter_division_name || '-'}
                      </TableCell>
                      <TableCell className="text-sm">
                        <div className="font-medium text-foreground">
                          {ticket.reporter_name || ticket.user_id || t('tickets.unknown_user', 'Unknown')}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                        {safeFormatDate(ticket.created_at || ticket.created)}
                      </TableCell>
                      <TableCell className="text-right px-6">
                        <Button variant="outline" size="sm" asChild>
                          <Link to={`/padal/tickets/${ticket.id}`}>
                            <Eye className="mr-1.5 h-3.5 w-3.5" /> {t('common.detail', 'Detail')}
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="h-48 text-center">
                      <Empty
                        variant={EMPTY_STATE_VARIANTS.NO_RESULTS}
                        title={t('tickets.no_tickets', 'Tidak ada tiket')}
                          description={t('techDashboard.queueEmptyDesc', 'There are no tickets in queue at the moment.')}
                      />
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
    </div>
  );
}
