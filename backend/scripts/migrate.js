#!/usr/bin/env node
/**
 * Migration runner with version tracking.
 *
 * Applied migrations are recorded in the `schema_migrations` table so:
 *  - Re-running the script is idempotent (already-applied migrations are skipped).
 *  - You can query `SELECT * FROM schema_migrations ORDER BY applied_at` to see history.
 */

const mysql = require('mysql2/promise');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const dbHost = process.env.DB_HOST || 'localhost';
const dbPort = parseInt(process.env.DB_PORT || '3306', 10);
const dbUser = process.env.DB_USER || 'root';
const dbPassword = process.env.DB_PASS || process.env.DB_PASSWORD || '';
const dbName = process.env.DB_NAME || 'helpdesk_db';

const indexMigrations = [
  {
    table: 'chats',
    index: 'idx_chats_user_id',
    sql: 'ALTER TABLE chats ADD INDEX idx_chats_user_id (user_id)'
  },
  {
    table: 'chats',
    index: 'idx_chats_technician_id',
    sql: 'ALTER TABLE chats ADD INDEX idx_chats_technician_id (technician_id)'
  },
  {
    table: 'chats',
    index: 'idx_chats_ticket_id',
    sql: 'ALTER TABLE chats ADD INDEX idx_chats_ticket_id (ticket_id)'
  },
  {
    table: 'chats',
    index: 'idx_chats_updated_at',
    sql: 'ALTER TABLE chats ADD INDEX idx_chats_updated_at (updated_at)'
  },
  {
    table: 'users',
    index: 'idx_users_role_is_active',
    sql: 'ALTER TABLE users ADD INDEX idx_users_role_is_active (role, is_active)'
  },
  {
    table: 'tickets',
    index: 'idx_tickets_status_created_at',
    sql: 'ALTER TABLE tickets ADD INDEX idx_tickets_status_created_at (status, created_at)'
  },
  {
    table: 'tickets',
    index: 'idx_tickets_status_closed_at',
    sql: 'ALTER TABLE tickets ADD INDEX idx_tickets_status_closed_at (status, closed_at)'
  },
  {
    table: 'messages',
    index: 'idx_messages_chat_id_created_at',
    sql: 'ALTER TABLE messages ADD INDEX idx_messages_chat_id_created_at (chat_id, created_at)'
  },
  {
    table: 'messages',
    index: 'idx_messages_sender_id',
    sql: 'ALTER TABLE messages ADD INDEX idx_messages_sender_id (sender_id)'
  },
  {
    table: 'messages',
    index: 'idx_messages_created_at',
    sql: 'ALTER TABLE messages ADD INDEX idx_messages_created_at (created_at)'
  },
];

async function ensureMigrationsTable(connection) {
  await connection.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id           INT AUTO_INCREMENT PRIMARY KEY,
      migration_id VARCHAR(255) NOT NULL UNIQUE COMMENT 'Unique identifier, e.g. table:index_name',
      applied_at   TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
      checksum     VARCHAR(64)  NULL COMMENT 'Optional SHA-256 of migration SQL for drift detection'
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);
}

async function isAlreadyRecorded(connection, migrationId) {
  const [rows] = await connection.query(
    'SELECT 1 FROM schema_migrations WHERE migration_id = ? LIMIT 1',
    [migrationId]
  );
  return rows.length > 0;
}

async function recordMigration(connection, migrationId) {
  await connection.query(
    'INSERT IGNORE INTO schema_migrations (migration_id) VALUES (?)',
    [migrationId]
  );
}

async function addIndexIfMissing(connection, migration) {
  const migrationId = `${migration.table}:${migration.index}`;

  // Check version-tracking table first (fast path)
  if (await isAlreadyRecorded(connection, migrationId)) {
    console.log(`- Skipping ${migration.index} (recorded in schema_migrations)`);
    return;
  }

  // Also check information_schema in case migration was applied outside this script
  const [rows] = await connection.query(
    `
      SELECT 1
      FROM information_schema.statistics
      WHERE table_schema = DATABASE()
        AND table_name = ?
        AND index_name = ?
      LIMIT 1
    `,
    [migration.table, migration.index]
  );

  if (rows.length > 0) {
    console.log(`- Skipping ${migration.index} (already exists in DB) — recording in schema_migrations`);
    await recordMigration(connection, migrationId);
    return;
  }

  try {
    await connection.query(migration.sql);
  } catch (err) {
    // Table may have been dropped (e.g. chats/messages removed in revision). Record and skip.
    if (err.code === 'ER_NO_SUCH_TABLE' || err.code === 'ER_DUP_KEYNAME') {
      console.log(`- Skipping ${migration.index} (${err.code})`);
      await recordMigration(connection, migrationId);
      return;
    }
    throw err;
  }
  await recordMigration(connection, migrationId);
  console.log(`- Applied ${migration.index} ✓`);
}

