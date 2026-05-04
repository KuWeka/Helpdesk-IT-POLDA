const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'helpdesk_db',
  port: process.env.DB_PORT || 3306,

  // Connection pooling
  waitForConnections: true,
  connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT) || 10,
  // Cap the wait queue at 50. With queueLimit: 0 (unlimited) a sudden spike could
  // queue thousands of requests and exhaust memory before they time out.
  queueLimit: parseInt(process.env.DB_QUEUE_LIMIT) || 50,

  // MySQL specific
  timezone: '+07:00',
  charset: 'utf8mb4',
  supportBigNumbers: true,
  bigNumberStrings: true,

  // Enable multiple statements for transactions
  multipleStatements: false, // Disabled for security

  // Connection validation
  connectTimeout: 10000,
});

// Test connection on startup and ensure critical tables exist
const logger = require('../utils/logger');
pool.getConnection()
  .then(async (connection) => {
    logger.info('Database connected successfully');
    // Ensure ticket_ratings table exists (safety net in case migrations haven't run)
    try {
      await connection.query(`
        CREATE TABLE IF NOT EXISTS ticket_ratings (
          id         VARCHAR(36)  PRIMARY KEY,
          ticket_id  VARCHAR(36)  NOT NULL,
          satker_id  VARCHAR(36)  NOT NULL,
          padal_id   VARCHAR(36)  NOT NULL,
          rating     TINYINT      NOT NULL,
          created_at TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE,
          FOREIGN KEY (satker_id) REFERENCES users(id)   ON DELETE CASCADE,
          FOREIGN KEY (padal_id)  REFERENCES users(id)   ON DELETE CASCADE,
          INDEX idx_rating_ticket (ticket_id),
          INDEX idx_rating_satker (satker_id),
          INDEX idx_rating_padal  (padal_id)
        )
      `);
      await connection.query(`
        CREATE TABLE IF NOT EXISTS ticket_assignments (
          id           VARCHAR(36)  PRIMARY KEY,
          ticket_id    VARCHAR(36)  NOT NULL,
          padal_id     VARCHAR(36)  NOT NULL,
          assigned_by  VARCHAR(36)  NOT NULL,
          status       ENUM('pending_confirm','accepted','rejected') DEFAULT 'pending_confirm',
          reject_note  TEXT         NULL,
          created_at   TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
          responded_at TIMESTAMP    NULL,
          FOREIGN KEY (ticket_id)   REFERENCES tickets(id) ON DELETE CASCADE,
          FOREIGN KEY (padal_id)    REFERENCES users(id)   ON DELETE CASCADE,
          FOREIGN KEY (assigned_by) REFERENCES users(id)   ON DELETE CASCADE,
          INDEX idx_assign_ticket (ticket_id),
          INDEX idx_assign_padal  (padal_id),
          INDEX idx_assign_status (status)
        )
      `);
      await connection.query(`
        CREATE TABLE IF NOT EXISTS padal_shifts (
          id          VARCHAR(36)  PRIMARY KEY,
          padal_id    VARCHAR(36)  NOT NULL UNIQUE,
          shift_start DATE         NOT NULL,
          shift_end   DATE         NOT NULL,
          notes       TEXT         NULL,
          created_at  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
          updated_at  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          FOREIGN KEY (padal_id) REFERENCES users(id) ON DELETE CASCADE
        )
      `);
      logger.info('Critical tables verified/created successfully');
    } catch (tableErr) {
      logger.warn('Could not auto-create tables on startup', { error: tableErr.message });
    }
    connection.release();
  })
  .catch(err => {
    logger.error('Database connection failed', { error: err.message });
    if (process.env.NODE_ENV !== 'test') {
      process.exit(1);
    }
  });

// Handle pool events
pool.on('connection', (connection) => {
  logger.info(`New database connection established`, { threadId: connection.threadId });
});

pool.on('error', (err) => {
  logger.error('Database pool error', { error: err.message });
});

module.exports = pool;
