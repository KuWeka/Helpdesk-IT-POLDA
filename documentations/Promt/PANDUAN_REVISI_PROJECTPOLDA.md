# PANDUAN REVISI SISTEM

Tanggal dibuat: 2026-05-04

## ProjectPolda — IT Helpdesk Ticket Management
**Panduan Teknis Lengkap untuk GitHub Copilot**

> Versi Dokumen: 1.0 | Status: Final | Tanggal: Mei 2026

---

## DAFTAR ISI

- [Bagian 0 — Prompt untuk GitHub Copilot](#bagian-0--prompt-untuk-github-copilot)
- [Bagian 1 — Gambaran Sistem Sebelum Revisi](#bagian-1--gambaran-sistem-sebelum-revisi)
- [Bagian 2 — Sistem Setelah Revisi](#bagian-2--sistem-setelah-revisi)
- [Bagian 3 — Perubahan Database](#bagian-3--perubahan-database-helpdesk_db)
- [Bagian 4 — Perubahan Backend & API](#bagian-4--perubahan-backend--api)
- [Bagian 5 — Perubahan Frontend](#bagian-5--perubahan-frontend)
- [Bagian 6 — Sesi Pengerjaan](#bagian-6--sesi-pengerjaan-terurut-prioritas)
- [Bagian 7 — Hal yang Belum Final](#bagian-7--hal-yang-belum-final-perlu-konfirmasi)
- [Bagian 8 — Checklist Pengerjaan](#bagian-8--checklist-pengerjaan)

---

## BAGIAN 0 — PROMPT UNTUK GITHUB COPILOT

Salin prompt berikut dan paste ke **GitHub Copilot Chat (`@workspace`)** di awal setiap sesi pengerjaan revisi:

---

```
@workspace

Kamu sedang membantu merevisi sistem ProjectPolda, yaitu sistem IT Helpdesk Ticket Management berbasis web.

Stack teknologi: Node.js + Express (backend), React + Vite (frontend), MySQL (database), Socket.IO (realtime), Redis (cache).

Sebelum mulai, baca dan pahami dokumen panduan revisi berikut yang ada di workspace ini:
- PANDUAN_REVISI_PROJECTPOLDA.md — Dokumen teknis lengkap berisi semua perubahan yang harus dilakukan,
  perubahan database, perubahan API, perubahan frontend, dan sesi pengerjaan yang terurut.

Ringkasan revisi yang akan dikerjakan:
1. Restrukturisasi 3 role lama (Admin, Teknisi, User) menjadi 4 role baru: Subtekinfo, Padal, Teknisi (read-only), dan Satker.
2. Penghapusan fitur urgensi secara menyeluruh dari seluruh sistem (DB, API, frontend).
3. Penghapusan tabel divisions, chats, messages, dan technician_settings dari database.
4. Penambahan tabel baru: ticket_ratings, ticket_assignments, padal_shifts.
5. Alur assign tiket baru: Subtekinfo assign ke Padal, Padal konfirmasi (terima/tolak).
6. Sistem rating wajib: Satker wajib rating sebelum bisa buat tiket baru.
7. Penolakan tiket dengan alasan wajib oleh Subtekinfo + notifikasi Socket.IO.
8. Laporan bulanan per role (Satker, Padal, Subtekinfo) dengan export Excel dan PDF.
9. Chat internal dihapus, diganti tombol WA ke nomor Subtekinfo.

Ikuti urutan sesi yang ada di dokumen. Jangan mengubah apapun di luar scope sesi yang sedang dikerjakan.
Tanyakan jika ada yang ambigu sebelum mengubah kode.

Sesi yang ingin dikerjakan sekarang: [TULIS NOMOR SESI DI SINI, contoh: Sesi 1]
```

---

> **Catatan:** Setelah paste prompt di atas, ganti `[TULIS NOMOR SESI DI SINI]` dengan sesi yang ingin dikerjakan, contoh: `Sesi 1`.

---

## BAGIAN 1 — GAMBARAN SISTEM SEBELUM REVISI

### 1.1 Stack Teknologi

| Komponen | Teknologi | Keterangan |
|---|---|---|
| Backend | Node.js + Express | REST API, middleware auth, role, validation |
| Frontend | React + Vite | SPA, React Router, shadcn/ui, Tailwind CSS |
| Database | MySQL (helpdesk_db) | Query manual via mysql2/promise |
| Realtime | Socket.IO | Chat user-teknisi, notifikasi tiket |
| Cache | Redis | Dashboard cache, warmup, rate limiter |
| Auth | JWT | Access token 1 jam + refresh token 7 hari |

### 1.2 Role Sistem Lama

| Role Lama | Akses Utama |
|---|---|
| Admin | Kelola semua tiket, kelola user & teknisi, monitoring chat, log aktivitas, settings |
| Teknisi | Ambil tiket dari antrian, update status, catatan internal, chat dengan user, toggle aktif |
| User | Buat tiket (dengan urgensi), lihat tiket sendiri, chat dengan teknisi, edit profil |

### 1.3 Struktur Database Lama (Tabel Relevan)

| Tabel | Status Setelah Revisi |
|---|---|
| `divisions` | **DIHAPUS** — tidak dipakai lagi |
| `users` | **DIMODIFIKASI** — role enum diperluas |
| `technician_settings` | **DIHAPUS & DIGANTI** — diganti tabel `padal_shifts` |
| `tickets` | **DIMODIFIKASI** — hapus urgency, tambah kolom baru |
| `ticket_attachments` | TETAP |
| `ticket_notes` | TETAP |
| `chats` | **DIHAPUS** — chat diganti ke WhatsApp |
| `messages` | **DIHAPUS** — chat diganti ke WhatsApp |
| `activity_logs` | TETAP |
| `system_settings` | TETAP |
| `ticket_ratings` | **DITAMBAH** — tabel baru untuk rating wajib |
| `ticket_assignments` | **DITAMBAH** — tabel baru untuk alur assign Padal |
| `padal_shifts` | **DITAMBAH** — pengganti `technician_settings` untuk manajemen shift Padal |

---

## BAGIAN 2 — SISTEM SETELAH REVISI

### 2.1 Pemetaan Role Baru

| Role Lama | Role Baru | Keterangan |
|---|---|---|
| Admin | **Subtekinfo** | Kelola tiket, assign Padal, laporan bulanan, tolak tiket |
| Teknisi | **Padal** | Perwira Pengendali — terima assign, update status, laporan bulanan |
| *(tidak ada)* | **Teknisi** *(baru)* | Read-only — hanya bisa lihat list & detail tiket, tidak ada aksi |
| User | **Satker** | Buat tiket, wajib rating, chat WA, laporan tiket sendiri |

### 2.2 Alur Tiket Baru (End-to-End)

1. **Satker** membuat tiket (tanpa field urgensi). Jika ada tiket selesai yang belum dirating, sistem memblokir dan redirect ke halaman rating terlebih dahulu.
2. Tiket masuk dengan status **Pending**. Notifikasi Socket.IO dikirim ke semua Subtekinfo yang online (`ticket:new`).
3. **Subtekinfo** membuka halaman tiket, memilih tiket Pending, klik "Assign Padal". Muncul modal berisi daftar Padal (yang sedang shift aktif tampil di atas).
4. Notifikasi Socket.IO dikirim ke Padal yang dipilih: `ticket:assigned`.
5. **Padal** menerima notifikasi dan memilih: **Terima** atau **Tolak**.
6. Jika **Padal Terima**: status tiket berubah ke **Proses**. Subtekinfo mendapat konfirmasi (`ticket:assignment_responded`).
7. Jika **Padal Tolak**: tiket kembali ke **Pending**. Subtekinfo mendapat notifikasi dan bisa assign ulang ke Padal lain. Baris penolakan tersimpan di tabel `ticket_assignments`.
8. Padal menugaskan Teknisi secara **offline** (di luar sistem). Padal mengerjakan dan update status tiket ke **Selesai**.
9. Notifikasi Socket.IO dikirim ke Satker: `ticket:rating_required`.
10. **Satker** memberi rating (1–5: Sangat Buruk / Buruk / Cukup Baik / Baik / Sangat Baik). Rating tersimpan di tabel `ticket_ratings`.

### 2.3 Hak Akses Per Role (Setelah Revisi)

#### Satker *(sebelumnya: User)*

| Menu / Fitur | Keterangan |
|---|---|
| Dashboard | Ringkasan tiket sendiri (pending, proses, selesai) + trend chart |
| Buat Tiket | Judul, deskripsi, lokasi, lampiran — **TANPA field urgensi**. Diblokir jika ada tiket selesai yang belum dirating. |
| Tiket Saya | Lihat semua tiket sendiri. Bisa **edit** (hanya saat Pending) dan **batalkan** tiket. |
| Rating | Muncul otomatis (redirect paksa) saat ada tiket selesai yang belum dirating. 5 pilihan rating. |
| Chat (WA) | Tombol yang membuka WhatsApp ke nomor Subtekinfo. **Bukan chat internal.** |
| Laporan Bulanan | Ringkasan tiket sendiri per bulan. Download Excel & PDF. |
| Pengaturan Akun | Ubah profil dan password. |

#### Subtekinfo *(sebelumnya: Admin)*

| Menu / Fitur | Keterangan |
|---|---|
| Dashboard | Statistik seluruh tiket, chart, SLA compliance, aging. Widget urgensi **DIHAPUS**. |
| Semua Tiket | Lihat, filter, cari semua tiket. Aksi: **Assign Padal**, **Tolak** (wajib alasan), **Batalkan** (wajib alasan), **Hapus**. |
| Manajemen Padal & Teknisi | Tidak ada manajemen Satker. Khusus list Padal (aktif di atas, tidak aktif di bawah) + Teknisi. Detail Padal menampilkan anggota Teknisi-nya. |
| Manajemen Shift Padal | Atur tanggal shift Padal (mulai–selesai). Status aktif/nonaktif otomatis berdasarkan tanggal. |
| Monitoring & Log | Log aktivitas sistem. Chat monitoring **DIHAPUS** (tidak ada chat internal). |
| Laporan Bulanan | Rekap seluruh sistem: tiket masuk/selesai/ditolak, performa per Padal, ranking Satker, daftar tiket ditolak, rata-rata waktu penyelesaian. Download Excel & PDF. |
| Pengaturan Sistem | Nama aplikasi, deskripsi, mode maintenance, **nomor WA Subtekinfo** (baru). |

#### Padal / Perwira Pengendali *(sebelumnya: Teknisi)*

| Menu / Fitur | Keterangan |
|---|---|
| Dashboard | Statistik harian dan chart penyelesaian tiket. |
| Antrian Tiket (Pending) | Lihat semua tiket pending. **TIDAK bisa ambil sendiri** — harus di-assign Subtekinfo. |
| Tiket Saya (Proses) | Tiket yang di-assign ke dirinya. Bisa update status ke **Selesai**, bisa **batalkan** tiket yang sedang dikerjakan. |
| Tiket Selesai | Hanya tiket yang pernah dikerjakan olehnya. |
| Konfirmasi Assign | Notifikasi masuk saat di-assign. Bisa pilih **Terima** atau **Tolak** (dengan alasan opsional). |
| Laporan Bulanan | Total tiket dikerjakan bulan itu + daftar tiket + rating yang diterima. Download Excel & PDF. |
| Pengaturan Akun | Ubah profil dan password. **TIDAK ada** toggle status ketersediaan. |

#### Teknisi *(role baru, read-only)*

| Menu / Fitur | Keterangan |
|---|---|
| Tiket Pending | Lihat list dan detail. **Tidak ada aksi apapun.** |
| Tiket Proses | Lihat list dan detail. **Tidak ada aksi apapun.** |
| Tiket Selesai | Lihat list dan detail. **Tidak ada aksi apapun.** |
| Menu lain | Tidak ada. Seluruh antarmuka read-only. |

---

## BAGIAN 3 — PERUBAHAN DATABASE (helpdesk_db)

### 3.1 Tabel yang DIHAPUS

| Tabel | Alasan Dihapus |
|---|---|
| `divisions` | Konsep divisi tidak dipakai di sistem baru |
| `chats` | Chat internal diganti ke WhatsApp |
| `messages` | Chat internal diganti ke WhatsApp |
| `technician_settings` | Diganti oleh tabel `padal_shifts` yang lebih sesuai |

**Urutan DROP yang benar (perhatikan FK constraint):**
```sql
DROP TABLE IF EXISTS messages;
DROP TABLE IF EXISTS chats;
DROP TABLE IF EXISTS technician_settings;
ALTER TABLE users DROP FOREIGN KEY fk_users_division; -- sesuaikan nama FK
ALTER TABLE users DROP COLUMN division_id;
DROP TABLE IF EXISTS divisions;
```

### 3.2 Tabel yang DIMODIFIKASI

#### Tabel: `users`

```sql
-- 1. Perluas ENUM role
ALTER TABLE users
  MODIFY COLUMN role ENUM('Subtekinfo','Padal','Teknisi','Satker') NOT NULL;

-- 2. Hapus FK dan kolom division_id
ALTER TABLE users DROP FOREIGN KEY fk_users_division; -- sesuaikan nama FK
ALTER TABLE users DROP COLUMN division_id;

-- 3. Migrasi data role lama ke role baru
UPDATE users SET role = 'Subtekinfo' WHERE role = 'Admin';
UPDATE users SET role = 'Padal'      WHERE role = 'Teknisi';
UPDATE users SET role = 'Satker'     WHERE role = 'User';
```

#### Tabel: `tickets`

```sql
-- 1. Hapus kolom urgency
ALTER TABLE tickets DROP COLUMN urgency;

-- 2. Tambah kolom rejection_reason
ALTER TABLE tickets
  ADD COLUMN rejection_reason TEXT NULL AFTER status;

-- 3. Tambah kolom padal_id (FK ke users)
ALTER TABLE tickets
  ADD COLUMN padal_id VARCHAR(36) NULL;

ALTER TABLE tickets
  ADD CONSTRAINT fk_tickets_padal
  FOREIGN KEY (padal_id) REFERENCES users(id) ON DELETE SET NULL;

-- 4. Pastikan status enum sudah lengkap
ALTER TABLE tickets
  MODIFY COLUMN status ENUM('Pending','Proses','Selesai','Ditolak','Dibatalkan') DEFAULT 'Pending';

-- 5. Hapus index urgency jika ada
DROP INDEX idx_urgency ON tickets; -- jalankan hanya jika index tersebut ada
```

### 3.3 Tabel yang DITAMBAHKAN

#### Tabel baru: `ticket_ratings`

```sql
CREATE TABLE ticket_ratings (
  id         VARCHAR(36) PRIMARY KEY,       -- UUID v4
  ticket_id  VARCHAR(36)  NOT NULL,
  satker_id  VARCHAR(36)  NOT NULL,
  padal_id   VARCHAR(36)  NOT NULL,
  rating     TINYINT      NOT NULL CHECK (rating BETWEEN 1 AND 5),
  -- 1=Sangat Buruk, 2=Buruk, 3=Cukup Baik, 4=Baik, 5=Sangat Baik
  created_at TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE,
  FOREIGN KEY (satker_id) REFERENCES users(id)   ON DELETE CASCADE,
  FOREIGN KEY (padal_id)  REFERENCES users(id)   ON DELETE CASCADE,
  INDEX idx_rating_satker (satker_id),
  INDEX idx_rating_padal  (padal_id)
);
```

#### Tabel baru: `ticket_assignments`

```sql
CREATE TABLE ticket_assignments (
  id           VARCHAR(36) PRIMARY KEY,     -- UUID v4
  ticket_id    VARCHAR(36) NOT NULL,
  padal_id     VARCHAR(36) NOT NULL,
  assigned_by  VARCHAR(36) NOT NULL,        -- FK ke Subtekinfo
  status       ENUM('pending_confirm','accepted','rejected') DEFAULT 'pending_confirm',
  reject_note  TEXT        NULL,            -- Alasan Padal menolak (opsional)
  created_at   TIMESTAMP   DEFAULT CURRENT_TIMESTAMP,
  responded_at TIMESTAMP   NULL,
  FOREIGN KEY (ticket_id)   REFERENCES tickets(id) ON DELETE CASCADE,
  FOREIGN KEY (padal_id)    REFERENCES users(id)   ON DELETE CASCADE,
  FOREIGN KEY (assigned_by) REFERENCES users(id)   ON DELETE CASCADE,
  INDEX idx_assign_ticket (ticket_id),
  INDEX idx_assign_padal  (padal_id)
);
```

> **Catatan:** Simpan semua baris assign meski sudah ditolak atau dibatalkan. Berguna untuk audit trail.

#### Tabel baru: `padal_shifts`

```sql
CREATE TABLE padal_shifts (
  id          VARCHAR(36) PRIMARY KEY,      -- UUID v4
  padal_id    VARCHAR(36) NOT NULL UNIQUE,
  shift_start DATE        NOT NULL,         -- Tanggal mulai shift
  shift_end   DATE        NOT NULL,         -- Tanggal akhir shift
  is_active   BOOLEAN GENERATED ALWAYS AS (
                CURDATE() BETWEEN shift_start AND shift_end
              ) VIRTUAL,                    -- Otomatis aktif berdasarkan tanggal
  notes       TEXT        NULL,
  created_at  TIMESTAMP   DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP   DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (padal_id) REFERENCES users(id) ON DELETE CASCADE
);
```

> **Catatan:** Kolom `is_active` bersifat **VIRTUAL (generated)** — otomatis dihitung dari tanggal hari ini vs `shift_start` dan `shift_end`. Tidak perlu update manual.

---

## BAGIAN 4 — PERUBAHAN BACKEND & API

### 4.1 Middleware Role

**File:** `backend/src/middleware/role.js`

- Tidak ada perubahan logika. Yang berubah adalah nilai role yang valid.
- Semua route yang tadinya menggunakan `role('Admin')` diperbarui ke `role('Subtekinfo')`.
- Semua route yang tadinya menggunakan `role('Teknisi')` diperbarui ke `role('Padal')`.
- Route untuk Teknisi read-only baru menggunakan `role('Teknisi')`.

### 4.2 Validation Schemas

**File:** `backend/src/utils/validationSchemas.js`

| Yang Diubah | Detail |
|---|---|
| `patterns.role` | Ubah dari `valid('Admin','Teknisi','User')` menjadi `valid('Subtekinfo','Padal','Teknisi','Satker')` |
| `patterns.urgency` | **HAPUS** seluruh definisi `patterns.urgency` |
| `ticketSchemas.create` | Hapus field `urgency` dari schema |
| `ticketSchemas.list` | Hapus field `urgency` dari query params schema |
| `ticketSchemas.update` | Hapus field `urgency` dari schema update |
| `ratingSchema` *(baru)* | `{ rating: Joi.number().integer().min(1).max(5).required() }` |
| `assignSchema` *(baru)* | `{ padal_id: Joi.string().uuid().required() }` |
| `rejectSchema` *(baru)* | `{ reason: Joi.string().min(5).max(1000).required() }` |

### 4.3 Endpoint Tickets

**File:** `backend/src/routes/tickets.js`

| Endpoint | Perubahan |
|---|---|
| `GET /api/tickets` | Hapus filter `urgency` dari query. Update role logic: `'User'→'Satker'`, `'Teknisi'→'Padal'/'Teknisi'`. Padal hanya lihat tiket assigned ke dirinya. Teknisi lihat semua (read-only). |
| `POST /api/tickets` | Hapus field `urgency` dari INSERT. Tambah **middleware cek rating pending** sebelum buat tiket: cek `ticket_ratings JOIN tickets WHERE status='Selesai' AND satker_id=req.user.id`. Jika ada yang belum dirating, return `403` dengan `{ pendingRating: true, ticket_id }`. |
| `GET /api/tickets/summary` | Hapus `urgency` query. Hapus `urgent_count` dari response. Update role checks (`User→Satker`, `Teknisi→Padal`). |
| `PATCH /api/tickets/:id` | Tambah validasi role-based: Padal hanya bisa update status tiket miliknya (yang di-assign ke dirinya). Subtekinfo bisa update semua. |
| `DELETE /api/tickets/:id` | Update role: `role('Admin')` → `role('Subtekinfo','Padal')`. Padal juga bisa hapus tiket yang di-assign ke dirinya. |
| `POST /api/tickets/:id/notes` | Update role: `role('Admin','Teknisi')` → `role('Subtekinfo','Padal')`. |
| `POST /api/tickets/:id/rating` *(baru)* | Hanya Satker. Validasi: tiket harus berstatus Selesai dan milik Satker tsb. Insert ke `ticket_ratings`. Emit `ticket:rating_received` ke Padal. |
| `POST /api/tickets/:id/reject` *(baru)* | Hanya Subtekinfo. Body wajib `{ reason }`. Update status tiket ke `'Ditolak'`, simpan `rejection_reason`. Emit `ticket:status_changed` ke Satker. |
| `POST /api/tickets/:id/assign` *(baru)* | Hanya Subtekinfo. Body: `{ padal_id }`. Insert ke `ticket_assignments` (status `pending_confirm`). Update `tickets.padal_id`. Emit `ticket:assigned` ke Padal. |
| `DELETE /api/tickets/:id/assign` *(baru)* | Hanya Subtekinfo. Hapus assignment aktif. Tiket kembali ke Pending. Clear `padal_id` di `tickets`. |
| `PATCH /api/tickets/:id/assignment/respond` *(baru)* | Hanya Padal. Body: `{ accepted: bool, note?: string }`. Jika accepted: update assignment ke `accepted`, tiket ke `Proses`. Jika tidak: update ke `rejected`, tiket ke `Pending`, emit ke Subtekinfo. |

### 4.4 Endpoint Laporan (Baru)

**Buat file baru:** `backend/src/routes/reports.js`

| Endpoint | Akses | Keterangan |
|---|---|---|
| `GET /api/reports/monthly` | Semua role (scope sesuai role) | Query: `month`, `year`. Satker: tiket sendiri. Padal: tiket yang dikerjakan + rating. Subtekinfo: seluruh sistem. |
| `GET /api/reports/monthly/export` | Semua role | Query: `format=xlsx` atau `format=pdf`, `month`, `year`. Generate dan stream file ke client. |

**Isi laporan per role:**

- **Satker:** Ringkasan tiket per status bulan itu, daftar tiket (nomor, judul, tanggal, status akhir, nama Padal), daftar rating yang pernah diberikan.
- **Padal:** Total tiket dikerjakan, daftar tiket, rating yang diterima bulan itu.
- **Subtekinfo:** Total masuk/selesai/ditolak/dibatalkan, performa per Padal (jumlah tiket), ranking Satuan Kerja, daftar tiket ditolak + alasan, rata-rata waktu penyelesaian.

### 4.5 Endpoint Users

**File:** `backend/src/routes/users.js`

| Yang Diubah | Detail |
|---|---|
| `GET /api/users` | Hapus filter `role='Admin'`. Tambah support filter `role='Padal','Teknisi','Satker','Subtekinfo'`. |
| `POST /api/users` | Update role validation ke role baru. Hapus FK `division_id` dari INSERT. |
| Hapus endpoint `technician_settings` | Endpoint yang mengacu `technician_settings` dihapus atau direfactor ke `/api/padal-shifts/*`. |
| `GET /api/padal-shifts` *(baru)* | Hanya Subtekinfo. List semua Padal beserta data shift dan status aktif. |
| `PUT /api/padal-shifts/:padal_id` *(baru)* | Hanya Subtekinfo. Update `shift_start`, `shift_end`, `notes` untuk Padal tertentu. |

### 4.6 Socket.IO Events Baru

**File:** `backend/src/socket/index.js`

| Event | Dari | Ke | Payload |
|---|---|---|---|
| `ticket:new` | Server | Room: `subtekinfo` | `{ ticket_id, ticket_number, title, satker_name, created_at }` |
| `ticket:assigned` | Server | User: `padal_id` | `{ ticket_id, ticket_number, title, assigned_by }` |
| `ticket:assignment_responded` | Server | Room: `subtekinfo` | `{ ticket_id, padal_id, accepted, note }` |
| `ticket:status_changed` | Server | User: `satker_id` | `{ ticket_id, ticket_number, new_status, reason? }` |
| `ticket:rating_required` | Server | User: `satker_id` | `{ ticket_id, ticket_number }` — emit saat tiket berubah ke Selesai |
| `ticket:rating_received` | Server | User: `padal_id` | `{ ticket_id, rating, from_satker }` |

**Tambahkan room management di `socket/index.js`:**

```js
socket.on('join_user_room', (userId) => {
  socket.join(`user:${userId}`);
});

socket.on('join_subtekinfo_room', () => {
  socket.join('subtekinfo');
});

// Emit ke user spesifik:
io.to(`user:${targetUserId}`).emit('ticket:status_changed', payload);

// Emit ke semua Subtekinfo:
io.to('subtekinfo').emit('ticket:new', payload);
```

---

## BAGIAN 5 — PERUBAHAN FRONTEND

### 5.1 Routing & Auth

| File | Yang Diubah |
|---|---|
| `App.jsx` | Update `RootRedirect`: `'Admin'→'/subtekinfo/dashboard'`, `'Teknisi'→'/padal/dashboard'`. Tambah routes untuk Padal, Teknisi, Satker. Hapus routes `/user/chats` dan `/technician/chats`. Tambah route `/teknisi/*` untuk role Teknisi read-only. |
| `ProtectedRoute.jsx` | Update `allowedRoles` ke nama role baru di semua route. |
| `AuthContext.jsx` | Update role checking: `'Admin'→'Subtekinfo'`, `'User'→'Satker'`, `'Teknisi'→'Padal'\|'Teknisi'`. |
| `sidebar-data.js` | Buat 4 konfigurasi sidebar berbeda: `satker`, `subtekinfo`, `padal`, `teknisi`. Hapus menu chat dari semua role. |

### 5.2 Halaman yang DIHAPUS

| File | Alasan |
|---|---|
| `pages/ChatListPage.jsx` | Chat internal dihapus |
| `pages/ChatDetailPage.jsx` | Chat internal dihapus |
| `pages/technician/TechnicianChatsPage.jsx` | Chat internal dihapus |
| `pages/technician/TechnicianSettingsPage.jsx` | Toggle status ketersediaan dihapus |
| `pages/admin/ChatMonitoringPage.jsx` | Chat internal dihapus |
| `components/modals/NewChatModal.jsx` | Chat internal dihapus |
| `components/chat/ChatMessage.jsx` | Chat internal dihapus |
| `components/chat/MessageInput.jsx` | Chat internal dihapus |
| `components/tickets/UrgencyBadge.jsx` | Urgensi dihapus total |
| `components/modals/ConfirmTakeTicketDialog.jsx` | Fitur ambil tiket sendiri dihapus |

### 5.3 Halaman yang DIMODIFIKASI

| File | Yang Diubah |
|---|---|
| `pages/CreateTicketPage.jsx` | Hapus field urgency. Tambah logika cek rating pending — sebelum render form, fetch cek, jika ada tiket belum dirating redirect ke `RatingPage`. |
| `pages/UserDashboard.jsx` → `SatkerDashboard.jsx` | Rename file. Hapus `urgent_count`. Tambah card "Menunggu Rating" jika ada. |
| `pages/UserTicketsPage.jsx` → `SatkerTicketsPage.jsx` | Rename. Hapus badge urgency. Tambah aksi edit (hanya saat Pending) dan batalkan. |
| `pages/TicketDetailPage.jsx` | Hapus tampilan urgency. Tambah tombol "Beri Rating" jika status Selesai dan belum dirating. Ganti tombol chat dengan **tombol WhatsApp**. |
| `pages/admin/AdminDashboard.jsx` → `SubtekinfoDashboard.jsx` | Rename. Hapus widget urgency/kritis. Tambah summary assign pending. |
| `pages/admin/AllTicketsPage.jsx` | Hapus filter urgency. Tambah tombol **Assign Padal**, **Tolak** (modal alasan wajib), **Batalkan** (modal alasan wajib). |
| `pages/admin/ManageTechniciansPage.jsx` → `ManagePadalPage.jsx` | Rename. Tampilkan Padal dengan status shift. Klik detail Padal → tampilkan anggota Teknisi. |
| `pages/technician/TechnicianDashboard.jsx` → `PadalDashboard.jsx` | Rename. Hapus toggle ketersediaan. Tambah notifikasi assign masuk. |
| `pages/technician/TechnicianQueuePage.jsx` → `PadalQueuePage.jsx` | Rename. Hapus tombol "Ambil Tiket". Hanya tampil list tiket pending (read-only untuk Padal). |
| `pages/technician/TechnicianTicketsPage.jsx` → `PadalTicketsPage.jsx` | Rename. Hanya tampilkan tiket yang di-assign ke Padal ybs. Tambah tombol **Selesai** dan **Batalkan**. |

### 5.4 Halaman yang DITAMBAHKAN

| File Baru | Fungsi |
|---|---|
| `pages/satker/RatingPage.jsx` | Halaman rating wajib. Tampilkan tiket selesai yang belum dirating. 5 tombol pilihan rating berlabel. Setelah submit, redirect ke dashboard atau buat tiket. |
| `pages/teknisi/TeknisiTicketsPage.jsx` | List tiket (pending, proses, selesai) untuk Teknisi read-only. Tidak ada tombol aksi. |
| `pages/teknisi/TeknisiTicketDetailPage.jsx` | Detail tiket read-only untuk Teknisi. |
| `pages/padal/PadalAssignNotifPage.jsx` *(atau modal)* | Tampilan notifikasi assign masuk. Tombol **Terima / Tolak**. Jika tolak, muncul textarea alasan (opsional). |
| `pages/subtekinfo/AssignPadalModal.jsx` | Modal assign Padal ke tiket. List Padal aktif di atas, tidak aktif di bawah. |
| `pages/subtekinfo/RejectTicketModal.jsx` | Modal penolakan tiket. Textarea alasan **wajib**. Tombol Kirim disabled selama textarea kosong. |
| `pages/reports/MonthlyReportPage.jsx` | Laporan bulanan (tampil berbeda per role). Filter bulan/tahun. Tombol Download Excel dan PDF. |
| `pages/subtekinfo/ManageShiftPage.jsx` | Manajemen shift Padal. Tabel list Padal + input tanggal shift. Status aktif otomatis dari tanggal. |

### 5.5 Komponen yang Dimodifikasi

| Komponen | Yang Diubah |
|---|---|
| `components/tickets/StatusBadge.jsx` | Tambah status `'Ditolak'` dan `'Dibatalkan'` dengan warna berbeda. |
| `components/layout/header.jsx` | Tambah notifikasi bell untuk Padal (assign masuk) dan Satker (tiket selesai / rating required). |
| `components/modals/AddEditTechnicianModal.jsx` → `AddEditPadalModal.jsx` | Rename. Hapus field spesialisasi & shift jam. Tambah field tanggal shift. |
| `i18n/locales/id.json` + `en.json` | Hapus semua kunci terkait urgency, chat, ambil tiket. Tambah kunci baru: `rating`, `assign`, `padal`, `satker`, `subtekinfo`, `teknisi`, `laporan_bulanan`. |

---

## BAGIAN 6 — SESI PENGERJAAN (Terurut Prioritas)

> Setiap sesi harus diselesaikan secara tuntas sebelum pindah ke sesi berikutnya. Uji fungsionalitas dasar setiap sesi sebelum lanjut.

---

### SESI 1 — Migrasi Database ⭐ *Prioritas Tertinggi*

**Mengapa pertama:** Semua perubahan backend dan frontend bergantung pada skema database yang benar.

**Cakupan pekerjaan:**
1. Backup database `helpdesk_db` terlebih dahulu.
2. DROP tabel dalam urutan yang benar (perhatikan FK): `messages` → `chats` → `technician_settings` → kolom `division_id` dari `users` → `divisions`.
3. ALTER TABLE `users`: perluas ENUM role, hapus FK dan kolom `division_id`.
4. UPDATE data seed: migrasi nilai role lama ke role baru.
5. ALTER TABLE `tickets`: hapus kolom `urgency`, tambah `rejection_reason`, tambah `padal_id` + FK.
6. CREATE TABLE: `ticket_ratings`, `ticket_assignments`, `padal_shifts`.
7. Verifikasi skema dengan `DESCRIBE` pada setiap tabel yang diubah.

**File yang dibuat:**
- `backend/migrations/001_revision_schema.sql`

**Definisi selesai:**
- [ ] Semua tabel terbaru tersedia dan terverifikasi.
- [ ] Kolom `urgency` sudah tidak ada di tabel `tickets`.
- [ ] ENUM role di tabel `users` sudah berisi 4 role baru.

---

### SESI 2 — Restrukturisasi Role Backend

**Mengapa kedua:** Fondasi otorisasi harus benar sebelum mengerjakan fitur apapun.

**Cakupan pekerjaan:**
1. Update `validationSchemas.js`: `patterns.role`, hapus `patterns.urgency`, update `ticketSchemas`, tambah `ratingSchema`, `assignSchema`, `rejectSchema`.
2. Update semua `role()` calls di routes: `'Admin'→'Subtekinfo'`, `'Teknisi'→'Padal'` (kecuali Teknisi read-only).
3. Update `GET /api/tickets`: hapus urgency filter, update role-based filtering.
4. Update `GET /api/tickets/summary`: hapus `urgent_count`, update role checks.
5. Update `GET /api/users`: support filter role baru.

**File yang diubah:**
- `backend/src/utils/validationSchemas.js`
- `backend/src/routes/tickets.js`
- `backend/src/routes/users.js`
- `backend/src/middleware/role.js` *(verifikasi saja)*

---

### SESI 3 — Hapus Fitur Urgensi Menyeluruh

**Mengapa ketiga:** Pembersihan fitur yang dihapus harus dilakukan sebelum menambah fitur baru.

**Cakupan pekerjaan:**
1. Backend: Hapus semua referensi `urgency` dari `routes/tickets.js`, `services/TicketService.js`, `utils/queryBuilder.js`.
2. Frontend: Hapus komponen `UrgencyBadge.jsx`.
3. Frontend: Hapus field urgency dari form `CreateTicketPage.jsx`.
4. Frontend: Hapus filter urgency dari semua halaman list tiket.
5. Frontend: Hapus tampilan urgency dari semua detail tiket.
6. i18n: Hapus semua kunci urgency dari `id.json` dan `en.json`.

**File yang diubah/dihapus:**
- `backend/src/routes/tickets.js`, `services/TicketService.js`, `utils/queryBuilder.js`
- `apps/web/src/components/tickets/UrgencyBadge.jsx` *(HAPUS)*
- `apps/web/src/pages/CreateTicketPage.jsx`
- `apps/web/src/pages/admin/AllTicketsPage.jsx`, `apps/web/src/pages/UserTicketsPage.jsx`
- `apps/web/src/i18n/locales/id.json`, `en.json`

---

### SESI 4 — Hapus Sistem Chat Internal

**Mengapa keempat:** Pembersihan komponen besar sebelum menambah routing baru.

**Cakupan pekerjaan:**
1. Backend: Hapus `routes/chats.js`, `routes/messages.js`, `ChatService.js`, `MessageService.js`.
2. Backend: Update `server.js` agar tidak mendaftarkan routes chat.
3. Frontend: Hapus semua file chat (lihat [Bagian 5.2](#52-halaman-yang-dihapus)).
4. Frontend: Hapus import dan routes chat dari `App.jsx`.
5. Frontend: Hapus menu chat dari `sidebar-data.js` untuk semua role.
6. Frontend: Di halaman detail tiket Satker, ganti tombol "Chat" dengan tombol **"Hubungi via WhatsApp"** yang membuka `wa.me/[nomor dari system_settings]`.

---

### SESI 5 — Alur Assign Padal & Socket.IO Baru

**Cakupan pekerjaan:**
1. Backend: Buat `POST /api/tickets/:id/assign`.
2. Backend: Buat `DELETE /api/tickets/:id/assign`.
3. Backend: Buat `PATCH /api/tickets/:id/assignment/respond`.
4. Backend: Update `socket/index.js` — room management baru + events baru (`ticket:new`, `ticket:assigned`, `ticket:assignment_responded`, `ticket:status_changed`).
5. Backend: Tambahkan emit `ticket:new` saat `POST /api/tickets` berhasil.
6. Frontend: Buat `AssignPadalModal.jsx` untuk Subtekinfo.
7. Frontend: Buat komponen notifikasi assign masuk untuk Padal (tombol Terima/Tolak).
8. Frontend: Update `AllTicketsPage.jsx` — tambahkan tombol Assign Padal.
9. Frontend: Update `PadalTicketsPage` — tampilkan notifikasi assign masuk.

---

### SESI 6 — Penolakan Tiket dengan Alasan Wajib

**Cakupan pekerjaan:**
1. Backend: Buat `POST /api/tickets/:id/reject`. Validasi `reason` wajib, tidak boleh kosong/whitespace. Update status tiket ke `Ditolak`. Simpan `rejection_reason`. Emit `ticket:status_changed` ke Satker.
2. Frontend: Buat `RejectTicketModal.jsx` — textarea wajib, tombol Kirim disabled jika kosong.
3. Frontend: Integrasikan modal ke `AllTicketsPage.jsx` (tombol Tolak di setiap tiket Pending).
4. Frontend: Di sisi Satker — tambahkan toast/notifikasi saat menerima event `ticket:status_changed` dari Socket.IO. Tampilkan status baru dan alasan penolakan.

---

### SESI 7 — Rating Wajib Satker

**Cakupan pekerjaan:**
1. Backend: Buat `POST /api/tickets/:id/rating`. Validasi: tiket harus Selesai, milik Satker tsb, belum pernah dirating. Insert ke `ticket_ratings`. Emit `ticket:rating_received` ke Padal.
2. Backend: Tambahkan middleware cek rating pending di `POST /api/tickets`. Jika ada tiket Selesai yang belum dirating → return `403` dengan `{ pendingRating: true, ticket_id }`.
3. Backend: Emit `ticket:rating_required` ke Satker saat status tiket berubah ke Selesai.
4. Frontend: Buat `RatingPage.jsx` — tampilkan tiket yang perlu dirating, 5 pilihan rating berlabel.
5. Frontend: Di `CreateTicketPage.jsx`, sebelum render form, cek rating pending. Jika ada, redirect ke `RatingPage`.
6. Frontend: Di `TicketDetailPage.jsx`, tampilkan tombol "Beri Rating" jika tiket Selesai dan belum dirating.
7. Frontend: Di header/notifikasi, tampilkan badge jika ada tiket yang belum dirating.

---

### SESI 8 — Manajemen Shift Padal

**Cakupan pekerjaan:**
1. Backend: Buat `GET /api/padal-shifts` (list semua Padal + data shift + `is_active`).
2. Backend: Buat `PUT /api/padal-shifts/:padal_id` (Subtekinfo update shift Padal).
3. Backend: Update `GET /api/users` — sorting Padal aktif di atas.
4. Frontend: Buat `ManageShiftPage.jsx` untuk Subtekinfo — tabel Padal, input date range shift, status aktif otomatis.
5. Frontend: Update `ManagePadalPage.jsx` — tampilkan status shift, klik detail Padal tampilkan daftar Teknisi anggotanya.
6. Frontend: Update `AssignPadalModal.jsx` — sort Padal aktif di atas saat memilih Padal untuk assign.

---

### SESI 9 — Laporan Bulanan

**Cakupan pekerjaan:**
1. Backend: Buat `backend/src/routes/reports.js`.
2. Backend: `GET /api/reports/monthly` — query berbeda per role (lihat [Bagian 4.4](#44-endpoint-laporan-baru)).
3. Backend: `GET /api/reports/monthly/export` — generate Excel dengan `exceljs`, generate PDF dengan `pdfkit` atau `puppeteer`. Stream file ke client.
4. Frontend: Buat `MonthlyReportPage.jsx` — filter bulan/tahun, preview data, tombol Download Excel dan PDF. Tampilan berbeda per role.
5. Frontend: Tambahkan menu **Laporan Bulanan** di sidebar semua role.

---

### SESI 10 — Restrukturisasi Frontend & Navigasi

*Sesi terakhir — memastikan semua halaman, routing, dan navigasi sudah konsisten dengan role baru.*

**Cakupan pekerjaan:**
1. Rename semua file halaman sesuai role baru (lihat [Bagian 5.3](#53-halaman-yang-dimodifikasi)).
2. Update `App.jsx`: route paths baru (`/satker/*`, `/subtekinfo/*`, `/padal/*`, `/teknisi/*`), `RootRedirect` sesuai role baru.
3. Update `sidebar-data.js`: 4 konfigurasi sidebar berbeda per role.
4. Tambahkan `TeknisiTicketsPage.jsx` dan `TeknisiTicketDetailPage.jsx` (read-only).
5. Update `AuthContext.jsx`: role checks ke nama role baru.
6. Update `ProtectedRoute.jsx`: `allowedRoles` ke nama role baru di semua route.
7. Finalisasi i18n: pastikan semua string baru sudah ada di `id.json` dan `en.json`.
8. **Smoke test** seluruh alur: login per role, buat tiket, assign, rating, laporan.

---

## BAGIAN 7 — HAL YANG BELUM FINAL (Perlu Konfirmasi)

> Item-item berikut sudah diidentifikasi namun **BELUM BOLEH diimplementasikan** sebelum ada keputusan.

| Item | Pertanyaan yang Belum Terjawab | Dampak |
|---|---|---|
| Average rating per Padal | Di mana ditampilkan? Dashboard Subtekinfo, profil Padal, laporan, atau semua? | Menentukan query DB dan komponen yang perlu dibuat |
| Batas waktu konfirmasi assign Padal | Berapa menit timeout sebelum assign dibatalkan otomatis? | Perlu job scheduler / cron jika diimplementasi |
| Teknisi dalam list Padal | Apakah Teknisi dikelola di halaman yang sama dengan Padal (dengan filter), atau halaman terpisah? | Mempengaruhi struktur `ManagePadalPage` |
| Format kolom Excel vs PDF | Apakah format kolom laporan Excel dan PDF sama, atau berbeda? | Mempengaruhi logika generate laporan |
| Matriks izin pembatalan tiket | Satker: boleh batalkan tiket Proses atau hanya Pending? Padal: boleh batalkan tiket Proses-nya sendiri? | Mempengaruhi validasi backend endpoint PATCH |
| Batas waktu edit tiket Satker | Edit hanya saat Pending, atau juga saat Proses? | Validasi di backend dan disable form di frontend |

---

## BAGIAN 8 — CHECKLIST PENGERJAAN

Perbarui checklist ini setelah setiap sesi selesai dikerjakan dan sudah diuji dasar.

| Sesi | Nama | Status |
|---|---|---|
| Sesi 1 | Migrasi Database | `[ ]` Belum Dikerjakan |
| Sesi 2 | Restrukturisasi Role Backend | `[ ]` Belum Dikerjakan |
| Sesi 3 | Hapus Fitur Urgensi Menyeluruh | `[ ]` Belum Dikerjakan |
| Sesi 4 | Hapus Sistem Chat Internal | `[ ]` Belum Dikerjakan |
| Sesi 5 | Alur Assign Padal & Socket.IO Baru | `[ ]` Belum Dikerjakan |
| Sesi 6 | Penolakan Tiket dengan Alasan Wajib | `[ ]` Belum Dikerjakan |
| Sesi 7 | Rating Wajib Satker | `[ ]` Belum Dikerjakan |
| Sesi 8 | Manajemen Shift Padal | `[ ]` Belum Dikerjakan |
| Sesi 9 | Laporan Bulanan | `[ ]` Belum Dikerjakan |
| Sesi 10 | Restrukturisasi Frontend & Navigasi | `[ ]` Belum Dikerjakan |

---

*Dokumen ini dibuat berdasarkan analisis source code ProjectPolda dan rencana revisi yang telah dikonfirmasi. Letakkan file ini di root workspace project agar dapat diakses oleh GitHub Copilot via `@workspace`.*
