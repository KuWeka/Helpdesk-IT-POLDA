const { v4: uuidv4 } = require('uuid');
const pool = require('../config/db');
const { cache } = require('../utils/cache');

class TicketService {
  static buildKey(prefix, payload = {}) {
    const serialized = Object.entries(payload)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}:${String(v)}`)
      .join('|');
    return `${prefix}${serialized ? `:${serialized}` : ''}`;
  }

  static async invalidateTicketCaches(ticketId = null) {
    if (ticketId) {
      await cache.del(`ticket:${ticketId}`);
    }
    await cache.delByPattern('tickets:list:*');
    await cache.del('tickets:stats');
  }

  /**
   * Get tickets with filtering and pagination
   */
  static async getTickets(filters = {}, pagination = {}) {
    const { page = 1, perPage = 20 } = pagination;
    const MAX_PER_PAGE = 100;
    const safePerPage = Math.min(Math.max(parseInt(perPage) || 20, 1), MAX_PER_PAGE);
    const safePage = Math.max(parseInt(page) || 1, 1);

    const listCacheKey = this.buildKey('tickets:list', {
      page: safePage,
      perPage: safePerPage,
      ...filters,
    });

    const cached = await cache.get(listCacheKey);
    if (cached) {
      return cached;
    }

    const offset = (safePage - 1) * safePerPage;

    let query = `
      SELECT t.*, u.name as reporter_name, tech.name as technician_name, padal.name as padal_name
      FROM tickets t
      LEFT JOIN users u ON t.user_id = u.id
      LEFT JOIN users tech ON t.assigned_technician_id = tech.id
      LEFT JOIN users padal ON t.padal_id = padal.id
      WHERE t.deleted_at IS NULL
    `;
    const params = [];

    // Apply filters
    if (filters.status) {
      query += ' AND t.status = ?';
      params.push(filters.status);
    }

    if (filters.user_id) {
      query += ' AND t.user_id = ?';
      params.push(filters.user_id);
    }

    if (filters.assigned_technician_id !== undefined) {
      if (filters.assigned_technician_id === null || filters.assigned_technician_id === '') {
        query += ' AND (t.assigned_technician_id IS NULL OR t.assigned_technician_id = "")';
      } else {
        query += ' AND t.assigned_technician_id = ?';
        params.push(filters.assigned_technician_id);
      }
    }

    if (filters.from) {
      query += ' AND DATE(t.created_at) >= DATE(?)';
      params.push(filters.from);
    }

    if (filters.to) {
      query += ' AND DATE(t.created_at) <= DATE(?)';
      params.push(filters.to);
    }

    if (filters.search) {
      query += ' AND (t.title LIKE ? OR t.description LIKE ? OR t.ticket_number LIKE ?)';
      const searchTerm = `%${filters.search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    // Get total count
    const countQuery = query.replace('SELECT t.*, u.name as reporter_name, tech.name as technician_name, padal.name as padal_name\n      FROM tickets t', 'SELECT COUNT(*) as total FROM tickets t');
    const [countResult] = await pool.query(countQuery, params);
    const total = countResult[0].total;

    // Apply sorting and pagination
    // Whitelist sort fields and order to prevent SQL injection via string interpolation
    const ALLOWED_SORT_FIELDS = ['created_at', 'updated_at', 'status', 'title', 'ticket_number', 'closed_at'];
    const ALLOWED_SORT_ORDERS = ['ASC', 'DESC'];
    const sortField = ALLOWED_SORT_FIELDS.includes(filters.sort) ? filters.sort : 'created_at';
    const sortOrder = ALLOWED_SORT_ORDERS.includes(filters.order?.toUpperCase()) ? filters.order.toUpperCase() : 'DESC';
    query += ` ORDER BY t.${sortField} ${sortOrder} LIMIT ? OFFSET ?`;
    params.push(safePerPage, offset);

    const [rows] = await pool.query(query, params);

    const payload = {
      tickets: rows,
      pagination: { page: safePage, perPage: safePerPage, total, totalPages: Math.ceil(total / safePerPage) }
    };

    await cache.set(listCacheKey, payload, 60);

    return payload;
  }

