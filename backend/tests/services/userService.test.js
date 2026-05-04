/**
 * UserService Unit Tests
 *
 * All DB, cache, and bcrypt calls are mocked — no real database connection required.
 *
 * Coverage:
 *  - buildKey
 *  - invalidateUserCaches
 *  - getUserById          (cache hit / miss)
 *  - getUsers             (filtering, pagination, cache)
 *  - createUser           (hashing, uuid, field mapping)
 *  - updateUser           (field whitelist, password change, unknown field guard)
 *  - deleteUser           (soft delete)
 *  - emailExists          (with and without excludeId)
 *  - usernameExists       (null username, with excludeId)
 */

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test_jwt_secret_that_is_at_least_32_chars_long';
process.env.JWT_REFRESH_SECRET = 'test_refresh_secret_that_is_at_least_32';
process.env.BCRYPT_ROUNDS = '1'; // speed up tests

// ─── Mock modules ────────────────────────────────────────────────────────────

const mockQuery = jest.fn();
jest.mock('../../src/config/db', () => ({ query: mockQuery }));

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

jest.mock('uuid', () => ({ v4: () => 'mock-uuid-user' }));

jest.mock('../../src/utils/logger', () => ({
  info: jest.fn(), warn: jest.fn(), error: jest.fn(),
  performance: jest.fn(), security: jest.fn(),
}));

