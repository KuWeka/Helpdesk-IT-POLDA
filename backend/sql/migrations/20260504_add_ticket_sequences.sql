-- Ticket sequence table for collision-free ticket number generation
CREATE TABLE IF NOT EXISTS ticket_sequences (
  month_prefix VARCHAR(6) NOT NULL PRIMARY KEY COMMENT 'Format: YYYYMM',
  counter      INT UNSIGNED NOT NULL DEFAULT 1
);
