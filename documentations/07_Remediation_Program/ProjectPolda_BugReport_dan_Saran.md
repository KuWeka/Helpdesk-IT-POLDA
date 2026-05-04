# ProjectPolda — Analisis Bug, Error, dan Saran Perbaikan

Tanggal dibuat: 2026-05-04

> Dianalisis dari source code oleh: Claude (Anthropic)  
> Tanggal analisis: 3 Mei 2026  
> Versi project: Berdasarkan file VERSION & CHANGELOG terbaru

---

## Ringkasan Eksekutif

Analisis dilakukan secara menyeluruh terhadap seluruh source code frontend (`apps/web/src`) dan backend (`backend/src`), termasuk log error aktual dari direktori `backend/logs/`. Ditemukan **9 bug/error nyata yang sudah terjadi atau sangat berisiko terjadi**, ditambah sejumlah saran peningkatan teknis dan UX.

---

## BAGIAN 1 — BUG & ERROR YANG DITEMUKAN

---

### 🔴 BUG KRITIS

---

#### BUG-01 — Dashboard Subtekinfo Selalu Gagal (403 Forbidden)

**Tingkat keparahan:** Kritis — fitur utama tidak bisa digunakan  
**File:** `backend/src/routes/dashboard.js`, baris 17

**Masalah:**  
Endpoint `/api/dashboard/admin-summary` menggunakan middleware `role('Admin')`, padahal setelah migrasi revisi besar, nama role sudah diganti menjadi `Subtekinfo`. Hal yang sama juga terjadi di endpoint `/api/dashboard/stats` (baris 258).

```js
// ❌ SALAH — role 'Admin' sudah tidak ada di ENUM users.role
router.get('/admin-summary', auth, role('Admin'), async (req, res) => { ... });
router.get('/stats', auth, role('Admin'), async (req, res) => { ... });
```

**Dampak:**  
Setiap kali Subtekinfo membuka halaman dashboard (`AdminDashboard.jsx`), request ke `/api/dashboard/admin-summary` akan selalu mendapat respons 403. Halaman dashboard Subtekinfo akan tampil kosong/blank tanpa data apapun.

**Perbaikan:**
```js
// ✅ BENAR
router.get('/admin-summary', auth, role('Subtekinfo'), async (req, res) => { ... });
router.get('/stats', auth, role('Subtekinfo'), async (req, res) => { ... });
```

---

#### BUG-02 — GET /api/technicians Crash (Error 500) karena Tabel `divisions` Tidak Ada

**Tingkat keparahan:** Kritis — crash konfirmasi dari log error  
**File:** `backend/src/routes/technicians.js`, baris 22 & 65  
**Konfirmasi:** Log error `2026-05-03` — `"Table 'helpdesk_db.divisions' doesn't exist"`

**Masalah:**  
Query di route `GET /api/technicians` masih melakukan `LEFT JOIN divisions d ON u.division_id = d.id`, padahal tabel `divisions` dan kolom `division_id` sudah dihapus pada migrasi `001_revision_schema.sql`.

```sql
-- ❌ SALAH — tabel divisions sudah tidak ada
SELECT u.id, ..., d.name as division_name, ...
FROM users u
LEFT JOIN divisions d ON u.division_id = d.id  -- crash di sini
LEFT JOIN technician_settings ts ON u.id = ts.user_id
WHERE u.role = 'Teknisi'
```

**Dampak:**  
- Halaman **Kelola Teknisi** (`ManageTechniciansPage.jsx`) gagal total, daftar teknisi tidak tampil
- Modal **Assign Teknisi** di `AdminTicketDetailPage` tidak dapat memuat daftar teknisi
- Error 500 muncul di setiap request ke `/api/technicians`

Hal yang sama juga berlaku untuk endpoint `GET /api/technicians/:userId` di baris 65.

**Perbaikan:**  
Hapus semua referensi ke `divisions` dan `division_id` pada `technicians.js`:
```sql
-- ✅ BENAR
SELECT u.id, u.name, u.email, u.phone, u.role, u.is_active, u.created_at,
       ts.is_active as tech_is_active, ts.shift_start, ts.shift_end,
       ts.specializations, ts.max_active_tickets, ts.wa_notification
FROM users u
LEFT JOIN technician_settings ts ON u.id = ts.user_id
WHERE u.role = 'Teknisi'
```

---

#### BUG-03 — Registrasi User Baru Gagal dengan Error 500

