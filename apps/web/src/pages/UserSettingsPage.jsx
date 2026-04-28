
import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext.jsx';
import api from '@/lib/api.js';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card.jsx';
import { Label } from '@/components/ui/label.jsx';
import { Input } from '@/components/ui/input.jsx';
import { Button } from '@/components/ui/button.jsx';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.jsx';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs.jsx';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group.jsx';
import { toast } from 'sonner';
import { Loader2, Save, User, Lock, Palette } from 'lucide-react';
import SectionHeader from '@/components/common/SectionHeader.jsx';
import i18n from '@/i18n/config.js';


export default function UserSettingsPage() {
  const { currentUser, setCurrentUser } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  
  const rawInitialLang = localStorage.getItem('app_language') || currentUser?.language || 'ID';
  const initialLang = String(rawInitialLang).toUpperCase() === 'EN' ? 'EN' : 'ID';
  
  const [profileData, setProfileData] = useState({
    name: currentUser?.name || '',
    phone: currentUser?.phone || '',
  });

  const [passwordData, setPasswordData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [prefData, setPrefData] = useState({
    language: initialLang,
    theme: currentUser?.theme || 'light',
  });

  const handleProfileSave = async () => {
    setIsLoading(true);
    try {
      await api.patch(`/users/${currentUser.id}`, profileData);
      const updatedUser = { ...currentUser, ...profileData };
      setCurrentUser(updatedUser);
      localStorage.setItem('helpdesk_user', JSON.stringify(updatedUser));
      toast.success('Profil berhasil diperbarui');
    } catch (err) {
      toast.error('Gagal memperbarui profil');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordSave = async () => {
    if (!passwordData.oldPassword) {
      toast.error('Password lama wajib diisi');
      return;
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('Konfirmasi password tidak cocok');
      return;
    }
    if (passwordData.newPassword.length < 6) {
      toast.error('Password baru minimal 6 karakter');
      return;
    }
    if (passwordData.oldPassword === passwordData.newPassword) {
      toast.error('Password baru harus berbeda dengan password lama');
      return;
    }

    setIsLoading(true);
    try {
      // Send both oldPassword and newPassword for backend validation
      await api.patch(`/users/${currentUser.id}`, {
        oldPassword: passwordData.oldPassword,
        password: passwordData.newPassword
      });
      
      toast.success('Password berhasil diubah');
      setPasswordData({ oldPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Gagal mengubah password. Pastikan password lama benar.';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrefSave = async () => {
    setIsLoading(true);
    try {
      await api.patch(`/users/${currentUser.id}`, {
        language: prefData.language,
        theme: prefData.theme
      });
      
      if (prefData.theme === 'dark') document.documentElement.classList.add('dark');
      else if (prefData.theme === 'light') document.documentElement.classList.remove('dark');
      
      localStorage.setItem('app_language', prefData.language);
      localStorage.setItem('app_theme', prefData.theme);

      await i18n.changeLanguage(prefData.language.toLowerCase());
      
      const updatedUser = { ...currentUser, language: prefData.language, theme: prefData.theme };
      setCurrentUser(updatedUser);
      localStorage.setItem('helpdesk_user', JSON.stringify(updatedUser));
      
      toast.success('Preferensi berhasil disimpan');
      
    } catch (err) {
      toast.error('Gagal menyimpan preferensi');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-500">
      <SectionHeader
        title="Pengaturan"
        subtitle="Kelola profil, keamanan, dan preferensi akun Anda"
      />

      <Tabs defaultValue="profil" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:inline-flex">
          <TabsTrigger value="profil" className="gap-2">
            <User className="h-4 w-4" />
            <span className="hidden sm:inline">Profil</span>
          </TabsTrigger>
          <TabsTrigger value="password" className="gap-2">
            <Lock className="h-4 w-4" />
            <span className="hidden sm:inline">Password</span>
          </TabsTrigger>
          <TabsTrigger value="preferensi" className="gap-2">
            <Palette className="h-4 w-4" />
            <span className="hidden sm:inline">Preferensi</span>
          </TabsTrigger>
        </TabsList>

        <div>
          <TabsContent value="profil" className="mt-0 outline-none">
            <Card className="border-border shadow-sm">
              <CardHeader>
                <CardTitle>Informasi Profil</CardTitle>
                <CardDescription>Perbarui data diri Anda di sini.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nama Lengkap</Label>
                  <Input 
                    id="name" 
                    value={profileData.name} 
                    onChange={(e) => setProfileData(prev => ({...prev, name: e.target.value}))}
                    className="max-w-md bg-background"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input 
                    id="email" 
                    value={currentUser?.email || ''} 
                    disabled 
                    className="max-w-md bg-muted/50 text-muted-foreground"
                  />
                  <p className="text-xs text-muted-foreground">Email tidak dapat diubah.</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Nomor Telepon / WA</Label>
                  <Input 
                    id="phone" 
                    value={profileData.phone} 
                    onChange={(e) => setProfileData(prev => ({...prev, phone: e.target.value}))}
                    className="max-w-md bg-background"
                  />
                </div>
              </CardContent>
              <CardFooter className="border-t pt-6">
                <Button onClick={handleProfileSave} disabled={isLoading} className="gap-2">
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Simpan Profil
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value="password" className="mt-0 outline-none">
            <Card className="border-border shadow-sm">
              <CardHeader>
                <CardTitle>Ubah Password</CardTitle>
                <CardDescription>Pastikan akun Anda tetap aman dengan password yang kuat.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="oldPassword">Password Lama</Label>
                  <Input 
                    id="oldPassword" 
                    type="password"
                    value={passwordData.oldPassword} 
                    onChange={(e) => setPasswordData(prev => ({...prev, oldPassword: e.target.value}))}
                    className="max-w-md bg-background"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newPassword">Password Baru</Label>
                  <Input 
                    id="newPassword" 
                    type="password"
                    value={passwordData.newPassword} 
                    onChange={(e) => setPasswordData(prev => ({...prev, newPassword: e.target.value}))}
                    className="max-w-md bg-background"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Konfirmasi Password Baru</Label>
                  <Input 
                    id="confirmPassword" 
                    type="password"
                    value={passwordData.confirmPassword} 
                    onChange={(e) => setPasswordData(prev => ({...prev, confirmPassword: e.target.value}))}
                    className="max-w-md bg-background"
                  />
                </div>
              </CardContent>
              <CardFooter className="border-t pt-6">
                <Button onClick={handlePasswordSave} disabled={isLoading || !passwordData.oldPassword || !passwordData.newPassword} className="gap-2">
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Ubah Password
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value="preferensi" className="mt-0 outline-none">
            <Card className="border-border shadow-sm">
              <CardHeader>
                <CardTitle>Preferensi Tampilan</CardTitle>
                <CardDescription>Atur bahasa dan tema aplikasi sesuai kebutuhan Anda.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2 max-w-md">
                  <Label>Bahasa</Label>
                  <Select value={prefData.language} onValueChange={(val) => setPrefData(prev => ({...prev, language: val}))}>
                    <SelectTrigger className="bg-background">
                      <SelectValue placeholder="Pilih Bahasa" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ID">Indonesia (ID)</SelectItem>
                      <SelectItem value="EN">English (EN)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Tema</Label>
                <RadioGroup 
                  value={prefData.theme} 
                  onValueChange={(val) => setPrefData(prev => ({...prev, theme: val}))}
                  className="grid grid-cols-2 gap-4 max-w-md"
                >
                  <div>
                    <RadioGroupItem value="light" id="light" className="peer sr-only" />
                    <Label
                      htmlFor="light"
                      className="flex flex-col items-center justify-between rounded-xl border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                    >
                      <div className="w-full h-20 bg-white rounded-md border shadow-sm mb-3 flex flex-col gap-2 p-2">
                        <div className="h-2 w-1/2 bg-gray-200 rounded"></div>
                        <div className="h-8 w-full bg-gray-100 rounded"></div>
                      </div>
                      Terang
                    </Label>
                  </div>
                  <div>
                    <RadioGroupItem value="dark" id="dark" className="peer sr-only" />
                    <Label
                      htmlFor="dark"
                      className="flex flex-col items-center justify-between rounded-xl border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                    >
                      <div className="w-full h-20 bg-gray-950 rounded-md border border-gray-800 shadow-sm mb-3 flex flex-col gap-2 p-2">
                        <div className="h-2 w-1/2 bg-gray-800 rounded"></div>
                        <div className="h-8 w-full bg-gray-900 rounded"></div>
                      </div>
                      Gelap
                    </Label>
                  </div>
                </RadioGroup>
                </div>
              </CardContent>
              <CardFooter className="border-t pt-6">
                <Button onClick={handlePrefSave} disabled={isLoading} className="gap-2">
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Simpan Preferensi
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>

        </div>
      </Tabs>
    </div>
  );
}
