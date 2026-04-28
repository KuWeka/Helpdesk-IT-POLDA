
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext.jsx';
import api from '@/lib/api.js';
import { Button } from '@/components/ui/button.jsx';
import SectionHeader from '@/components/common/SectionHeader.jsx';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.jsx';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table.jsx';
import { Skeleton } from '@/components/ui/skeleton.jsx';
import { Empty, EmptyHeader, EmptyTitle, EmptyDescription, EmptyMedia } from '@/components/ui/empty.jsx';
import { MessageSquare, PlusCircle, ArrowRight, AlertCircle, Clock, CheckCircle2, TrendingUp, ShieldCheck, Timer, Flame } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import StatusBadge from '@/components/tickets/StatusBadge.jsx';
import InsightCard from '@/components/tickets/InsightCard.jsx';
import { format } from 'date-fns';

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

export default function UserDashboard() {
  const { t } = useTranslation();
  const { currentUser } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [stats, setStats] = useState({ pending: 0, proses: 0, selesai: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [userDivision, setUserDivision] = useState('');
  const [ticketTrendData, setTicketTrendData] = useState([]);
  const [slaCompliance, setSlaCompliance] = useState(0);
  const [agingTickets, setAgingTickets] = useState(0);
  const [urgentTickets, setUrgentTickets] = useState(0);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [summaryRes, ticketsRes] = await Promise.all([
          api.get('/tickets/summary', {
            params: {
              role: 'user',
              userId: currentUser.id,
              dashboardType: 'user'
            }
          }),
          api.get('/tickets', {
            params: {
              page: 1,
              perPage: 10,
              sort: 'created_at',
              order: 'desc'
            }
          })
        ]);

        const summaryPayload = summaryRes.data?.data?.summary || summaryRes.data?.summary || {};
        setStats({
          pending: Number(summaryPayload.pending || 0),
          proses: Number(summaryPayload.proses || 0),
          selesai: Number(summaryPayload.selesai || 0)
        });
        setSlaCompliance(Number(summaryPayload.sla_compliance || 0));
        setAgingTickets(Number(summaryPayload.aging_count || 0));
        setUrgentTickets(Number(summaryPayload.urgent_count || 0));

        const trendRows = Array.isArray(summaryPayload.trend) ? summaryPayload.trend : [];
        setTicketTrendData(
          trendRows.map((item) => ({
            date: safeFormatDate(item.date, 'dd MMM'),
            count: Number(item.count || 0)
          }))
        );

        const recentTickets = extractItems(ticketsRes.data);
        setTickets(recentTickets);

      } catch (err) {
        console.error('Error fetching dashboard data:', err);
      } finally {
        setIsLoading(false);
      }
    };

    if (currentUser) {
      fetchDashboardData();
    }
  }, [currentUser]);

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 flex flex-col gap-8 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <SectionHeader
            title={t('dashboard.user_title', 'Dashboard User')}
            subtitle={currentUser?.division ? `Divisi: ${currentUser.division}` : undefined}
            actions={null}
          />
          <p className="text-sm text-muted-foreground mt-1">
            {t('dashboard.hello', 'Halo')}, <span className="font-medium text-foreground">{currentUser?.name}</span>
            {userDivision && <span> dari <span className="font-medium text-foreground">{userDivision}</span></span>}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="gap-2 bg-background shadow-sm" asChild>
            <Link to="/user/chats">
              <MessageSquare className="h-4 w-4" />
              Chat Teknisi
            </Link>
          </Button>
          <Button asChild className="gap-2 shadow-sm">
            <Link to="/user/create-ticket">
              <PlusCircle className="h-4 w-4" />
              {t('buttons.create_ticket', 'Buat Tiket Baru')}
            </Link>
          </Button>
        </div>
      </div>


      {/* Summary Cards */}
      {isLoading ? (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[
            { title: t('status.pending', 'Pending'), value: stats.pending, icon: Clock, note: 'Tiket menunggu diproses' },
            { title: t('status.proses', 'Proses'), value: stats.proses, icon: AlertCircle, note: 'Sedang dalam penanganan' },
            { title: t('status.selesai', 'Selesai'), value: stats.selesai, icon: CheckCircle2, note: 'Sudah dituntaskan' },
          ].map((item) => (
            <Card key={item.title} className="border-border bg-card/95 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{item.title}</CardTitle>
                <item.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{item.value}</div>
                <p className="text-xs text-muted-foreground mt-1">{item.note}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Insight Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 mt-4">
        <InsightCard title="Tren Tiket Bulan Ini" icon={TrendingUp} isLoading={isLoading}>
          {ticketTrendData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={ticketTrendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" />
                <YAxis stroke="hsl(var(--muted-foreground))" allowDecimals={false} />
                <Tooltip />
                <Line type="monotone" dataKey="count" stroke="hsl(var(--primary))" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-muted-foreground">Tidak ada data trend untuk ditampilkan</p>
          )}
        </InsightCard>

        <InsightCard title="SLA Penyelesaian" icon={ShieldCheck} isLoading={isLoading}>
          <div className="flex items-center gap-4">
            <div className="text-3xl font-bold text-primary">{slaCompliance}%</div>
            <div className="text-sm text-muted-foreground">dari tiket berhasil diselesaikan</div>
          </div>
        </InsightCard>

        <InsightCard title="Aging Tiket" icon={Timer} isLoading={isLoading}>
          <div className="space-y-2">
            <div className="text-2xl font-bold text-amber-600">{agingTickets}</div>
            <p className="text-sm text-muted-foreground">Tiket lebih dari 3 hari belum selesai</p>
          </div>
        </InsightCard>

        <InsightCard title="Prioritas Hari Ini" icon={Flame} isLoading={isLoading}>
          <div className="space-y-2">
            <div className="text-2xl font-bold text-red-600">{urgentTickets}</div>
            <p className="text-sm text-muted-foreground">Tiket prioritas tinggi menunggu penanganan</p>
          </div>
        </InsightCard>
      </div>

      <Card className="border-border bg-card/95 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <CardTitle className="text-xl">Tiket Terkini</CardTitle>
          <Link to="/user/tickets" className="text-sm font-medium text-primary flex items-center gap-1 hover:underline">
            Lihat Semua <ArrowRight className="h-4 w-4" />
          </Link>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table className="min-w-full">
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead>ID Tiket</TableHead>
                  <TableHead>Judul</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Teknisi</TableHead>
                  <TableHead>Tanggal</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array(3).fill(0).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-48" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-24 rounded-full" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                      <TableCell className="text-right"><Skeleton className="h-8 w-16 ml-auto" /></TableCell>
                    </TableRow>
                  ))
                ) : tickets.length > 0 ? (
                  tickets.map((ticket) => (
                    <TableRow key={ticket.id} className="hover:bg-muted/30 transition-colors">
                      <TableCell className="font-medium font-mono text-sm">{ticket.ticket_number}</TableCell>
                      <TableCell className="max-w-[200px] truncate" title={ticket.title}>{ticket.title}</TableCell>
                      <TableCell>
                        <StatusBadge status={ticket.status} />
                      </TableCell>
                      <TableCell>
                        {ticket.technician_name || (
                          <span className="text-muted-foreground italic">Belum ada</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                        {safeFormatDate(ticket.created_at || ticket.created)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" asChild>
                          <Link to={`/user/tickets/${ticket.id}`}>Detail</Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="h-32 text-center">
                      <Empty>
                        <EmptyHeader>
                          <EmptyMedia variant="icon">
                            <AlertCircle className="h-6 w-6 opacity-50" />
                          </EmptyMedia>
                          <EmptyTitle>{t('tickets.no_tickets', 'Tidak ada tiket')}</EmptyTitle>
                          <EmptyDescription>Belum ada tiket yang dilaporkan.</EmptyDescription>
                        </EmptyHeader>
                      </Empty>
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