**Tingkat keparahan:** Kritis — tidak ada user baru yang bisa dibuat  
**File:** `backend/src/routes/auth.js`, `backend/src/routes/users.js`  
**Konfirmasi:** Log error `2026-05-03` — `"Data truncated for column 'role' at row 1"` pada endpoint `/api/auth/register`

**Masalah:**  
Error ini muncul saat proses INSERT user baru ke database. Kemungkinan penyebab: nilai role yang dikirim tidak sesuai dengan ENUM `('Subtekinfo', 'Padal', 'Teknisi', 'Satker')` di database, atau migrasi ENUM belum dijalankan sehingga ENUM di database masih `('Admin', 'User', 'Teknisi')`.

Juga ditemukan bahwa route `GET /api/technicians/:userId` masih menggunakan `role('Admin')`:
```js
// ❌ SALAH
if (req.user.role !== 'Admin' && req.user.id !== userId) { ... }
```

**Perbaikan:**
1. Pastikan migrasi `001_revision_schema.sql` sudah dijalankan sepenuhnya
2. Perbaiki role check di `technicians.js`:
```js
// ✅ BENAR
if (req.user.role !== 'Subtekinfo' && req.user.id !== userId) { ... }
```

---

### 🟠 BUG SIGNIFIKAN

---

#### BUG-04 — `CreateTicketPage` Memanggil Endpoint `/api/divisions/:id` yang Tidak Ada

**Tingkat keparahan:** Signifikan — komponen UI rusak (error silent)  
**File:** `apps/web/src/pages/CreateTicketPage.jsx`, baris 43–47

**Masalah:**  
Halaman Buat Permohonan mencoba memuat nama divisi user dengan `api.get(`/divisions/${currentUser.division_id}`)`. Namun:
1. Tabel `divisions` sudah dihapus saat migrasi
2. Kolom `division_id` di tabel `users` juga sudah dihapus
3. Tidak ada route `/api/divisions` yang terdaftar di `server.js`

```js
// ❌ SALAH — endpoint ini tidak ada & division_id sudah tidak ada di user
if (currentUser?.division_id) {
  api.get(`/divisions/${currentUser.division_id}`)
    .then(({ data }) => setUserDivision(data?.name || 'Unknown'))
    .catch(() => setUserDivision('Unknown'));
}
```

**Dampak:**  
Field "Divisi" pada form Buat Permohonan selalu menampilkan `'-'` atau `'Unknown'`. Tampilan tidak crash karena error ditangkap dengan `.catch()`, tapi data tidak akurat.

**Perbaikan:**  
Hapus logic fetch divisi karena kolom `division_id` sudah tidak ada. Tampilkan nilai dari field lain atau hapus kolom "Divisi" dari info pelapor:
```js
// ✅ BENAR — hapus block ini
useEffect(() => {
  setUserDivision('-'); // atau hapus field divisi sama sekali
}, []);
```

---

#### BUG-05 — `AdminTicketDetailPage` Mengecek Role `'Admin'` yang Sudah Tidak Ada

**Tingkat keparahan:** Signifikan — tombol aksi tidak pernah tampil  
**File:** `apps/web/src/pages/admin/AdminTicketDetailPage.jsx`, baris 89 & 170

**Masalah:**  
Dua kondisi kritis menggunakan role `'Admin'` yang sudah tidak ada. Setelah login sebagai Subtekinfo, `currentUser.role` akan bernilai `'Subtekinfo'`, bukan `'Admin'`.

```js
// ❌ SALAH
if (currentUser?.role === 'Admin') {   // baris 89 - fetchTechnicians tidak akan dipanggil
  fetchTechnicians();
}

const isAdmin = currentUser?.role === 'Admin';  // baris 170 - selalu false
// ...
{isAdmin && (   // tombol "Assign Teknisi", "Force Complete", "Delete" tidak pernah muncul
  <div>...</div>
)}
```

**Dampak:**  
Di halaman detail tiket (`/subtekinfo/tickets/:id`), Subtekinfo tidak bisa melihat tombol apapun (Assign, Complete, Delete) karena `isAdmin` selalu `false`.

**Perbaikan:**
```js
// ✅ BENAR
if (currentUser?.role === 'Subtekinfo') {
  fetchTechnicians();
}
const isAdmin = currentUser?.role === 'Subtekinfo';
```

---

#### BUG-06 — Redis Cache `DEL BY PATTERN` Gagal Secara Berkala

