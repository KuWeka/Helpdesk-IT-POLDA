const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const pool = require('../config/db');
const { cache } = require('../utils/cache');
const { normalizeRole } = require('../config/roles');

class UserService {
  static toLegacyRole(role) {
    switch (role) {
      case 'Subtekinfo':
        return 'Admin';
      case 'Padal':
        return 'Teknisi';
      case 'Satker':
        return 'User';
      case 'Teknisi':
      default:
        return role;
    }
  }

  static isRoleTruncationError(error) {
    const code = error?.code;
    const message = String(error?.message || '');
    return code === 'WARN_DATA_TRUNCATED'
      || code === 'ER_TRUNCATED_WRONG_VALUE_FOR_FIELD'
      || /Data truncated for column 'role'/i.test(message)
      || /Incorrect .* value .* for column 'role'/i.test(message);
  }

  static buildKey(prefix, payload = {}) {
    const serialized = Object.entries(payload)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}:${String(v)}`)
      .join('|');
    return `${prefix}${serialized ? `:${serialized}` : ''}`;
  }

  static async invalidateUserCaches(userId = null) {
    if (userId) {
      await cache.del(`user:${userId}`);
    }
    await cache.delByPattern('users:list:*');
  }

  /**
   * Get users with filtering and pagination
   */
  static async getUsers(filters = {}, pagination = {}) {
    const { page = 1, perPage = 20 } = pagination;
    const MAX_PER_PAGE = 100;
    const safePerPage = Math.min(Math.max(parseInt(perPage) || 20, 1), MAX_PER_PAGE);
    const safePage = Math.max(parseInt(page) || 1, 1);
    const offset = (safePage - 1) * safePerPage;

    let query = `
      SELECT u.id, u.name, u.email, u.username, u.phone, u.role, u.is_active,
             u.language, u.theme, u.created_at, u.updated_at,
             ps.shift_start, ps.shift_end,
             CASE
               WHEN ps.shift_start IS NOT NULL AND ps.shift_end IS NOT NULL
                    AND CURDATE() BETWEEN ps.shift_start AND ps.shift_end
               THEN 1 ELSE 0
             END AS is_shift_active,
             ps.notes AS shift_notes
      FROM users u
      LEFT JOIN padal_shifts ps ON ps.padal_id = u.id
      WHERE u.is_active = 1 AND u.deleted_at IS NULL
    `;
    const params = [];

    // Apply filters
    if (filters.role) {
      query += ' AND u.role = ?';
      params.push(filters.role);
    }

    if (filters.is_active !== undefined) {
      query = query.replace('WHERE u.is_active = 1', 'WHERE u.is_active = ?');
      params.unshift(filters.is_active ? 1 : 0);
    }

    if (filters.search) {
      query += ' AND (u.name LIKE ? OR u.email LIKE ? OR u.username LIKE ?)';
      const searchTerm = `%${filters.search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    // Get total count
    const countQuery = query.replace('SELECT u.id, u.name, u.email, u.username, u.phone, u.role, u.is_active,\n             u.language, u.theme, u.created_at, u.updated_at,\n             ps.shift_start, ps.shift_end,\n             CASE\n               WHEN ps.shift_start IS NOT NULL AND ps.shift_end IS NOT NULL\n                    AND CURDATE() BETWEEN ps.shift_start AND ps.shift_end\n               THEN 1 ELSE 0\n             END AS is_shift_active,\n             ps.notes AS shift_notes\n      FROM users u', 'SELECT COUNT(*) as total FROM users u');
    const [countResult] = await pool.query(countQuery, params);
    const total = countResult[0].total;

    // Apply sorting and pagination
    // Untuk role Padal: prioritaskan yang sedang aktif shift di atas
    // Whitelist sort fields and order to prevent SQL injection via string interpolation
    const ALLOWED_SORT_FIELDS_USER = ['name', 'email', 'created_at', 'updated_at', 'role'];
    const ALLOWED_SORT_ORDERS_USER = ['ASC', 'DESC'];

    if (filters.role === 'Padal') {
      const sortField = ALLOWED_SORT_FIELDS_USER.includes(filters.sort) ? filters.sort : 'name';
      const sortOrder = ALLOWED_SORT_ORDERS_USER.includes(filters.order?.toUpperCase()) ? filters.order.toUpperCase() : 'ASC';
      query += ` ORDER BY is_shift_active DESC, u.${sortField} ${sortOrder} LIMIT ? OFFSET ?`;
    } else {
      const sortField = ALLOWED_SORT_FIELDS_USER.includes(filters.sort) ? filters.sort : 'created_at';
      const sortOrder = ALLOWED_SORT_ORDERS_USER.includes(filters.order?.toUpperCase()) ? filters.order.toUpperCase() : 'DESC';
      query += ` ORDER BY u.${sortField} ${sortOrder} LIMIT ? OFFSET ?`;
    }
    params.push(safePerPage, offset);

    const listCacheKey = this.buildKey('users:list', {
      page: safePage,
      perPage: safePerPage,
      ...filters,
    });

    const cached = await cache.get(listCacheKey);
    if (cached) {
      return cached;
    }

    const [rows] = await pool.query(query, params);

    const payload = {
      users: rows,
      pagination: { page: safePage, perPage: safePerPage, total, totalPages: Math.ceil(total / safePerPage) }
    };

    await cache.set(listCacheKey, payload, 120);

    return payload;
  }

  /**
   * Get user by ID
   */
  static async getUserById(id) {
    const cacheKey = `user:${id}`;
    let user = await cache.get(cacheKey);
    if (user) return user;
    const [rows] = await pool.query(`
      SELECT u.id, u.name, u.email, u.username, u.phone, u.role, u.is_active,
             u.language, u.theme, u.created_at, u.updated_at
      FROM users u
      WHERE u.id = ? AND u.deleted_at IS NULL
    `, [id]);
    user = rows[0] || null;
    if (user) await cache.set(cacheKey, user, 3600); // cache for 1 hour
    return user;
  }

