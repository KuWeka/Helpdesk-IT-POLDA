# TASK: Daftarkan PadalMembersPage ke Routing dan Sidebar Padal

Tanggal dibuat: 2026-05-04

## Konteks

File `apps/web/src/pages/technician/PadalMembersPage.jsx` sudah selesai dibuat lengkap
beserta semua modal dan logic-nya (tambah anggota, hapus anggota, loading state, empty state,
error handling, konfirmasi AlertDialog). Namun halaman ini belum bisa diakses karena:

1. Belum didaftarkan sebagai route di `App.jsx`
2. Belum ada menu di sidebar Padal (`sidebar-data.js`)

Tugasmu hanya melakukan **2 perubahan kecil** di 2 file. Tidak ada perubahan lain yang perlu
dilakukan — jangan ubah file lain apapun.

---

## PERUBAHAN 1 — `apps/web/src/App.jsx`

### 1a. Tambahkan import PadalMembersPage

Buka file `apps/web/src/App.jsx`.

Temukan blok import halaman Padal yang saat ini terlihat seperti ini (sekitar baris 29–32):

```jsx
// Padal Pages
import TechnicianDashboard from '@/pages/technician/TechnicianDashboard.jsx';
import TechnicianQueuePage from '@/pages/technician/TechnicianQueuePage.jsx';
import TechnicianTicketsPage from '@/pages/technician/TechnicianTicketsPage.jsx';
import TechnicianTicketDetailPage from '@/pages/technician/TechnicianTicketDetailPage.jsx';
```

Tambahkan satu baris import baru **di bawah baris terakhir blok tersebut**:

```jsx
// Padal Pages
import TechnicianDashboard from '@/pages/technician/TechnicianDashboard.jsx';
import TechnicianQueuePage from '@/pages/technician/TechnicianQueuePage.jsx';
import TechnicianTicketsPage from '@/pages/technician/TechnicianTicketsPage.jsx';
import TechnicianTicketDetailPage from '@/pages/technician/TechnicianTicketDetailPage.jsx';
import PadalMembersPage from '@/pages/technician/PadalMembersPage.jsx';
```

### 1b. Tambahkan Route `/padal/members`

Masih di file yang sama, temukan blok routes Padal yang saat ini terlihat seperti ini
(sekitar baris 114–124):

```jsx
{/* Padal Routes */}
<Route path="/padal" element={
  <ProtectedRoute allowedRoles={['Padal']}>
    <MainLayout />
  </ProtectedRoute>
}>
  <Route path="dashboard" element={<TechnicianDashboard />} />
  <Route path="queue" element={<TechnicianQueuePage />} />
  <Route path="tickets" element={<TechnicianTicketsPage />} />
  <Route path="tickets/:ticketId" element={<TechnicianTicketDetailPage />} />
  <Route path="reports" element={<MonthlyReportPage />} />
</Route>
```

Tambahkan satu route baru **setelah route `reports` dan sebelum tag penutup `</Route>`**:

```jsx
{/* Padal Routes */}
<Route path="/padal" element={
  <ProtectedRoute allowedRoles={['Padal']}>
    <MainLayout />
  </ProtectedRoute>
}>
  <Route path="dashboard" element={<TechnicianDashboard />} />
  <Route path="queue" element={<TechnicianQueuePage />} />
  <Route path="tickets" element={<TechnicianTicketsPage />} />
  <Route path="tickets/:ticketId" element={<TechnicianTicketDetailPage />} />
  <Route path="reports" element={<MonthlyReportPage />} />
  <Route path="members" element={<PadalMembersPage />} />
</Route>
```

---

## PERUBAHAN 2 — `apps/web/src/components/layout/sidebar-data.js`

Buka file `apps/web/src/components/layout/sidebar-data.js`.

Icon `Users` sudah diimport di baris 9 — **tidak perlu tambah import apapun**.

Temukan `technicianSidebarData` yang saat ini terlihat seperti ini (sekitar baris 47–59):

```js
export const technicianSidebarData = {
  navGroups: [
    {
      title: 'Menu Padal',
      items: [
        { title: 'Dashboard', url: '/padal/dashboard', icon: LayoutDashboard },
        { title: 'Antrian Permohonan', url: '/padal/queue', icon: ListOrdered },
        { title: 'Permohonan Saya', url: '/padal/tickets', icon: Ticket },
        { title: 'Laporan Bulanan', url: '/padal/reports', icon: BarChart2 },
      ],
    },
  ],
};
```

Tambahkan satu item menu baru **setelah item `Laporan Bulanan` dan sebelum penutup array `]`**:

```js
export const technicianSidebarData = {
  navGroups: [
    {
      title: 'Menu Padal',
      items: [
        { title: 'Dashboard', url: '/padal/dashboard', icon: LayoutDashboard },
        { title: 'Antrian Permohonan', url: '/padal/queue', icon: ListOrdered },
        { title: 'Permohonan Saya', url: '/padal/tickets', icon: Ticket },
        { title: 'Laporan Bulanan', url: '/padal/reports', icon: BarChart2 },
        { title: 'Anggota Teknisi', url: '/padal/members', icon: Users },
      ],
    },
  ],
};
```

---

## Verifikasi Setelah Selesai

Setelah kedua perubahan dilakukan, pastikan:

1. Tidak ada error TypeScript/ESLint pada kedua file yang diubah
2. Import `PadalMembersPage` menggunakan path `@/pages/technician/PadalMembersPage.jsx`
   (bukan path relatif `./` atau `../`)
3. Route baru menggunakan path `"members"` (tanpa slash di depan, karena ini child route)
4. Item menu baru menggunakan `icon: Users` (huruf kapital U, bukan string `'Users'`)
5. Tidak ada file lain yang diubah selain kedua file di atas

---

## Yang TIDAK Perlu Dilakukan

- Jangan ubah `PadalMembersPage.jsx` — file ini sudah selesai dan berfungsi
- Jangan ubah backend/routes apapun — endpoint sudah siap
- Jangan ubah file sidebar untuk role lain (Satker, Subtekinfo, Teknisi)
- Jangan tambahkan proteksi role tambahan — `ProtectedRoute allowedRoles={['Padal']}`
  di parent route sudah menangani ini secara otomatis

---

## Setelah Selesai — Buat File `CHANGELOG_PADAL_MEMBERS.md`

Buat file baru bernama `CHANGELOG_PADAL_MEMBERS.md` di root project (sejajar dengan `README.md`).

Isi file ini berdasarkan apa yang kamu kerjakan:

```md
# CHANGELOG — Integrasi PadalMembersPage

> Dikerjakan oleh: GitHub Copilot  
> Tanggal: [isi tanggal hari ini]

## Perubahan

### `apps/web/src/App.jsx`
- Ditambahkan: import `PadalMembersPage`
- Ditambahkan: route `/padal/members` di dalam blok Padal Routes

### `apps/web/src/components/layout/sidebar-data.js`
- Ditambahkan: item menu "Anggota Teknisi" dengan url `/padal/members` dan icon `Users`
  di dalam `technicianSidebarData`

## Catatan
Halaman `PadalMembersPage.jsx` sudah ada sebelumnya lengkap dengan semua fitur.
Perubahan ini hanya menghubungkan halaman tersebut ke sistem routing dan navigasi.
```
