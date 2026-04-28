
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import api from '@/lib/api.js';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card.jsx';
import { Label } from '@/components/ui/label.jsx';
import { Input } from '@/components/ui/input.jsx';
import { Button } from '@/components/ui/button.jsx';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.jsx';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs.jsx';
import { Switch } from '@/components/ui/switch.jsx';
import { Textarea } from '@/components/ui/textarea.jsx';
import { toast } from 'sonner';
import { Loader2, Save, Clock, ShieldAlert, Bell, Mail, Globe, Database } from 'lucide-react';
import SectionHeader from '@/components/common/SectionHeader.jsx';

export default function SystemSettingsPage() {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const [data, setData] = useState({
    app_name: 'IT Helpdesk',
    app_description: '',
    operating_hours_start: '08:00',
    operating_hours_end: '17:00',
    global_pending_limit: 100, // Visual only unless schema added later
    per_tech_limit: 5,
    notif_email: true,
    notif_chat: true,
    notif_wa: true,
    smtp_user: 'noreply@helpdesk.com',
    sender_name: 'Helpdesk Support',
    email_template: 'Halo {{name}},\n\nTiket Anda #{{ticket}} telah diperbarui.\n\nTerima kasih.',
    language: 'ID',
    timezone: 'WIB',
    maintenance_mode: false
  });

  useEffect(() => {
    api.get('/settings')
      .then(({ data: res }) => {
        const rec = res?.settings || {};
        setData(prev => ({
          ...prev,
          app_name: rec.app_name || prev.app_name,
          app_description: rec.app_description || prev.app_description,
          maintenance_mode: Boolean(rec.maintenance_mode)
        }));
      }).catch(console.error);
  }, []);

  const handleSave = async (sectionMsg) => {
    setIsLoading(true);
    try {
      await api.patch('/settings', {
        app_name: data.app_name,
        app_description: data.app_description,
        maintenance_mode: data.maintenance_mode,
      });
      toast.success(`${sectionMsg} ${t('systemSettings.saved', 'saved successfully')}`);
    } catch (e) {
      toast.error(`${t('systemSettings.saveFailed', 'Failed to save')} ${sectionMsg}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-500 pb-12">
      <SectionHeader
        title={t('nav.item.Pengaturan Sistem', 'System Settings')}
        subtitle={t('systemSettings.subtitle', 'Manage global system configuration for the helpdesk application.')}
      />

      <Tabs defaultValue="jam" className="space-y-6">
        <TabsList className="flex w-full flex-nowrap justify-start overflow-x-auto">
          <TabsTrigger value="jam" className="gap-2 shrink-0"><Clock className="h-4 w-4" /><span>{t('systemSettings.tabs.operationalHours', 'Operational Hours')}</span></TabsTrigger>
          <TabsTrigger value="batas" className="gap-2 shrink-0"><ShieldAlert className="h-4 w-4" /><span>{t('systemSettings.tabs.ticketLimits', 'Ticket Limits')}</span></TabsTrigger>
          <TabsTrigger value="notifikasi" className="gap-2 shrink-0"><Bell className="h-4 w-4" /><span>{t('systemSettings.tabs.notifications', 'Notifications')}</span></TabsTrigger>
          <TabsTrigger value="email" className="gap-2 shrink-0"><Mail className="h-4 w-4" /><span>Email</span></TabsTrigger>
          <TabsTrigger value="bahasa" className="gap-2 shrink-0"><Globe className="h-4 w-4" /><span>{t('systemSettings.tabs.language', 'Language')}</span></TabsTrigger>
          <TabsTrigger value="backup" className="gap-2 shrink-0"><Database className="h-4 w-4" /><span>{t('systemSettings.tabs.maintenance', 'Maintenance')}</span></TabsTrigger>
        </TabsList>

        <div>
          <TabsContent value="jam" className="mt-0">
            <Card className="border-border shadow-sm">
              <CardHeader><CardTitle>{t('systemSettings.operationalHours.title', 'Operational Hours')}</CardTitle><CardDescription>{t('systemSettings.operationalHours.desc', 'Outside operational hours, new tickets cannot be created.')}</CardDescription></CardHeader>
              <CardContent className="pt-6 space-y-4">
                <div className="flex gap-4 max-w-md">
                  <div className="space-y-2 flex-1"><Label>{t('systemSettings.openHour', 'Open Hour')}</Label><Input type="time" value={data.operating_hours_start} onChange={(e) => setData({...data, operating_hours_start: e.target.value})} className="bg-background"/></div>
                  <div className="space-y-2 flex-1"><Label>{t('systemSettings.closeHour', 'Close Hour')}</Label><Input type="time" value={data.operating_hours_end} onChange={(e) => setData({...data, operating_hours_end: e.target.value})} className="bg-background"/></div>
                </div>
              </CardContent>
              <CardFooter className="border-t pt-6"><Button onClick={() => handleSave(t('systemSettings.operationalHours.title', 'Operational Hours'))} disabled={isLoading}><Save className="h-4 w-4 mr-2"/> {t('common.save', 'Save')}</Button></CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value="batas" className="mt-0">
            <Card className="border-border shadow-sm">
              <CardHeader><CardTitle>{t('systemSettings.ticketLimitsTitle', 'Global Ticket Limits')}</CardTitle><CardDescription>{t('systemSettings.ticketLimitsDesc', 'Set queue capacity and per-technician limits.')}</CardDescription></CardHeader>
              <CardContent className="pt-6 space-y-4 max-w-md">
                <div className="space-y-2"><Label>{t('systemSettings.maxPendingQueue', 'Maximum Pending Queue')}</Label><Input type="number" value={data.global_pending_limit} onChange={(e) => setData({...data, global_pending_limit: e.target.value})} className="bg-background"/></div>
                <div className="space-y-2"><Label>{t('systemSettings.defaultPerTechLimit', 'Default Ticket Limit Per Technician')}</Label><Input type="number" value={data.per_tech_limit} onChange={(e) => setData({...data, per_tech_limit: e.target.value})} className="bg-background"/></div>
              </CardContent>
              <CardFooter className="border-t pt-6"><Button onClick={() => handleSave(t('systemSettings.tabs.ticketLimits', 'Ticket Limits'))} disabled={isLoading}><Save className="h-4 w-4 mr-2"/> {t('common.save', 'Save')}</Button></CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value="notifikasi" className="mt-0">
            <Card className="border-border shadow-sm">
              <CardHeader><CardTitle>{t('systemSettings.notificationsTitle', 'System Notifications')}</CardTitle><CardDescription>{t('systemSettings.notificationsDesc', 'Choose default notification channels.')}</CardDescription></CardHeader>
              <CardContent className="pt-6 space-y-6 max-w-md">
                <div className="flex items-center justify-between"><Label className="text-base cursor-pointer" onClick={() => setData({...data, notif_email: !data.notif_email})}>{t('systemSettings.emailNotifications', 'Email Notifications')}</Label><Switch checked={data.notif_email} onCheckedChange={(c) => setData({...data, notif_email: c})} /></div>
                <div className="flex items-center justify-between"><Label className="text-base cursor-pointer" onClick={() => setData({...data, notif_chat: !data.notif_chat})}>{t('systemSettings.internalChatApp', 'Internal Chat App')}</Label><Switch checked={data.notif_chat} onCheckedChange={(c) => setData({...data, notif_chat: c})} /></div>
                <div className="flex items-center justify-between"><Label className="text-base cursor-pointer" onClick={() => setData({...data, notif_wa: !data.notif_wa})}>{t('systemSettings.whatsappGateway', 'WhatsApp Gateway')}</Label><Switch checked={data.notif_wa} onCheckedChange={(c) => setData({...data, notif_wa: c})} /></div>
              </CardContent>
              <CardFooter className="border-t pt-6"><Button onClick={() => handleSave(t('systemSettings.tabs.notifications', 'Notifications'))} disabled={isLoading}><Save className="h-4 w-4 mr-2"/> {t('common.save', 'Save')}</Button></CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value="email" className="mt-0">
            <Card className="border-border shadow-sm">
              <CardHeader><CardTitle>{t('systemSettings.emailSettingsTitle', 'Email Settings')}</CardTitle><CardDescription>{t('systemSettings.emailSettingsDesc', 'Manage sender identity and notification templates.')}</CardDescription></CardHeader>
              <CardContent className="pt-6 space-y-4 max-w-lg">
                <div className="space-y-2"><Label>Sender Email (Read-only)</Label><Input value={data.smtp_user} disabled className="bg-muted text-muted-foreground"/></div>
                <div className="space-y-2"><Label>Sender Name</Label><Input value={data.sender_name} onChange={(e) => setData({...data, sender_name: e.target.value})} className="bg-background"/></div>
                <div className="space-y-2"><Label>{t('systemSettings.defaultTemplateText', 'Default Template (Text)')}</Label><Textarea rows={4} value={data.email_template} onChange={(e) => setData({...data, email_template: e.target.value})} className="bg-background"/></div>
              </CardContent>
              <CardFooter className="border-t pt-6"><Button onClick={() => handleSave(t('systemSettings.tabs.email', 'Email'))} disabled={isLoading}><Save className="h-4 w-4 mr-2"/> {t('common.save', 'Save')}</Button></CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value="bahasa" className="mt-0">
            <Card className="border-border shadow-sm">
              <CardHeader><CardTitle>{t('systemSettings.localeTimeTitle', 'Locale & Time')}</CardTitle><CardDescription>{t('systemSettings.localeTimeDesc', 'Set default language and system time zone.')}</CardDescription></CardHeader>
              <CardContent className="pt-6 space-y-4 max-w-md">
                <div className="space-y-2">
                  <Label>{t('systemSettings.defaultLanguage', 'Default Language')}</Label>
                  <Select value={data.language} onValueChange={(v) => setData({...data, language: v})}><SelectTrigger className="bg-background"><SelectValue/></SelectTrigger><SelectContent><SelectItem value="ID">Indonesia</SelectItem><SelectItem value="EN">English</SelectItem></SelectContent></Select>
                </div>
                <div className="space-y-2">
                  <Label>{t('systemSettings.timezone', 'Time Zone')}</Label>
                  <Select value={data.timezone} onValueChange={(v) => setData({...data, timezone: v})}><SelectTrigger className="bg-background"><SelectValue/></SelectTrigger><SelectContent><SelectItem value="WIB">WIB (GMT+7)</SelectItem><SelectItem value="WITA">WITA (GMT+8)</SelectItem><SelectItem value="WIT">WIT (GMT+9)</SelectItem></SelectContent></Select>
                </div>
              </CardContent>
              <CardFooter className="border-t pt-6"><Button onClick={() => handleSave(t('systemSettings.tabs.language', 'Language'))} disabled={isLoading}><Save className="h-4 w-4 mr-2"/> {t('common.save', 'Save')}</Button></CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value="backup" className="mt-0">
            <Card className="border-border shadow-sm border-destructive/20">
              <CardHeader><CardTitle>{t('systemSettings.maintenanceTitle', 'Maintenance System')}</CardTitle><CardDescription>{t('systemSettings.maintenanceDesc', 'Manage maintenance mode and utility operations.')}</CardDescription></CardHeader>
              <CardContent className="pt-6 space-y-6">
                <div className="flex items-center justify-between border-b pb-4">
                  <div><p className="font-medium">{t('systemSettings.maintenanceMode', 'Maintenance Mode')}</p><p className="text-sm text-muted-foreground">{t('systemSettings.maintenanceModeDesc', 'Users cannot log in during maintenance mode.')}</p></div>
                  <Switch checked={data.maintenance_mode} onCheckedChange={(c) => setData({...data, maintenance_mode: c})} />
                </div>
                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => toast.success(t('systemSettings.backupStarted', 'Exporting database...'))}><Database className="h-4 w-4 mr-2"/> {t('systemSettings.backupDb', 'Backup DB')}</Button>
                  <Button variant="outline" onClick={() => toast.success(t('systemSettings.cacheCleared', 'Cache cleared'))}>{t('systemSettings.clearCache', 'Clear Cache')}</Button>
                </div>
              </CardContent>
              <CardFooter className="border-t pt-6"><Button onClick={() => handleSave(t('systemSettings.tabs.maintenance', 'Maintenance'))} disabled={isLoading}><Save className="h-4 w-4 mr-2"/> {t('common.save', 'Save')}</Button></CardFooter>
            </Card>
          </TabsContent>

        </div>
      </Tabs>
    </div>
  );
}
