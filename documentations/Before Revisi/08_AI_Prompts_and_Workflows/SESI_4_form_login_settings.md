Tanggal: 2026-04-18

> Jalankan setelah Sesi 3 selesai dan diverifikasi
> Fokus: Rapikan halaman Login, Signup, dan semua halaman Settings

---

## KONTEKS

Project: Helpdesk System — React 18 + Vite + shadcn/ui.
`react-hook-form`, `@hookform/resolvers`, dan `zod` sudah terinstall.
Sesi 1–3 sudah selesai.

---

## YANG TIDAK BOLEH DIUBAH

```
❌ Semua api.get/post/patch/delete calls
❌ Semua handler logic (handleSubmit, handleProfileSave, handlePasswordSave, dll)
❌ Semua useState yang menyimpan form data
❌ src/lib/api.js, socket.js, AuthContext.jsx
❌ src/components/ui/
```

---

## TUGAS SESI INI

### TUGAS 1 — `src/pages/LoginPage.jsx`

Halaman login sudah cukup baik strukturnya. Yang perlu diperbaiki:

#### 1A. Tambahkan animasi masuk

```jsx
// Wrapper utama:
<div className="min-h-screen flex items-center justify-center bg-muted/30 px-4">
  <div className="w-full max-w-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
    {/* konten */}
  </div>
</div>
```

#### 1B. Perbaiki error display

Ganti div error biasa dengan shadcn `Alert`:

```jsx
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

// Ganti bagian error:
{error && (
  <Alert variant="destructive" className="py-2">
    <AlertCircle className="h-4 w-4" />
    <AlertDescription className="text-xs">{error}</AlertDescription>
  </Alert>
)}
```

#### 1C. Pastikan button submit punya loading state yang benar

```jsx
<Button type="submit" className="w-full" disabled={isLoading}>
  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
  {isLoading ? 'Memproses...' : 'Masuk'}
</Button>
```

**JANGAN ubah** `handleSubmit`, `login()`, state `identifier`, `password`, `isLoading`, `error`.

---

### TUGAS 2 — `src/pages/SignupPage.jsx`

Terapkan pola yang sama dengan LoginPage:
- Animasi `animate-in fade-in` pada wrapper
- Error display dengan `Alert` shadcn
- Loading state yang benar pada button
- Pertahankan semua state dan handler

---

### TUGAS 3 — `src/pages/UserSettingsPage.jsx`

File ini sudah menggunakan `Tabs` shadcn. Yang perlu diperbaiki:

#### 3A. Konsistenkan layout TabsList

