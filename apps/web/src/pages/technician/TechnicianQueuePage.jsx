
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
      const message = extractApiErrorMessage(err, 'Gagal memuat antrian tiket. Silakan coba lagi.');
      setError(message);
      toast.error('Gagal memuat antrian tiket');
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
        subtitle="Daftar tiket berstatus Pending yang belum ditugaskan dan siap diproses."
      />

      {error && (
        <div className="p-4 bg-destructive/10 text-destructive rounded-xl border border-destructive/20 font-medium">
          {error}
        </div>
      )}

      <Card className="border-border shadow-sm overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto rounded-lg border border-border">
            <Table className="min-w-full">
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="w-[130px] px-6">ID Tiket</TableHead>
                  <TableHead>Judul</TableHead>
                  <TableHead>Urgensi</TableHead>
                  <TableHead>Divisi</TableHead>
                  <TableHead>{t('tickets.reporter', 'Pelapor')}</TableHead>
                  <TableHead>Tanggal Dibuat</TableHead>
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
                      <TableCell>
                        <UrgencyBadge urgency={ticket.urgency} />
                      </TableCell>
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
                          <Link to={`/technician/tickets/${ticket.id}`}>
                            <Eye className="mr-1.5 h-3.5 w-3.5" /> Detail
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
                        description="Antrian tiket saat ini kosong."
                      />
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
