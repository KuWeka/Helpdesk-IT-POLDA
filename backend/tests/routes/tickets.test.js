/**
 * Ticket Route Unit Tests
 *
 * These tests mount only the ticket router in a lightweight Express app with all
 * external dependencies (DB pool, cache, TicketService) mocked — no real DB needed.
 *
 * Coverage:
 *  - Unauthenticated requests         → 401
 *  - RBAC: wrong-role DELETE          → 403
 *  - Validation error on create       → 400
 *  - Successful list (Satker)         → 200
 *  - Successful single fetch          → 200 / 404
 */

// ─── Environment ─────────────────────────────────────────────────────────────
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test_jwt_secret_that_is_at_least_32_chars_long';
process.env.JWT_REFRESH_SECRET = 'test_refresh_secret_at_least_32_chars_long';
process.env.DB_HOST = 'localhost';
process.env.DB_PORT = '3306';
process.env.DB_USER = 'root';
process.env.DB_PASS = '';
process.env.DB_NAME = 'helpdesk_db';
process.env.BCRYPT_ROUNDS = '1';

// ─── Mock modules (must come before any require that loads them) ──────────────

const mockQuery = jest.fn();
const mockGetConnection = jest.fn();
jest.mock('../../src/config/db', () => ({
  query: mockQuery,
  getConnection: mockGetConnection,
}));

const mockCache = {
  get: jest.fn().mockResolvedValue(null),
  set: jest.fn().mockResolvedValue(true),
  del: jest.fn().mockResolvedValue(true),
  delByPattern: jest.fn().mockResolvedValue(true),
  exists: jest.fn().mockResolvedValue(false),
};
// auth.js requires the module as-is and calls cache.exists directly;
// services destructure { cache }. Expose methods at both levels.
jest.mock('../../src/utils/cache', () => ({ ...mockCache, cache: mockCache }));
jest.mock('../../src/utils/logger', () => ({
  info: jest.fn(), warn: jest.fn(), error: jest.fn(),
  performance: jest.fn(), security: jest.fn(),
}));
jest.mock('../../src/utils/metrics', () => ({
  metricsMiddleware: (_req, _res, next) => next(),
}));

const mockTicketService = {
  getTickets: jest.fn(),
  getTicketById: jest.fn(),
  createTicket: jest.fn(),
  updateTicket: jest.fn(),
  deleteTicket: jest.fn(),
  generateTicketNumber: jest.fn(),
  getTicketStats: jest.fn(),
  invalidateTicketCaches: jest.fn(),
};
jest.mock('../../src/services/TicketService', () => mockTicketService);
jest.mock('../../src/utils/dashboardCache', () => ({
  invalidateAllDashboardCaches: jest.fn().mockResolvedValue(true),
}));

// ─── Test setup ──────────────────────────────────────────────────────────────

const express = require('express');
const request = require('supertest');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET;

function signJwt(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });
}

function makeApp() {
  const app = express();
  app.use(express.json());

  // CSRF is skipped for GET requests; for POST/PATCH/DELETE in tests we set
  // matching cookie + header so the middleware passes.
  const { csrfProtection } = require('../../src/middleware/csrf');
  app.use(csrfProtection);

  app.use('/api/tickets', require('../../src/routes/tickets'));

  // Minimal error handler
  app.use((err, _req, res, _next) => {
    res.status(err.status || 500).json({ success: false, message: err.message });
  });

  return app;
}

// Helper: add auth cookie + optional CSRF to a supertest chain
function withAuth(req, token, csrfToken = null) {
  const cookieName = process.env.ACCESS_TOKEN_COOKIE_NAME || 'helpdesk_access_token';
  const csrfCookieName = process.env.CSRF_COOKIE_NAME || 'helpdesk_csrf_token';

  let cookieStr = `${cookieName}=${token}`;
  if (csrfToken) {
    cookieStr += `; ${csrfCookieName}=${csrfToken}`;
    req = req.set('x-csrf-token', csrfToken);
  }
  return req.set('Cookie', cookieStr);
}

const SATKER_TOKEN = signJwt({ id: 'user-satker-1', role: 'Satker', name: 'Budi' });
const PADAL_TOKEN  = signJwt({ id: 'user-padal-1',  role: 'Padal',  name: 'Citra' });
const CSRF_VALUE   = 'test-csrf-token-abc123';

