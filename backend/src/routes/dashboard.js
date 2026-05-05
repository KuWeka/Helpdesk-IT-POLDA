const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const auth = require('../middleware/auth');
const role = require('../middleware/role');
const rateLimit = require('express-rate-limit');
const { cache } = require('../utils/cache');
const logger = require('../utils/logger');
const { normalizeRole } = require('../config/roles');

let HAS_TECHNICIAN_SETTINGS_TABLE = null;

async function hasTechnicianSettingsTable() {
  if (typeof HAS_TECHNICIAN_SETTINGS_TABLE === 'boolean') return HAS_TECHNICIAN_SETTINGS_TABLE;
  const [rows] = await pool.query(
    `SELECT 1
     FROM information_schema.TABLES
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = 'technician_settings'
     LIMIT 1`
  );
  HAS_TECHNICIAN_SETTINGS_TABLE = rows.length > 0;
  return HAS_TECHNICIAN_SETTINGS_TABLE;
}

// Rate limit: 30 requests per minute per user — prevents DoS via expensive aggregate queries
const dashboardLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  keyGenerator: (req) => req.user?.id || rateLimit.ipKeyGenerator(req.ip),
  message: 'Terlalu banyak permintaan dashboard. Silakan coba lagi nanti.',
  standardHeaders: true,
  legacyHeaders: false,
});

const sendDashboardResponse = (res, payload, cacheStatus, startedAt, operation) => {
  const duration = Date.now() - startedAt;
  // Only expose cache/timing debug headers in non-production environments
  if (process.env.NODE_ENV !== 'production') {
    res.setHeader('X-Cache', cacheStatus);
    res.setHeader('X-Response-Time-Ms', String(duration));
  }
  logger.performance(operation, duration, { cache: cacheStatus });
  return res.json(payload);
};

router.get('/admin-summary', auth, role('Subtekinfo'), dashboardLimiter, async (req, res) => {
  try {
    const startedAt = Date.now();
    const forceRefresh = req.query.refresh === 'true';
    const cacheKey = 'dashboard:admin:summary';

    if (!forceRefresh) {
      const cachedPayload = await cache.get(cacheKey);
      if (cachedPayload) {
        return sendDashboardResponse(res, cachedPayload, 'HIT', startedAt, 'dashboard.admin-summary');
      }
    }

    const [
      [statusRows],
      [activeTechRows],
      [totalUserRows],
      [pendingRows],
      [prosesRows],
      [selesaiRows],
      [topTechRows]
    ] = await Promise.all([
      pool.query(`
        SELECT
          COUNT(*) as total,
          SUM(CASE WHEN status = 'Pending' THEN 1 ELSE 0 END) as pending,
          SUM(CASE WHEN status = 'Proses' THEN 1 ELSE 0 END) as proses,
          SUM(CASE WHEN status = 'Selesai' THEN 1 ELSE 0 END) as selesai
        FROM tickets
        WHERE deleted_at IS NULL
      `),
      pool.query(`
        SELECT count(*) as count
        FROM users
        WHERE role IN ('Padal', 'Teknisi') AND is_active = 1 AND deleted_at IS NULL
      `),
      pool.query('SELECT count(*) as count FROM users WHERE deleted_at IS NULL'),
      pool.query(`
        SELECT t.id, t.ticket_number, t.title, t.created_at,
               u.name as reporter_name, tech.name as technician_name
        FROM tickets t
        LEFT JOIN users u ON t.user_id = u.id
        LEFT JOIN users tech ON t.assigned_technician_id = tech.id
        WHERE t.status = 'Pending' AND t.deleted_at IS NULL
        ORDER BY t.created_at DESC
        LIMIT 10
      `),
      pool.query(`
        SELECT t.id, t.ticket_number, t.title, t.created_at,
               u.name as reporter_name, tech.name as technician_name
        FROM tickets t
        LEFT JOIN users u ON t.user_id = u.id
        LEFT JOIN users tech ON t.assigned_technician_id = tech.id
        WHERE t.status = 'Proses' AND t.deleted_at IS NULL
        ORDER BY t.created_at DESC
        LIMIT 10
      `),
      pool.query(`
        SELECT t.id, t.ticket_number, t.title, t.created_at, t.closed_at,
               u.name as reporter_name, tech.name as technician_name
        FROM tickets t
        LEFT JOIN users u ON t.user_id = u.id
        LEFT JOIN users tech ON t.assigned_technician_id = tech.id
        WHERE t.status = 'Selesai' AND t.deleted_at IS NULL
        ORDER BY t.closed_at DESC, t.created_at DESC
        LIMIT 10
      `),
      pool.query(`
        SELECT tech.name as technician_name, COUNT(*) as total
        FROM tickets t
        LEFT JOIN users tech ON t.assigned_technician_id = tech.id
        WHERE t.status = 'Selesai'
          AND t.deleted_at IS NULL
          AND t.assigned_technician_id IS NOT NULL
          AND t.assigned_technician_id != ''
          AND t.closed_at >= DATE_FORMAT(CURDATE(), '%Y-%m-01')
        GROUP BY t.assigned_technician_id, tech.name
        ORDER BY total DESC
        LIMIT 5
      `)
    ]);

    const status = statusRows[0] || {};

    const topTechnicians = topTechRows.map((row) => ({
      name: (row.technician_name || 'Unknown').split(' ')[0],
      total: row.total
    }));

    const responsePayload = {
      success: true,
      data: {
        stats: {
          total: status.total || 0,
          pending: status.pending || 0,
          proses: status.proses || 0,
          selesai: status.selesai || 0,
          activeTechs: activeTechRows[0]?.count || 0,
          totalUsers: totalUserRows[0]?.count || 0
        },
        tables: {
          pending: pendingRows,
          proses: prosesRows,
          selesai: selesaiRows
        },
        chartData: topTechnicians
      }
    };

    await cache.set(cacheKey, responsePayload, 60);

    sendDashboardResponse(res, responsePayload, forceRefresh ? 'BYPASS' : 'MISS', startedAt, 'dashboard.admin-summary');
  } catch (error) {
    logger.error('Failed to get admin dashboard summary', { error: error.message, userId: req.user?.id });
    res.status(500).json({ message: 'Server Error' });
  }
});

