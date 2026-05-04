# 🛠️ TASK: Fix All Bugs & Apply All Improvements — ProjectPolda

Tanggal dibuat: 2026-05-04

## Instruksi Awal (BACA DULU SEBELUM MULAI)

Kamu adalah GitHub Copilot yang akan bekerja sebagai developer untuk proyek **ProjectPolda** — sebuah IT Helpdesk Ticketing System berbasis React + Node.js/Express + MySQL + Redis + Socket.IO.

**Langkah pertama yang WAJIB dilakukan:**

1. Buka dan baca file-file berikut untuk memahami konteks proyek secara menyeluruh **sebelum menyentuh kode apapun**:
   - `apps/web/src/App.jsx` — routing dan struktur role
   - `backend/src/server.js` — registrasi semua route
   - `backend/src/middleware/auth.js` dan `role.js` — sistem auth & otorisasi
   - `backend/migrations/001_revision_schema.sql` — perubahan skema database besar (role rename, tabel dihapus)
   - `backend/src/routes/dashboard.js`
   - `backend/src/routes/tickets.js`
   - `backend/src/routes/technicians.js`
   - `backend/src/routes/auth.js`
   - `backend/src/routes/reports.js`
   - `backend/src/utils/cache.js`
   - `backend/src/utils/dashboardCache.js`
   - `apps/web/src/pages/admin/AdminTicketDetailPage.jsx`
   - `apps/web/src/pages/admin/AllTicketsPage.jsx`
   - `apps/web/src/pages/CreateTicketPage.jsx`
   - `apps/web/src/pages/UserDashboard.jsx`
   - `apps/web/src/pages/RatingPage.jsx`
   - `apps/web/src/pages/TicketDetailPage.jsx`
   - `apps/web/src/components/modals/RejectTicketModal.jsx`
   - `apps/web/src/components/modals/AssignPadalModal.jsx`
   - `apps/web/src/components/layout/sidebar-data.js`
   - `apps/web/src/lib/constants.js`
   - `backend/src/utils/validationSchemas.js`

2. Pahami konteks penting ini:
   - Proyek baru saja melalui **"Revisi Besar"** yang mengganti nama-nama role dan struktur database
   - Role lama: `Admin`, `User`, `Teknisi` → Role baru: `Subtekinfo`, `Satker`, `Padal`, `Teknisi`
   - Tabel `divisions`, `technician_settings`, `chats`, `messages` sudah **dihapus** via migrasi
   - Kolom `division_id` di tabel `users` sudah **dihapus**
   - Banyak kode yang belum diupdate mengikuti perubahan ini — itulah yang akan kita perbaiki

3. Kerjakan semua item di bawah **secara berurutan**, dari BUG-01 sampai SARAN-12.

4. Setiap kali selesai mengerjakan satu item, catat apa yang diubah untuk laporan akhir.

5. Setelah **semua** item selesai, buat file `CHANGELOG_BUGFIX.md` seperti yang dijelaskan di bagian akhir prompt ini.

---

## BAGIAN A — PERBAIKAN BUG (Wajib Dikerjakan)

---

### BUG-01 — Dashboard Subtekinfo Selalu 403 Forbidden

**File:** `backend/src/routes/dashboard.js`

**Masalah:** Dua endpoint masih menggunakan `role('Admin')` padahal role `Admin` sudah tidak ada. Semua request dari user Subtekinfo akan selalu ditolak dengan 403.

**Yang harus diubah:**
- Baris 17: Ganti `role('Admin')` menjadi `role('Subtekinfo')` pada route `GET /admin-summary`
- Baris 258: Ganti `role('Admin')` menjadi `role('Subtekinfo')` pada route `GET /stats`

```js
// SEBELUM (salah)
router.get('/admin-summary', auth, role('Admin'), async (req, res) => { ... });
router.get('/stats', auth, role('Admin'), async (req, res) => { ... });

// SESUDAH (benar)
router.get('/admin-summary', auth, role('Subtekinfo'), async (req, res) => { ... });
router.get('/stats', auth, role('Subtekinfo'), async (req, res) => { ... });
```

Setelah itu, **lakukan pencarian menyeluruh** di seluruh file `backend/src/routes/dashboard.js` — pastikan tidak ada lagi referensi ke role `'Admin'` yang tertinggal.

---

