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

// Test connection on startup
const logger = require('../utils/logger');
pool.getConnection()
  .then(connection => {
    logger.info('Database connected successfully');
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