const sampleTicket = {
  id: 'ticket-1',
  ticket_number: 'TKT-202605-0001',
  title: 'Printer mati',
  description: 'Printer di lantai 2 tidak menyala',
  category: 'Hardware',
  status: 'Open',
  user_id: 'user-satker-1',
};

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('GET /api/tickets', () => {
  let app;

  beforeAll(() => {
    app = makeApp();
  });

  beforeEach(() => {
    jest.resetAllMocks();
    mockCache.get.mockResolvedValue(null);
    mockCache.exists.mockResolvedValue(false);
  });

  test('returns 401 when no auth token provided', async () => {
    const res = await request(app).get('/api/tickets');
    expect(res.status).toBe(401);
  });

  test('returns 200 with ticket list for authenticated Satker', async () => {
    // pool.query for role check inside route
    mockQuery.mockResolvedValueOnce([[{ role: 'Satker' }]]);
    // TicketService.getTickets
    mockTicketService.getTickets.mockResolvedValueOnce({
      tickets: [sampleTicket],
      pagination: { page: 1, perPage: 10, total: 1, totalPages: 1 },
    });

    const res = await withAuth(
      request(app).get('/api/tickets'),
      SATKER_TOKEN
    );

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('success', true);
    // ApiResponse.paginated puts data directly in body.data array
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.meta.pagination.total).toBe(1);
  });

  test('returns 401 when token is blacklisted', async () => {
    mockCache.exists.mockResolvedValueOnce(true); // token blacklisted

    const res = await withAuth(
      request(app).get('/api/tickets'),
      SATKER_TOKEN
    );

    expect(res.status).toBe(401);
  });
});

describe('GET /api/tickets/:id', () => {
  let app;

  beforeAll(() => {
    app = makeApp();
  });

  beforeEach(() => {
    jest.resetAllMocks();
    mockCache.get.mockResolvedValue(null);
    mockCache.exists.mockResolvedValue(false);
  });

  test('returns 200 for valid ticket (reporter viewing own ticket)', async () => {
    // GET /:id does direct pool.query (not TicketService)
    // 1st call: get ticket row; 2nd call: role check
    mockQuery
      .mockResolvedValueOnce([[{ ...sampleTicket }]])        // ticket row
      .mockResolvedValueOnce([[{ role: 'Satker' }]]);        // role check

    const res = await withAuth(
      request(app).get('/api/tickets/ticket-1'),
      SATKER_TOKEN
    );

    expect(res.status).toBe(200);
    expect(res.body.id).toBe('ticket-1');
  });

  test('returns 404 when ticket does not exist', async () => {
    // 1st call: no ticket row
    mockQuery.mockResolvedValueOnce([[]]); // ticket not found

    const res = await withAuth(
      request(app).get('/api/tickets/ghost-id'),
      SATKER_TOKEN
    );

    expect(res.status).toBe(404);
  });
});

describe('POST /api/tickets', () => {
  let app;

  beforeAll(() => {
    app = makeApp();
  });

  beforeEach(() => {
    jest.resetAllMocks();
    mockCache.get.mockResolvedValue(null);
    mockCache.exists.mockResolvedValue(false);
  });

  test('returns 400 when required fields are missing', async () => {
    mockQuery.mockResolvedValueOnce([[{ role: 'Satker' }]]);

    const res = await withAuth(
      request(app)
        .post('/api/tickets')
        .send({ title: '' }) // missing description, category
        .set('Content-Type', 'application/json'),
      SATKER_TOKEN,
      CSRF_VALUE
    );

    // Validation middleware returns 400 for Joi errors
    expect(res.status).toBe(400);
  });

  test('returns 403 when Padal tries to create a ticket', async () => {
    mockQuery.mockResolvedValueOnce([[{ role: 'Padal' }]]);

    const payload = {
      title: 'Test tiket',
      description: 'Deskripsi tiket test yang cukup panjang',
      category: 'Hardware',
      location: 'Lantai 1',
    };

    const res = await withAuth(
      request(app)
        .post('/api/tickets')
        .send(payload)
        .set('Content-Type', 'application/json'),
      PADAL_TOKEN,
      CSRF_VALUE
    );

    expect(res.status).toBe(403);
  });
});

describe('DELETE /api/tickets/:id', () => {
  let app;

  beforeAll(() => {
    app = makeApp();
  });

  beforeEach(() => {
    jest.resetAllMocks();
    mockCache.get.mockResolvedValue(null);
    mockCache.exists.mockResolvedValue(false);
  });

  test('returns 403 when Satker tries to delete a ticket', async () => {
    mockQuery.mockResolvedValueOnce([[{ role: 'Satker' }]]);

    const res = await withAuth(
      request(app).delete('/api/tickets/ticket-1'),
      SATKER_TOKEN,
      CSRF_VALUE
    );

    expect(res.status).toBe(403);
  });
});
