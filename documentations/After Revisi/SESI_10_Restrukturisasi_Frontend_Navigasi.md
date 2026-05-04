# Sesi 10 — Restrukturisasi Frontend & Navigasi

Tanggal dibuat: 2026-05-04

**Tanggal Pengerjaan:** 3 Mei 2026  
**Status:** ✅ Selesai (Sesi Terakhir)

---

## Tujuan

Memastikan semua halaman, routing, dan navigasi konsisten dengan 4 role baru (Satker, Teknisi, Padal, Subtekinfo). Menambah halaman read-only untuk Teknisi, merestrukturisasi path URL per role, dan memperbarui semua referensi navigate/Link di seluruh frontend.

---

## Struktur Route Baru

| Path Lama | Path Baru | Role |
|-----------|-----------|------|
| `/user/*` | `/satker/*` | Satker |
| `/user/*` | `/teknisi/*` | Teknisi (read-only, baru) |
| `/technician/*` | `/padal/*` | Padal |
| `/admin/*` | `/subtekinfo/*` | Subtekinfo |

Legacy redirects ditambahkan di App.jsx agar URL lama tetap diarahkan ke dashboard role masing-masing (backward compatibility).

---

## File Baru

### 1. `apps/web/src/pages/teknisi/TeknisiTicketsPage.jsx`

Halaman daftar tiket **read-only** untuk role Teknisi:
- Menampilkan semua tiket (bukan filter per user) dengan filter status, tanggal, pencarian
- **Tidak ada tombol aksi** (tidak ada Selesai, Batalkan, Assign, dsb.)
- Kolom tambahan: Padal (siapa yang menangani)
- Link detail menuju `/teknisi/tickets/:id`

### 2. `apps/web/src/pages/teknisi/TeknisiTicketDetailPage.jsx`

Halaman detail tiket **read-only** untuk role Teknisi:
- Tampilkan judul, deskripsi, status, pelapor, padal, satker, tanggal
- Tampilkan lampiran (download only, tidak bisa hapus)
- Tampilkan catatan teknisi (read-only)
- Tampilkan alasan penolakan jika status Ditolak
- Tidak ada form tambah catatan, tidak ada tombol aksi apapun
- Tombol "Kembali ke Daftar Tiket" → `/teknisi/tickets`

---

## File yang Diubah

### 3. `apps/web/src/App.jsx`

- **Import baru**: `TeknisiTicketsPage`, `TeknisiTicketDetailPage`
- **Komentar seksi** diperbarui: `// Satker Pages`, `// Teknisi Pages (read-only)`, `// Padal Pages`, `// Subtekinfo Pages`
- **RootRedirect** diperbarui:
  ```jsx
  if (role === 'Subtekinfo') → /subtekinfo/dashboard
  if (role === 'Padal')      → /padal/dashboard
  if (role === 'Teknisi')    → /teknisi/tickets
  default (Satker)           → /satker/dashboard
  ```
- **Route baru** (mengganti /user, /technician, /admin):
  - `/satker` — `allowedRoles={['Satker']}`
  - `/teknisi` — `allowedRoles={['Teknisi']}` (hanya tickets + reports)
  - `/padal` — `allowedRoles={['Padal']}`
  - `/subtekinfo` — `allowedRoles={['Subtekinfo']}`
- **Legacy redirects** (backward compat):
  ```jsx
  /user/*        → /satker/dashboard
  /technician/*  → /padal/dashboard
  /admin/*       → /subtekinfo/dashboard
  ```

### 4. `apps/web/src/contexts/AuthContext.jsx`

Navigasi setelah login diperbarui:
```js
if (role === 'Subtekinfo') navigate('/subtekinfo/dashboard');
else if (role === 'Padal') navigate('/padal/dashboard');
else if (role === 'Teknisi') navigate('/teknisi/tickets');
else navigate('/satker/dashboard');
```

### 5. `apps/web/src/components/common/ProtectedRoute.jsx`

Redirect unauthorized diperbarui:
```js
if (role === 'Subtekinfo') → /subtekinfo/dashboard
if (role === 'Padal')      → /padal/dashboard
if (role === 'Teknisi')    → /teknisi/tickets
default                    → /satker/dashboard
```

### 6. `apps/web/src/pages/HomePage.jsx`

Redirect logic diperbarui sesuai role baru.

### 7. `apps/web/src/components/layout/sidebar-data.js`

- **Tambah** `teknisiSidebarData` — menu Semua Tiket + Laporan Bulanan (tanpa Dashboard)
- **Update** `getSidebarData()` — tambah case `'Teknisi'` → `teknisiSidebarData`
- **Semua URL** di seluruh sidebar diperbarui:

| Sidebar | Prefix Lama | Prefix Baru |
|---------|-------------|-------------|
| `userSidebarData` (Satker) | `/user/` | `/satker/` |
| `technicianSidebarData` (Padal) | `/technician/` | `/padal/` |
| `adminSidebarData` (Subtekinfo) | `/admin/` | `/subtekinfo/` |
| `teknisiSidebarData` (Teknisi) | — (baru) | `/teknisi/` |

### 8. Halaman Satker

