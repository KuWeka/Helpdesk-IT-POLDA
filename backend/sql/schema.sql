CREATE DATABASE IF NOT EXISTS helpdesk_db;
USE helpdesk_db;

CREATE TABLE IF NOT EXISTS divisions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) NOT NULL UNIQUE,
  username VARCHAR(50) UNIQUE DEFAULT NULL,
  password_hash VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  role ENUM('Subtekinfo', 'Padal', 'Teknisi', 'Satker') DEFAULT 'Satker',
  is_active BOOLEAN DEFAULT TRUE,
  division_id INT NULL,
  language VARCHAR(10) DEFAULT 'ID',
  theme ENUM('light', 'dark', 'system') DEFAULT 'light',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (division_id) REFERENCES divisions(id) ON DELETE SET NULL,
  INDEX idx_users_role_is_active (role, is_active),
  INDEX idx_users_email (email),           -- fast login lookups by email
  INDEX idx_users_username (username)      -- fast login lookups by username
);

CREATE TABLE IF NOT EXISTS system_settings (
  id INT PRIMARY KEY,
  app_name VARCHAR(100) DEFAULT 'IT Helpdesk',
  app_description TEXT,
  maintenance_mode BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS technician_settings (
  user_id VARCHAR(36) PRIMARY KEY,
  is_active BOOLEAN DEFAULT TRUE,
  shift_start TIME DEFAULT '08:00:00',
  shift_end TIME DEFAULT '17:00:00',
  specializations JSON,
  max_active_tickets INT DEFAULT 5,
  wa_notification BOOLEAN DEFAULT FALSE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS tickets (
  id VARCHAR(36) PRIMARY KEY,
  ticket_number VARCHAR(50) UNIQUE NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  location VARCHAR(255),
  urgency ENUM('Rendah', 'Sedang', 'Tinggi', 'Kritis') DEFAULT 'Sedang',
  category VARCHAR(100) DEFAULT NULL,
  status ENUM('Pending', 'Proses', 'Selesai', 'Ditolak', 'Dibatalkan') DEFAULT 'Pending',
  user_id VARCHAR(36) NOT NULL,
  assigned_technician_id VARCHAR(36) NULL,
  closed_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (assigned_technician_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_status (status),
  INDEX idx_user_id (user_id),
  INDEX idx_tech_id (assigned_technician_id),
  INDEX idx_tickets_padal_id (padal_id),        -- fast lookup for Padal dashboard filters
  INDEX idx_tickets_status_created_at (status, created_at),
  INDEX idx_tickets_status_closed_at (status, closed_at)
);

CREATE TABLE IF NOT EXISTS ticket_attachments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  ticket_id VARCHAR(36) NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  file_path VARCHAR(500) NOT NULL,
  file_size INT,
  mime_type VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE,
  INDEX idx_ticket_attachments_ticket_id (ticket_id)  -- fast attachment list per ticket
);

CREATE TABLE IF NOT EXISTS ticket_notes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  ticket_id VARCHAR(36) NOT NULL,
  technician_id VARCHAR(36) NOT NULL,
  note_content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE,
  FOREIGN KEY (technician_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS chats (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  technician_id VARCHAR(36) NOT NULL,
  ticket_id VARCHAR(36) NULL,
  status ENUM('Open', 'Closed') DEFAULT 'Open',
  last_message TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (technician_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE SET NULL,
  INDEX idx_chats_user_id (user_id),
  INDEX idx_chats_technician_id (technician_id),
  INDEX idx_chats_ticket_id (ticket_id),
  INDEX idx_chats_updated_at (updated_at)
);

CREATE TABLE IF NOT EXISTS messages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  chat_id VARCHAR(36) NOT NULL,
  sender_id VARCHAR(36) NOT NULL,
  sender_role ENUM('Satker', 'Teknisi', 'Padal', 'Subtekinfo') NOT NULL,
  message_content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (chat_id) REFERENCES chats(id) ON DELETE CASCADE,
  FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_messages_chat_id_created_at (chat_id, created_at),
  INDEX idx_messages_sender_id (sender_id),
  INDEX idx_messages_created_at (created_at)
);

CREATE TABLE IF NOT EXISTS activity_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  admin_id VARCHAR(36) NULL,
  action_type VARCHAR(100) NOT NULL,
  target_type VARCHAR(100) NOT NULL,
  target_id VARCHAR(100) NULL,
  details JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (admin_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Seed Data

INSERT INTO divisions (name, description) VALUES
('IT', 'Information Technology Division'),
('HR', 'Human Resources Division'),
('Finance', 'Finance and Accounting Division')
ON DUPLICATE KEY UPDATE name=name;

INSERT INTO system_settings (id, app_name, app_description, maintenance_mode) 
VALUES (1, 'IT Helpdesk', 'IT Helpdesk System', FALSE)
ON DUPLICATE KEY UPDATE id=id;

-- Seed Admin User
-- SECURITY: Default credentials have been removed from this file.
-- To create the initial admin account, run:
--   node scripts/setup-db.js --seed-admin
-- or set SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD environment variables
-- before running the setup script. Never commit credentials to version control.