const bcrypt = require('bcryptjs');
const UserService = require('../../src/services/UserService');

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeUserRow(overrides = {}) {
  return {
    id: 'user-1',
    name: 'Alice',
    email: 'alice@test.com',
    username: 'alice',
    role: 'Satker',
    is_active: 1,
    phone: null,
    language: 'ID',
    theme: 'light',
    created_at: new Date(),
    updated_at: new Date(),
    ...overrides,
  };
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('UserService', () => {
  beforeEach(() => {
    // resetAllMocks clears the mockResolvedValueOnce queue (clearAllMocks does not)
    jest.resetAllMocks();
    mockCacheGet.mockResolvedValue(null);
  });

  // ── buildKey ─────────────────────────────────────────────────────────────

  describe('buildKey', () => {
    test('returns prefix only when payload is empty', () => {
      expect(UserService.buildKey('users:list')).toBe('users:list');
    });

    test('sorts keys alphabetically', () => {
      const key = UserService.buildKey('users:list', { z: 'last', a: 'first' });
      expect(key).toBe('users:list:a:first|z:last');
    });
  });

  // ── invalidateUserCaches ─────────────────────────────────────────────────

  describe('invalidateUserCaches', () => {
    test('deletes specific user cache when id provided', async () => {
      await UserService.invalidateUserCaches('user-1');
      expect(mockCacheDel).toHaveBeenCalledWith('user:user-1');
      expect(mockCacheDelByPattern).toHaveBeenCalledWith('users:list:*');
    });

    test('only invalidates list pattern when no id provided', async () => {
      await UserService.invalidateUserCaches();
      expect(mockCacheDel).not.toHaveBeenCalled();
      expect(mockCacheDelByPattern).toHaveBeenCalledWith('users:list:*');
    });
  });

  // ── getUserById ──────────────────────────────────────────────────────────

  describe('getUserById', () => {
    test('returns cached user without querying DB', async () => {
      const user = makeUserRow();
      mockCacheGet.mockResolvedValueOnce(user);

      const result = await UserService.getUserById('user-1');

      expect(result).toEqual(user);
      expect(mockQuery).not.toHaveBeenCalled();
    });

    test('queries DB on cache miss and caches result', async () => {
      const user = makeUserRow();
      mockQuery.mockResolvedValueOnce([[user]]);

      const result = await UserService.getUserById('user-1');

      expect(result).toEqual(user);
      expect(mockCacheSet).toHaveBeenCalledWith('user:user-1', user, 3600);
    });

    test('returns null when user not found', async () => {
      mockQuery.mockResolvedValueOnce([[]]); // no rows

      const result = await UserService.getUserById('ghost');

      expect(result).toBeNull();
      expect(mockCacheSet).not.toHaveBeenCalled();
    });
  });

  // ── getUsers ─────────────────────────────────────────────────────────────

  describe('getUsers', () => {
    function setupGetUsersMocks(rows = [], total = 0) {
      mockQuery.mockResolvedValueOnce([[{ total }]]); // count
      mockQuery.mockResolvedValueOnce([rows]);         // list
    }

    test('returns paginated result on cache miss', async () => {
      const user = makeUserRow();
      setupGetUsersMocks([user], 1);

      const result = await UserService.getUsers({}, { page: 1, perPage: 10 });

      expect(result.users).toHaveLength(1);
      expect(result.pagination.total).toBe(1);
    });

    test('returns cached list without running list query (count query still runs)', async () => {
      const cached = { users: [makeUserRow()], pagination: { total: 1 } };
      // Count query always runs before the cache check in this service
      mockQuery.mockResolvedValueOnce([[{ total: 1 }]]);
      mockCacheGet.mockResolvedValueOnce(cached);

      const result = await UserService.getUsers({}, { page: 1, perPage: 10 });

      expect(result).toEqual(cached);
      // Only count query should run
      expect(mockQuery).toHaveBeenCalledTimes(1);
    });

    test('clamps perPage to 100', async () => {
      setupGetUsersMocks([], 0);
      await UserService.getUsers({}, { page: 1, perPage: 9999 });

      const lastCall = mockQuery.mock.calls[mockQuery.mock.calls.length - 1];
      expect(lastCall[1]).toContain(100);
      expect(lastCall[1]).not.toContain(9999);
    });
  });

  // ── createUser ───────────────────────────────────────────────────────────

  describe('createUser', () => {
    test('hashes password and returns user without password_hash', async () => {
      mockQuery.mockResolvedValueOnce([{ insertId: 1 }]); // INSERT

      const result = await UserService.createUser({
        name: 'Bob',
        email: 'bob@test.com',
        password: 'Password1!',
        role: 'Satker',
      });

      expect(result).not.toHaveProperty('password_hash');
      expect(result.name).toBe('Bob');
      expect(result.id).toBe('mock-uuid-user');
    });

    test('assigns defaults for language and theme', async () => {
      mockQuery.mockResolvedValueOnce([{}]);

      const result = await UserService.createUser({
        name: 'Carol',
        email: 'carol@test.com',
        role: 'Padal',
      });

      expect(result.language).toBe('ID');
      expect(result.theme).toBe('light');
      expect(result.is_active).toBe(true);
    });
  });

  // ── updateUser ───────────────────────────────────────────────────────────

  describe('updateUser', () => {
    test('throws when trying to update an unknown field', async () => {
      await expect(
        UserService.updateUser('user-1', { malicious_field: 'DROP TABLE' })
      ).rejects.toThrow("Field 'malicious_field' tidak diizinkan");
    });

    test('throws when oldPassword missing during password change', async () => {
      await expect(
        UserService.updateUser('user-1', { password: 'NewPass1!' })
      ).rejects.toThrow('Password lama wajib diisi');
    });

    test('throws when old password does not match', async () => {
      const hash = await bcrypt.hash('CorrectOld1!', 1);
      mockQuery.mockResolvedValueOnce([[{ password_hash: hash }]]);

      await expect(
        UserService.updateUser('user-1', { oldPassword: 'WrongOld1!', password: 'NewPass1!' })
      ).rejects.toThrow('Password lama tidak sesuai');
    });

    test('successfully updates allowed fields', async () => {
      mockQuery.mockResolvedValueOnce([{ affectedRows: 1 }]);          // UPDATE
      mockQuery.mockResolvedValueOnce([[makeUserRow({ name: 'Alice Updated' })]]); // getUserById

      const result = await UserService.updateUser('user-1', { name: 'Alice Updated' });

      const updateSql = mockQuery.mock.calls[0][0];
      expect(updateSql).toContain('SET');
      expect(updateSql).not.toContain('malicious');
      expect(result.name).toBe('Alice Updated');
    });
  });

  // ── deleteUser ───────────────────────────────────────────────────────────

  describe('deleteUser', () => {
    test('performs soft delete (is_active = false + deleted_at) not hard DELETE', async () => {
      mockQuery.mockResolvedValueOnce([{ affectedRows: 1 }]);

      await UserService.deleteUser('user-1');

      const [sql] = mockQuery.mock.calls[0];
      expect(sql).toMatch(/SET is_active = false/i);
      expect(sql).toMatch(/deleted_at = NOW/i);
      expect(sql).not.toMatch(/^DELETE/i);
    });
  });

  // ── emailExists ──────────────────────────────────────────────────────────

  describe('emailExists', () => {
    test('returns true when email found', async () => {
      mockQuery.mockResolvedValueOnce([[{ id: 'user-1' }]]);

      expect(await UserService.emailExists('alice@test.com')).toBe(true);
    });

    test('returns false when no match', async () => {
      mockQuery.mockResolvedValueOnce([[]]);

      expect(await UserService.emailExists('nobody@test.com')).toBe(false);
    });

    test('excludes specified id (for self-update scenario)', async () => {
      mockQuery.mockResolvedValueOnce([[]]);

      await UserService.emailExists('alice@test.com', 'user-1');

      const [sql, params] = mockQuery.mock.calls[0];
      expect(sql).toContain('AND id != ?');
      expect(params).toContain('user-1');
    });
  });

  // ── usernameExists ───────────────────────────────────────────────────────

  describe('usernameExists', () => {
    test('returns false immediately when username is null/undefined', async () => {
      expect(await UserService.usernameExists(null)).toBe(false);
      expect(mockQuery).not.toHaveBeenCalled();
    });

    test('returns true when username found', async () => {
      mockQuery.mockResolvedValueOnce([[{ id: 'user-1' }]]);

      expect(await UserService.usernameExists('alice')).toBe(true);
    });

    test('excludes specified id from check', async () => {
      mockQuery.mockResolvedValueOnce([[]]);

      await UserService.usernameExists('alice', 'user-1');

      const [sql, params] = mockQuery.mock.calls[0];
      expect(sql).toContain('AND id != ?');
      expect(params).toContain('user-1');
    });
  });
});