**Tingkat keparahan:** Signifikan — data dashboard stale / tidak terupdate  
**File:** `backend/src/utils/cache.js`, baris 132–145  
**Konfirmasi:** Log error — `"Redis DEL BY PATTERN error"` dengan pesan `"ERR wrong number of arguments for 'del' command"`

**Masalah:**  
Fungsi `delByPattern` menggunakan `this.client.del(key)` untuk setiap key yang ditemukan via `scanIterator`. Pada versi Redis/redis-client tertentu, fungsi `del()` dipanggil dengan string tunggal tetapi diinterpretasikan berbeda.

```js
// ❌ Bermasalah di beberapa versi redis client
for await (const key of this.client.scanIterator(...)) {
  await this.client.del(key); // error pada kondisi tertentu
}
```

**Dampak:**  
Saat invalidasi cache dashboard dilakukan (misalnya setelah tiket diupdate), cache lama bisa saja tidak terhapus. Dashboard Padal bisa menampilkan data yang tidak terupdate.

**Perbaikan:**
```js
// ✅ Lebih robust
for await (const key of this.client.scanIterator({ MATCH: pattern, COUNT: 100 })) {
  await this.client.del([key]); // kirim sebagai array
}
```

---

### 🟡 BUG MINOR / POTENSIAL

---

#### BUG-07 — Laporan Padal Menggunakan `DATE_FORMAT(updated_at)` bukan `created_at`

**Tingkat keparahan:** Minor — data laporan tidak akurat  
**File:** `backend/src/routes/reports.js`, fungsi `reportPadal`

**Masalah:**  
Query ringkasan dan daftar tiket untuk laporan Padal menggunakan filter `DATE_FORMAT(t.updated_at, '%Y-%m') = ?`, artinya tiket yang dibuat bulan ini tapi diupdate bulan lalu tidak akan masuk laporan, dan tiket bulan lalu yang baru saja diupdate justru ikut terhitung.

```sql
-- ❌ Tidak konsisten — filter berdasarkan updated_at, bukan created_at
WHERE t.padal_id = ? AND DATE_FORMAT(t.updated_at, '%Y-%m') = ?
```

**Perbaikan:**  
Pertimbangkan menggunakan `created_at` untuk konsistensi dengan laporan Satker, atau tambahkan keterangan di UI bahwa laporan Padal berdasarkan tanggal update.

---

#### BUG-08 — Rating: Teknisi Bisa Submit Rating Tiket Milik Satker Lain

**Tingkat keparahan:** Minor — logika bisnis berpotensi abuse  
**File:** `backend/src/routes/tickets.js`, baris 584 & 141

**Masalah:**  
Route `POST /api/tickets/:id/rating` dan `GET /api/tickets/pending-rating` mengizinkan role `'Teknisi'` untuk ikut dalam alur rating. Namun query di `/pending-rating` hanya mengecek `t.user_id = ?` (user yang melapor), artinya Teknisi akan mendapat daftar tiket milik dirinya sebagai Satker — ini inkonsisten karena Teknisi bersifat read-only dan tidak punya tiket.

Di sisi lain, jika ada Teknisi yang juga punya akun Satker dan bisa buat tiket (backend mengizinkan ini), alur rating bisa tumpang tindih.

---

#### BUG-09 — `UserDashboard` Tidak Menampilkan Data division

**Tingkat keparahan:** Minor — UI menampilkan data kosong  
**File:** `apps/web/src/pages/UserDashboard.jsx`

**Masalah:**  
Sama dengan BUG-04, `UserDashboard` juga bisa mencoba mengambil data divisi dari `currentUser.division_id` yang sudah tidak ada. Meskipun tidak crash, beberapa elemen UI mungkin tampil kosong.

---

## BAGIAN 2 — SARAN PERBAIKAN & PENINGKATAN

---

### 📋 PRIORITAS TINGGI

---

#### SARAN-01 — Jalankan Migrasi Database yang Tertunda

File migrasi `backend/sql/migrations/20260421_add_category_to_tickets.sql` belum tentu sudah dijalankan (hanya menambahkan kolom `category`). Pastikan seluruh migrasi dieksekusi secara berurutan, termasuk `001_revision_schema.sql`.

**Langkah:**
```bash
# Jalankan migrasi secara berurutan
mysql -u root -p helpdesk_db < backend/migrations/001_revision_schema.sql
mysql -u root -p helpdesk_db < backend/sql/migrations/20260421_add_category_to_tickets.sql
```

---

