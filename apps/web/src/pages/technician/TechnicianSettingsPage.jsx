
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext.jsx';
import api from '@/lib/api.js';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card.jsx';
import { Label } from '@/components/ui/label.jsx';
import { Input } from '@/components/ui/input.jsx';
import { Button } from '@/components/ui/button.jsx';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.jsx';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs.jsx';
import { Switch } from '@/components/ui/switch.jsx';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group.jsx';
import { Checkbox } from '@/components/ui/checkbox.jsx';
import { toast } from 'sonner';
import { Loader2, Save, User, Lock, Bell, Globe, Palette, ToggleLeft, Clock, Smartphone, Wrench, ShieldAlert } from 'lucide-react';
import SectionHeader from '@/components/SectionHeader.jsx';

export default function TechnicianSettingsPage() {
  const { currentUser, setCurrentUser } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [techSettingsId, setTechSettingsId] = useState(null);
  
  // Data States
  const [profileData, setProfileData] = useState({ name: currentUser?.name || '', phone: currentUser?.phone || '' });
  const [passwordData, setPasswordData] = useState({ oldPassword: '', newPassword: '', confirmPassword: '' });
  const [notifData, setNotifData] = useState({ email: true, chat: true });
  const [prefData, setPrefData] = useState({ language: currentUser?.language || 'ID', theme: currentUser?.theme || 'light' });
  const [techData, setTechData] = useState({
    is_active: false,
    default_status: 'Aktif (Menerima Tiket)',
    shift_start: '09:00',
    shift_end: '17:00',
    wa_notification_enabled: false,
    specializations: [],
    max_active_tickets: 5
  });

  const specsList = ['Printer', 'WiFi', 'PC', 'Monitor', 'Telepon', 'Lainnya'];

  useEffect(() => {
    const fetchTechSettings = async () => {
      try {
        let currentSettings = null;
        const { data: records } = await api.get('/technician-settings', {
          params: {
            page: 1,
            perPage: 1,
            filter: `user_id = "${currentUser.id}"`
          }
        });
        
        if ((records?.items || []).length > 0) {
          currentSettings = records.items[0];
        } else {
          try {
            const { data } = await api.post('/technician-settings', {
              user_id: currentUser.id,
              is_active: true,
              default_status: 'Aktif (Menerima Tiket)',
              shift_start: '',
              shift_end: '',
              specializations: [],
              max_active_tickets: null,
              wa_notification_enabled: false
            });
            currentSettings = data;
            toast.success('Pengaturan teknisi default berhasil dibuat');
          } catch (err) {
            console.error('Error creating default settings:', err);
            toast.error('Gagal membuat pengaturan teknisi default');
            return;
          }
        }

        setTechSettingsId(currentSettings.id);
        setTechData({
          is_active: currentSettings.is_active,
          default_status: currentSettings.default_status || 'Aktif (Menerima Tiket)',
          shift_start: currentSettings.shift_start || '',
          shift_end: currentSettings.shift_end || '',
          wa_notification_enabled: currentSettings.wa_notification_enabled || false,
          specializations: currentSettings.specializations || [],
          max_active_tickets: currentSettings.max_active_tickets || ''
        });
        
      } catch (err) {
        console.error('Failed fetching tech settings', err);
        toast.error('Gagal memuat pengaturan teknisi');
      }
    };
    
    if (currentUser) {
      fetchTechSettings();
    }
  }, [currentUser]);

  const handleUserUpdate = async (data, successMsg) => {
    setIsLoading(true);
    try {
      await api.patch(`/users/${currentUser.id}`, data);
      toast.success(successMsg);
    } catch (err) {
      toast.error('Gagal memperbarui pengaturan');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTechUpdate = async (data, successMsg) => {
    if (!techSettingsId) {
      toast.error('Data pengaturan teknisi tidak ditemukan');
      return;
    }
    setIsLoading(true);
    try {
      await api.patch(`/technician-settings/${techSettingsId}`, data);
      toast.success(successMsg);
    } catch (err) {
      toast.error('Gagal memperbarui pengaturan teknisi');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordSave = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('Konfirmasi password tidak cocok'); return;
    }
    setIsLoading(true);
    try {
      await api.post('/auth/verify-password', {
        email: currentUser.email,
        password: passwordData.oldPassword
      });
      await api.patch(`/users/${currentUser.id}`, {
        oldPassword: passwordData.oldPassword,
        password: passwordData.newPassword,
        passwordConfirm: passwordData.confirmPassword
      });
      toast.success('Password berhasil diubah');
      setPasswordData({ oldPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      toast.error('Password lama salah atau gagal mengubah');
    } finally {
      setIsLoading(false);
    }
  };

  const handleThemeChange = (val) => {
    setPrefData(prev => ({...prev, theme: val}));
    if (val === 'dark') document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
    localStorage.setItem('app_theme', val);
  };

  const handlePrefSave = async () => {
    setIsLoading(true);
    try {
      await api.patch(`/users/${currentUser.id}`, {
        language: prefData.language,
        theme: prefData.theme,
      });

      localStorage.setItem('app_language', prefData.language);
      localStorage.setItem('app_theme', prefData.theme);

      const updatedUser = {
        ...currentUser,
        language: prefData.language,
        theme: prefData.theme,
      };

      localStorage.setItem('helpdesk_user', JSON.stringify(updatedUser));
      setCurrentUser(updatedUser);

      toast.success('Preferensi disimpan');
    } catch (err) {
      toast.error('Gagal menyimpan preferensi');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500 pb-12">
      <SectionHeader
        title="Pengaturan Teknisi"
        subtitle="Kelola profil, keamanan, dan preferensi kerja Anda"
      />

      <Tabs defaultValue="profil" className="w-full flex flex-col md:flex-row gap-6">
        <TabsList className="flex flex-row md:flex-col h-auto bg-muted/30 justify-start overflow-x-auto md:w-72 shrink-0 p-2 rounded-xl border gap-1">
          <TabsTrigger value="profil" className="w-full justify-start gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"><User className="h-4 w-4" /> Profil</TabsTrigger>
          <TabsTrigger value="password" className="w-full justify-start gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"><Lock className="h-4 w-4" /> Password</TabsTrigger>
          <TabsTrigger value="notifikasi" className="w-full justify-start gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"><Bell className="h-4 w-4" /> Notifikasi</TabsTrigger>
          <TabsTrigger value="bahasa" className="w-full justify-start gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"><Globe className="h-4 w-4" /> Bahasa</TabsTrigger>
          <TabsTrigger value="tema" className="w-full justify-start gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"><Palette className="h-4 w-4" /> Tema</TabsTrigger>
          <TabsTrigger value="status" className="w-full justify-start gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"><ToggleLeft className="h-4 w-4" /> Status Default</TabsTrigger>
          <TabsTrigger value="shift" className="w-full justify-start gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"><Clock className="h-4 w-4" /> Jam Shift</TabsTrigger>
          <TabsTrigger value="wa" className="w-full justify-start gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"><Smartphone className="h-4 w-4" /> Notif WhatsApp</TabsTrigger>
          <TabsTrigger value="spesialisasi" className="w-full justify-start gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"><Wrench className="h-4 w-4" /> Spesialisasi</TabsTrigger>
          <TabsTrigger value="batas" className="w-full justify-start gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"><ShieldAlert className="h-4 w-4" /> Batas Tiket</TabsTrigger>
        </TabsList>

        <div className="flex-1 min-w-0">
          
          {/* TAB 1: Profil */}
          <TabsContent value="profil" className="mt-0 outline-none">
            <Card className="border-border shadow-sm">
              <CardHeader className="border-b"><CardTitle>Informasi Profil</CardTitle></CardHeader>
              <CardContent className="space-y-4 pt-6">
                <div className="space-y-2 max-w-2xl">
                  <Label>Nama Lengkap</Label>
                  <Input value={profileData.name} onChange={(e) => setProfileData({...profileData, name: e.target.value})} className="bg-background"/>
                </div>
                <div className="space-y-2 max-w-2xl">
                  <Label>Email</Label>
                  <Input value={currentUser?.email || ''} disabled className="bg-muted text-muted-foreground"/>
                </div>
                <div className="space-y-2 max-w-2xl">
                  <Label>No. Telepon / WA</Label>
                  <Input value={profileData.phone} onChange={(e) => setProfileData({...profileData, phone: e.target.value})} className="bg-background"/>
                </div>
                <div className="space-y-2 max-w-2xl">
                  <Label>Divisi</Label>
                  <Input value="Teknisi IT" disabled className="bg-muted text-muted-foreground"/>
                </div>
              </CardContent>
              <CardFooter className="border-t pt-6"><Button onClick={() => handleUserUpdate(profileData, 'Profil disimpan')} disabled={isLoading}><Save className="h-4 w-4 mr-2"/> Simpan</Button></CardFooter>
            </Card>
          </TabsContent>

          {/* TAB 2: Password */}
          <TabsContent value="password" className="mt-0 outline-none">
            <Card className="border-border shadow-sm">
              <CardHeader className="border-b"><CardTitle>Ubah Password</CardTitle></CardHeader>
              <CardContent className="space-y-4 pt-6">
                <div className="space-y-2 max-w-2xl">
                  <Label>Password Lama</Label>
                  <Input type="password" value={passwordData.oldPassword} onChange={(e) => setPasswordData({...passwordData, oldPassword: e.target.value})} className="bg-background"/>
                </div>
                <div className="space-y-2 max-w-2xl">
                  <Label>Password Baru</Label>
                  <Input type="password" value={passwordData.newPassword} onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})} className="bg-background"/>
                </div>
                <div className="space-y-2 max-w-2xl">
                  <Label>Konfirmasi Password</Label>
                  <Input type="password" value={passwordData.confirmPassword} onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})} className="bg-background"/>
                </div>
              </CardContent>
              <CardFooter className="border-t pt-6"><Button onClick={handlePasswordSave} disabled={isLoading || !passwordData.newPassword}><Save className="h-4 w-4 mr-2"/> Ubah Password</Button></CardFooter>
            </Card>
          </TabsContent>

          {/* TAB 3: Notifikasi */}
          <TabsContent value="notifikasi" className="mt-0 outline-none">
            <Card className="border-border shadow-sm">
              <CardHeader className="border-b"><CardTitle>Notifikasi Sistem</CardTitle></CardHeader>
              <CardContent className="space-y-6 pt-6">
                <div className="flex items-center justify-between max-w-2xl">
                  <Label className="text-base cursor-pointer" onClick={() => setNotifData({...notifData, email: !notifData.email})}>Notifikasi Email</Label>
                  <Switch checked={notifData.email} onCheckedChange={(c) => setNotifData({...notifData, email: c})} />
                </div>
                <div className="flex items-center justify-between max-w-2xl">
                  <Label className="text-base cursor-pointer" onClick={() => setNotifData({...notifData, chat: !notifData.chat})}>Notifikasi Chat</Label>
                  <Switch checked={notifData.chat} onCheckedChange={(c) => setNotifData({...notifData, chat: c})} />
                </div>
              </CardContent>
              <CardFooter className="border-t pt-6"><Button onClick={() => handleUserUpdate({notification_settings: notifData}, 'Notifikasi disimpan')} disabled={isLoading}><Save className="h-4 w-4 mr-2"/> Simpan</Button></CardFooter>
            </Card>
          </TabsContent>

          {/* TAB 4: Bahasa */}
          <TabsContent value="bahasa" className="mt-0 outline-none">
            <Card className="border-border shadow-sm">
              <CardHeader className="border-b"><CardTitle>Bahasa</CardTitle></CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-2 max-w-2xl">
                  <Label>Bahasa Antarmuka</Label>
                  <Select value={prefData.language} onValueChange={(v) => setPrefData({...prefData, language: v})}>
                    <SelectTrigger className="bg-background"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ID">Indonesia</SelectItem>
                      <SelectItem value="EN">English</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
              <CardFooter className="border-t pt-6"><Button onClick={handlePrefSave} disabled={isLoading}><Save className="h-4 w-4 mr-2"/> Simpan</Button></CardFooter>
            </Card>
          </TabsContent>

          {/* TAB 5: Tema */}
          <TabsContent value="tema" className="mt-0 outline-none">
            <Card className="border-border shadow-sm">
              <CardHeader className="border-b"><CardTitle>Tema</CardTitle></CardHeader>
              <CardContent className="pt-6">
                <RadioGroup value={prefData.theme} onValueChange={handleThemeChange} className="grid grid-cols-2 gap-4 max-w-2xl">
                  <div>
                    <RadioGroupItem value="light" id="light" className="peer sr-only" />
                    <Label htmlFor="light" className="flex flex-col items-center p-4 border-2 rounded-xl cursor-pointer hover:bg-muted peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5">
                      <span className="font-medium text-foreground">Terang</span>
                    </Label>
                  </div>
                  <div>
                    <RadioGroupItem value="dark" id="dark" className="peer sr-only" />
                    <Label htmlFor="dark" className="flex flex-col items-center p-4 border-2 rounded-xl cursor-pointer bg-slate-900 border-slate-700 hover:bg-slate-800 peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/20">
                      <span className="font-medium text-white">Gelap</span>
                    </Label>
                  </div>
                </RadioGroup>
              </CardContent>
              <CardFooter className="border-t pt-6"><Button onClick={handlePrefSave} disabled={isLoading}><Save className="h-4 w-4 mr-2"/> Simpan</Button></CardFooter>
            </Card>
          </TabsContent>

          {/* TAB 6: Status Default */}
          <TabsContent value="status" className="mt-0 outline-none">
            <Card className="border-border shadow-sm">
              <CardHeader className="border-b"><CardTitle>Status Bekerja</CardTitle></CardHeader>
              <CardContent className="pt-6 space-y-4">
                <div className="space-y-2 max-w-2xl">
                  <Label>Status Saat Ini</Label>
                  <Select value={techData.is_active ? "true" : "false"} onValueChange={(v) => setTechData({...techData, is_active: v === "true"})}>
                    <SelectTrigger className="bg-background"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="true">Aktif (Menerima Tiket)</SelectItem>
                      <SelectItem value="false">Tidak Bertugas</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 max-w-2xl">
                  <Label>Teks Status Default</Label>
                  <Input value={techData.default_status} onChange={(e) => setTechData({...techData, default_status: e.target.value})} className="bg-background" placeholder="Contoh: Aktif (Menerima Tiket)"/>
                </div>
              </CardContent>
              <CardFooter className="border-t pt-6"><Button onClick={() => handleTechUpdate({is_active: techData.is_active, default_status: techData.default_status}, 'Status disimpan')} disabled={isLoading}><Save className="h-4 w-4 mr-2"/> Simpan</Button></CardFooter>
            </Card>
          </TabsContent>

          {/* TAB 7: Jam Shift */}
          <TabsContent value="shift" className="mt-0 outline-none">
            <Card className="border-border shadow-sm">
              <CardHeader className="border-b"><CardTitle>Jam Shift</CardTitle><CardDescription>Di luar jam ini, status Anda otomatis menjadi Tidak Bertugas.</CardDescription></CardHeader>
              <CardContent className="pt-6 space-y-4">
                <div className="flex gap-4 max-w-2xl">
                  <div className="space-y-2 flex-1">
                    <Label>Jam Mulai</Label>
                    <Input type="time" value={techData.shift_start} onChange={(e) => setTechData({...techData, shift_start: e.target.value})} className="bg-background"/>
                  </div>
                  <div className="space-y-2 flex-1">
                    <Label>Jam Selesai</Label>
                    <Input type="time" value={techData.shift_end} onChange={(e) => setTechData({...techData, shift_end: e.target.value})} className="bg-background"/>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="border-t pt-6"><Button onClick={() => handleTechUpdate({shift_start: techData.shift_start, shift_end: techData.shift_end}, 'Jam shift disimpan')} disabled={isLoading}><Save className="h-4 w-4 mr-2"/> Simpan</Button></CardFooter>
            </Card>
          </TabsContent>

          {/* TAB 8: Notif WA */}
          <TabsContent value="wa" className="mt-0 outline-none">
            <Card className="border-border shadow-sm">
              <CardHeader className="border-b"><CardTitle>Notifikasi WhatsApp</CardTitle></CardHeader>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between max-w-2xl">
                  <div className="space-y-0.5">
                    <Label className="text-base cursor-pointer" onClick={() => setTechData({...techData, wa_notification_enabled: !techData.wa_notification_enabled})}>Terima Pesan WA</Label>
                    <p className="text-sm text-muted-foreground">Notifikasi tiket baru via WhatsApp</p>
                  </div>
                  <Switch checked={techData.wa_notification_enabled} onCheckedChange={(c) => setTechData({...techData, wa_notification_enabled: c})} />
                </div>
              </CardContent>
              <CardFooter className="border-t pt-6"><Button onClick={() => handleTechUpdate({wa_notification_enabled: techData.wa_notification_enabled}, 'Pengaturan WA disimpan')} disabled={isLoading}><Save className="h-4 w-4 mr-2"/> Simpan</Button></CardFooter>
            </Card>
          </TabsContent>

          {/* TAB 9: Spesialisasi */}
          <TabsContent value="spesialisasi" className="mt-0 outline-none">
            <Card className="border-border shadow-sm">
              <CardHeader className="border-b"><CardTitle>Keahlian Khusus</CardTitle><CardDescription>Pilih bidang yang menjadi fokus perbaikan Anda.</CardDescription></CardHeader>
              <CardContent className="pt-6">
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 max-w-2xl">
                  {specsList.map((spec) => (
                    <div key={spec} className="flex items-center space-x-2 bg-muted/30 p-3 rounded-lg border">
                      <Checkbox 
                        id={`spec-${spec}`} 
                        checked={techData.specializations.includes(spec)}
                        onCheckedChange={(checked) => {
                          if (checked) setTechData(prev => ({...prev, specializations: [...prev.specializations, spec]}));
                          else setTechData(prev => ({...prev, specializations: prev.specializations.filter(s => s !== spec)}));
                        }}
                      />
                      <Label htmlFor={`spec-${spec}`} className="cursor-pointer font-medium text-foreground">{spec}</Label>
                    </div>
                  ))}
                </div>
              </CardContent>
              <CardFooter className="border-t pt-6"><Button onClick={() => handleTechUpdate({specializations: techData.specializations}, 'Spesialisasi disimpan')} disabled={isLoading}><Save className="h-4 w-4 mr-2"/> Simpan</Button></CardFooter>
            </Card>
          </TabsContent>

          {/* TAB 10: Batas Tiket */}
          <TabsContent value="batas" className="mt-0 outline-none">
            <Card className="border-border shadow-sm">
              <CardHeader className="border-b"><CardTitle>Batas Tiket Aktif</CardTitle><CardDescription>Maksimal tiket status Proses yang bisa Anda pegang bersamaan.</CardDescription></CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-2 max-w-sm">
                  <Label>Jumlah Maksimal</Label>
                  <Input type="number" min="1" max="20" value={techData.max_active_tickets || ''} onChange={(e) => setTechData({...techData, max_active_tickets: e.target.value ? parseInt(e.target.value) : null})} className="bg-background" placeholder="Kosongkan untuk tanpa batas"/>
                </div>
              </CardContent>
              <CardFooter className="border-t pt-6"><Button onClick={() => handleTechUpdate({max_active_tickets: techData.max_active_tickets}, 'Batas tiket disimpan')} disabled={isLoading}><Save className="h-4 w-4 mr-2"/> Simpan</Button></CardFooter>
            </Card>
          </TabsContent>

        </div>
      </Tabs>
    </div>
  );
}
