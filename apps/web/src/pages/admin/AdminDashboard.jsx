
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext.jsx';
import api from '@/lib/api.js';
import socket from '@/lib/socket.js';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table.jsx';
import { Button } from '@/components/ui/button.jsx';
import { Skeleton } from '@/components/ui/skeleton.jsx';
import { Empty, EMPTY_STATE_VARIANTS } from '@/components/ui/empty.jsx';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart.jsx';
import { Ticket, Users, CheckCircle2, Clock, PlayCircle, BarChart3, TrendingUp, ShieldCheck, Timer, Flame } from 'lucide-react';
import InsightCard from '@/components/tickets/InsightCard.jsx';
import SectionHeader from '@/components/common/SectionHeader.jsx';
import { format } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line, Tooltip, ResponsiveContainer } from 'recharts';

const chartConfig = {
  total: {
    label: 'Total Tickets',
    color: 'hsl(var(--primary))',
  },
};

const safeFormatDate = (value, pattern = 'dd MMM HH:mm') => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return format(date, pattern);
};

export default function AdminDashboard() {
  const { t } = useTranslation();
  const { currentUser } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  
  const [stats, setStats] = useState({
    total: 0, pending: 0, proses: 0, selesai: 0,
    activeTechs: 0, totalUsers: 0
  });

  const [tables, setTables] = useState({
    pending: [], proses: [], selesai: []
  });
  
  const [chartData, setChartData] = useState([]);
  const [ticketTrendData, setTicketTrendData] = useState([]);
  const [slaCompliance, setSlaCompliance] = useState(0);
  const [agingTickets, setAgingTickets] = useState(0);
  const [urgentTickets, setUrgentTickets] = useState(0);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  useEffect(() => {
    const handleNewTicket = () => { fetchDashboardData(); };
    const handleTicketUpdated = () => { fetchDashboardData(); };
    socket.on('ticket:new', handleNewTicket);
    socket.on('ticket_updated', handleTicketUpdated);
    return () => {
      socket.off('ticket:new', handleNewTicket);
      socket.off('ticket_updated', handleTicketUpdated);
    };
  }, []);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      const { data } = await api.get('/dashboard/admin-summary');
      const payload = data?.data || {};

      setStats(payload.stats || {
        total: 0,
        pending: 0,
        proses: 0,
        selesai: 0,
        activeTechs: 0,
        totalUsers: 0
      });

      setTables(payload.tables || {
        pending: [],
        proses: [],
        selesai: []
      });

      setChartData(payload.chartData || []);

      const pendingData = payload.tables?.pending || [];
      const prosesData = payload.tables?.proses || [];
      const selesaiData = payload.tables?.selesai || [];
      const allDashboardTickets = [...pendingData, ...prosesData, ...selesaiData];

      const now = Date.now();
      const threeDaysMs = 3 * 24 * 60 * 60 * 1000;
      const agingCount = [...pendingData, ...prosesData].filter((tk) => {
        const createdAt = tk.created_at || tk.created;
        const createdTs = createdAt ? new Date(createdAt).getTime() : null;
        if (!createdTs || Number.isNaN(createdTs)) return false;
        return now - createdTs > threeDaysMs;
      }).length;

      const totalTickets = payload.stats?.total || 0;
      const doneTickets = payload.stats?.selesai || 0;
      const slaPct = totalTickets > 0 ? Math.round((doneTickets / totalTickets) * 100) : 0;
      const urgentCount = Number(payload.stats?.urgent_count || 0);

      const dayMap = new Map();
      allDashboardTickets.forEach((tk) => {
        const createdAt = tk.created_at || tk.created;
        if (!createdAt) return;
        const date = new Date(createdAt);
        if (Number.isNaN(date.getTime())) return;
        const key = format(date, 'dd MMM');
        dayMap.set(key, (dayMap.get(key) || 0) + 1);
      });

      const trend = Array.from(dayMap.entries())
        .map(([date, count]) => ({ date, count }))
        .slice(-8);

      setAgingTickets(agingCount);
      setSlaCompliance(slaPct);
      setTicketTrendData(trend);
      setUrgentTickets(urgentCount);

    } catch (err) {
      console.error('Error fetching admin dashboard:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const renderTableCard = (title, items, isProsesOrSelesai) => (
    <Card className="border-border shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold">{title}</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className={`${items.length > 0 ? 'max-h-[280px] overflow-y-auto' : ''} overflow-x-auto`}>
          <Table className="min-w-full">
          <TableHeader className="bg-muted/30">
            <TableRow>
              <TableHead className="px-4">ID & Judul</TableHead>
              <TableHead>{t('tickets.reporter', 'Pelapor')}</TableHead>
              {isProsesOrSelesai && <TableHead>{t('roles.technician', 'Teknisi')}</TableHead>}
              <TableHead>{t('common.date', 'Date')}</TableHead>
              <TableHead className="text-right px-4">{t('common.actions', 'Actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array(3).fill(0).map((_, i) => (
                <TableRow key={i}>
                  <TableCell className="px-4"><Skeleton className="h-5 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                  {isProsesOrSelesai && <TableCell><Skeleton className="h-5 w-24" /></TableCell>}
                  <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                  <TableCell className="text-right px-4"><Skeleton className="h-8 w-16 ml-auto" /></TableCell>
                </TableRow>
              ))
            ) : items.length > 0 ? (
              items.map(tk => (
                <TableRow key={tk.id} className="hover:bg-muted/30">
                  <TableCell className="px-4">
                    <div className="font-medium text-foreground truncate max-w-[150px]">{tk.title}</div>
                    <div className="text-xs text-muted-foreground font-mono">{tk.ticket_number}</div>
                  </TableCell>
                  <TableCell className="text-sm truncate max-w-[120px]">{tk.reporter_name || '-'}</TableCell>
                  {isProsesOrSelesai && (
                    <TableCell className="text-sm truncate max-w-[120px]">{tk.padal_name || '-'}</TableCell>
                  )}
                  <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                    {safeFormatDate(tk.created_at || tk.created)}
                  </TableCell>
                  <TableCell className="text-right px-4">
                    <Button variant="secondary" size="sm" asChild>
                      <Link to={`/subtekinfo/tickets/${tk.id}`}>{t('common.detail', 'Detail')}</Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={isProsesOrSelesai ? 5 : 4} className="py-8 text-center">
                  <Empty
                    variant={EMPTY_STATE_VARIANTS.NO_RESULTS}
                    title={t('tickets.no_tickets', 'Tidak ada tiket')}
                    description={t('adminDashboard.noDataSection', 'No data to display in this section.')}
                  />
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      <SectionHeader
        title={t('dashboard.admin_title', 'Dashboard Admin')}
        subtitle={`${t('dashboard.hello', 'Halo')}, ${currentUser?.name || 'Admin'}`}
      />


      {/* Summary Cards */}
      {isLoading ? (
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => (
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
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-2 xl:grid-cols-4">
          {[
            { title: t('adminDashboard.totalTickets', 'Total Tickets'), value: stats.total, icon: Ticket, note: t('adminDashboard.totalTicketsNote', 'All tickets registered') },
            { title: t('status.pending', 'Pending'), value: stats.pending, icon: Clock, note: t('adminDashboard.pendingNote', 'Waiting for handling') },
            { title: t('status.proses', 'In Progress'), value: stats.proses, icon: PlayCircle, note: t('adminDashboard.inProgressNote', 'Currently being worked on') },
            { title: t('status.selesai', 'Completed'), value: stats.selesai, icon: CheckCircle2, note: t('adminDashboard.completedNote', 'Completed successfully') },
          ].map((item) => (
            <Card key={item.title} className="border-border shadow-sm">
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
        <InsightCard title={t('adminDashboard.insights.trendTitle', 'Ticket Trend This Month')} icon={TrendingUp} isLoading={isLoading}>
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
            <Empty
              variant={EMPTY_STATE_VARIANTS.NO_RESULTS}
              title={t('adminDashboard.insights.noTrendTitle', 'Trend data is not available yet')}
              description={t('adminDashboard.insights.noTrendDesc', 'No trend data to display')}
            />
          )}
        </InsightCard>

        <InsightCard title={t('adminDashboard.insights.slaTitle', 'SLA Completion')} icon={ShieldCheck} isLoading={isLoading}>
          <div className="flex items-center gap-4">
            <div className="text-3xl font-bold text-primary">{slaCompliance}%</div>
            <div className="text-sm text-muted-foreground">{t('adminDashboard.insights.slaDesc', 'tickets completed out of total tickets')}</div>
          </div>
        </InsightCard>

        <InsightCard title={t('adminDashboard.insights.agingTitle', 'Ticket Aging')} icon={Timer} isLoading={isLoading}>
          <div className="space-y-2">
            <div className="text-2xl font-bold text-amber-600">{agingTickets}</div>
            <p className="text-sm text-muted-foreground">{t('adminDashboard.insights.agingDesc', 'Tickets older than 3 days are still unresolved')}</p>
          </div>
        </InsightCard>

        <InsightCard title={t('adminDashboard.insights.priorityTitle', 'Today Priority')} icon={Flame} isLoading={isLoading}>
          <div className="space-y-2">
            <div className="text-2xl font-bold text-red-600">{urgentTickets}</div>
            <p className="text-sm text-muted-foreground">{t('adminDashboard.insights.priorityDesc', 'High-priority tickets that need quick action')}</p>
          </div>
        </InsightCard>
      </div>

      <div className="grid lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 space-y-6">
          {renderTableCard(t('adminDashboard.tables.pendingLatest', 'Latest Pending Tickets'), tables.pending, false)}
          {renderTableCard(t('adminDashboard.tables.inProgress', 'In Progress Tickets'), tables.proses, true)}
          {renderTableCard(t('adminDashboard.tables.completedLatest', 'Latest Completed Tickets'), tables.selesai, true)}
        </div>
        
        <div className="space-y-6">
          
          <Card className="border-border shadow-sm">
            <CardHeader>
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                {t('adminDashboard.topTechniciansTitle', 'Top 5 Technicians This Month')}
              </CardTitle>
              <CardDescription>{t('adminDashboard.topTechniciansDesc', 'Number of completed tickets per technician this month.')}</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-[280px] w-full" />
              ) : chartData.length > 0 ? (
                <ChartContainer config={chartConfig} className="h-[280px] w-full">
                  <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis
                      dataKey="name"
                      tickLine={false}
                      axisLine={false}
                      tickMargin={8}
                      tick={{ fontSize: 12 }}
                    />
                    <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 12 }} allowDecimals={false} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="total" fill="var(--color-total)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ChartContainer>
              ) : (
                <div className="h-[280px]">
                  <Empty
                    variant={EMPTY_STATE_VARIANTS.NO_RESULTS}
                    title={t('adminDashboard.emptyTitle', 'No data yet')}
                    description={t('adminDashboard.emptyDesc', 'No completed ticket data this month.')}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