  /**
   * Create new user
   */
  static async createUser(userData) {
    const id = uuidv4();

    // Hash password if provided
    // Use BCRYPT_ROUNDS env var so rounds can be tuned without code changes.
    // Default 10 is the industry standard balance between security and performance.
    const BCRYPT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS || '10', 10);
    let passwordHash = null;
    if (userData.password) {
      passwordHash = await bcrypt.hash(userData.password, BCRYPT_ROUNDS);
    }

    const user = {
      id,
      name: userData.name,
      email: userData.email,
      username: userData.username || null,
      password_hash: passwordHash,
      phone: userData.phone || null,
      role: normalizeRole(userData.role),
      language: userData.language || 'ID',
      theme: userData.theme || 'light',
      is_active: userData.is_active !== undefined ? userData.is_active : true,
      created_at: new Date(),
      updated_at: new Date()
    };

    const insertSql = `
      INSERT INTO users (id, name, email, username, password_hash, phone, role,
                        language, theme, is_active, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const insertParams = [
      user.id, user.name, user.email, user.username, user.password_hash,
      user.phone, user.role, user.language, user.theme,
      user.is_active, user.created_at, user.updated_at
    ];

    try {
      await pool.query(insertSql, insertParams);
    } catch (error) {
      if (!this.isRoleTruncationError(error)) {
        throw error;
      }

      // Backward compatibility: some deployments still use legacy ENUM values.
      const legacyRole = this.toLegacyRole(user.role);
      insertParams[6] = legacyRole;
      await pool.query(insertSql, insertParams);
      user.role = normalizeRole(legacyRole);
    }

    // Invalidate user caches
    await this.invalidateUserCaches(id);

    // Return user without password hash
    const userWithoutPassword = { ...user };
    delete userWithoutPassword.password_hash;
    return userWithoutPassword;
  }

  /**
   * Update user
   */
  static async updateUser(id, updateData) {
    // Handle password update with security
    if (updateData.password || updateData.oldPassword) {
      if (!updateData.oldPassword) {
        throw new Error('Password lama wajib diisi untuk mengubah password');
      }
      if (!updateData.password) {
        throw new Error('Password baru wajib diisi');
      }

      // Get current user to verify old password
      const [rows] = await pool.query(
        'SELECT password_hash FROM users WHERE id = ?',
        [id]
      );

      if (rows.length === 0) {
        throw new Error('User tidak ditemukan');
      }

      const currentPasswordHash = rows[0].password_hash;

      // Verify old password
      const isOldPasswordValid = await bcrypt.compare(updateData.oldPassword, currentPasswordHash);
      if (!isOldPasswordValid) {
        throw new Error('Password lama tidak sesuai');
      }

      // Hash new password
      const BCRYPT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS || '10', 10);
      const passwordHash = await bcrypt.hash(updateData.password, BCRYPT_ROUNDS);
      updateData.password_hash = passwordHash;
    }

    // Remove oldPassword from updateData if present (don't store in DB)
    delete updateData.oldPassword;
    // Remove plain password from updateData (we use password_hash)
    delete updateData.password;

    const fields = [];
    const params = [];

    // Whitelist allowed column names to prevent SQL injection via dynamic key names
    const ALLOWED_UPDATE_FIELDS = [
      'name', 'email', 'username', 'phone', 'role',
      'password_hash', 'language', 'theme', 'is_active'
    ];

    Object.keys(updateData).forEach(key => {
      if (!ALLOWED_UPDATE_FIELDS.includes(key)) {
        throw new Error(`Field '${key}' tidak diizinkan untuk diupdate`);
      }
      if (updateData[key] !== undefined) {
        fields.push(`${key} = ?`);
        params.push(updateData[key]);
      }
    });

    if (fields.length === 0) {
      throw new Error('No fields to update');
    }

    fields.push('updated_at = ?');
    params.push(new Date());
    params.push(id);

    await pool.query(
      `UPDATE users SET ${fields.join(', ')} WHERE id = ?`,
      params
    );

    // When role changes, all user list caches may contain stale role data.
    // invalidateUserCaches already calls delByPattern('users:list:*'), but we
    // also explicitly clear dashboard and stats caches that include role-based counts.
    if (updateData.role !== undefined) {
      await cache.del('tickets:stats');
      await cache.delByPattern('dashboard:*');
    }

    await this.invalidateUserCaches(id);

    return this.getUserById(id);
  }

  /**
   * Delete user (soft delete by setting is_active = false)
   */
  static async deleteUser(id) {
    await pool.query(
      'UPDATE users SET is_active = false, deleted_at = NOW(), updated_at = NOW() WHERE id = ?',
      [id]
    );
    await this.invalidateUserCaches(id);
  }

  /**
   * Check if email exists
   */
  static async emailExists(email, excludeId = null) {
    let query = 'SELECT id FROM users WHERE email = ? AND deleted_at IS NULL';
    const params = [email];

    if (excludeId) {
      query += ' AND id != ?';
      params.push(excludeId);
    }

    const [rows] = await pool.query(query, params);
    return rows.length > 0;
  }

  /**
   * Check if username exists
   */
  static async usernameExists(username, excludeId = null) {
    if (!username) return false;

    let query = 'SELECT id FROM users WHERE username = ? AND deleted_at IS NULL';
    const params = [username];

    if (excludeId) {
      query += ' AND id != ?';
      params.push(excludeId);
    }

    const [rows] = await pool.query(query, params);
    return rows.length > 0;
  }
}

module.exports = UserService;