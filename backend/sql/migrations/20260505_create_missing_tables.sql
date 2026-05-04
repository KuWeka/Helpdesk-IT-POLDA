-- Migration 003: Create missing tables (ticket_ratings, ticket_assignments, padal_shifts)

-- ticket_ratings
CREATE TABLE IF NOT EXISTS ticket_ratings (
  id         VARCHAR(36)  PRIMARY KEY,
  ticket_id  VARCHAR(36)  NOT NULL,
  satker_id  VARCHAR(36)  NOT NULL,
  padal_id   VARCHAR(36)  NOT NULL,
  rating     TINYINT      NOT NULL CHECK (rating BETWEEN 1 AND 5),
  created_at TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE,
  FOREIGN KEY (satker_id) REFERENCES users(id)   ON DELETE CASCADE,
  FOREIGN KEY (padal_id)  REFERENCES users(id)   ON DELETE CASCADE,
  INDEX idx_rating_ticket (ticket_id),
  INDEX idx_rating_satker (satker_id),
  INDEX idx_rating_padal  (padal_id)
);

-- ticket_assignments
CREATE TABLE IF NOT EXISTS ticket_assignments (
  id           VARCHAR(36)  PRIMARY KEY,
  ticket_id    VARCHAR(36)  NOT NULL,
  padal_id     VARCHAR(36)  NOT NULL,
  assigned_by  VARCHAR(36)  NOT NULL,
  status       ENUM('pending_confirm', 'accepted', 'rejected') DEFAULT 'pending_confirm',
  reject_note  TEXT         NULL,
  created_at   TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  responded_at TIMESTAMP    NULL,
  FOREIGN KEY (ticket_id)   REFERENCES tickets(id) ON DELETE CASCADE,
  FOREIGN KEY (padal_id)    REFERENCES users(id)   ON DELETE CASCADE,
  FOREIGN KEY (assigned_by) REFERENCES users(id)   ON DELETE CASCADE,
  INDEX idx_assign_ticket (ticket_id),
  INDEX idx_assign_padal  (padal_id),
  INDEX idx_assign_status (status)
);

-- padal_shifts
CREATE TABLE IF NOT EXISTS padal_shifts (
  id          VARCHAR(36)  PRIMARY KEY,
  padal_id    VARCHAR(36)  NOT NULL UNIQUE,
  shift_start DATE         NOT NULL,
  shift_end   DATE         NOT NULL,
  notes       TEXT         NULL,
  created_at  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (padal_id) REFERENCES users(id) ON DELETE CASCADE
);
