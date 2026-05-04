/**
 * Env Validation Tests
 *
 * Covers:
 * - All required vars present → no errors
 * - Missing JWT_SECRET → error
 * - JWT_SECRET too short → error
 * - Missing DB_HOST → error
 * - Multiple missing → multiple errors
 * - Test environment → relaxed (missing vars are warnings, not errors)
 */

// Don't call assertEnv in this test — test validateEnv() directly.
const originalEnv = process.env;

beforeEach(() => {
  // Reset env before each test to a clean state
  jest.resetModules();
  process.env = { ...originalEnv };
});

afterAll(() => {
  process.env = originalEnv;
});

function loadValidator() {
  return require('../../src/config/env');
}

function minimalValidEnv() {
  return {
    NODE_ENV:            'development',
    JWT_SECRET:          'a_valid_jwt_secret_that_is_at_least_32_chars_long',
    JWT_REFRESH_SECRET:  'a_valid_refresh_secret_that_is_32plus_chars_long',
    DB_HOST:             'localhost',
    DB_USER:             'root',
    DB_NAME:             'helpdesk_db',
  };
}

// ──────────────────────────────────────────────────────────────
describe('validateEnv', () => {
  test('returns no errors when all required vars are set', () => {
    Object.assign(process.env, minimalValidEnv());
    const { validateEnv } = loadValidator();

    const { errors } = validateEnv();

    expect(errors).toHaveLength(0);
  });

  test('returns error when JWT_SECRET is missing', () => {
    Object.assign(process.env, minimalValidEnv());
    delete process.env.JWT_SECRET;
    const { validateEnv } = loadValidator();

    const { errors } = validateEnv();

    expect(errors.some(e => e.includes('JWT_SECRET'))).toBe(true);
  });

  test('returns error when JWT_SECRET is shorter than 32 chars', () => {
    Object.assign(process.env, minimalValidEnv());
    process.env.JWT_SECRET = 'short';
    const { validateEnv } = loadValidator();

    const { errors } = validateEnv();

    expect(errors.some(e => e.includes('JWT_SECRET') && e.includes('too short'))).toBe(true);
  });

  test('returns error when DB_HOST is missing', () => {
    Object.assign(process.env, minimalValidEnv());
    delete process.env.DB_HOST;
    const { validateEnv } = loadValidator();

    const { errors } = validateEnv();

    expect(errors.some(e => e.includes('DB_HOST'))).toBe(true);
  });

  test('collects multiple errors when multiple vars are missing', () => {
    Object.assign(process.env, minimalValidEnv());
    delete process.env.JWT_SECRET;
    delete process.env.DB_HOST;
    const { validateEnv } = loadValidator();

    const { errors } = validateEnv();

    expect(errors.length).toBeGreaterThanOrEqual(2);
  });

  test('returns additional errors for missing production vars when NODE_ENV=production', () => {
    Object.assign(process.env, minimalValidEnv());
    process.env.NODE_ENV = 'production';
    // intentionally omit CORS_ORIGIN, DB_PASS, REDIS_URL
    delete process.env.CORS_ORIGIN;
    delete process.env.DB_PASS;
    delete process.env.REDIS_URL;
    const { validateEnv } = loadValidator();

    const { errors } = validateEnv();

    expect(errors.some(e => e.includes('CORS_ORIGIN'))).toBe(true);
    expect(errors.some(e => e.includes('DB_PASS'))).toBe(true);
    expect(errors.some(e => e.includes('REDIS_URL'))).toBe(true);
  });

  test('does NOT require vars in test environment', () => {
    // In test env, missing required vars should produce no errors
    process.env = { NODE_ENV: 'test' };
    const { validateEnv } = loadValidator();

    const { errors } = validateEnv();

    // No required-var errors in test environment
    expect(errors).toHaveLength(0);
  });
});