#### SARAN-02 — Tambahkan Field Kategori di Form Buat Permohonan

Saat ini `CreateTicketPage.jsx` mengirim `category: 'Umum'` secara hardcoded. Kolom `category` sudah ada di database (hasil migrasi), tapi tidak diekspos ke user.

**Implementasi:** Tambahkan dropdown atau radio group kategori di form dengan pilihan yang relevan (misalnya: Jaringan, Hardware, Software, Akses Sistem, Lainnya). Ini akan meningkatkan kualitas data laporan bulanan.

---

#### SARAN-03 — Validasi Role Lebih Ketat di Frontend saat Sign Up

Halaman Sign Up tidak menampilkan field role, sehingga semua user baru secara default menjadi `Satker`. Ini sudah benar untuk self-registration publik. Namun perlu dipastikan tidak ada celah di mana seseorang bisa mendaftar sebagai `Subtekinfo` langsung dari form publik.

**Rekomendasi:** Tambahkan whitelist role yang boleh didaftarkan sendiri:
```js
// Di authSchemas.register, batasi role yang diizinkan untuk self-registration
role: Joi.string().valid('Satker').default('Satker') // hanya Satker
```
Role Padal, Teknisi, dan Subtekinfo hanya boleh dibuat oleh Subtekinfo lewat `/api/users`.

---

### 📋 PRIORITAS MENENGAH

---

#### SARAN-04 — Tambahkan Tombol "Tolak Tiket" di `AdminTicketDetailPage`

`RejectTicketModal` sudah dibuat dan digunakan di `AllTicketsPage`, tapi **tidak diimplementasikan** di halaman detail tiket Subtekinfo (`AdminTicketDetailPage`). Ini menyebabkan inkonsistensi: penolakan hanya bisa dilakukan dari halaman daftar, tidak dari halaman detail.

**Implementasi:** Import dan gunakan `RejectTicketModal` di `AdminTicketDetailPage`, mirip dengan cara `AllTicketsPage` menggunakannya.

---

#### SARAN-05 — Perbaiki Alur Assign di `AdminTicketDetailPage`

Saat ini `AdminTicketDetailPage` menggunakan `PATCH /tickets/:id` dengan field `assigned_technician_id` untuk assign. Tapi sistem baru sudah punya endpoint khusus `POST /tickets/:id/assign` yang menangani flow `pending_confirm → accepted` via table `ticket_assignments`. 

Kedua mekanisme ini bekerja secara paralel dan tidak konsisten. Rekomendasinya adalah mengganti tombol "Assign Teknisi" di `AdminTicketDetailPage` menjadi **"Assign Padal"** menggunakan `AssignPadalModal` yang sudah ada, supaya alur notifikasi dan konfirmasi Padal berjalan dengan benar.

---

#### SARAN-06 — Tambahkan Skeleton/Loading State di `ManageTechniciansPage`

Saat `GET /api/technicians` gagal (seperti saat ini akibat BUG-02), halaman langsung menampilkan toast error tanpa state fallback yang informatif. Setelah bug diperbaiki, pastikan ada empty state yang jelas jika daftar teknisi kosong.

---

#### SARAN-07 — Hapus Referensi `technician_settings` dari `technicians.js`

File `001_revision_schema.sql` menjatuhkan tabel `technician_settings` pada Langkah 1:
```sql
DROP TABLE IF EXISTS technician_settings;
```

Namun `backend/src/routes/technicians.js` masih melakukan `LEFT JOIN technician_settings ts ON u.id = ts.user_id`. Ini tidak akan crash (karena `LEFT JOIN` akan return NULL jika tabel tidak ada — **salah**, ini akan crash jika tabel benar-benar dihapus).

**Verifikasi terlebih dahulu** apakah `technician_settings` sudah di-drop atau belum. Jika sudah, hapus semua JOIN dan kolom terkait (`ts.is_active`, `ts.shift_start`, dll.) dari query.

---

### 📋 SARAN UMUM & JANGKA PANJANG

---

#### SARAN-08 — Implementasi Migration Runner Otomatis

Saat ini migrasi harus dijalankan manual via `mysql -u...`. Pertimbangkan menggunakan migration runner sederhana yang sudah ada di `backend/scripts/migrate.js` dan memastikannya dieksekusi saat startup dev.

---

#### SARAN-09 — Perbaiki Error Message yang Tidak Informatif

