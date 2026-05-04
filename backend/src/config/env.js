/**
 * Environment Variable Validation
 *
 * Called ONCE at process start (before any module that reads env vars).
 * process.exit(1) on missing required vars so the service never starts
 * in a broken state — better to fail fast than to fail on the first request.
 */

const REQUIRED_VARS = [
  { key: 'JWT_SECRET',         minLength: 32,  description: 'Secret key untuk signing JWT access tokens' },
  { key: 'JWT_REFRESH_SECRET', minLength: 32,  description: 'Secret key untuk signing JWT refresh tokens' },
  { key: 'DB_HOST',            description: 'MySQL database host' },
  { key: 'DB_USER',            description: 'MySQL database username' },
  { key: 'DB_NAME',            description: 'MySQL database name' },
];

/** Required in production only */
const PRODUCTION_REQUIRED_VARS = [
  { key: 'CORS_ORIGIN',        description: 'Comma-separated list of allowed CORS origins (no localhost)' },
  { key: 'DB_PASS',            description: 'MySQL database password' },
  { key: 'REDIS_URL',          description: 'Redis connection URL (e.g. redis://host:6379)' },
];

const OPTIONAL_WITH_WARNINGS = [
  { key: 'REDIS_URL',          description: 'Cache/blacklist disabled without Redis' },
  { key: 'UPLOAD_DIR',         description: 'Defaults to ./uploads — may not persist across restarts' },
];

function validateEnv() {
  const isProduction = process.env.NODE_ENV === 'production';
  const isTest       = process.env.NODE_ENV === 'test';
  const errors       = [];
  const warnings     = [];

  // Always-required vars
  for (const spec of REQUIRED_VARS) {
    const value = process.env[spec.key];

    if (!value || value.trim() === '') {
      if (!isTest) {
        errors.push(`Missing required env var: ${spec.key} — ${spec.description}`);
      }
      continue;
    }

    if (spec.minLength && value.length < spec.minLength) {
      errors.push(
        `Env var ${spec.key} is too short (${value.length} chars, minimum ${spec.minLength}) — ${spec.description}`
      );
    }
  }

  // Production-only required vars
  if (isProduction) {
    for (const spec of PRODUCTION_REQUIRED_VARS) {
      const value = process.env[spec.key];
      if (!value || value.trim() === '') {
        errors.push(`Missing required env var in production: ${spec.key} — ${spec.description}`);
      }
    }
  }

  // Optional — warn but don't block
  if (!isProduction && !isTest) {
    for (const spec of OPTIONAL_WITH_WARNINGS) {
      if (!process.env[spec.key]) {
        warnings.push(`Optional env var not set: ${spec.key} — ${spec.description}`);
      }
    }
  }

  return { errors, warnings };
}

/**
 * Run validation and exit on errors. Call this at the very top of server.js
 * before importing any other local module.
 */
function assertEnv() {
  const { errors, warnings } = validateEnv();

  // Print warnings first (non-fatal)
  for (const warning of warnings) {
    // Use process.stderr directly — logger may not be initialised yet
    process.stderr.write(`[ENV WARN]  ${warning}\n`);
  }

  if (errors.length > 0) {
    process.stderr.write('\n[ENV ERROR] Application startup aborted — fix the following issues:\n');
    for (const error of errors) {
      process.stderr.write(`  ✗ ${error}\n`);
    }
    process.stderr.write(
      '\nCreate a .env file from .env.example and set the missing variables.\n\n'
    );
    process.exit(1);
  }
}

module.exports = { assertEnv, validateEnv };
