-- =============================================================================
-- MIGRATION: 20260504_fix_role_enum.sql
-- Purpose  : Update users.role ENUM from legacy values (Admin/User/Teknisi)
--            to new canonical values (Subtekinfo/Satker/Padal).
-- Safe     : Idempotent. VARCHAR intermediate step prevents ER_TRUNCATED_WRONG_VALUE
--            errors when old role values still exist in the data.
-- =============================================================================

-- Step 1: Relax to VARCHAR so data with old ENUM values can be updated safely
ALTER TABLE users MODIFY COLUMN role VARCHAR(20) NOT NULL DEFAULT 'Satker';

-- Step 2: Migrate legacy role names → canonical role names
UPDATE users SET role = 'Subtekinfo' WHERE role = 'Admin';
UPDATE users SET role = 'Padal'      WHERE role = 'Teknisi';
UPDATE users SET role = 'Satker'     WHERE role = 'User';

-- Step 3: Restore to ENUM with the correct canonical values
ALTER TABLE users
  MODIFY COLUMN role ENUM('Subtekinfo', 'Padal', 'Teknisi', 'Satker') NOT NULL DEFAULT 'Satker'