router.get('/technician-summary', auth, dashboardLimiter, async (req, res) => {
  try {
    const startedAt = Date.now();
    const technicianId = req.user.id;

    // Verify role from DB (JWT may be stale right after a role change)
    const [[roleRow]] = await pool.query(
      `SELECT role FROM users WHERE id = ? AND is_active = 1 AND deleted_at IS NULL LIMIT 1`,
      [technicianId]
    );
    const normalizedRole = roleRow ? normalizeRole(roleRow.role) : null;
    if (!normalizedRole || (normalizedRole !== 'Padal' && normalizedRole !== 'Teknisi')) {
      return res.status(403).json({ success: false, message: 'Akses ditolak.' });
    }

    const hasTechnicianSettings = await hasTechnicianSettingsTable();
    if (hasTechnicianSettings) {
      // Ensure technician_settings row exists and defaults to on-duty (is_active = 1)
      await pool.query(
        `INSERT IGNORE INTO technician_settings (user_id, is_active) VALUES (?, 1)`,
        [technicianId]
      );
    }

    const forceRefresh = req.query.refresh === 'true';
    const cacheKey = `dashboard:technician:${technicianId}:summary`;

    if (!forceRefresh) {
      const cachedPayload = await cache.get(cacheKey);
      if (cachedPayload) {
        return sendDashboardResponse(res, cachedPayload, 'HIT', startedAt, 'dashboard.technician-summary');
      }
    }

    const [
      [statusRows],
      [pendingRows],
      [myProsesRows],
      [technicianRows]
    ] = await Promise.all([
      pool.query(`
        SELECT
          SUM(CASE WHEN status = 'Pending' THEN 1 ELSE 0 END) as pending,
          SUM(CASE WHEN status = 'Proses' AND assigned_technician_id = ? THEN 1 ELSE 0 END) as myProses,
          SUM(CASE WHEN status = 'Selesai' AND assigned_technician_id = ? AND DATE(closed_at) = CURDATE() THEN 1 ELSE 0 END) as completedToday,
          SUM(CASE WHEN assigned_technician_id = ? AND created_at >= DATE_FORMAT(CURDATE(), '%Y-%m-01') THEN 1 ELSE 0 END) as totalThisMonth
        FROM tickets
        WHERE deleted_at IS NULL
      `, [technicianId, technicianId, technicianId]),
      pool.query(`
        SELECT t.id, t.ticket_number, t.title, t.created_at,
               u.name as reporter_name, tech.name as technician_name
        FROM tickets t
        LEFT JOIN users u ON t.user_id = u.id
        LEFT JOIN users tech ON t.assigned_technician_id = tech.id
        WHERE t.status = 'Pending' AND t.deleted_at IS NULL
        ORDER BY t.created_at DESC
        LIMIT 10
      `),
      pool.query(`
        SELECT t.id, t.ticket_number, t.title, t.created_at,
               u.name as reporter_name, tech.name as technician_name
        FROM tickets t
        LEFT JOIN users u ON t.user_id = u.id
        LEFT JOIN users tech ON t.assigned_technician_id = tech.id
        WHERE t.status = 'Proses' AND t.assigned_technician_id = ? AND t.deleted_at IS NULL
        ORDER BY t.created_at DESC
        LIMIT 10
      `, [technicianId]),
      hasTechnicianSettings
        ? pool.query(`
            SELECT u.id,
                   u.is_active,
                   ts.is_active as tech_is_active,
                   ts.wa_notification,
                   ts.max_active_tickets,
                   ts.specializations
            FROM users u
            LEFT JOIN technician_settings ts ON ts.user_id = u.id
            WHERE u.id = ? AND u.deleted_at IS NULL
            LIMIT 1
          `, [technicianId])
        : pool.query(`
            SELECT u.id,
                   u.is_active,
                   NULL as tech_is_active,
                   NULL as wa_notification,
                   NULL as max_active_tickets,
                   NULL as specializations
            FROM users u
            WHERE u.id = ? AND u.deleted_at IS NULL
            LIMIT 1
          `, [technicianId])
    ]);

    const stats = statusRows[0] || {};
    const technician = technicianRows[0] || null;
    const techSettings = technician ? {
      id: technician.id,
      is_active: technician.tech_is_active ?? technician.is_active,
      wa_notification: technician.wa_notification,
      max_active_tickets: technician.max_active_tickets,
      specializations: technician.specializations
    } : {
      id: technicianId,
      is_active: true
    };

    const pendingTickets = pendingRows.map((row) => ({
      ...row,
      created: row.created_at
    }));

    const myTickets = myProsesRows.map((row) => ({
      ...row,
      created: row.created_at
    }));

    const responsePayload = {
      success: true,
      data: {
        stats: {
          pending: stats.pending || 0,
          myProses: stats.myProses || 0,
          completedToday: stats.completedToday || 0,
          totalThisMonth: stats.totalThisMonth || 0
        },
        techSettings,
        pendingTickets,
        myTickets
      }
    };

    await cache.set(cacheKey, responsePayload, 30);

    sendDashboardResponse(res, responsePayload, forceRefresh ? 'BYPASS' : 'MISS', startedAt, 'dashboard.technician-summary');
  } catch (error) {
    logger.error('Failed to get technician dashboard summary', { error: error.message, userId: req.user?.id });
    res.status(500).json({ message: 'Server Error' });
  }
});