| File | Perubahan |
|------|-----------|
| `CreateTicketPage.jsx` | Navigate `/user/tickets` → `/satker/tickets`; `/user/rating` → `/satker/rating` |
| `RatingPage.jsx` | Semua navigate `/user/*` → `/satker/*` |
| `TicketDetailPage.jsx` | Navigate rating → `/satker/rating` |
| `UserDashboard.jsx` | Link create-ticket dan tickets → `/satker/*` |
| `UserTicketsPage.jsx` | Link dashboard, create-ticket, detail tiket → `/satker/*` |

### 9. Halaman Padal

| File | Perubahan |
|------|-----------|
| `AssignmentNotificationBanner.jsx` | navigate → `/padal/tickets/:id` |
| `TechnicianDashboard.jsx` | Link queue, tickets, detail tiket → `/padal/*` |
| `TechnicianQueuePage.jsx` | Link detail tiket → `/padal/tickets/:id` |
| `TechnicianTicketDetailPage.jsx` | navigate dashboard → `/padal/dashboard`; Link tiket → `/padal/tickets` |
| `TechnicianTicketsPage.jsx` | Link detail tiket → `/padal/tickets/:id` |

### 10. Halaman Subtekinfo

| File | Perubahan |
|------|-----------|
| `AdminDashboard.jsx` | Link detail tiket → `/subtekinfo/tickets/:id` |
| `AdminTicketDetailPage.jsx` | navigate + Link → `/subtekinfo/tickets` |
| `AllTicketsPage.jsx` | Link detail tiket → `/subtekinfo/tickets/:id` |

---

## Ringkasan File yang Diubah / Dibuat

| File | Aksi |
|------|------|
| `apps/web/src/pages/teknisi/TeknisiTicketsPage.jsx` | Dibuat (baru) |
| `apps/web/src/pages/teknisi/TeknisiTicketDetailPage.jsx` | Dibuat (baru) |
| `apps/web/src/App.jsx` | Diubah (route restrukturisasi total) |
| `apps/web/src/contexts/AuthContext.jsx` | Diubah (navigate after login) |
| `apps/web/src/components/common/ProtectedRoute.jsx` | Diubah (unauthorized redirect) |
| `apps/web/src/pages/HomePage.jsx` | Diubah (redirect logic) |
| `apps/web/src/components/layout/sidebar-data.js` | Diubah (URL update + teknisiSidebarData baru) |
| `apps/web/src/pages/CreateTicketPage.jsx` | Diubah (navigate URL) |
| `apps/web/src/pages/RatingPage.jsx` | Diubah (navigate URL) |
| `apps/web/src/pages/TicketDetailPage.jsx` | Diubah (navigate URL) |
| `apps/web/src/pages/UserDashboard.jsx` | Diubah (Link URL) |
| `apps/web/src/pages/UserTicketsPage.jsx` | Diubah (Link URL) |
| `apps/web/src/components/tickets/AssignmentNotificationBanner.jsx` | Diubah (navigate URL) |
| `apps/web/src/pages/technician/TechnicianDashboard.jsx` | Diubah (Link URL) |
| `apps/web/src/pages/technician/TechnicianQueuePage.jsx` | Diubah (Link URL) |
| `apps/web/src/pages/technician/TechnicianTicketDetailPage.jsx` | Diubah (navigate + Link URL) |
| `apps/web/src/pages/technician/TechnicianTicketsPage.jsx` | Diubah (Link URL) |
| `apps/web/src/pages/admin/AdminDashboard.jsx` | Diubah (Link URL) |
| `apps/web/src/pages/admin/AdminTicketDetailPage.jsx` | Diubah (navigate + Link URL) |
| `apps/web/src/pages/admin/AllTicketsPage.jsx` | Diubah (Link URL) |

---

## Catatan

- File halaman lama (TechnicianDashboard.jsx, AdminDashboard.jsx, dll.) **tidak di-rename** karena sudah berfungsi dengan baik — hanya URL navigasi internal yang diperbarui
- Legacy redirects di App.jsx memastikan bookmark atau link lama tetap bekerja
- Tidak ada perubahan database atau backend di sesi ini
- Semua perubahan diverifikasi tanpa error kompilasi

---

## Status Revisi Keseluruhan

| Sesi | Nama | Status |
|------|------|--------|
| Sesi 1 | Migrasi Database | ✅ Selesai |
| Sesi 2 | Restrukturisasi Role Backend | ✅ Selesai |
| Sesi 3 | Hapus Fitur Urgensi | ✅ Selesai |
| Sesi 4 | Hapus Sistem Chat Internal | ✅ Selesai |
| Sesi 5 | Alur Assign Padal & Socket.IO Baru | ✅ Selesai |
| Sesi 6 | Penolakan Tiket dengan Alasan Wajib | ✅ Selesai |
| Sesi 7 | Rating Wajib Satker | ✅ Selesai |
| Sesi 8 | Manajemen Shift Padal | ✅ Selesai |
| Sesi 9 | Laporan Bulanan | ✅ Selesai |
| Sesi 10 | Restrukturisasi Frontend & Navigasi | ✅ Selesai |

**Semua 10 sesi revisi ProjectPolda telah selesai dikerjakan.**