### BUG-02 — GET /api/technicians Crash 500 (Tabel `divisions` Tidak Ada)

**File:** `backend/src/routes/technicians.js`

**Masalah:** Query di dua endpoint masih melakukan `LEFT JOIN divisions d ON u.division_id = d.id` dan `LEFT JOIN technician_settings ts ON u.id = ts.user_id`. Kedua tabel ini sudah dihapus oleh migrasi `001_revision_schema.sql`, sehingga setiap request ke endpoint ini menghasilkan Error 500.

**Sebelum mengubah kode:**
- Cek apakah tabel `technician_settings` benar-benar sudah di-drop di database (lihat migrasi). Jika sudah, hapus semua JOIN-nya. Jika belum (masih ada), biarkan JOIN ke `technician_settings` tapi tetap hapus JOIN ke `divisions`.

**Yang harus diubah pada endpoint `GET /` (list semua teknisi):**
- Hapus `LEFT JOIN divisions d ON u.division_id = d.id`
- Hapus kolom `d.name as division_name` dari SELECT
- Jika `technician_settings` sudah di-drop: hapus juga `LEFT JOIN technician_settings ts ON u.id = ts.user_id` dan semua kolom `ts.*` dari SELECT dan dari response object

**Yang harus diubah pada endpoint `GET /:userId` (detail satu teknisi):**
- Sama seperti di atas, hapus JOIN dan kolom yang mereferensi tabel yang sudah tidak ada

**Yang harus diubah pada role check di `GET /:userId`:**
```js
// SEBELUM (salah)
if (req.user.role !== 'Admin' && req.user.id !== userId) {

// SESUDAH (benar)
if (req.user.role !== 'Subtekinfo' && req.user.id !== userId) {
```

Setelah selesai, pastikan tidak ada referensi ke `divisions`, `division_id`, atau `technician_settings` yang tersisa di seluruh file `technicians.js`.

---

### BUG-03 — Registrasi User Baru Gagal 500 (Role Truncation Error)

**File:** `backend/src/routes/auth.js`, `backend/src/utils/validationSchemas.js`

**Masalah:** Error `"Data truncated for column 'role' at row 1"` terjadi saat registrasi. Ini berarti nilai role yang coba di-INSERT ke database tidak sesuai dengan ENUM yang ada.

**Yang harus diubah:**

Di `backend/src/utils/validationSchemas.js`, verifikasi bahwa `patterns.role` hanya mengizinkan nilai `'Subtekinfo'`, `'Padal'`, `'Teknisi'`, `'Satker'` — bukan nilai lama seperti `'Admin'` atau `'User'`. Jika masih ada nilai lama, hapus.

Di `backend/src/routes/auth.js`, cari fungsi `normalizeRole` dan pastikan semua kemungkinan nilai role lama sudah di-normalize ke role baru sebelum INSERT ke database:
```js
// Pastikan fungsi ini lengkap
const normalizeRole = (role) => {
  if (!role) return 'Satker';
  if (role === 'User' || role === 'user') return 'Satker';
  if (role === 'Admin' || role === 'admin') return 'Subtekinfo';
  if (role === 'Teknisi' || role === 'teknisi') return 'Teknisi';
  if (role === 'Padal' || role === 'padal') return 'Padal';
  if (role === 'Satker' || role === 'satker') return 'Satker';
  if (role === 'Subtekinfo' || role === 'subtekinfo') return 'Subtekinfo';
  return 'Satker'; // default fallback
};
```

Juga pastikan schema validasi untuk `register` di `authSchemas` **hanya mengizinkan `'Satker'`** sebagai satu-satunya role yang bisa dipilih saat registrasi publik (untuk mencegah user mendaftar sebagai Subtekinfo sendiri):
```js
// authSchemas.register
role: Joi.string().valid('Satker').default('Satker')
```

---

### BUG-04 — CreateTicketPage Memanggil `/api/divisions/:id` yang Tidak Ada

**File:** `apps/web/src/pages/CreateTicketPage.jsx`

**Masalah:** Ada `useEffect` yang memanggil `api.get(`/divisions/${currentUser.division_id}`)`. Endpoint ini tidak ada, tabel `divisions` sudah dihapus, dan kolom `division_id` sudah tidak ada di user object.

