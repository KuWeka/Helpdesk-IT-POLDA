-- =============================================================================
-- MIGRASI: 001_revision_schema.sql
-- Proyek  : ProjectPolda — IT Helpdesk Ticket Management
-- Versi   : 1.0
-- Tanggal : Mei 2026
-- Sesi    : Sesi 1 — Migrasi Database
-- =============================================================================
-- PETUNJUK EKSEKUSI
--   1. Backup database terlebih dahulu:
--        mysqldump -u root -p helpdesk_db > helpdesk_db_backup_YYYYMMDD.sql
--   2. Jalankan migrasi:
--        mysql -u root -p helpdesk_db < backend/migrations/001_revision_schema.sql
--   3. Verifikasi dengan query di bagian VERIFIKASI di bawah.
-- =============================================================================

USE helpdesk_db;

-- Pastikan foreign key checks aktif untuk validasi
SET FOREIGN_KEY_CHECKS = 1;

-- =============================================================================
-- LANGKAH 1: DROP TABEL YANG DIHAPUS
-- Urutan: messages → chats → technician_settings
-- (divisions dihapus setelah FK users.division_id sudah dilepas — lihat Langkah 3)
-- =============================================================================

DROP TABLE IF EXISTS messages;
DROP TABLE IF EXISTS chats;
DROP TABLE IF EXISTS technician_settings;

-- =============================================================================
-- LANGKAH 2: MODIFIKASI TABEL users
-- 2a. Hapus FK division_id secara dinamis (nama FK di-generate otomatis oleh MySQL)
-- 2b. Hapus kolom division_id
-- 2c. Perluas ENUM role ke 4 role baru
-- 2d. Migrasi data role lama → role baru
-- =============================================================================

-- 2a. Temukan dan hapus FK constraint division_id secara dinamis
SET @fk_division := (
  SELECT CONSTRAINT_NAME
  FROM information_schema.KEY_COLUMN_USAGE
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME    = 'users'
    AND COLUMN_NAME   = 'division_id'
    AND REFERENCED_TABLE_NAME = 'divisions'
  LIMIT 1
);

SET @sql_drop_fk := IF(
  @fk_division IS NOT NULL,
  CONCAT('ALTER TABLE users DROP FOREIGN KEY `', @fk_division, '`'),
  'SELECT ''INFO: FK division_id tidak ditemukan, dilewati'' AS status'
);

PREPARE stmt_drop_fk FROM @sql_drop_fk;
EXECUTE stmt_drop_fk;
DEALLOCATE PREPARE stmt_drop_fk;

-- 2b. Hapus kolom division_id (juga menghapus index terkait secara otomatis)
SET @col_users_division := (
  SELECT COLUMN_NAME
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME   = 'users'
    AND COLUMN_NAME  = 'division_id'
  LIMIT 1
);

SET @sql_drop_users_division := IF(
  @col_users_division IS NOT NULL,
  'ALTER TABLE users DROP COLUMN division_id',
  'SELECT ''INFO: kolom users.division_id tidak ditemukan, dilewati'' AS status'
);

PREPARE stmt_drop_users_division FROM @sql_drop_users_division;
EXECUTE stmt_drop_users_division;
DEALLOCATE PREPARE stmt_drop_users_division;

-- 2c. Perluas ENUM role
--     Catatan: Karena MySQL tidak bisa langsung mengubah ENUM dengan nilai lama yang
--     berbeda, kita ubah dulu ke VARCHAR, migrasi data, lalu ubah ke ENUM baru.
ALTER TABLE users
  MODIFY COLUMN role VARCHAR(20) NOT NULL DEFAULT 'Satker';

-- 2d. Migrasi data role lama → role baru
UPDATE users SET role = 'Subtekinfo' WHERE role = 'Admin';
UPDATE users SET role = 'Padal'      WHERE role = 'Teknisi';
UPDATE users SET role = 'Satker'     WHERE role = 'User';

-- 2e. Ubah kembali ke ENUM dengan nilai baru yang sudah sesuai
ALTER TABLE users
  MODIFY COLUMN role ENUM('Subtekinfo', 'Padal', 'Teknisi', 'Satker') NOT NULL DEFAULT 'Satker';

-- Update index gabungan agar masih relevan setelah perubahan ENUM
-- (DROP + re-CREATE karena MODIFY COLUMN sudah rebuild index otomatis, ini hanya untuk kejelasan)

-- =============================================================================
-- LANGKAH 3: DROP TABEL divisions
-- (setelah FK di users sudah dilepas, aman untuk drop)
-- =============================================================================

DROP TABLE IF EXISTS divisions;

-- =============================================================================
-- LANGKAH 4: MODIFIKASI TABEL tickets
-- =============================================================================

