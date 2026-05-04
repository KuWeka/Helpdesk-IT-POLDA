Tanggal: 2026-04-18

> Jalankan setelah Sesi 5 selesai
> Fokus: Perbaikan sisa, konsistensi, dan verifikasi akhir seluruh aplikasi

---

## KONTEKS

Project: Helpdesk System — React 18 + Vite + shadcn/ui.
Sesi 1–5 sudah selesai. Ini sesi terakhir untuk polish dan memastikan tidak ada yang tertinggal.

---

## YANG TIDAK BOLEH DIUBAH

```
❌ Semua api calls dan socket handlers
❌ src/lib/api.js, socket.js, AuthContext.jsx
❌ src/components/ui/
❌ src/styles/theme.css
```

---

## TUGAS SESI INI

### TUGAS 1 — Scan seluruh project, cari dan ganti token CSS yang tidak valid

Cari semua penggunaan token CSS yang tidak ada di `src/styles/theme.css`:

```bash
# Token yang TIDAK VALID (tidak ada di theme) — harus diganti:
bg-surface       → bg-muted atau bg-card
text-surface     → text-muted-foreground
border-surface   → border-border
```

Jalankan pencarian di seluruh `src/`:
- Cari `bg-surface` → ganti dengan `bg-muted` atau `bg-card` (sesuai konteks)
- Cari `text-surface` → ganti dengan `text-foreground`

---

### TUGAS 2 — Konsistenkan page title di semua halaman

Setiap halaman harus punya struktur header yang konsisten di bagian paling atas:

```jsx
// Pola standar untuk halaman tanpa tombol aksi:
<div className="mb-6">
  <h1 className="text-2xl font-bold tracking-tight">{judul}</h1>
  <p className="text-sm text-muted-foreground mt-1">{deskripsi singkat}</p>
</div>

// Pola standar untuk halaman dengan tombol aksi:
<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
  <div>
    <h1 className="text-2xl font-bold tracking-tight">{judul}</h1>
    <p className="text-sm text-muted-foreground mt-1">{deskripsi singkat}</p>
  </div>
  <Button>...</Button>
</div>
```

Pastikan setiap halaman berikut punya header yang konsisten:
- `AdminDashboard`, `TechnicianDashboard`, `UserDashboard`
- `AllTicketsPage`, `TicketHistoryPage`
- `ManageUsersPage`, `ManageTechniciansPage`
- `ActivityLogsPage`, `ChatMonitoringPage`
- `SystemSettingsPage`
- `UserTicketsPage`, `TechnicianTicketsPage`, `TechnicianQueuePage`

---

### TUGAS 3 — Konsistenkan Skeleton loading di semua halaman tabel

Semua halaman tabel yang belum punya skeleton loading, tambahkan:

```jsx
// Saat isLoading:
{isLoading ? (
  <Card>
    <CardContent className="p-0">
      <Table>
        <TableHeader>
          <TableRow>
            {/* header kolom tetap tampil */}
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: 5 }).map((_, i) => (
            <TableRow key={i}>
              <TableCell><Skeleton className="h-4 w-24" /></TableCell>
              <TableCell><Skeleton className="h-4 w-32" /></TableCell>
              <TableCell><Skeleton className="h-4 w-16" /></TableCell>
              <TableCell><Skeleton className="h-4 w-20" /></TableCell>
              <TableCell><Skeleton className="h-8 w-8 rounded-md" /></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </CardContent>
  </Card>
) : (
  // tabel normal
)}
```

---

### TUGAS 4 — Tambahkan empty state di semua tabel

Saat data kosong (bukan loading), tampilkan empty state yang informatif:

```jsx
import { Empty } from '@/components/ui/empty'; // jika ada
// atau buat manual:

{!isLoading && items.length === 0 && (
  <div className="flex flex-col items-center justify-center py-16 text-center">
    <div className="rounded-full bg-muted p-4 mb-4">
      <Inbox className="h-8 w-8 text-muted-foreground" />
    </div>
    <h3 className="font-semibold text-sm">Tidak ada data</h3>
    <p className="text-xs text-muted-foreground mt-1">
      Belum ada tiket yang ditemukan.
    </p>
  </div>
)}
```

Import `Inbox` dari `lucide-react`. Sesuaikan teks dan icon per halaman.

---

### TUGAS 5 — Verifikasi `src/components/layout/header.jsx`

Pastikan breadcrumb sudah menampilkan nama halaman yang benar untuk semua route.
Cek mapping di `mapByRole` — bandingkan dengan routes di `src/App.jsx`.

