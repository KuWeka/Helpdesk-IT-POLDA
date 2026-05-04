-- Migration: 20260503_add_soft_delete.sql
-- Adds deleted_at columns to users and tickets so records are never permanently
-- destroyed via the API. Hard deletes can still be done by a DBA with justification.
--
-- Run with: node scripts/migrate.js
-- Or manually: mysql -u root -p helpdesk_db < sql/migrations/20260503_add_soft_delete.sql

-- users.deleted_at
ALTER TABLE users
  ADD COLUMN deleted_at TIMESTAMP NULL DEFAULT NULL
    COMMENT 'Soft-delete timestamp. NULL means the record is active.';

ALTER TABLE users
  ADD INDEX idx_users_deleted_at (deleted_at);

-- tickets.deleted_at
ALTER TABLE tickets
  ADD COLUMN deleted_at TIMESTAMP NULL DEFAULT NULL
    COMMENT 'Soft-delete timestamp. NULL means the record is active.';

ALTER TABLE tickets
  ADD INDEX idx_tickets_deleted_at (deleted_at);