**Yang harus diubah:**
- Hapus state `userDivision` dan `setUserDivision`
- Hapus seluruh `useEffect` yang memanggil `/divisions/...`
- Hapus baris `const [userDivision, setUserDivision] = useState('Memuat...')`
- Di JSX, hapus atau ganti tampilan kolom "Divisi" pada info pelapor. Jika ingin tetap menampilkan sesuatu di posisi itu, ganti dengan data lain yang tersedia di `currentUser` (misalnya field `phone` yang sudah ada, atau label statis)

---

### BUG-05 — AdminTicketDetailPage Mengecek Role `'Admin'` yang Sudah Tidak Ada

**File:** `apps/web/src/pages/admin/AdminTicketDetailPage.jsx`

**Masalah:** Dua tempat menggunakan `currentUser?.role === 'Admin'` yang selalu bernilai `false` karena role Admin sudah tidak ada, menyebabkan semua tombol aksi (Assign, Complete, Delete) tidak pernah muncul.

**Yang harus diubah:**
```js
// SEBELUM (salah) — baris sekitar 89
if (currentUser?.role === 'Admin') {
  fetchTechnicians();
}

// SESUDAH (benar)
if (currentUser?.role === 'Subtekinfo') {
  fetchTechnicians();
}

// SEBELUM (salah) — baris sekitar 170
const isAdmin = currentUser?.role === 'Admin';

// SESUDAH (benar)
const isAdmin = currentUser?.role === 'Subtekinfo';
```

Lakukan pencarian `'Admin'` di seluruh file ini dan pastikan tidak ada yang terlewat.

---

### BUG-06 — Redis Cache DEL BY PATTERN Gagal

**File:** `backend/src/utils/cache.js`

**Masalah:** Fungsi `delByPattern` memanggil `this.client.del(key)` dengan string tunggal. Pada versi `redis` npm client v4+, fungsi `del()` bisa bermasalah jika menerima string biasa bukan array, terutama pada kondisi tertentu yang menyebabkan error `"ERR wrong number of arguments for 'del' command"`.

**Yang harus diubah:**
```js
// SEBELUM
for await (const key of this.client.scanIterator({ MATCH: pattern, COUNT: 100 })) {
  await this.client.del(key);
}

// SESUDAH — kirim sebagai array untuk konsistensi
for await (const key of this.client.scanIterator({ MATCH: pattern, COUNT: 100 })) {
  await this.client.del([key]);
}
```

---

### BUG-07 — Laporan Padal Filter `updated_at` Tidak Konsisten

**File:** `backend/src/routes/reports.js`, fungsi `reportPadal`

**Masalah:** Query summary dan list tiket untuk Padal menggunakan `DATE_FORMAT(t.updated_at, '%Y-%m') = ?` sebagai filter periode. Ini tidak konsisten dengan laporan Satker yang menggunakan `created_at`, dan bisa menyebabkan data masuk/keluar laporan secara tidak terduga.

**Yang harus diubah:**
Ganti filter di kedua query di dalam fungsi `reportPadal` dari `updated_at` menjadi `created_at`:
```sql
-- SEBELUM
WHERE t.padal_id = ? AND DATE_FORMAT(t.updated_at, '%Y-%m') = ?

-- SESUDAH
WHERE t.padal_id = ? AND DATE_FORMAT(t.created_at, '%Y-%m') = ?
```

Lakukan pada kedua query (summary dan list tiket) di dalam fungsi `reportPadal`.

---

### BUG-08 — Hapus Role Teknisi dari Alur Rating

**File:** `backend/src/routes/tickets.js`

**Masalah:** Route `GET /tickets/pending-rating` dan `POST /tickets/:id/rating` mengizinkan role `'Teknisi'` padahal Teknisi adalah role read-only yang tidak membuat tiket, sehingga alur rating tidak relevan untuk mereka.

**Yang harus diubah:**
```js
// SEBELUM
router.get('/pending-rating', auth, role('Satker', 'Teknisi'), ...)
router.post('/:id/rating', auth, role('Satker', 'Teknisi'), ...)

// SESUDAH — hanya Satker yang bisa rating
router.get('/pending-rating', auth, role('Satker'), ...)
router.post('/:id/rating', auth, role('Satker'), ...)
```

---

### BUG-09 — UserDashboard Referensi `division_id` yang Tidak Ada

**File:** `apps/web/src/pages/UserDashboard.jsx`

