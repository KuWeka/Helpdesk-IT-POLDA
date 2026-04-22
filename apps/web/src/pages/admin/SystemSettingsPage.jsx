
import React, { useState, useEffect } from 'react';
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
import SectionHeader from '@/components/SectionHeader.jsx';

export default function SystemSettingsPage() {
  const [settingsId, setSettingsId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [data, setData] = useState({
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
    api.get('/system-settings', { params: { page: 1, perPage: 1 } })
      .then(({ data: res }) => {
        if ((res?.items || []).length > 0) {
          const rec = res.items[0];
          setSettingsId(rec.id);
          setData(prev => ({
            ...prev,
            operating_hours_start: rec.operating_hours_start || '08:00',
            operating_hours_end: rec.operating_hours_end || '17:00',
            smtp_user: rec.smtp_user || prev.smtp_user
          }));
        }
      }).catch(console.error);
  }, []);

  const handleSave = async (sectionMsg) => {
    if (!settingsId) return toast.error('Data pengaturan tidak ditemukan');
    setIsLoading(true);
    try {
      await api.patch(`/system-settings/${settingsId}`, {
        operating_hours_start: data.operating_hours_start,
        operating_hours_end: data.operating_hours_end,
      });
      toast.success(sectionMsg + ' berhasil disimpan');
    } catch (e) {
      toast.error('Gagal menyimpan ' + sectionMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in duration-500 pb-12">
      <SectionHeader
        title="Pengaturan Sistem"
        subtitle="Konfigurasi global untuk aplikasi helpdesk."
      />

      <Tabs defaultValue="jam" className="w-full flex flex-col md:flex-row gap-6">
        <TabsList className="flex flex-row md:flex-col h-auto bg-muted/30 justify-start overflow-x-auto md:w-64 shrink-0 p-2 rounded-xl border gap-1">
          <TabsTrigger value="jam" className="w-full justify-start gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"><Clock className="h-4 w-4" /> Jam Operasional</TabsTrigger>
          <TabsTrigger value="batas" className="w-full justify-start gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"><ShieldAlert className="h-4 w-4" /> Batas Tiket Global</TabsTrigger>
          <TabsTrigger value="notifikasi" className="w-full justify-start gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"><Bell className="h-4 w-4" /> Notifikasi</TabsTrigger>
          <TabsTrigger value="email" className="w-full justify-start gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"><Mail className="h-4 w-4" /> Email & Templat</TabsTrigger>
          <TabsTrigger value="bahasa" className="w-full justify-start gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"><Globe className="h-4 w-4" /> Bahasa & Zona Waktu</TabsTrigger>
          <TabsTrigger value="backup" className="w-full justify-start gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"><Database className="h-4 w-4" /> Backup & Maintenance</TabsTrigger>
        </TabsList>

        <div className="flex-1 min-w-0">
          <TabsContent value="jam" className="mt-0">
            <Card className="border-border shadow-sm">
              <CardHeader className="border-b"><CardTitle>Jam Operasional</CardTitle><CardDescription>Luar jam operasional → tiket tidak bisa dibuat</CardDescription></CardHeader>
              <CardContent className="pt-6 space-y-4">
                <div className="flex gap-4 max-w-md">
                  <div className="space-y-2 flex-1"><Label>Jam Buka</Label><Input type="time" value={data.operating_hours_start} onChange={(e) => setData({...data, operating_hours_start: e.target.value})} className="bg-background"/></div>
                  <div className="space-y-2 flex-1"><Label>Jam Tutup</Label><Input type="time" value={data.operating_hours_end} onChange={(e) => setData({...data, operating_hours_end: e.target.value})} className="bg-background"/></div>
                </div>
              </CardContent>
              <CardFooter className="border-t pt-6"><Button onClick={() => handleSave('Jam Operasional')} disabled={isLoading}><Save className="h-4 w-4 mr-2"/> Simpan</Button></CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value="batas" className="mt-0">
            <Card className="border-border shadow-sm">
              <CardHeader className="border-b"><CardTitle>Batas Tiket Global</CardTitle></CardHeader>
              <CardContent className="pt-6 space-y-4 max-w-md">
                <div className="space-y-2"><Label>Maksimal Antrian Pending</Label><Input type="number" value={data.global_pending_limit} onChange={(e) => setData({...data, global_pending_limit: e.target.value})} className="bg-background"/></div>
                <div className="space-y-2"><Label>Default Batas Tiket Per Teknisi</Label><Input type="number" value={data.per_tech_limit} onChange={(e) => setData({...data, per_tech_limit: e.target.value})} className="bg-background"/></div>
              </CardContent>
              <CardFooter className="border-t pt-6"><Button onClick={() => handleSave('Batas Tiket')} disabled={isLoading}><Save className="h-4 w-4 mr-2"/> Simpan</Button></CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value="notifikasi" className="mt-0">
            <Card className="border-border shadow-sm">
              <CardHeader className="border-b"><CardTitle>Switch Notifikasi</CardTitle></CardHeader>
              <CardContent className="pt-6 space-y-6 max-w-md">
                <div className="flex items-center justify-between"><Label className="text-base cursor-pointer" onClick={() => setData({...data, notif_email: !data.notif_email})}>Email Notifikasi</Label><Switch checked={data.notif_email} onCheckedChange={(c) => setData({...data, notif_email: c})} /></div>
                <div className="flex items-center justify-between"><Label className="text-base cursor-pointer" onClick={() => setData({...data, notif_chat: !data.notif_chat})}>Chat App Internal</Label><Switch checked={data.notif_chat} onCheckedChange={(c) => setData({...data, notif_chat: c})} /></div>
                <div className="flex items-center justify-between"><Label className="text-base cursor-pointer" onClick={() => setData({...data, notif_wa: !data.notif_wa})}>WhatsApp Gateway</Label><Switch checked={data.notif_wa} onCheckedChange={(c) => setData({...data, notif_wa: c})} /></div>
              </CardContent>
              <CardFooter className="border-t pt-6"><Button onClick={() => handleSave('Notifikasi')} disabled={isLoading}><Save className="h-4 w-4 mr-2"/> Simpan</Button></CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value="email" className="mt-0">
            <Card className="border-border shadow-sm">
              <CardHeader className="border-b"><CardTitle>Pengaturan Email</CardTitle></CardHeader>
              <CardContent className="pt-6 space-y-4 max-w-lg">
                <div className="space-y-2"><Label>Sender Email (Read-only)</Label><Input value={data.smtp_user} disabled className="bg-muted text-muted-foreground"/></div>
                <div className="space-y-2"><Label>Sender Name</Label><Input value={data.sender_name} onChange={(e) => setData({...data, sender_name: e.target.value})} className="bg-background"/></div>
                <div className="space-y-2"><Label>Templat Default (Teks)</Label><Textarea rows={4} value={data.email_template} onChange={(e) => setData({...data, email_template: e.target.value})} className="bg-background"/></div>
              </CardContent>
              <CardFooter className="border-t pt-6"><Button onClick={() => handleSave('Pengaturan Email')} disabled={isLoading}><Save className="h-4 w-4 mr-2"/> Simpan</Button></CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value="bahasa" className="mt-0">
            <Card className="border-border shadow-sm">
              <CardHeader className="border-b"><CardTitle>Lokal & Waktu</CardTitle></CardHeader>
              <CardContent className="pt-6 space-y-4 max-w-md">
                <div className="space-y-2">
                  <Label>Bahasa Default</Label>
                  <Select value={data.language} onValueChange={(v) => setData({...data, language: v})}><SelectTrigger className="bg-background"><SelectValue/></SelectTrigger><SelectContent><SelectItem value="ID">Indonesia</SelectItem><SelectItem value="EN">English</SelectItem></SelectContent></Select>
                </div>
                <div className="space-y-2">
                  <Label>Zona Waktu</Label>
                  <Select value={data.timezone} onValueChange={(v) => setData({...data, timezone: v})}><SelectTrigger className="bg-background"><SelectValue/></SelectTrigger><SelectContent><SelectItem value="WIB">WIB (GMT+7)</SelectItem><SelectItem value="WITA">WITA (GMT+8)</SelectItem><SelectItem value="WIT">WIT (GMT+9)</SelectItem></SelectContent></Select>
                </div>
              </CardContent>
              <CardFooter className="border-t pt-6"><Button onClick={() => handleSave('Lokalisasi')} disabled={isLoading}><Save className="h-4 w-4 mr-2"/> Simpan</Button></CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value="backup" className="mt-0">
            <Card className="border-border shadow-sm border-destructive/20">
              <CardHeader className="border-b"><CardTitle>Maintenance System</CardTitle></CardHeader>
              <CardContent className="pt-6 space-y-6">
                <div className="flex items-center justify-between border-b pb-4">
                  <div><p className="font-medium">Maintenance Mode</p><p className="text-sm text-muted-foreground">User tidak dapat login saat maintenance.</p></div>
                  <Switch checked={data.maintenance_mode} onCheckedChange={(c) => setData({...data, maintenance_mode: c})} />
                </div>
                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => toast.success('Mengekspor database...')}><Database className="h-4 w-4 mr-2"/> Backup DB</Button>
                  <Button variant="outline" onClick={() => toast.success('Cache dibersihkan')}>Clear Cache</Button>
                </div>
              </CardContent>
              <CardFooter className="border-t pt-6"><Button onClick={() => handleSave('Maintenance')} disabled={isLoading}><Save className="h-4 w-4 mr-2"/> Simpan</Button></CardFooter>
            </Card>
          </TabsContent>

        </div>
      </Tabs>
    </div>
  );
}
