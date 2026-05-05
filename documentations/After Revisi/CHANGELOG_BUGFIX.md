# CHANGELOG BUGFIX — ProjectPolda

Tanggal dibuat: 2026-05-04

Dokumen ini mencatat semua perbaikan bug dan implementasi saran dari `ProjectPolda_BugReport_dan_Saran.md` yang dikerjakan dalam sesi ini.

---

## BUG FIXES

### BUG-13 — Semua Tiket Subtekinfo gagal memuat data
- **File**: `apps/web/src/pages/admin/AllTicketsPage.jsx`
- **Perubahan**: Param query diperbaiki ke `assigned_technician_id`, parser respons ditambah untuk format `data.tickets`, dan toast error fetch ditampilkan
- **Status**: ✅ Selesai

### BUG-14 — Kelola Padal gagal memuat data
- **File**: `apps/web/src/pages/admin/ManageTechniciansPage.jsx`
- **Perubahan**: Tambah fallback endpoint `/users?role=Padal` saat `/technicians` gagal, serta update pesan error menjadi "Gagal memuat data padal"
- **Status**: ✅ Selesai

### BUG-15 — Laporan bulanan gagal karena kolom `padal_id` tidak ada
- **File**: `backend/src/routes/reports.js`, `backend/src/services/TicketService.js`
- **Perubahan**: Tambah deteksi kolom `tickets.padal_id`; jika tidak ada maka query fallback ke `assigned_technician_id`
- **Status**: ✅ Selesai

### BUG-16 — Laporan bulanan gagal karena kolom `rejection_reason` tidak ada
- **File**: `backend/src/routes/reports.js`
- **Perubahan**: Tambah deteksi kolom `tickets.rejection_reason`; jika tidak ada maka gunakan `NULL AS rejection_reason`
- **Status**: ✅ Selesai

### BUG-10 — Env validation gagal saat test integration
- **File**: `backend/tests/setup.js`
- **Perubahan**: Nilai `JWT_SECRET` pada setup test diperpanjang agar memenuhi minimum 32 karakter
- **Status**: ✅ Selesai

### BUG-11 — Unit test TicketService tidak sinkron dengan strategi cache terbaru
- **File**: `backend/tests/services/ticketService.test.js`
- **Perubahan**: Dua test pada `getTickets` diperbarui agar sesuai behavior `shouldUseCache = false` (tidak mengandalkan cache hit/set)
- **Status**: ✅ Selesai

### BUG-12 — ESLint frontend membaca file artifact `.tmp-build-check`
- **File**: `apps/web/eslint.config.mjs`
- **Perubahan**: Tambah `.tmp-build-check/**` pada `ignores` agar lint hanya memproses source yang relevan
- **Status**: ✅ Selesai

### BUG-01 — Dashboard 403 Forbidden (role Admin)
- **File**: `backend/src/routes/dashboard.js`
- **Perubahan**: `role('Admin')` → `role('Subtekinfo')` pada route `GET /admin-summary` dan `GET /stats`
- **Status**: ✅ Selesai

### BUG-02 — Technicians API crash (table divisions/technician_settings)
- **File**: `backend/src/routes/technicians.js`
- **Perubahan**: Dihapus semua `LEFT JOIN divisions`, `LEFT JOIN technician_settings`, kolom terkait, dan operasi `INSERT/UPDATE/DELETE` pada tabel yang sudah di-drop
- **Status**: ✅ Selesai

### BUG-03 — Role truncation saat register
- **File**: `backend/src/routes/auth.js`
- **Perubahan**: Fungsi `normalizeRole` dilengkapi untuk semua varian peran; role register dikunci ke `Satker`
- **Status**: ✅ Selesai

### BUG-04 — CreateTicketPage memanggil API divisions
- **File**: `apps/web/src/pages/CreateTicketPage.jsx`
- **Perubahan**: Dihapus `useEffect` yang memanggil `/divisions/${id}`, dihapus state `userDivision`, grid pelapor diubah dari 3-kolom ke 2-kolom
- **Status**: ✅ Selesai

### BUG-05 — AdminTicketDetailPage role check salah (`Admin` → `Subtekinfo`)
- **File**: `apps/web/src/pages/admin/AdminTicketDetailPage.jsx`
- **Perubahan**: `currentUser?.role === 'Admin'` → `=== 'Subtekinfo'` di semua tempat; impor modal baru ditambahkan
- **Status**: ✅ Selesai

### BUG-06 — cache.js `delByPattern` error (del signature)
- **File**: `backend/src/utils/cache.js`
- **Perubahan**: `await this.client.del(key)` → `await this.client.del([key])`
- **Status**: ✅ Selesai

### BUG-07 — Laporan Padal filter periode salah (`updated_at` → `created_at`)
- **File**: `backend/src/routes/reports.js`
- **Perubahan**: `DATE_FORMAT(t.updated_at, ...)` → `DATE_FORMAT(t.created_at, ...)` dan `ORDER BY t.updated_at` → `ORDER BY t.created_at` pada fungsi `reportPadal`
- **Status**: ✅ Selesai

### BUG-08 — Teknisi bisa akses rating routes
- **File**: `backend/src/routes/tickets.js`
- **Perubahan**: `role('Satker', 'Teknisi')` → `role('Satker')` pada `GET /pending-rating` dan `POST /:id/rating`
- **Status**: ✅ Selesai

### BUG-09 — UserDashboard referensi `division_id`
- **File**: `apps/web/src/pages/UserDashboard.jsx`
- **Perubahan**: Dihapus state `userDivision`, referensi `currentUser.division`, dan elemen UI yang menampilkan divisi
- **Status**: ✅ Selesai