**Masalah:** Mirip dengan BUG-04, periksa apakah ada pemanggilan API atau penggunaan `currentUser.division_id` di file ini.

**Yang harus dilakukan:**
- Buka file dan cari semua kemunculan `division_id` atau pemanggilan ke `/divisions/`
- Jika ditemukan, hapus atau ganti dengan fallback yang sesuai
- Pastikan tidak ada elemen UI yang bergantung pada data divisi

---

## BAGIAN B — IMPLEMENTASI SARAN (Wajib Dikerjakan)

---

### SARAN-02 — Tambahkan Field Kategori di Form Buat Permohonan

**File:** `apps/web/src/pages/CreateTicketPage.jsx`

Kolom `category` sudah ada di database dan backend sudah menerima field ini, tapi form saat ini mengirim `category: 'Umum'` secara hardcoded.

**Yang harus diimplementasikan:**
1. Tambahkan state `category` ke `formData` (dengan default value `'Umum'`)
2. Tambahkan komponen `Select` dari shadcn/ui untuk memilih kategori
3. Pilihan kategori: `'Jaringan'`, `'Hardware'`, `'Software'`, `'Akses Sistem'`, `'Umum'`, `'Lainnya'`
4. Label field: "Kategori" dengan tanda required (*)
5. Posisikan di antara field "Lokasi" dan field "Lampiran"
6. Kirim nilai kategori yang dipilih saat submit (ganti `category: 'Umum'` yang hardcoded)
7. Tambahkan validasi: jika kategori belum dipilih, tampilkan error toast

Gunakan komponen `Select`, `SelectContent`, `SelectItem`, `SelectTrigger`, `SelectValue` dari `@/components/ui/select.jsx` yang sudah ada.

---

### SARAN-03 — Batasi Role di Self-Registration

**File:** `backend/src/utils/validationSchemas.js`, `backend/src/routes/auth.js`

**Yang harus diimplementasikan:**
1. Di `authSchemas.register`, ubah validasi role menjadi hanya mengizinkan `'Satker'`:
```js
// authSchemas.register
role: Joi.string().valid('Satker').default('Satker')
```
2. Di `backend/src/routes/auth.js` pada endpoint `POST /register`, tambahkan override paksa sebelum INSERT:
```js
// Paksa role ke 'Satker' untuk self-registration, apapun yang dikirim
const finalRole = 'Satker';
```
Ini memastikan tidak ada celah meskipun validasi Joi di-bypass.

---

### SARAN-04 — Tambahkan Tombol "Tolak Tiket" di AdminTicketDetailPage

**File:** `apps/web/src/pages/admin/AdminTicketDetailPage.jsx`

`RejectTicketModal` sudah ada di `apps/web/src/components/modals/RejectTicketModal.jsx` dan sudah digunakan di `AllTicketsPage.jsx`. Sekarang tambahkan juga di halaman detail tiket.

**Yang harus diimplementasikan:**
1. Import `RejectTicketModal` di bagian atas file
2. Tambahkan state: `const [isRejectModalOpen, setIsRejectModalOpen] = useState(false)`
3. Tambahkan tombol "Tolak Tiket" di area tombol aksi (dekat tombol "Force Complete" dan "Delete"), dengan kondisi hanya tampil jika status tiket bukan `'Ditolak'`, `'Selesai'`, atau `'Dibatalkan'`
4. Tombol menggunakan `variant="destructive"` atau style merah untuk konsistensi
5. Render `<RejectTicketModal>` di bawah modal-modal yang sudah ada, dengan props: `open={isRejectModalOpen}`, `onOpenChange={setIsRejectModalOpen}`, `ticket={ticket}`, `onSuccess={() => { setIsRejectModalOpen(false); fetchTicketData(); }}`

Lihat implementasi di `AllTicketsPage.jsx` sebagai referensi.

---

### SARAN-05 — Ganti "Assign Teknisi" menjadi "Assign Padal" di AdminTicketDetailPage

**File:** `apps/web/src/pages/admin/AdminTicketDetailPage.jsx`

Saat ini terdapat tombol "Assign Teknisi" yang menggunakan `PATCH /tickets/:id` dengan field `assigned_technician_id`. Ini tidak konsisten dengan sistem baru yang menggunakan endpoint `POST /tickets/:id/assign` dan tabel `ticket_assignments` untuk alur `pending_confirm → accepted`.

