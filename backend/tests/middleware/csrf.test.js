/**
 * CSRF Middleware Tests
 *
 * Covers:
 * - Excluded paths (/auth/login, /auth/register) → always pass (no CSRF check)
 * - GET/HEAD/OPTIONS requests → always pass (safe methods)
 * - POST with no CSRF token → 403
 * - POST with wrong CSRF token → 403
 * - POST with correct token but timing-safe comparison → passes
 * - POST with different-length token → 403 (no timing leak)
 */

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test_jwt_secret_that_is_at_least_32_chars_long';

jest.mock('../../src/utils/logger', () => ({
  info: jest.fn(), warn: jest.fn(), error: jest.fn(),
}));
jest.mock('../../src/utils/metrics', () => ({
  markCacheHit: jest.fn(), markCacheMiss: jest.fn(),
  metricsMiddleware: (req, res, next) => next(),
}));

const { csrfProtection: csrf, CSRF_COOKIE_NAME } = require('../../src/middleware/csrf');

function makeReq({ method = 'POST', path = '/api/tickets', headers = {}, cookies = {} } = {}) {
  // Build cookie header string from object so parseCookies(req) works correctly
  const cookieStr = Object.entries(cookies)
    .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
    .join('; ');
  return {
    method,
    path,
    headers: { ...headers, ...(cookieStr ? { cookie: cookieStr } : {}) },
  };
}

function makeRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json   = jest.fn().mockReturnValue(res);
  return res;
}

const CSRF_HEADER_NAME = 'x-csrf-token';

// ──────────────────────────────────────────────────────────────
describe('csrf middleware', () => {
  test('skips check for GET requests', () => {
    const req  = makeReq({ method: 'GET' });
    const res  = makeRes();
    const next = jest.fn();

    csrf(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });

  test('skips check for HEAD requests', () => {
    const req  = makeReq({ method: 'HEAD' });
    const res  = makeRes();
    const next = jest.fn();

    csrf(req, res, next);
    expect(next).toHaveBeenCalledTimes(1);
  });

  test('skips check for /auth/login', () => {
    const req  = makeReq({ method: 'POST', path: '/auth/login' });
    const res  = makeRes();
    const next = jest.fn();

    csrf(req, res, next);
    expect(next).toHaveBeenCalledTimes(1);
  });

  test('skips check for /auth/register', () => {
    const req  = makeReq({ method: 'POST', path: '/auth/register' });
    const res  = makeRes();
    const next = jest.fn();

    csrf(req, res, next);
    expect(next).toHaveBeenCalledTimes(1);
  });

  test('returns 403 when no CSRF token is provided', () => {
    const req  = makeReq({ method: 'POST', path: '/api/tickets', headers: {}, cookies: {} });
    const res  = makeRes();
    const next = jest.fn();

    csrf(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  test('returns 403 when CSRF header does not match cookie', () => {
    const req = makeReq({
      method:  'POST',
      path:    '/api/tickets',
      headers: { [CSRF_HEADER_NAME]: 'wrong_token' },
      cookies: { [CSRF_COOKIE_NAME]: 'correct_token' },
    });
    const res  = makeRes();
    const next = jest.fn();

    csrf(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  test('returns 403 when header token length differs from cookie (no timing leak)', () => {
    const req = makeReq({
      method:  'POST',
      path:    '/api/tickets',
      headers: { [CSRF_HEADER_NAME]: 'short' },
      cookies: { [CSRF_COOKIE_NAME]: 'a_much_longer_correct_token_value_here' },
    });
    const res  = makeRes();
    const next = jest.fn();

    csrf(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  test('passes when header token matches cookie (timing-safe)', () => {
    const token = 'a_valid_csrf_token_value_that_matches_exactly';
    const req   = makeReq({
      method:  'POST',
      path:    '/api/tickets',
      headers: { [CSRF_HEADER_NAME]: token },
      cookies: { [CSRF_COOKIE_NAME]: token },
    });
    const res  = makeRes();
    const next = jest.fn();

    csrf(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });
});
