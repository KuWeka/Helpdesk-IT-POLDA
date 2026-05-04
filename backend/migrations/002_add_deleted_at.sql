-- =============================================================================
-- MIGRASI: 002_add_deleted_at.sql
-- Proyek  : ProjectPolda — IT Helpdesk Ticket Management
-- Versi   : 1.1
-- Tanggal : Mei 2026
-- =============================================================================
-- PETUNJUK EKSEKUSI
--   1. Backup database terlebih dahulu
--   2. Jalankan: mysql -u root -p helpdesk_db < backend/migrations/002_add_deleted_at.sql
-- =============================================================================

USE helpdesk_db;

-- Tambah kolom deleted_at ke tabel users (jika belum ada)
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP NULL DEFAULT NULL;

-- Tambah kolom deleted_at ke tabel tickets (jika belum ada)
ALTER TABLE tickets
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP NULL DEFAULT NULL;

-- Index untuk mempercepat query WHERE deleted_at IS NULL
ALTER TABLE users
  ADD INDEX IF NOT EXISTS idx_users_deleted_at (deleted_at);

ALTER TABLE tickets
  ADD INDEX IF NOT EXISTS idx_tickets_deleted_at (deleted_at);

-- =============================================================================
-- VERIFIKASI
-- =============================================================================
-- SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
--   WHERE TABLE_SCHEMA = 'helpdesk_db'
--   AND TABLE_NAME IN ('users', 'tickets')
--   AND COLUMN_NAME = 'deleted_at';
-- Harus mengembalikan 2 baris.