**Yang harus diimplementasikan:**
1. Import `AssignPadalModal` dari `@/components/modals/AssignPadalModal.jsx`
2. Hapus state `selectedTechId` dan `isAssignModalOpen` yang lama
3. Hapus fungsi `handleAssignTech` yang lama
4. Hapus state dan fungsi yang berkaitan dengan fetch `technicians` untuk dropdown assign lama
5. Tambahkan state: `const [isAssignPadalOpen, setIsAssignPadalOpen] = useState(false)`
6. Ganti tombol "Assign Teknisi" menjadi "Assign Padal" dengan `onClick={() => setIsAssignPadalOpen(true)}`
7. Hapus `<Dialog>` assign yang lama (dengan dropdown select teknisi)
8. Tambahkan komponen `<AssignPadalModal>` dengan props: `open={isAssignPadalOpen}`, `onOpenChange={setIsAssignPadalOpen}`, `ticket={ticket}`, `onSuccess={() => { setIsAssignPadalOpen(false); fetchTicketData(); }}`
9. Update label `const isAdmin = currentUser?.role === 'Subtekinfo'` jika belum (dari BUG-05)

---

### SARAN-06 — Tambahkan Loading & Empty State di ManageTechniciansPage

**File:** `apps/web/src/pages/admin/ManageTechniciansPage.jsx`

**Yang harus diimplementasikan:**
1. Tambahkan state `isLoading` jika belum ada, set `true` saat mulai fetch dan `false` saat selesai
2. Saat `isLoading === true`, tampilkan skeleton rows menggunakan komponen `Skeleton` dari `@/components/ui/skeleton.jsx`
3. Saat fetch berhasil tapi `technicians.length === 0`, tampilkan empty state yang informatif (contoh: "Belum ada teknisi terdaftar. Klik 'Tambah Teknisi' untuk menambahkan.")
4. Gunakan komponen `Empty` dari `@/components/ui/empty.jsx` jika tersedia

---

### SARAN-07 — Verifikasi dan Bersihkan Referensi `technician_settings` di Semua File

**File:** Semua file di `backend/src/`

**Yang harus dilakukan:**
1. Cari semua kemunculan string `technician_settings` di seluruh direktori `backend/src/`
2. Untuk setiap kemunculan, cek apakah tabel ini masih ada di database (lihat migrasi)
3. Jika sudah di-drop: hapus JOIN, hapus kolom terkait dari SELECT, hapus dari response object
4. Lakukan hal yang sama untuk `divisions` dan `division_id`

---

### SARAN-09 — Perbaiki Error Message di AdminTicketDetailPage

**File:** `apps/web/src/pages/admin/AdminTicketDetailPage.jsx`

**Masalah:** `error.response` adalah object, bukan string, sehingga `.message` tidak terbaca.

**Yang harus diubah:** Cari semua kemunculan pola `error.response?.message` di file ini dan ganti:
```js
// SEBELUM (salah)
error.response?.message || error.message

// SESUDAH (benar)
error.response?.data?.message || error.message
```

Lakukan juga pencarian serupa di file-file lain yang mungkin punya pola yang sama.

---

### SARAN-10 — Tambahkan Guard Ticket ID di RatingPage

**File:** `apps/web/src/pages/RatingPage.jsx`

**Masalah:** Saat user diarahkan ke `/satker/rating?ticket_id=ABC`, halaman ini mengambil tiket dari endpoint `/pending-rating` yang mengembalikan tiket pending paling lama — bukan tiket ABC secara spesifik.

**Yang harus diimplementasikan:**
1. Setelah `fetchPending()` mendapatkan `data.ticket`, cek apakah `redirectTicketId` ada
2. Jika `redirectTicketId` ada dan berbeda dengan `data.ticket?.id`, tampilkan peringatan atau fetch ulang untuk tiket yang spesifik
3. Minimal, tambahkan pengecekan agar jika tiket yang dikembalikan sudah dirating, tampilkan konfirmasi yang benar

---

### SARAN-11 — Ganti `window.confirm` dengan AlertDialog di TicketDetailPage

**File:** `apps/web/src/pages/TicketDetailPage.jsx`

**Masalah:** Pembatalan tiket menggunakan `window.confirm()` yang tidak konsisten dengan design system aplikasi.

