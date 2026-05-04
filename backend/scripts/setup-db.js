#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });

const dbHost = process.env.DB_HOST || 'localhost';
const dbPort = parseInt(process.env.DB_PORT || '3306', 10);
const dbUser = process.env.DB_USER || 'root';
const dbPassword = process.env.DB_PASS || process.env.DB_PASSWORD || '';
const dbName = process.env.DB_NAME || 'helpdesk_db';

// Optional: seed admin flag
const shouldSeedAdmin = process.argv.includes('--seed-admin');

const schemaPath = path.resolve(__dirname, '..', 'sql', 'schema.sql');
const uploadsPath = path.resolve(__dirname, '..', 'uploads');
const logsPath = path.resolve(__dirname, '..', 'logs');

function splitSqlStatements(content) {
  return content
    .split(/;\s*(?:\r?\n|$)/)
    .map((statement) => statement.trim())
    .filter(Boolean);
}

async function ensureDatabase(connection) {
  await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``);
}

async function applySchema(connection, schemaSql) {
  const statements = splitSqlStatements(schemaSql);

  for (const statement of statements) {
    // The schema file contains explicit CREATE/USE for helpdesk_db; ignore USE and normalize DB name.
    if (/^USE\s+/i.test(statement)) {
      continue;
    }

    if (/^CREATE\s+DATABASE\s+/i.test(statement)) {
      continue;
    }

    await connection.query(statement);
  }
}

async function main() {
  if (!fs.existsSync(schemaPath)) {
    throw new Error(`Schema file not found: ${schemaPath}`);
  }

  const schemaSql = fs.readFileSync(schemaPath, 'utf8');

  console.log('==========================================');
  console.log('Helpdesk IT - Database Setup (Node)');
  console.log('==========================================');
  console.log(`Host: ${dbHost}`);
  console.log(`Port: ${dbPort}`);
  console.log(`User: ${dbUser}`);
  console.log(`Database: ${dbName}`);

  const adminConnection = await mysql.createConnection({
    host: dbHost,
    port: dbPort,
    user: dbUser,
    password: dbPassword,
    multipleStatements: false,
  });

  try {
    await adminConnection.query('SELECT 1');
    console.log('Database connection successful');

    await ensureDatabase(adminConnection);
    console.log('Database ensured');
  } finally {
    await adminConnection.end();
  }

  const dbConnection = await mysql.createConnection({
    host: dbHost,
    port: dbPort,
    user: dbUser,
    password: dbPassword,
    database: dbName,
    multipleStatements: false,
  });

  try {
    await applySchema(dbConnection, schemaSql);
    console.log('Schema migration completed');
  } finally {
    await dbConnection.end();
  }

  fs.mkdirSync(uploadsPath, { recursive: true });
  fs.mkdirSync(logsPath, { recursive: true });
  console.log('Directories ensured: uploads, logs');

  // Seed admin account from environment variables (never from hardcoded values)
  if (shouldSeedAdmin) {
    const adminEmail = process.env.SEED_ADMIN_EMAIL;
    const adminPassword = process.env.SEED_ADMIN_PASSWORD;
    const adminName = process.env.SEED_ADMIN_NAME || 'Super Admin';
    const adminUsername = process.env.SEED_ADMIN_USERNAME || 'admin';

    if (!adminEmail || !adminPassword) {
      console.error('ERROR: --seed-admin requires SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD environment variables');
      process.exit(1);
    }

    if (adminPassword.length < 12) {
      console.error('ERROR: SEED_ADMIN_PASSWORD must be at least 12 characters');
      process.exit(1);
    }

    const bcrypt = require('bcryptjs');
    const { v4: uuidv4 } = require('uuid');
    const BCRYPT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS || '10', 10);
    const passwordHash = await bcrypt.hash(adminPassword, BCRYPT_ROUNDS);

    const seedConn = await mysql.createConnection({
      host: dbHost, port: dbPort, user: dbUser, password: dbPassword, database: dbName,
    });
    try {
      await seedConn.query(
        `INSERT INTO users (id, name, email, username, password_hash, role, is_active, language, theme)
         VALUES (?, ?, ?, ?, ?, 'Subtekinfo', TRUE, 'ID', 'light')
         ON DUPLICATE KEY UPDATE name=VALUES(name)`,
        [uuidv4(), adminName, adminEmail, adminUsername, passwordHash]
      );
      console.log(`Admin account seeded for: ${adminEmail}`);
    } finally {
      await seedConn.end();
    }
  }

  console.log('==========================================');
  console.log('Setup completed successfully');
  console.log('==========================================');
}

main().catch((error) => {
  console.error('Database setup failed:', error && error.message ? error.message : error);
  if (error && error.code) {
    console.error('Error code:', error.code);
  }
  process.exit(1);
});
