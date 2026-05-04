-- MIGRATION: 20260505_force_fix_legacy_roles.sql
-- Purpose: Force-update legacy role values that may have been skipped by previous migration.

-- Relax to VARCHAR first to avoid ENUM truncation errors
ALTER TABLE users MODIFY COLUMN role VARCHAR(20) NOT NULL DEFAULT 'Satker';

-- Migrate legacy role names to canonical values
UPDATE users SET role = 'Subtekinfo' WHERE role IN ('Admin', 'admin');
UPDATE users SET role = 'Satker'     WHERE role IN ('User', 'user');
UPDATE users SET role = 'Teknisi'    WHERE role IN ('teknisi');
UPDATE users SET role = 'Padal'      WHERE role IN ('padal');

-- Restore ENUM with canonical values
ALTER TABLE users
  MODIFY COLUMN role ENUM('Subtekinfo', 'Padal', 'Teknisi', 'Satker') NOT NULL DEFAULT 'Satker';
