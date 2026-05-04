/**
 * TicketService Unit Tests
 *
 * All DB and cache calls are mocked — no real database connection required.
 *
 * Coverage:
 *  - buildKey             (pure utility)
 *  - invalidateTicketCaches
 *  - getTicketById        (cache hit / miss)
 *  - getTickets           (filtering, pagination, cache, sort whitelist)
 *  - createTicket
 *  - updateTicket         (field whitelist, soft-delete guard)
 *  - deleteTicket
 *  - generateTicketNumber (atomic sequence, same-connection usage)
 */

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test_jwt_secret_that_is_at_least_32_chars_long';
process.env.JWT_REFRESH_SECRET = 'test_refresh_secret_that_is_at_least_32';

// ─── Mock modules ────────────────────────────────────────────────────────────

const mockQuery = jest.fn();
const mockGetConnection = jest.fn();

jest.mock('../../src/config/db', () => ({
  query: mockQuery,
  getConnection: mockGetConnection,
}));

const mockCacheGet = jest.fn().mockResolvedValue(null);
const mockCacheSet = jest.fn().mockResolvedValue(true);
const mockCacheDel = jest.fn().mockResolvedValue(true);
const mockCacheDelByPattern = jest.fn().mockResolvedValue(true);

jest.mock('../../src/utils/cache', () => ({
  cache: {
    get: mockCacheGet,
    set: mockCacheSet,
    del: mockCacheDel,
    delByPattern: mockCacheDelByPattern,
  },
}));

jest.mock('uuid', () => ({ v4: () => 'mock-uuid-1234' }));

jest.mock('../../src/utils/logger', () => ({
  info: jest.fn(), warn: jest.fn(), error: jest.fn(),
  performance: jest.fn(), security: jest.fn(),
}));

