# Dokumentasi Sesi 1 — Migrasi Database

Tanggal dibuat: 2026-05-04

**Proyek:** ProjectPolda — IT Helpdesk Ticket Management  
**Sesi:** 1 dari 10  
**Tanggal:** Mei 2026  
**Status:** ✅ Selesai

---

## Ringkasan

Sesi ini mengerjakan seluruh perubahan skema database `helpdesk_db` sebagai fondasi untuk semua sesi berikutnya. Tidak ada perubahan kode backend atau frontend pada sesi ini.

---

## File yang Dibuat

| File | Keterangan |
|---|---|
| `backend/migrations/001_revision_schema.sql` | File migrasi tunggal yang mencakup semua perubahan skema Sesi 1 |

---

## Rincian Perubahan

### 1. Tabel yang DIHAPUS

| Tabel | Alasan |
|---|---|
| `messages` | Chat internal diganti ke WhatsApp |
| `chats` | Chat internal diganti ke WhatsApp |
| `technician_settings` | Diganti oleh `padal_shifts` |
| `divisions` | Konsep divisi tidak dipakai di sistem baru |

**Urutan DROP:** `messages` → `chats` → `technician_settings` → (hapus FK di `users`) → `divisions`  
FK constraint `division_id` di tabel `users` dihapus secara dinamis via `information_schema` karena nama FK di-generate otomatis oleh MySQL.

---

### 2. Tabel `users` — Dimodifikasi

| Perubahan | Detail |
|---|---|
| Hapus FK `division_id` | Dinamis via `information_schema.KEY_COLUMN_USAGE` |
| Hapus kolom `division_id` | `ALTER TABLE users DROP COLUMN IF EXISTS division_id` |
| Perluas ENUM `role` | Diubah sementara ke `VARCHAR` → migrasi data → ubah ke ENUM baru (mencegah error MySQL saat nilai lama masih ada) |
| ENUM `role` baru | `ENUM('Subtekinfo', 'Padal', 'Teknisi', 'Satker')` |
| Migrasi data | `Admin` → `Subtekinfo`, `Teknisi` → `Padal`, `User` → `Satker` |

---

### 3. Tabel `tickets` — Dimodifikasi

| Perubahan | Detail |
|---|---|
| Hapus kolom `urgency` | `ALTER TABLE tickets DROP COLUMN IF EXISTS urgency` |
| Hapus index `idx_urgency` | Kondisional — hanya dijalankan jika index tersebut ada |
| Tambah kolom `rejection_reason` | `TEXT NULL`, posisi setelah kolom `status` |
| Tambah kolom `padal_id` | `VARCHAR(36) NULL`, FK ke `users(id) ON DELETE SET NULL` |
| Perluas ENUM `status` | `ENUM('Pending','Proses','Selesai','Ditolak','Dibatalkan')` |

---

### 4. Tabel BARU yang Ditambahkan

#### `ticket_ratings`
```sql
id         VARCHAR(36) PRIMARY KEY   -- UUID v4
ticket_id  VARCHAR(36) NOT NULL      -- FK → tickets(id)
satker_id  VARCHAR(36) NOT NULL      -- FK → users(id)
padal_id   VARCHAR(36) NOT NULL      -- FK → users(id)
rating     TINYINT NOT NULL          -- CHECK 1–5
created_at TIMESTAMP
```
Keterangan rating: 1=Sangat Buruk, 2=Buruk, 3=Cukup Baik, 4=Baik, 5=Sangat Baik

#### `ticket_assignments`
```sql
id           VARCHAR(36) PRIMARY KEY  -- UUID v4
ticket_id    VARCHAR(36) NOT NULL     -- FK → tickets(id)
padal_id     VARCHAR(36) NOT NULL     -- FK → users(id)
assigned_by  VARCHAR(36) NOT NULL     -- FK → users(id), Subtekinfo
status       ENUM('pending_confirm','accepted','rejected')
reject_note  TEXT NULL                -- Alasan tolak oleh Padal (opsional)
created_at   TIMESTAMP
responded_at TIMESTAMP NULL
```

#### `padal_shifts`
```sql
id          VARCHAR(36) PRIMARY KEY  -- UUID v4
padal_id    VARCHAR(36) NOT NULL UNIQUE  -- FK → users(id)
shift_start DATE NOT NULL
shift_end   DATE NOT NULL
is_active   BOOLEAN VIRTUAL GENERATED  -- CURDATE() BETWEEN shift_start AND shift_end
notes       TEXT NULL
created_at  TIMESTAMP
updated_at  TIMESTAMP
```
> Kolom `is_active` bersifat **VIRTUAL** — dihitung otomatis oleh MySQL, tidak perlu di-update manual.

---

## Cara Eksekusi

```bash
# Langkah 1: Backup database
mysqldump -u root -proot helpdesk_db > helpdesk_db_backup_20260502.sql

# Langkah 2: Jalankan migrasi
mysql -u root -proot helpdesk_db < backend/migrations/001_revision_schema.sql
```

---

## Query Verifikasi Pasca-Migrasi

```sql
-- 1. ENUM role harus berisi 4 role baru
SHOW COLUMNS FROM users LIKE 'role';
-- Harapan: enum('Subtekinfo','Padal','Teknisi','Satker')

-- 2. Kolom urgency harus tidak ada
SHOW COLUMNS FROM tickets LIKE 'urgency';
-- Harapan: Empty set

-- 3. Kolom baru di tickets harus ada
SHOW COLUMNS FROM tickets;
-- Harapan: rejection_reason dan padal_id muncul

-- 4. Tabel lama harus sudah tidak ada
SHOW TABLES;
-- Harapan: divisions, chats, messages, technician_settings tidak muncul

-- 5. Tabel baru harus ada
DESCRIBE ticket_ratings;
DESCRIBE ticket_assignments;
DESCRIBE padal_shifts;

-- 6. Distribusi role setelah migrasi data
SELECT role, COUNT(*) AS jumlah FROM users GROUP BY role;
-- Harapan: hanya nilai Subtekinfo / Padal / Teknisi / Satker
```

---

## Checklist Sesi 1

- [x] DROP `messages`, `chats`, `technician_settings` (urutan FK-safe)
- [x] Hapus FK dan kolom `division_id` dari `users` (dinamis via `information_schema`)
- [x] DROP `divisions`
- [x] Perluas ENUM `role` di `users` ke 4 role baru
- [x] Migrasi data role: `Admin→Subtekinfo`, `Teknisi→Padal`, `User→Satker`
- [x] Hapus kolom `urgency` dari `tickets` (kondisional idempotent)
- [x] Tambah kolom `rejection_reason` dan `padal_id` ke `tickets`
- [x] Pastikan ENUM `status` di `tickets` sudah lengkap
- [x] CREATE TABLE `ticket_ratings`
- [x] CREATE TABLE `ticket_assignments`
- [x] CREATE TABLE `padal_shifts` (dengan kolom VIRTUAL `is_active`)
- [x] Query verifikasi tersedia di file migrasi

---

## Catatan Teknis

- Seluruh `ADD COLUMN` dan `DROP COLUMN` menggunakan `IF EXISTS` / `IF NOT EXISTS` — migrasi **idempotent**, aman dijalankan ulang.
- Perubahan ENUM `role` menggunakan jalur `VARCHAR` sementara untuk menghindari error MySQL ketika nilai data lama masih ada saat ENUM langsung dimodifikasi.
- Semua FK constraint dihapus/dibuat secara kondisional menggunakan prepared statement dinamis agar tidak bergantung pada nama constraint yang di-generate otomatis MySQL.