Tambahkan route yang mungkin belum ada di mapping:
```jsx
const mapByRole = {
  user: {
    dashboard: 'Dashboard',
    'create-ticket': 'Buat Tiket',
    tickets: 'Tiket Saya',
    chats: 'Chat',
    settings: 'Pengaturan',
  },
  technician: {
    dashboard: 'Dashboard',
    queue: 'Antrian Tiket',
    tickets: 'Tiket Saya',
    chats: 'Chat',
    settings: 'Pengaturan',
  },
  admin: {
    dashboard: 'Dashboard',
    tickets: 'Semua Tiket',
    'ticket-history': 'Riwayat Tiket',
    users: 'Kelola User',
    technicians: 'Kelola Teknisi',
    chats: 'Monitoring Chat',
    'activity-logs': 'Log Aktivitas',
    settings: 'Pengaturan Sistem',
  },
};
```

---

### TUGAS 6 — Cek dan pastikan `tailwind.config.js` sudah benar

Pastikan config mendukung OKLCH colors dari `theme.css` dengan menambahkan:

```js
// tailwind.config.js
module.exports = {
  darkMode: ['class'],
  content: [
    './src/**/*.{js,jsx}',
  ],
  theme: {
    extend: {
      // pastikan semua color tokens ada
      colors: {
        sidebar: {
          DEFAULT: 'hsl(var(--sidebar))',
          foreground: 'hsl(var(--sidebar-foreground))',
          primary: 'hsl(var(--sidebar-primary))',
          'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
          accent: 'hsl(var(--sidebar-accent))',
          'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
          border: 'hsl(var(--sidebar-border))',
          ring: 'hsl(var(--sidebar-ring))',
        },
      },
    },
  },
};
```

> Catatan: `src/styles/theme.css` menggunakan OKLCH tapi `tailwind.config.js` pakai `hsl(var(...))`. Ini tidak masalah karena OKLCH di CSS Variables akan dikonversi browser secara otomatis — Tailwind hanya perlu tahu nama token-nya.

---

## CHECKLIST FINAL MENYELURUH

Setelah semua sesi selesai, test setiap item berikut:

### Auth & Navigation
- [ ] Login sebagai Admin → redirect ke `/admin/dashboard`
- [ ] Login sebagai Teknisi → redirect ke `/technician/dashboard`
- [ ] Login sebagai User → redirect ke `/user/dashboard`
- [ ] Logout berfungsi dari NavUser di sidebar footer
- [ ] Breadcrumb di header menampilkan nama halaman yang benar
- [ ] Sidebar bisa di-collapse dan di-expand
- [ ] Mobile: sidebar muncul sebagai drawer saat layar kecil

### Dark Mode
- [ ] Toggle dark mode berfungsi di semua halaman
- [ ] Tema tersimpan setelah refresh
- [ ] Sidebar, header, card, tabel — semua konsisten di dark mode

### Admin
- [ ] AdminDashboard: stats cards + chart tampil dengan benar
- [ ] AllTickets: tabel + filter + DropdownMenu aksi berfungsi
- [ ] ManageUsers: CRUD berfungsi, AlertDialog muncul saat hapus
- [ ] ManageTechnicians: CRUD berfungsi, AlertDialog muncul saat hapus
- [ ] ActivityLogs: tabel + filter tampil
- [ ] SystemSettings: save berfungsi
- [ ] ChatMonitoring: list chat tampil

### Teknisi
- [ ] TechnicianDashboard: stats + list tiket tampil
- [ ] TechnicianQueue: list tiket pending tampil
- [ ] TechnicianTickets: tabel berfungsi
- [ ] TechnicianChats: dua panel berfungsi, realtime chat berjalan
- [ ] TechnicianSettings: semua tab dan save berfungsi

### User
- [ ] UserDashboard: stats tampil
- [ ] UserTickets: tabel berfungsi
- [ ] CreateTicket: form submit berfungsi, attachment upload berfungsi
- [ ] ChatList: list chat tampil
- [ ] ChatDetail: pesan tampil, kirim pesan berfungsi, read receipt berfungsi
- [ ] UserSettings: semua tab dan save berfungsi

### UI Konsistensi
- [ ] Tidak ada `window.confirm` tersisa
- [ ] Tidak ada `bg-surface` tersisa
- [ ] Semua halaman punya skeleton loading
- [ ] Semua tabel punya empty state
- [ ] Semua halaman punya page header yang konsisten
- [ ] Tidak ada error di browser console terkait komponen UI