**Yang harus diimplementasikan:**
1. Import `AlertDialog`, `AlertDialogAction`, `AlertDialogCancel`, `AlertDialogContent`, `AlertDialogDescription`, `AlertDialogFooter`, `AlertDialogHeader`, `AlertDialogTitle` dari `@/components/ui/alert-dialog.jsx`
2. Tambahkan state: `const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false)`
3. Hapus `window.confirm(...)` dari `handleCancelTicket`
4. Pisahkan logika: satu handler untuk membuka dialog, satu handler untuk eksekusi pembatalan
5. Render `<AlertDialog>` dengan teks konfirmasi yang sesuai (contoh: "Apakah Anda yakin ingin membatalkan permohonan ini? Tindakan ini tidak dapat dibatalkan.")
6. Tombol "Batalkan Permohonan" di JSX cukup memanggil `setIsCancelDialogOpen(true)`

---

### SARAN-12 — Tambahkan Socket Listener di Dashboard Subtekinfo

**File:** `apps/web/src/pages/admin/AdminDashboard.jsx`

**Masalah:** Dashboard tidak auto-refresh saat ada tiket baru masuk via socket.

**Yang harus diimplementasikan:**
1. Import `socket` dari `@/lib/socket.js` jika belum
2. Tambahkan `useEffect` untuk mendengarkan event socket `ticket:new`:
```js
useEffect(() => {
  const handleNewTicket = () => {
    fetchDashboardData();
  };
  socket.on('ticket:new', handleNewTicket);
  return () => socket.off('ticket:new', handleNewTicket);
}, []);
```
3. Juga dengarkan event `ticket_updated` untuk update counter saat status tiket berubah

---

## BAGIAN C — LANGKAH SETELAH SEMUA SELESAI

Setelah seluruh item di Bagian A dan B selesai dikerjakan:

### Buat File `CHANGELOG_BUGFIX.md` di Root Project

Buat file `CHANGELOG_BUGFIX.md` di direktori root project (sejajar dengan `README.md`).

File ini harus ditulis oleh kamu (Copilot) sendiri berdasarkan apa yang kamu kerjakan. **Tulis berdasarkan perubahan nyata yang kamu buat**, bukan hanya menyalin deskripsi dari prompt ini.

Struktur file yang diharapkan:

```md
# CHANGELOG_BUGFIX — ProjectPolda

> Dikerjakan oleh: GitHub Copilot
> Tanggal: [isi dengan tanggal hari ini]
> Berdasarkan laporan analisis: ProjectPolda_BugReport_dan_Saran.md

---

## Ringkasan Singkat

[Tulis 2–3 kalimat ringkasan tentang apa yang dikerjakan secara keseluruhan]

---

## Detail Perubahan

### BUG-01 — [Nama bug]
- **File yang diubah:** [daftar file]
- **Perubahan:** [jelaskan apa yang diubah]
- **Status:** ✅ Selesai / ⚠️ Sebagian / ❌ Tidak dikerjakan (beserta alasan)

### BUG-02 — ...
[ulangi untuk setiap bug dan saran]

---

## File yang Dimodifikasi

[Daftar lengkap semua file yang diubah beserta jenis perubahannya (fix, refactor, feature, dll.)]

---

## Catatan Tambahan

[Isi jika ada hal-hal yang perlu diketahui developer, misalnya: item yang tidak bisa dikerjakan karena keterbatasan informasi, asumsi yang dibuat, atau langkah manual yang masih perlu dilakukan seperti menjalankan migrasi database]
```

---

## Aturan Penting Selama Mengerjakan

1. **Jangan mengubah logika bisnis utama** — hanya perbaiki yang ada di scope task ini
2. **Jangan mengubah nama komponen, nama file, atau struktur folder**
3. **Pertahankan style code yang sudah ada** (indentation, quote style, dll.)
4. **Jika ada keraguan** tentang apakah sesuatu perlu diubah atau tidak, pilih opsi yang paling aman (minimal change)
5. **Jangan hapus komentar yang ada** kecuali komentar tersebut sudah tidak relevan karena kode di bawahnya dihapus
6. **Test secara mental setiap perubahan** — pastikan alur data dari frontend ke backend masih masuk akal setelah perubahan
7. **Untuk item yang melibatkan pengecekan database** (seperti apakah tabel `technician_settings` sudah di-drop), verifikasi dulu dengan membaca file migrasi sebelum memutuskan