router.get('/stats', auth, role('Subtekinfo'), dashboardLimiter, async (req, res) => {
  try {
    // Combine all counts into a single query instead of 3 sequential queries
    const [[statsRow]] = await pool.query(`
      SELECT
        COUNT(*) AS total,
        SUM(CASE WHEN t.status = 'Pending' THEN 1 ELSE 0 END) AS pending,
        SUM(CASE WHEN t.status = 'Proses' THEN 1 ELSE 0 END) AS proses,
        SUM(CASE WHEN t.status = 'Selesai' THEN 1 ELSE 0 END) AS selesai,
        (SELECT COUNT(*) FROM users WHERE role IN ('Padal', 'Teknisi') AND is_active = 1 AND deleted_at IS NULL) AS activeTechs,
        (SELECT COUNT(*) FROM users WHERE deleted_at IS NULL) AS totalUsers
      FROM tickets t
      WHERE t.deleted_at IS NULL
    `);

    res.json({
      totalTickets: Number(statsRow.total || 0),
      pending: Number(statsRow.pending || 0),
      proses: Number(statsRow.proses || 0),
      selesai: Number(statsRow.selesai || 0),
      activeTechs: Number(statsRow.activeTechs || 0),
      totalUsers: Number(statsRow.totalUsers || 0),
    });
  } catch (error) {
    logger.error('Failed to get dashboard stats', { error: error.message, userId: req.user?.id });
    res.status(500).json({ message: 'Server Error' });
  }
});

module.exports = router;