-- 4a. Hapus index urgency jika ada
SET @idx_urgency := (
  SELECT INDEX_NAME
  FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME   = 'tickets'
    AND INDEX_NAME   = 'idx_urgency'
  LIMIT 1
);

SET @sql_drop_idx := IF(
  @idx_urgency IS NOT NULL,
  'DROP INDEX idx_urgency ON tickets',
  'SELECT ''INFO: index idx_urgency tidak ditemukan, dilewati'' AS status'
);

PREPARE stmt_drop_idx FROM @sql_drop_idx;
EXECUTE stmt_drop_idx;
DEALLOCATE PREPARE stmt_drop_idx;

-- 4b. Hapus kolom urgency
SET @col_tickets_urgency := (
  SELECT COLUMN_NAME
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME   = 'tickets'
    AND COLUMN_NAME  = 'urgency'
  LIMIT 1
);

SET @sql_drop_tickets_urgency := IF(
  @col_tickets_urgency IS NOT NULL,
  'ALTER TABLE tickets DROP COLUMN urgency',
  'SELECT ''INFO: kolom tickets.urgency tidak ditemukan, dilewati'' AS status'
);

PREPARE stmt_drop_tickets_urgency FROM @sql_drop_tickets_urgency;
EXECUTE stmt_drop_tickets_urgency;
DEALLOCATE PREPARE stmt_drop_tickets_urgency;

-- 4c. Tambah kolom rejection_reason
SET @col_tickets_reject := (
  SELECT COLUMN_NAME
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME   = 'tickets'
    AND COLUMN_NAME  = 'rejection_reason'
  LIMIT 1
);

SET @sql_add_tickets_reject := IF(
  @col_tickets_reject IS NULL,
  'ALTER TABLE tickets ADD COLUMN rejection_reason TEXT NULL AFTER status',
  'SELECT ''INFO: kolom tickets.rejection_reason sudah ada, dilewati'' AS status'
);

PREPARE stmt_add_tickets_reject FROM @sql_add_tickets_reject;
EXECUTE stmt_add_tickets_reject;
DEALLOCATE PREPARE stmt_add_tickets_reject;

-- 4d. Tambah kolom padal_id
SET @col_tickets_padal := (
  SELECT COLUMN_NAME
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME   = 'tickets'
    AND COLUMN_NAME  = 'padal_id'
  LIMIT 1
);

SET @sql_add_tickets_padal := IF(
  @col_tickets_padal IS NULL,
  'ALTER TABLE tickets ADD COLUMN padal_id VARCHAR(36) NULL AFTER rejection_reason',
  'SELECT ''INFO: kolom tickets.padal_id sudah ada, dilewati'' AS status'
);

PREPARE stmt_add_tickets_padal FROM @sql_add_tickets_padal;
EXECUTE stmt_add_tickets_padal;
DEALLOCATE PREPARE stmt_add_tickets_padal;

-- 4e. Tambah FK untuk padal_id
--     Cek dulu apakah FK sudah ada (idempotent saat re-run)
SET @fk_padal := (
  SELECT CONSTRAINT_NAME
  FROM information_schema.KEY_COLUMN_USAGE
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME   = 'tickets'
    AND COLUMN_NAME  = 'padal_id'
    AND REFERENCED_TABLE_NAME = 'users'
  LIMIT 1
);

SET @sql_add_fk_padal := IF(
  @fk_padal IS NULL,
  'ALTER TABLE tickets ADD CONSTRAINT fk_tickets_padal FOREIGN KEY (padal_id) REFERENCES users(id) ON DELETE SET NULL',
  'SELECT ''INFO: FK fk_tickets_padal sudah ada, dilewati'' AS status'
);

PREPARE stmt_add_fk_padal FROM @sql_add_fk_padal;
EXECUTE stmt_add_fk_padal;
DEALLOCATE PREPARE stmt_add_fk_padal;

-- 4f. Pastikan ENUM status sudah lengkap (termasuk Ditolak & Dibatalkan)
ALTER TABLE tickets
  MODIFY COLUMN status ENUM('Pending', 'Proses', 'Selesai', 'Ditolak', 'Dibatalkan') DEFAULT 'Pending';

-- =============================================================================
-- LANGKAH 5: CREATE TABEL BARU
-- =============================================================================

-- 5a. ticket_ratings
CREATE TABLE IF NOT EXISTS ticket_ratings (
  id         VARCHAR(36)  PRIMARY KEY,                    -- UUID v4
  ticket_id  VARCHAR(36)  NOT NULL,
  satker_id  VARCHAR(36)  NOT NULL,
  padal_id   VARCHAR(36)  NOT NULL,
  rating     TINYINT      NOT NULL CHECK (rating BETWEEN 1 AND 5),
  -- 1=Sangat Buruk | 2=Buruk | 3=Cukup Baik | 4=Baik | 5=Sangat Baik
  created_at TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE,
  FOREIGN KEY (satker_id) REFERENCES users(id)   ON DELETE CASCADE,
  FOREIGN KEY (padal_id)  REFERENCES users(id)   ON DELETE CASCADE,
  INDEX idx_rating_ticket (ticket_id),
  INDEX idx_rating_satker (satker_id),
  INDEX idx_rating_padal  (padal_id)
);