---

## SARAN / IMPROVEMENTS

### SARAN-01 — Jalankan migrasi database
- **Catatan**: Tugas operasional — tidak diimplementasikan di kode
- **Status**: ⏭️ Lewati (ops task)

### SARAN-02 — Field Kategori di CreateTicketPage
- **File**: `apps/web/src/pages/CreateTicketPage.jsx`
- **Perubahan**: Ditambahkan field `<Select>` Kategori dengan opsi: Jaringan, Hardware, Software, Akses Sistem, Umum, Lainnya; ditambahkan validasi kategori di `handleSubmit`
- **Status**: ✅ Selesai

### SARAN-03 — Register hanya izinkan role Satker
- **File**: `backend/src/routes/auth.js`, `backend/src/utils/validationSchemas.js`
- **Perubahan**: Validasi Joi dikunci `valid('Satker')`, logika register menggunakan `finalRole = 'Satker'`
- **Status**: ✅ Selesai

### SARAN-04 — Tombol Tolak Tiket di AdminTicketDetailPage
- **File**: `apps/web/src/pages/admin/AdminTicketDetailPage.jsx`
- **Perubahan**: Ditambahkan tombol "Tolak Tiket" dengan `RejectTicketModal` component; hanya tampil jika status bukan Ditolak/Selesai/Dibatalkan
- **Status**: ✅ Selesai

### SARAN-05 — Assign Padal menggantikan Assign Teknisi
- **File**: `apps/web/src/pages/admin/AdminTicketDetailPage.jsx`
- **Perubahan**: Tombol "Assign Teknisi" → "Assign Padal" menggunakan `AssignPadalModal` component
- **Status**: ✅ Selesai

### SARAN-06 — Loading/Empty state di ManageTechniciansPage
- **File**: `apps/web/src/pages/admin/ManageTechniciansPage.jsx`
- **Catatan**: Sudah ada skeleton rows dan `<Empty>` component — tidak perlu perubahan
- **Status**: ✅ Sudah ada

### SARAN-07 — Bersihkan referensi technician_settings
- **File**: `backend/src/routes/technicians.js`
- **Perubahan**: Dihapus semua INSERT/UPDATE/DELETE ke `technician_settings` yang sudah di-drop
- **Status**: ✅ Selesai

### SARAN-08 — Migration runner otomatis
- **Catatan**: Tugas operasional — tidak diimplementasikan di kode
- **Status**: ⏭️ Lewati (ops task)

### SARAN-09 — Perbaiki error message (`error.response?.message` → `error.response?.data?.message`)
- **File**: `apps/web/src/pages/admin/AdminTicketDetailPage.jsx`
- **Perubahan**: `error.response?.message` → `error.response?.data?.message` di `handleForceComplete` dan `handleDelete`
- **Status**: ✅ Selesai

### SARAN-10 — Guard ticket ID di RatingPage
- **File**: `apps/web/src/pages/RatingPage.jsx`
- **Perubahan**: Ditambahkan pengecekan apakah `redirectTicketId` cocok dengan tiket yang dikembalikan API; jika tidak cocok tampilkan `toast.warning`
- **Status**: ✅ Selesai

### SARAN-11 — Ganti `window.confirm` dengan `AlertDialog` di TicketDetailPage
- **File**: `apps/web/src/pages/TicketDetailPage.jsx`
- **Perubahan**: Impor `AlertDialog` components; ditambahkan state `isCancelDialogOpen`; `handleCancelTicket` sekarang hanya membuka dialog; logika API dipindah ke handler yang dipanggil dari `AlertDialogAction`
- **Status**: ✅ Selesai

### SARAN-12 — Tambah socket listener di AdminDashboard
- **File**: `apps/web/src/pages/admin/AdminDashboard.jsx`
- **Perubahan**: Impor `socket` dari `@/lib/socket.js`; ditambahkan `useEffect` yang listen `ticket:new` dan `ticket_updated` dan memanggil `fetchDashboardData()` secara otomatis
- **Status**: ✅ Selesai

---

## Ringkasan

| Item | Deskripsi | Status |
|------|-----------|--------|
| BUG-01 | Dashboard 403 role fix | ✅ |
| BUG-02 | Technicians divisions crash | ✅ |
| BUG-03 | Auth role normalization | ✅ |
| BUG-04 | CreateTicketPage divisions call | ✅ |
| BUG-05 | AdminTicketDetailPage isAdmin | ✅ |
| BUG-06 | Cache del pattern | ✅ |
| BUG-07 | Reports updated_at filter | ✅ |
| BUG-08 | Teknisi rating routes | ✅ |
| BUG-09 | UserDashboard division refs | ✅ |
| SARAN-01 | Run migrations (ops) | ⏭️ |
| SARAN-02 | Category field | ✅ |
| SARAN-03 | Register role restriction | ✅ |
| SARAN-04 | Reject ticket modal | ✅ |
| SARAN-05 | Assign Padal modal | ✅ |
| SARAN-06 | Loading/empty state | ✅ |
| SARAN-07 | technician_settings cleanup | ✅ |
| SARAN-08 | Migration runner (ops) | ⏭️ |
| SARAN-09 | error.response.data.message | ✅ |
| SARAN-10 | RatingPage ticket ID guard | ✅ |
| SARAN-11 | AlertDialog ganti window.confirm | ✅ |
| SARAN-12 | Socket listener AdminDashboard | ✅ |