Beberapa tempat masih menggunakan error message generik:
```js
toast.error('Gagal mengassign teknisi: ' + (error.response?.message || error.message));
// ⚠️ error.response adalah object, bukan string — .message tidak akan terbaca
```

Seharusnya:
```js
toast.error('Gagal mengassign teknisi: ' + (error.response?.data?.message || error.message));
```

Temuan ini ada di `AdminTicketDetailPage.jsx` baris 145 dan beberapa tempat lain.

---

#### SARAN-10 — Tambahkan Guard di `RatingPage` untuk Cegah Double-Submit

Saat ini `RatingPage` tidak mengecek apakah tiket yang muncul di `pending-rating` adalah tiket yang sama dengan `?ticket_id` di URL. Jika user mengakses `/satker/rating?ticket_id=ABC` tapi endpoint `/pending-rating` mengembalikan tiket XYZ (yang pending lebih lama), rating akan dikirim ke tiket XYZ, bukan ABC. Ini bisa membingungkan user.

**Rekomendasi:** Jika `redirectTicketId` ada, prioritaskan fetch untuk tiket spesifik itu.

---

#### SARAN-11 — Pertimbangkan Konfirmasi Sebelum "Batalkan Permohonan"

Di `TicketDetailPage.jsx`, pembatalan tiket menggunakan `window.confirm()` bawaan browser yang tidak konsisten dengan desain UI/UX aplikasi yang sudah menggunakan shadcn `AlertDialog`. Ganti dengan `AlertDialog` untuk pengalaman yang lebih konsisten.

---

#### SARAN-12 — Tambahkan Auto-Refresh atau Socket Event di Dashboard Subtekinfo

Dashboard Subtekinfo saat ini hanya fetch data satu kali saat komponen mount. Jika ada tiket baru masuk (via socket `ticket:new`), counter di dashboard tidak akan terupdate kecuali user refresh manual. Pertimbangkan mendengarkan event socket `ticket:new` di `AdminDashboard.jsx` dan trigger `fetchDashboardData()` ulang.

---

## BAGIAN 3 — REKAP PRIORITAS

| No | Jenis | Deskripsi Singkat | Prioritas |
|----|-------|-------------------|-----------|
| BUG-01 | 🔴 Kritis | Dashboard Subtekinfo 403 karena role('Admin') | Segera |
| BUG-02 | 🔴 Kritis | `/api/technicians` crash — tabel divisions hilang | Segera |
| BUG-03 | 🔴 Kritis | Registrasi user gagal 500 — role truncation | Segera |
| BUG-04 | 🟠 Signifikan | `/api/divisions/:id` dipanggil tapi tidak ada | Tinggi |
| BUG-05 | 🟠 Signifikan | `AdminTicketDetailPage` cek role 'Admin' (harus 'Subtekinfo') | Tinggi |
| BUG-06 | 🟠 Signifikan | Redis cache del pattern gagal | Menengah |
| BUG-07 | 🟡 Minor | Laporan Padal filter updated_at tidak konsisten | Rendah |
| BUG-08 | 🟡 Minor | Teknisi bisa ikut alur rating | Rendah |
| BUG-09 | 🟡 Minor | UserDashboard referensi division_id yang tidak ada | Rendah |
| SARAN-01 | 📋 | Jalankan migrasi yang tertunda | Segera |
| SARAN-02 | 📋 | Tambahkan field kategori di form buat tiket | Menengah |
| SARAN-03 | 📋 | Batasi role di self-registration | Tinggi |
| SARAN-04 | 📋 | Tambahkan tombol Tolak di detail tiket | Menengah |
| SARAN-05 | 📋 | Konsistensi alur Assign Padal | Menengah |
| SARAN-06–12 | 📋 | Peningkatan lainnya | Rendah–Menengah |

---

## CATATAN PENTING

Semua BUG-01 sampai BUG-05 kemungkinan besar terjadi **akibat migrasi revisi besar yang belum diselesaikan sepenuhnya** — yaitu perubahan nama role (`Admin → Subtekinfo`, dst.) dan penghapusan tabel `divisions`. Source code backend masih banyak yang menggunakan nama lama. Pastikan pencarian global dilakukan untuk semua kemunculan string `'Admin'` dan `divisions` di dalam kode backend sebelum deployment.

```bash
# Cari semua sisa referensi role lama di backend
grep -rn "'Admin'" backend/src/
grep -rn "divisions" backend/src/
grep -rn "division_id" backend/src/
grep -rn "technician_settings" backend/src/
```
