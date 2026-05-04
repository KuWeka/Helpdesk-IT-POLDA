-- Ensure ticket_assignments status values match application usage
-- and keep an updated_at audit column for operational visibility.

ALTER TABLE ticket_assignments
  MODIFY COLUMN status ENUM('pending_confirm', 'accepted', 'rejected', 'cancelled', 'expired')
  DEFAULT 'pending_confirm';

ALTER TABLE ticket_assignments
  ADD COLUMN updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;