-- 5b. ticket_assignments
CREATE TABLE IF NOT EXISTS ticket_assignments (
  id           VARCHAR(36)  PRIMARY KEY,                  -- UUID v4
  ticket_id    VARCHAR(36)  NOT NULL,
  padal_id     VARCHAR(36)  NOT NULL,
  assigned_by  VARCHAR(36)  NOT NULL,                     -- FK ke Subtekinfo
  status       ENUM('pending_confirm', 'accepted', 'rejected') DEFAULT 'pending_confirm',
  reject_note  TEXT         NULL,                         -- Alasan Padal menolak (opsional)
  created_at   TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  responded_at TIMESTAMP    NULL,
  FOREIGN KEY (ticket_id)   REFERENCES tickets(id) ON DELETE CASCADE,
  FOREIGN KEY (padal_id)    REFERENCES users(id)   ON DELETE CASCADE,
  FOREIGN KEY (assigned_by) REFERENCES users(id)   ON DELETE CASCADE,
  INDEX idx_assign_ticket (ticket_id),
  INDEX idx_assign_padal  (padal_id),
  INDEX idx_assign_status (status)
);

-- 5c. padal_shifts
--     Catatan kompatibilitas: status aktif dihitung saat query (bukan generated column)
CREATE TABLE IF NOT EXISTS padal_shifts (
  id          VARCHAR(36)  PRIMARY KEY,                   -- UUID v4
  padal_id    VARCHAR(36)  NOT NULL UNIQUE,
  shift_start DATE         NOT NULL,                      -- Tanggal mulai shift
  shift_end   DATE         NOT NULL,                      -- Tanggal akhir shift
  notes       TEXT         NULL,
  created_at  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (padal_id) REFERENCES users(id) ON DELETE CASCADE
);

-- =============================================================================
-- LANGKAH 6: TAMBAH KOLOM whatsapp_number KE system_settings
-- =============================================================================

-- Tambah kolom whatsapp_number jika belum ada
SET @col_wa := (
  SELECT COLUMN_NAME
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME   = 'system_settings'
    AND COLUMN_NAME  = 'whatsapp_number'
  LIMIT 1
);

SET @sql_add_wa := IF(
  @col_wa IS NULL,
  'ALTER TABLE system_settings ADD COLUMN whatsapp_number VARCHAR(20) NULL AFTER maintenance_mode',
  'SELECT ''INFO: kolom whatsapp_number sudah ada, dilewati'' AS status'
);

PREPARE stmt_add_wa FROM @sql_add_wa;
EXECUTE stmt_add_wa;
DEALLOCATE PREPARE stmt_add_wa;

-- =============================================================================
-- LANGKAH 7: UPDATE SEED DATA — Samakan admin seed dengan role baru
-- =============================================================================

-- Update role admin seed yang sudah ada (dari schema.sql)
UPDATE users SET role = 'Subtekinfo' WHERE id = 'admin-uuid-1' AND role = 'Admin';

-- =============================================================================
-- VERIFIKASI SKEMA
-- Jalankan query berikut setelah migrasi untuk memastikan hasilnya benar:
-- =============================================================================

-- Cek 1: ENUM role di tabel users harus berisi 4 role baru
-- SHOW COLUMNS FROM users LIKE 'role';
-- Harapan: enum('Subtekinfo','Padal','Teknisi','Satker')

-- Cek 2: Kolom urgency sudah tidak ada di tabel tickets
-- SHOW COLUMNS FROM tickets LIKE 'urgency';
-- Harapan: Empty set

-- Cek 3: Kolom baru di tickets ada
-- SHOW COLUMNS FROM tickets;
-- Harapan: rejection_reason dan padal_id muncul

-- Cek 4: Tabel lama sudah terhapus
-- SHOW TABLES;
-- Harapan: divisions, chats, messages, technician_settings tidak muncul

-- Cek 5: Tabel baru sudah ada
-- DESCRIBE ticket_ratings;
-- DESCRIBE ticket_assignments;
-- DESCRIBE padal_shifts;

-- Cek 6: Data role sudah termigasi
-- SELECT role, COUNT(*) FROM users GROUP BY role;
-- Harapan: hanya nilai Subtekinfo / Padal / Teknisi / Satker

-- =============================================================================
-- SELESAI
-- =============================================================================
