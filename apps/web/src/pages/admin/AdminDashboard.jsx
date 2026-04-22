
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext.jsx';
import api from '@/lib/api.js';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table.jsx';
import { Button } from '@/components/ui/button.jsx';
import { Skeleton } from '@/components/ui/skeleton.jsx';
import { Empty, EMPTY_STATE_VARIANTS } from '@/components/ui/empty.jsx';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart.jsx';
import { Ticket, Users, CheckCircle2, Clock, PlayCircle, BarChart3, TrendingUp, ShieldCheck, Timer, Flame } from 'lucide-react';
import UrgencyBadge from '@/components/UrgencyBadge.jsx';
import InsightCard from '@/components/InsightCard.jsx';
import SectionHeader from '@/components/SectionHeader.jsx';
import { format } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line, Tooltip, ResponsiveContainer } from 'recharts';

const chartConfig = {
  total: {
    label: 'Jumlah Tiket',
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

      const urgentCount = [...pendingData, ...prosesData].filter((tk) => {
        const urgency = String(tk.urgency || '').toLowerCase();
        return urgency.includes('tinggi') || urgency.includes('urgent') || urgency.includes('critical') || urgency.includes('kritis') || urgency.includes('high');
      }).length;

      const totalTickets = payload.stats?.total || 0;
      const doneTickets = payload.stats?.selesai || 0;
      const slaPct = totalTickets > 0 ? Math.round((doneTickets / totalTickets) * 100) : 0;

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
      setUrgentTickets(urgentCount);
      setSlaCompliance(slaPct);
      setTicketTrendData(trend);

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
        <div className={`${items.length > 0 ? 'max-h-[280px] overflow-y-auto' : ''} overflow-x-auto rounded-lg border border-border`}>
          <Table className="min-w-full">
          <TableHeader className="bg-muted/30">
            <TableRow>
              <TableHead className="px-4">ID & Judul</TableHead>
              <TableHead>Urgensi</TableHead>
              <TableHead>{t('tickets.reporter', 'Pelapor')}</TableHead>
              {isProsesOrSelesai && <TableHead>{t('roles.technician', 'Teknisi')}</TableHead>}
              <TableHead>Tanggal</TableHead>
              <TableHead className="text-right px-4">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array(3).fill(0).map((_, i) => (
                <TableRow key={i}>
                  <TableCell className="px-4"><Skeleton className="h-5 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-16 rounded-full" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-24" /></TableCell>
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
                  <TableCell><UrgencyBadge urgency={tk.urgency} /></TableCell>
                  <TableCell className="text-sm truncate max-w-[120px]">{tk.reporter_name || '-'}</TableCell>
                  {isProsesOrSelesai && (
                    <TableCell className="text-sm truncate max-w-[120px]">{tk.technician_name || '-'}</TableCell>
                  )}
                  <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                    {safeFormatDate(tk.created_at || tk.created)}
                  </TableCell>
                  <TableCell className="text-right px-4">
                    <Button variant="secondary" size="sm" asChild>
                      <Link to={`/admin/tickets/${tk.id}`}>Detail</Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={isProsesOrSelesai ? 6 : 5} className="py-8 text-center">
                  <Empty
                    variant={EMPTY_STATE_VARIANTS.NO_RESULTS}
                    title={t('tickets.no_tickets', 'Tidak ada tiket')}
                    description="Belum ada data untuk ditampilkan pada bagian ini."
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
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {[
            { title: 'Total Tiket', value: stats.total, icon: Ticket, note: 'Semua tiket terdaftar' },
            { title: t('status.pending', 'Pending'), value: stats.pending, icon: Clock, note: 'Menunggu penanganan' },
            { title: t('status.proses', 'Proses'), value: stats.proses, icon: PlayCircle, note: 'Sedang dikerjakan' },
            { title: t('status.selesai', 'Selesai'), value: stats.selesai, icon: CheckCircle2, note: 'Telah diselesaikan' },
            { title: t('admin.active_techs', 'Teknisi Aktif'), value: stats.activeTechs, icon: Users, note: 'Teknisi sedang bertugas' },
            { title: 'Pengguna', value: stats.totalUsers, icon: Users, note: 'Total user terdaftar' }
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
            <Empty
              variant={EMPTY_STATE_VARIANTS.NO_RESULTS}
              title="Data tren belum tersedia"
              description="Belum ada data trend untuk ditampilkan"
            />
          )}
        </InsightCard>

        <InsightCard title="SLA Penyelesaian" icon={ShieldCheck} isLoading={isLoading}>
          <div className="flex items-center gap-4">
            <div className="text-3xl font-bold text-primary">{slaCompliance}%</div>
            <div className="text-sm text-muted-foreground">tiket berhasil diselesaikan dari total tiket</div>
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
            <p className="text-sm text-muted-foreground">Tiket prioritas tinggi yang perlu aksi cepat</p>
          </div>
        </InsightCard>
      </div>

      <div className="grid lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 space-y-6">
          {renderTableCard(`Tiket ${t('status.pending', 'Pending')} Terbaru`, tables.pending, false)}
          {renderTableCard(`Tiket Sedang ${t('status.proses', 'Proses')}`, tables.proses, true)}
          {renderTableCard(`Tiket Baru ${t('status.selesai', 'Selesai')}`, tables.selesai, true)}
        </div>
        
        <div className="space-y-6">
          
          <Card className="border-border shadow-sm">
            <CardHeader>
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Top 5 Teknisi Bulan Ini
              </CardTitle>
              <CardDescription>Jumlah tiket selesai per teknisi pada bulan berjalan.</CardDescription>
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
                    title="Belum ada data"
                    description="Belum ada data tiket selesai bulan ini."
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