  /**
   * Get ticket by ID
   */
  static async getTicketById(id) {
    const cacheKey = `ticket:${id}`;
    let ticket = await cache.get(cacheKey);
    if (ticket) return ticket;
    const [rows] = await pool.query(`
      SELECT t.*, u.name as reporter_name, tech.name as technician_name, padal.name as padal_name
      FROM tickets t
      LEFT JOIN users u ON t.user_id = u.id
      LEFT JOIN users tech ON t.assigned_technician_id = tech.id
      LEFT JOIN users padal ON t.padal_id = padal.id
      WHERE t.id = ? AND t.deleted_at IS NULL
    `, [id]);
    ticket = rows[0] || null;
    if (ticket) await cache.set(cacheKey, ticket, 3600); // cache for 1 hour
    return ticket;
  }

  /**
   * Create new ticket
   */
  static async createTicket(ticketData) {
    const id = uuidv4();
    const ticketNumber = await this.generateTicketNumber();

    const ticket = {
      id,
      ticket_number: ticketNumber,
      title: ticketData.title,
      description: ticketData.description,
      location: ticketData.location || '',
      category: ticketData.category,
      status: 'Pending',
      user_id: ticketData.user_id,
      padal_id: null,
      assigned_technician_id: null,
      rejection_reason: null,
      solution: null,
      closed_at: null,
      created_at: new Date(),
      updated_at: new Date()
    };

    await pool.query(`
      INSERT INTO tickets (id, ticket_number, title, description, location, category,
                          status, user_id, padal_id, assigned_technician_id, rejection_reason,
                          solution, closed_at, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      ticket.id, ticket.ticket_number, ticket.title, ticket.description,
      ticket.location, ticket.category, ticket.status, ticket.user_id,
      ticket.padal_id, ticket.assigned_technician_id, ticket.rejection_reason,
      ticket.solution, ticket.closed_at, ticket.created_at, ticket.updated_at
    ]);

    await this.invalidateTicketCaches(id);

    return ticket;
  }

  /**
   * Update ticket
   */
  static async updateTicket(id, updateData) {
    const fields = [];
    const params = [];

    // Whitelist allowed column names to prevent SQL injection via dynamic key names
    const ALLOWED_UPDATE_FIELDS = [
      'title', 'description', 'category', 'status', 'location',
      'assigned_technician_id', 'padal_id', 'solution', 'closed_at',
      'rejection_reason'
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
      `UPDATE tickets SET ${fields.join(', ')} WHERE id = ? AND deleted_at IS NULL`,
      params
    );

    await this.invalidateTicketCaches(id);

    return this.getTicketById(id);
  }

  /**
   * Delete ticket
   */
  static async deleteTicket(id) {
    await pool.query('UPDATE tickets SET deleted_at = NOW(), updated_at = NOW() WHERE id = ? AND deleted_at IS NULL', [id]);
    await this.invalidateTicketCaches(id);
  }

  /**
   * Generate unique ticket number
   */
  static async generateTicketNumber(executor = null) {
    const managedConnection = !executor;
    const db = executor || await pool.getConnection();
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');

    // Use LAST_INSERT_ID(counter + 1) so each concurrent request receives
    // a unique sequence value on its own connection.
    const prefix = `${year}${month}`;
    try {
      await db.query(
        `INSERT INTO ticket_sequences (month_prefix, counter)
         VALUES (?, 1)
         ON DUPLICATE KEY UPDATE counter = LAST_INSERT_ID(counter + 1)`,
        [prefix]
      );

      const [seqRows] = await db.query('SELECT LAST_INSERT_ID() AS seq');
      const sequence = String(seqRows[0].seq).padStart(4, '0');
      return `TKT-${year}${month}-${sequence}`;
    } finally {
      if (managedConnection) {
        db.release();
      }
    }
  }

}

module.exports = TicketService;