/**
 * Auth Middleware Tests
 *
 * Covers:
 * - No token → 401
 * - Invalid token → 401
 * - Expired token → 401
 * - Blacklisted token (after logout) → 401
 * - Valid token → req.user populated, next() called
 */

process.env.JWT_SECRET = 'test_jwt_secret_that_is_at_least_32_chars_long';
process.env.JWT_REFRESH_SECRET = 'test_refresh_secret_that_is_at_least_32_chars';
process.env.NODE_ENV = 'test';

const jwt = require('jsonwebtoken');

// --- Mocks (must happen before requiring auth) ---

const mockCacheExists = jest.fn().mockResolvedValue(false);
jest.mock('../../src/utils/cache', () => ({
  exists: mockCacheExists,
  get: jest.fn(),
  set: jest.fn(),
  del: jest.fn(),
}));

jest.mock('../../src/utils/logger', () => ({
  info: jest.fn(), warn: jest.fn(), error: jest.fn(),
  performance: jest.fn(), security: jest.fn(),
}));

jest.mock('../../src/utils/metrics', () => ({
  markCacheHit: jest.fn(), markCacheMiss: jest.fn(),
  metricsMiddleware: (req, res, next) => next(),
}));

const auth = require('../../src/middleware/auth');

// Helper to build a minimal Express-like request/response
function makeReq(cookieHeader = '') {
  return {
    headers: { cookie: cookieHeader },
  };
}

function makeRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json   = jest.fn().mockReturnValue(res);
  return res;
}

function signToken(payload, options = {}) {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h', ...options });
}

const COOKIE_NAME = process.env.ACCESS_TOKEN_COOKIE_NAME || 'helpdesk_access_token';

// ──────────────────────────────────────────────────────────────
describe('auth middleware', () => {
  beforeEach(() => {
    mockCacheExists.mockResolvedValue(false);
  });

  test('returns 401 when no cookie is present', async () => {
    const req  = makeReq('');
    const res  = makeRes();
    const next = jest.fn();

    await auth(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  test('returns 401 when token is malformed', async () => {
    const req  = makeReq(`${COOKIE_NAME}=not.a.jwt`);
    const res  = makeRes();
    const next = jest.fn();

    await auth(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  test('returns 401 with TokenExpiredError message when token is expired', async () => {
    const token = signToken({ id: 'u1', role: 'Satker' }, { expiresIn: '-1s' });
    const req   = makeReq(`${COOKIE_NAME}=${token}`);
    const res   = makeRes();
    const next  = jest.fn();

    await auth(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    const body = res.json.mock.calls[0][0];
    expect(body.message).toMatch(/kadaluarsa/i);
    expect(next).not.toHaveBeenCalled();
  });

  test('returns 401 when token is blacklisted (user logged out)', async () => {
    mockCacheExists.mockResolvedValue(true); // blacklisted
    const token = signToken({ id: 'u1', role: 'Satker' });
    const req   = makeReq(`${COOKIE_NAME}=${token}`);
    const res   = makeRes();
    const next  = jest.fn();

    await auth(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    const body = res.json.mock.calls[0][0];
    expect(body.message).toMatch(/session/i);
    expect(next).not.toHaveBeenCalled();
  });

  test('calls next() and sets req.user for a valid, non-blacklisted token', async () => {
    const payload = { id: 'u1', role: 'Satker', name: 'Test User' };
    const token   = signToken(payload);
    const req     = makeReq(`${COOKIE_NAME}=${token}`);
    const res     = makeRes();
    const next    = jest.fn();

    await auth(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(req.user.id).toBe('u1');
    expect(req.user.role).toBe('Satker');
  });
});