const TicketService = require('../../src/services/TicketService');

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeTicketRow(overrides = {}) {
  return {
    id: 'ticket-1',
    ticket_number: 'TKT-202605-0001',
    title: 'Test Ticket',
    description: 'desc',
    status: 'Pending',
    user_id: 'user-1',
    deleted_at: null,
    created_at: new Date('2026-05-04'),
    updated_at: new Date('2026-05-04'),
    reporter_name: 'Alice',
    technician_name: null,
    padal_name: null,
    ...overrides,
  };
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('TicketService', () => {
  beforeEach(() => {
    // resetAllMocks clears the mockResolvedValueOnce queue too (clearAllMocks does not)
    jest.resetAllMocks();
    mockCacheGet.mockResolvedValue(null);
  });

  // ── buildKey ─────────────────────────────────────────────────────────────

  describe('buildKey', () => {
    test('returns prefix only when payload is empty', () => {
      expect(TicketService.buildKey('tickets:list')).toBe('tickets:list');
    });

    test('serializes payload keys in sorted order', () => {
      const key = TicketService.buildKey('tickets:list', { z: '1', a: '2' });
      expect(key).toBe('tickets:list:a:2|z:1');
    });
  });

  // ── invalidateTicketCaches ───────────────────────────────────────────────

  describe('invalidateTicketCaches', () => {
    test('deletes specific ticket cache when id is provided', async () => {
      await TicketService.invalidateTicketCaches('ticket-1');
      expect(mockCacheDel).toHaveBeenCalledWith('ticket:ticket-1');
      expect(mockCacheDelByPattern).toHaveBeenCalledWith('tickets:list:*');
    });

    test('does not call del for specific ticket when no id provided', async () => {
      await TicketService.invalidateTicketCaches();
      expect(mockCacheDel).not.toHaveBeenCalledWith(expect.stringContaining('ticket:'));
      expect(mockCacheDelByPattern).toHaveBeenCalledWith('tickets:list:*');
    });
  });

  // ── getTicketById ────────────────────────────────────────────────────────

  describe('getTicketById', () => {
    test('returns cached value without hitting DB', async () => {
      const ticket = makeTicketRow();
      mockCacheGet.mockResolvedValueOnce(ticket);

      const result = await TicketService.getTicketById('ticket-1');

      expect(result).toEqual(ticket);
      expect(mockQuery).not.toHaveBeenCalled();
    });

    test('fetches from DB on cache miss and caches result', async () => {
      const ticket = makeTicketRow();
      mockQuery.mockResolvedValueOnce([[ticket]]);

      const result = await TicketService.getTicketById('ticket-1');

      expect(result).toEqual(ticket);
      expect(mockQuery).toHaveBeenCalledTimes(1);
      expect(mockCacheSet).toHaveBeenCalledWith('ticket:ticket-1', ticket, 3600);
    });

    test('returns null when ticket not found', async () => {
      mockQuery.mockResolvedValueOnce([[]]); // no rows

      const result = await TicketService.getTicketById('non-existent');

      expect(result).toBeNull();
      expect(mockCacheSet).not.toHaveBeenCalled();
    });
  });

  // ── getTickets ───────────────────────────────────────────────────────────

  describe('getTickets', () => {
    function setupGetTicketsMocks(rows = [], total = 0) {
      // count query
      mockQuery.mockResolvedValueOnce([[{ total }]]);
      // list query
      mockQuery.mockResolvedValueOnce([rows]);
    }

    test('returns paginated tickets from DB on cache miss', async () => {
      const ticket = makeTicketRow();
      setupGetTicketsMocks([ticket], 1);

      const result = await TicketService.getTickets({}, { page: 1, perPage: 10 });

      expect(result.tickets).toHaveLength(1);
      expect(result.pagination.total).toBe(1);
      expect(mockCacheSet).toHaveBeenCalled();
    });

    test('returns cached list without running any DB query', async () => {
      const cached = { tickets: [makeTicketRow()], pagination: { page: 1, perPage: 10, total: 1, totalPages: 1 } };
      mockCacheGet.mockResolvedValueOnce(cached);

      const result = await TicketService.getTickets({}, { page: 1, perPage: 10 });

      expect(result).toEqual(cached);
      expect(mockQuery).not.toHaveBeenCalled();
    });

    test('clamps perPage to MAX_PER_PAGE (100)', async () => {
      setupGetTicketsMocks([], 0);
      await TicketService.getTickets({}, { page: 1, perPage: 999 });

      // The LIMIT value in the query params should be 100, not 999
      const lastCall = mockQuery.mock.calls[mockQuery.mock.calls.length - 1];
      const params = lastCall[1];
      expect(params).toContain(100);
      expect(params).not.toContain(999);
    });

    test('defaults to created_at DESC when unknown sort field provided', async () => {
      setupGetTicketsMocks([], 0);
      await TicketService.getTickets({ sort: 'injected_field', order: 'asc' }, {});

      const query = mockQuery.mock.calls[mockQuery.mock.calls.length - 1][0];
      expect(query).toMatch(/ORDER BY t\.created_at ASC/i);
      expect(query).not.toContain('injected_field');
    });

    test('applies status filter', async () => {
      setupGetTicketsMocks([], 0);
      await TicketService.getTickets({ status: 'Pending' }, {});

      const callArgs = mockQuery.mock.calls.find(call => call[1]?.includes('Pending'));
      expect(callArgs).toBeDefined();
    });
  });

  // ── createTicket ─────────────────────────────────────────────────────────

  describe('createTicket', () => {
    test('inserts ticket and returns ticket object with generated id', async () => {
      // Mock generateTicketNumber: getConnection + INSERT + SELECT LAST_INSERT_ID
      const mockConn = {
        query: jest.fn()
          .mockResolvedValueOnce([{}]) // INSERT into ticket_sequences
          .mockResolvedValueOnce([[{ seq: 1 }]]), // SELECT LAST_INSERT_ID
        release: jest.fn(),
      };
      mockGetConnection.mockResolvedValueOnce(mockConn);

      // Mock the INSERT tickets query
      mockQuery.mockResolvedValueOnce([{ insertId: 1 }]);
      // Mock invalidateTicketCaches — del + delByPattern
      mockCacheDel.mockResolvedValue(true);
      mockCacheDelByPattern.mockResolvedValue(true);

      const result = await TicketService.createTicket({
        title: 'Test',
        description: 'desc',
        category: 'Hardware',
        user_id: 'user-1',
      });

      expect(result.id).toBe('mock-uuid-1234');
      expect(result.title).toBe('Test');
      expect(result.ticket_number).toMatch(/^TKT-\d{6}-\d{4}$/);
    });
  });

  // ── updateTicket ─────────────────────────────────────────────────────────

  describe('updateTicket', () => {
    test('throws when unknown field is provided', async () => {
      await expect(
        TicketService.updateTicket('ticket-1', { injected_col: 'value' })
      ).rejects.toThrow("Field 'injected_col' tidak diizinkan");
    });

    test('throws when updateData is empty', async () => {
      await expect(
        TicketService.updateTicket('ticket-1', {})
      ).rejects.toThrow('No fields to update');
    });

    test('executes UPDATE with soft-delete guard and returns updated ticket', async () => {
      // UPDATE query
      mockQuery.mockResolvedValueOnce([{ affectedRows: 1 }]);
      // getTicketById: cache miss → DB query (mysql2 returns [rows, fields])
      mockQuery.mockResolvedValueOnce([[makeTicketRow({ status: 'Proses' })]]);

      const result = await TicketService.updateTicket('ticket-1', { status: 'Proses' });

      const updateCall = mockQuery.mock.calls[0];
      expect(updateCall[0]).toContain('deleted_at IS NULL');
      expect(result.status).toBe('Proses');
    });
  });

  // ── deleteTicket ─────────────────────────────────────────────────────────

  describe('deleteTicket', () => {
    test('performs soft delete (sets deleted_at) not hard DELETE', async () => {
      mockQuery.mockResolvedValueOnce([{ affectedRows: 1 }]);

      await TicketService.deleteTicket('ticket-1');

      const [sql] = mockQuery.mock.calls[0];
      expect(sql).toMatch(/SET deleted_at = NOW/i);
      expect(sql).not.toMatch(/^DELETE/i);
    });
  });

  // ── generateTicketNumber ─────────────────────────────────────────────────

  describe('generateTicketNumber', () => {
    test('returns formatted ticket number TKT-YYYYMM-NNNN', async () => {
      const mockConn = {
        query: jest.fn()
          .mockResolvedValueOnce([{}])        // INSERT/UPDATE sequence row
          .mockResolvedValueOnce([[{ seq: 5 }]]), // SELECT LAST_INSERT_ID
        release: jest.fn(),
      };
      mockGetConnection.mockResolvedValueOnce(mockConn);

      const number = await TicketService.generateTicketNumber();

      expect(number).toMatch(/^TKT-\d{6}-0005$/);
    });

    test('uses provided executor connection (does not call getConnection)', async () => {
      const mockConn = {
        query: jest.fn()
          .mockResolvedValueOnce([{}])
          .mockResolvedValueOnce([[{ seq: 10 }]]),
        release: jest.fn(),
      };

      await TicketService.generateTicketNumber(mockConn);

      expect(mockGetConnection).not.toHaveBeenCalled();
      // release should NOT be called when executor was provided by caller
      expect(mockConn.release).not.toHaveBeenCalled();
    });
  });

});
