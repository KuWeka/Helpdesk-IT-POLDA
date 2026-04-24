
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext.jsx';
import api from '@/lib/api.js';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.jsx';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table.jsx';
import { Button } from '@/components/ui/button.jsx';
import { Skeleton } from '@/components/ui/skeleton.jsx';
import { Switch } from '@/components/ui/switch.jsx';
import { Badge } from '@/components/ui/badge.jsx';
import { Empty, EMPTY_STATE_VARIANTS } from '@/components/ui/empty.jsx';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog.jsx';
import { ListOrdered, CheckCircle2, Calendar, Hand, ArrowRight, Activity, TrendingUp, ShieldCheck, Timer, Flame } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import UrgencyBadge from '@/components/UrgencyBadge.jsx';
import InsightCard from '@/components/InsightCard.jsx';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { TICKET_STATUS } from '@/lib/constants.js';
import SectionHeader from '@/components/SectionHeader.jsx';

const safeFormatDate = (value, pattern = 'dd MMM HH:mm') => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return format(date, pattern);
};

export default function TechnicianDashboard() {
  const { t } = useTranslation();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  
  const [techSettings, setTechSettings] = useState({ is_active: true });
  const [stats, setStats] = useState({ pending: 0, myProses: 0, completedToday: 0, totalThisMonth: 0 });
  const [pendingTickets, setPendingTickets] = useState([]);
  const [myTickets, setMyTickets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [ticketTrendData, setTicketTrendData] = useState([]);
  const [slaCompliance, setSlaCompliance] = useState(0);
  const [agingTickets, setAgingTickets] = useState(0);
  const [urgentTickets, setUrgentTickets] = useState(0);
  
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [isTaking, setIsTaking] = useState(false);

  useEffect(() => {
    if (currentUser && currentUser.id) {
      fetchDashboardData();
    }
  }, [currentUser]);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      const { data } = await api.get('/dashboard/technician-summary');
      const payload = data?.data || {};

      setTechSettings(payload.techSettings || {
        id: currentUser.id,
        is_active: currentUser.is_active
      });

      setStats(payload.stats || {
        pending: 0,
        myProses: 0,
        completedToday: 0,
        totalThisMonth: 0
      });

      setPendingTickets(payload.pendingTickets || []);
      setMyTickets(payload.myTickets || []);

      const allTechTickets = [...(payload.pendingTickets || []), ...(payload.myTickets || [])];
      const now = Date.now();
      const threeDaysMs = 3 * 24 * 60 * 60 * 1000;

      const agingCount = allTechTickets.filter((tk) => {
        const createdAt = tk.created_at || tk.created;
        const createdTs = createdAt ? new Date(createdAt).getTime() : null;
        if (!createdTs || Number.isNaN(createdTs)) return false;
        return now - createdTs > threeDaysMs;
      }).length;

      const urgentCount = allTechTickets.filter((tk) => {
        const urgency = String(tk.urgency || '').toLowerCase();
        return urgency.includes('tinggi') || urgency.includes('urgent') || urgency.includes('critical') || urgency.includes('kritis') || urgency.includes('high');
      }).length;

      const handled = (payload.stats?.myProses || 0) + (payload.stats?.completedToday || 0);
      const slaPct = handled > 0 ? Math.round(((payload.stats?.completedToday || 0) / handled) * 100) : 0;

      const dayMap = new Map();
      allTechTickets.forEach((tk) => {
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

    } catch (error) {
      console.error('Dashboard error:', error);
      toast.error(t('techDashboard.toast.loadError', 'Failed to load dashboard data'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleStatus = async (checked) => {
    if (!techSettings || isUpdatingStatus) return;
    setIsUpdatingStatus(true);
    setTechSettings(prev => ({ ...prev, is_active: checked }));
    
    try {
      // Update via technicians endpoint
      await api.patch(`/technicians/${currentUser.id}`, {
        is_active: checked,
        tech_is_active: checked
      });
      
      toast.success(t('techDashboard.toast.statusUpdated', 'Status updated successfully'));
    } catch (error) {
      console.error('Error updating status:', error);
      setTechSettings(prev => ({ ...prev, is_active: !checked }));
      toast.error(t('techDashboard.toast.statusUpdateFailed', 'Failed to update status'));
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleTakeTicket = async () => {
    if (!selectedTicket) return;
    setIsTaking(true);
    try {
      await api.patch(`/tickets/${selectedTicket.id}`, {
        assigned_technician_id: currentUser.id,
        status: TICKET_STATUS.PROSES
      });
      
      toast.success(t('techDashboard.toast.ticketTaken', 'Ticket claimed successfully'));
      const targetId = selectedTicket.id;
      setSelectedTicket(null);
      
      setTimeout(() => {
        navigate(`/technician/tickets/${targetId}`);
      }, 500);
      
    } catch (error) {
      toast.error(t('techDashboard.toast.ticketTakeFailed', 'Failed to claim ticket'));
      setSelectedTicket(null);
      fetchDashboardData();
    } finally {
      setIsTaking(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-card p-6 rounded-2xl border shadow-sm">
        <div>
          <SectionHeader
            title={t('dashboard.tech_title', 'Dashboard Teknisi')}
            subtitle={`${t('dashboard.hello', 'Hello')}, ${currentUser?.name || t('roles.technician', 'Technician')}`}
          />
        </div>
        
        <div className="flex items-center gap-4 bg-background p-3 rounded-xl border">
          <div className="flex flex-col items-end">
            <span className="text-sm font-medium text-foreground">{t('techDashboard.workStatus', 'Work Status')}</span>
            {techSettings?.is_active ? (
              <Badge className="bg-green-500 hover:bg-green-600">{t('techDashboard.active', 'Active')}</Badge>
            ) : (
              <Badge variant="secondary">{t('techDashboard.offDuty', 'Off Duty')}</Badge>
            )}
          </div>
          <Switch 
            checked={techSettings?.is_active || false} 
            onCheckedChange={handleToggleStatus}
            disabled={isUpdatingStatus || !techSettings}
          />
        </div>
      </div>


      {/* Summary Cards */}
      {isLoading ? (
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
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
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          {[
            { title: t('techDashboard.cards.allPending', 'All Pending'), value: stats.pending, icon: ListOrdered, note: t('techDashboard.cards.allPendingNote', 'Waiting queue tickets') },
            { title: t('techDashboard.cards.myInProgress', 'My In Progress Tickets'), value: stats.myProses, icon: Activity, note: t('techDashboard.cards.myInProgressNote', 'Currently being handled') },
            { title: t('techDashboard.cards.completedToday', 'Completed Today'), value: stats.completedToday, icon: CheckCircle2, note: t('techDashboard.cards.completedTodayNote', 'Technician daily performance') },
            { title: t('techDashboard.cards.totalThisMonth', 'Total This Month'), value: stats.totalThisMonth, icon: Calendar, note: t('techDashboard.cards.totalThisMonthNote', 'Monthly ticket accumulation') },
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
        <InsightCard title={t('techDashboard.insights.trendTitle', 'Technician Ticket Trend')} icon={TrendingUp} isLoading={isLoading}>
          {ticketTrendData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={ticketTrendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" />
                <YAxis stroke="hsl(var(--muted-foreground))" allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <Empty
              variant={EMPTY_STATE_VARIANTS.NO_RESULTS}
              title={t('techDashboard.insights.noTrendTitle', 'Trend data is not available yet')}
              description={t('techDashboard.insights.noTrendDesc', 'No trend data to display')}
            />
          )}
        </InsightCard>

        <InsightCard title={t('techDashboard.insights.slaTitle', 'SLA Completion')} icon={ShieldCheck} isLoading={isLoading}>
          <div className="flex items-center gap-4">
            <div className="text-3xl font-bold text-primary">{slaCompliance}%</div>
            <div className="text-sm text-muted-foreground">{t('techDashboard.insights.slaDesc', 'Technician ticket completion ratio today')}</div>
          </div>
        </InsightCard>

        <InsightCard title={t('techDashboard.insights.agingTitle', 'Ticket Aging')} icon={Timer} isLoading={isLoading}>
          <div className="space-y-2">
            <div className="text-2xl font-bold text-amber-600">{agingTickets}</div>
            <p className="text-sm text-muted-foreground">{t('techDashboard.insights.agingDesc', 'Tickets older than 3 days are still unresolved')}</p>
          </div>
        </InsightCard>

        <InsightCard title={t('techDashboard.insights.priorityTitle', 'Today Priority')} icon={Flame} isLoading={isLoading}>
          <div className="space-y-2">
            <div className="text-2xl font-bold text-red-600">{urgentTickets}</div>
            <p className="text-sm text-muted-foreground">{t('techDashboard.insights.priorityDesc', 'High-priority tickets in technician queue')}</p>
          </div>
        </InsightCard>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        <Card className="border-border shadow-sm flex flex-col">
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <CardTitle className="text-xl">{t('tickets.queue', 'Antrian Tiket')}</CardTitle>
            <Button variant="ghost" size="sm" asChild className="text-primary hover:text-primary/80">
              <Link to="/technician/queue">{t('common.viewAll', 'View All')} <ArrowRight className="ml-1 h-4 w-4" /></Link>
            </Button>
          </CardHeader>
          <CardContent className="flex-1 p-0">
            <div className="overflow-x-auto">
              <Table className="min-w-full">
                <TableHeader className="bg-muted/30">
                  <TableRow>
                    <TableHead className="px-4">{t('common.titleAndId', 'Title & ID')}</TableHead>
                    <TableHead>{t('common.urgency', 'Urgency')}</TableHead>
                    <TableHead>{t('common.date', 'Date')}</TableHead>
                    <TableHead className="text-right px-4">{t('common.actions', 'Actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    Array(3).fill(0).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell className="px-4"><Skeleton className="h-10 w-32" /></TableCell>
                        <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                        <TableCell className="text-right px-4"><Skeleton className="h-8 w-20 ml-auto" /></TableCell>
                      </TableRow>
                    ))
                  ) : pendingTickets.length > 0 ? (
                    pendingTickets.map((ticket) => (
                      <TableRow key={ticket.id} className="hover:bg-muted/30">
                        <TableCell className="px-4 py-3">
                          <div className="font-medium text-foreground truncate max-w-[180px]" title={ticket.title}>{ticket.title}</div>
                          <div className="text-xs text-muted-foreground font-mono mt-0.5">{ticket.ticket_number}</div>
                        </TableCell>
                        <TableCell><UrgencyBadge urgency={ticket.urgency} /></TableCell>
                        <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                          {safeFormatDate(ticket.created_at || ticket.created)}
                        </TableCell>
                        <TableCell className="text-right px-4">
                          <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white" onClick={() => setSelectedTicket(ticket)}>
                            <Hand className="mr-1.5 h-3.5 w-3.5" /> {t('techDashboard.take', 'Take')}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} className="h-32 text-center text-muted-foreground">
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
          </CardContent>
        </Card>

        <Card className="border-border shadow-sm flex flex-col">
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <CardTitle className="text-xl">{t('techDashboard.myInProgressTitle', 'My In Progress Tickets')}</CardTitle>
            <Button variant="ghost" size="sm" asChild className="text-primary hover:text-primary/80">
              <Link to="/technician/tickets">{t('common.viewAll', 'View All')} <ArrowRight className="ml-1 h-4 w-4" /></Link>
            </Button>
          </CardHeader>
          <CardContent className="flex-1 p-0">
            <div className="overflow-x-auto">
              <Table className="min-w-full">
                <TableHeader className="bg-muted/30">
                  <TableRow>
                    <TableHead className="px-4">{t('common.titleAndId', 'Title & ID')}</TableHead>
                    <TableHead>{t('tickets.reporter', 'Pelapor')}</TableHead>
                    <TableHead className="text-right px-4">{t('common.actions', 'Actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    Array(3).fill(0).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell className="px-4"><Skeleton className="h-10 w-32" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                        <TableCell className="text-right px-4"><Skeleton className="h-8 w-20 ml-auto" /></TableCell>
                      </TableRow>
                    ))
                  ) : myTickets.length > 0 ? (
                    myTickets.map((ticket) => (
                      <TableRow key={ticket.id} className="hover:bg-muted/30">
                        <TableCell className="px-4 py-3">
                          <div className="font-medium text-foreground truncate max-w-[180px]" title={ticket.title}>{ticket.title}</div>
                          <div className="text-xs text-muted-foreground font-mono mt-0.5">{ticket.ticket_number}</div>
                        </TableCell>
                        <TableCell className="text-sm truncate max-w-[120px]">
                          {ticket.reporter_name || ticket.user_id || t('tickets.unknown_user', 'Pengguna tidak diketahui')}
                        </TableCell>
                        <TableCell className="text-right px-4">
                          <Button variant="outline" size="sm" asChild>
                            <Link to={`/technician/tickets/${ticket.id}`}>{t('common.detail', 'Detail')}</Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={3} className="h-32 text-center text-muted-foreground">
                        <Empty
                          variant={EMPTY_STATE_VARIANTS.NO_RESULTS}
                          title={t('tickets.no_tickets', 'Tidak ada tiket')}
                          description={t('techDashboard.myInProgressEmptyDesc', 'There are no in-progress tickets assigned to you at the moment.')}
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

      <Dialog open={!!selectedTicket} onOpenChange={(open) => !open && setSelectedTicket(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('techDashboard.takeDialog.title', 'Confirm Take Ticket')}</DialogTitle>
            <DialogDescription>
              {t('techDashboard.takeDialog.desc', 'Are you sure you want to take and process this ticket?')}
            </DialogDescription>
          </DialogHeader>
          {selectedTicket && (
            <div className="bg-muted/30 p-4 rounded-xl border space-y-2 mt-2">
              <div className="flex items-center justify-between">
                <span className="font-mono text-sm font-semibold">{selectedTicket.ticket_number}</span>
                <UrgencyBadge urgency={selectedTicket.urgency} />
              </div>
              <p className="font-medium text-foreground">{selectedTicket.title}</p>
            </div>
          )}
          <DialogFooter className="gap-2 sm:gap-0 mt-4">
            <Button variant="outline" onClick={() => setSelectedTicket(null)} disabled={isTaking}>
              {t('buttons.cancel', 'Batal')}
            </Button>
            <Button onClick={handleTakeTicket} disabled={isTaking} className="bg-blue-600 hover:bg-blue-700 text-white">
              {isTaking ? t('common.processing', 'Processing...') : t('techDashboard.takeDialog.confirm', 'Yes, Take Ticket')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