```jsx
<Tabs defaultValue="profile" className="space-y-6">
  <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-flex">
    <TabsTrigger value="profile" className="gap-2">
      <User className="h-4 w-4" />
      <span className="hidden sm:inline">Profil</span>
    </TabsTrigger>
    <TabsTrigger value="password" className="gap-2">
      <Lock className="h-4 w-4" />
      <span className="hidden sm:inline">Password</span>
    </TabsTrigger>
    <TabsTrigger value="notification" className="gap-2">
      <Bell className="h-4 w-4" />
      <span className="hidden sm:inline">Notifikasi</span>
    </TabsTrigger>
    <TabsTrigger value="preferences" className="gap-2">
      <Palette className="h-4 w-4" />
      <span className="hidden sm:inline">Preferensi</span>
    </TabsTrigger>
  </TabsList>

  {/* Tab Profil */}
  <TabsContent value="profile">
    <Card>
      <CardHeader>
        <CardTitle>Informasi Profil</CardTitle>
        <CardDescription>Perbarui nama dan nomor telepon Anda.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Nama Lengkap</Label>
          <Input
            id="name"
            value={profileData.name}
            onChange={(e) => setProfileData(prev => ({ ...prev, name: e.target.value }))}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">Nomor Telepon</Label>
          <Input
            id="phone"
            value={profileData.phone}
            onChange={(e) => setProfileData(prev => ({ ...prev, phone: e.target.value }))}
          />
        </div>
      </CardContent>
      <CardFooter className="border-t pt-6">
        <Button onClick={handleProfileSave} disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          <Save className="mr-2 h-4 w-4" />
          Simpan Perubahan
        </Button>
      </CardFooter>
    </Card>
  </TabsContent>

  {/* Tab Password */}
  <TabsContent value="password">
    <Card>
      <CardHeader>
        <CardTitle>Ubah Password</CardTitle>
        <CardDescription>Masukkan password lama dan password baru Anda.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* field password dengan pola space-y-2 + Label + Input */}
      </CardContent>
      <CardFooter className="border-t pt-6">
        <Button onClick={handlePasswordSave} disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Simpan Password
        </Button>
      </CardFooter>
    </Card>
  </TabsContent>

  {/* Tab Notifikasi */}
  <TabsContent value="notification">
    <Card>
      <CardHeader>
        <CardTitle>Pengaturan Notifikasi</CardTitle>
        <CardDescription>Atur preferensi notifikasi Anda.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Notifikasi Email</Label>
            <p className="text-sm text-muted-foreground">Terima notifikasi via email</p>
          </div>
          <Switch
            checked={notifData.email}
            onCheckedChange={(val) => setNotifData(prev => ({ ...prev, email: val }))}
          />
        </div>
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Notifikasi Chat</Label>
            <p className="text-sm text-muted-foreground">Terima notifikasi pesan baru</p>
          </div>
          <Switch
            checked={notifData.chat}
            onCheckedChange={(val) => setNotifData(prev => ({ ...prev, chat: val }))}
          />
        </div>
      </CardContent>
      <CardFooter className="border-t pt-6">
        <Button onClick={handleNotifSave} disabled={isLoading}>
          <Save className="mr-2 h-4 w-4" />
          Simpan Notifikasi
        </Button>
      </CardFooter>
    </Card>
  </TabsContent>

  {/* Tab Preferensi */}
  <TabsContent value="preferences">
    <Card>
      <CardHeader>
        <CardTitle>Preferensi Tampilan</CardTitle>
        <CardDescription>Atur bahasa dan tema aplikasi.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Language Select dan Theme RadioGroup yang sudah ada */}
      </CardContent>
      <CardFooter className="border-t pt-6">
        <Button onClick={handlePrefSave} disabled={isLoading}>
          <Save className="mr-2 h-4 w-4" />
          Simpan Preferensi
        </Button>
      </CardFooter>
    </Card>
  </TabsContent>
</Tabs>
```

**Pertahankan** semua state (`profileData`, `passwordData`, `notifData`, `prefData`) dan semua handler (`handleProfileSave`, `handlePasswordSave`, dll).

---

### TUGAS 4 — `src/pages/technician/TechnicianSettingsPage.jsx`

Terapkan pola Tabs + Card yang sama dengan UserSettingsPage.
Sesuaikan tab dengan field yang ada di halaman tersebut (profil, password, pengaturan shift/spesialisasi).
Pertahankan semua state dan api calls.

---

### TUGAS 5 — `src/pages/admin/SystemSettingsPage.jsx`

Rapikan layout menggunakan Card:

```jsx
<div className="space-y-6">
  <div>
    <h1 className="text-2xl font-bold tracking-tight">Pengaturan Sistem</h1>
    <p className="text-sm text-muted-foreground mt-1">
      Konfigurasi parameter sistem helpdesk
    </p>
  </div>

  <Card>
    <CardHeader>
      <CardTitle>Pengaturan Tiket</CardTitle>
      <CardDescription>Atur parameter terkait pembuatan dan pengelolaan tiket.</CardDescription>
    </CardHeader>
    <CardContent className="space-y-6">
      {/* field-field settings yang sudah ada, rapikan dengan space-y-2 + Label + Input/Switch */}
    </CardContent>
    <CardFooter className="border-t pt-6">
      <Button onClick={handleSave} disabled={isLoading}>
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        <Save className="mr-2 h-4 w-4" />
        Simpan Pengaturan
      </Button>
    </CardFooter>
  </Card>
</div>
```

Pertahankan semua logic fetch dan save.

---

## VERIFIKASI SETELAH SELESAI

- [ ] Login bisa dilakukan, error tampil dengan Alert shadcn
- [ ] Signup bisa dilakukan
- [ ] UserSettings: 4 tab (Profil, Password, Notifikasi, Preferensi) tampil dengan benar
- [ ] Semua save button di settings berfungsi
- [ ] TechnicianSettings: tab dan form berfungsi
- [ ] SystemSettings: Card layout rapi, save berfungsi
- [ ] Dark mode konsisten di semua halaman settings