async function runSqlFileMigrations(connection) {
  const migrationsDir = path.join(__dirname, '..', 'sql', 'migrations');
  let files;
  try {
    files = fs.readdirSync(migrationsDir)
      .filter(f => f.endsWith('.sql'))
      .sort(); // ascending order — YYYYMMDD prefix ensures correct sequence
  } catch {
    console.log('No sql/migrations directory found, skipping file migrations.');
    return;
  }

  for (const file of files) {
    const migrationId = `file:${file}`;
    if (await isAlreadyRecorded(connection, migrationId)) {
      console.log(`- Skipping ${file} (already applied)`);
      continue;
    }

    const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');

    // `DELIMITER` is a mysql client directive (not server SQL), so it cannot
    // be executed via mysql2 query(). Skip and record to avoid repeated failures.
    if (/^\s*DELIMITER\b/im.test(sql)) {
      console.log(`- Skipping ${file} (contains DELIMITER directives not supported by migrate runner)`);
      await recordMigration(connection, migrationId);
      continue;
    }

    // Remove SQL comments so statement splitting remains reliable even with
    // descriptive headers in migration files.
    const sqlWithoutComments = sql
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .split('\n')
      .map((line) => line.replace(/--.*$/, ''))
      .join('\n');

    // Split on semicolons and run each statement individually
    const statements = sqlWithoutComments
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    for (const stmt of statements) {
      try {
        await connection.query(stmt);
      } catch (err) {
        // IF NOT EXISTS guards make this idempotent — warn but don't abort
        if (err.code === 'ER_DUP_FIELDNAME' || err.code === 'ER_DUP_KEYNAME') {
          console.log(`  (skipped — already exists: ${err.sqlMessage})`);
        } else {
          throw err;
        }
      }
    }

    await recordMigration(connection, migrationId);
    console.log(`- Applied ${file} ✓`);
  }
}

async function main() {
  const connection = await mysql.createConnection({
    host: dbHost,
    port: dbPort,
    user: dbUser,
    password: dbPassword,
    database: dbName,
    multipleStatements: true,
  });

  try {
    console.log(`Applying migrations on ${dbHost}:${dbPort}/${dbName}...`);

    // Ensure the tracking table exists before running any migration
    await ensureMigrationsTable(connection);

    // 1. Index migrations (inline, idempotent)
    for (const migration of indexMigrations) {
      await addIndexIfMissing(connection, migration);
    }

    // 2. SQL file migrations from sql/migrations/*.sql (ordered by filename)
    await runSqlFileMigrations(connection);

    console.log('All migrations completed successfully.');
    const [applied] = await connection.query(
      'SELECT migration_id, applied_at FROM schema_migrations ORDER BY applied_at'
    );
    console.log(`\nApplied migrations (${applied.length} total):`);
    applied.forEach(r => console.log(`  [${r.applied_at.toISOString()}] ${r.migration_id}`));
  } finally {
    await connection.end();
  }
}

if (require.main === module) {
  main().catch((error) => {
    console.error('Migration error:', error && error.message ? error.message : error);
    process.exit(1);
  });
}

/**
 * Run all pending migrations using an existing mysql2 pool (for server.js startup).
 * Idempotent — safe to call on every deploy.
 *
 * @param {import('mysql2/promise').Pool} pool - existing mysql2 pool from config/db
 */
async function runMigrations(pool) {
  const connection = await pool.getConnection();
  try {
    await ensureMigrationsTable(connection);
    for (const migration of indexMigrations) {
      await addIndexIfMissing(connection, migration);
    }
    await runSqlFileMigrations(connection);
  } finally {
    connection.release();
  }
}

module.exports = { runMigrations };
