const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const auth = require('../middleware/auth');
const role = require('../middleware/role');
const { cache } = require('../utils/cache');
const logger = require('../utils/logger');

const sendDashboardResponse = (res, payload, cacheStatus, startedAt, operation) => {
  const duration = Date.now() - startedAt;
  res.setHeader('X-Cache', cacheStatus);
  res.setHeader('X-Response-Time-Ms', String(duration));
  logger.performance(operation, duration, { cache: cacheStatus });
  return res.json(payload);
};

router.get('/admin-summary', auth, role('Subtekinfo'), async (req, res) => {
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
      `),
      pool.query(`
        SELECT count(*) as count
        FROM users
        WHERE role = 'Teknisi' AND is_active = 1
      `),
      pool.query('SELECT count(*) as count FROM users'),
      pool.query(`
        SELECT t.id, t.ticket_number, t.title, t.created_at,
               u.name as reporter_name, tech.name as technician_name
        FROM tickets t
        LEFT JOIN users u ON t.user_id = u.id
        LEFT JOIN users tech ON t.assigned_technician_id = tech.id
        WHERE t.status = 'Pending'
        ORDER BY t.created_at DESC
        LIMIT 10
      `),
      pool.query(`
        SELECT t.id, t.ticket_number, t.title, t.created_at,
               u.name as reporter_name, tech.name as technician_name
        FROM tickets t
        LEFT JOIN users u ON t.user_id = u.id
        LEFT JOIN users tech ON t.assigned_technician_id = tech.id
        WHERE t.status = 'Proses'
        ORDER BY t.created_at DESC
        LIMIT 10
      `),
      pool.query(`
        SELECT t.id, t.ticket_number, t.title, t.created_at, t.closed_at,
               u.name as reporter_name, tech.name as technician_name
        FROM tickets t
        LEFT JOIN users u ON t.user_id = u.id
        LEFT JOIN users tech ON t.assigned_technician_id = tech.id
        WHERE t.status = 'Selesai'
        ORDER BY t.closed_at DESC, t.created_at DESC
        LIMIT 10
      `),
      pool.query(`
        SELECT tech.name as technician_name, COUNT(*) as total
        FROM tickets t
        LEFT JOIN users tech ON t.assigned_technician_id = tech.id
        WHERE t.status = 'Selesai'
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

router.get('/technician-summary', auth, async (req, res) => {
  try {
    const startedAt = Date.now();
    const technicianId = req.user.id;

    // Verify role from DB (JWT may be stale right after a role change)
    const [[roleRow]] = await pool.query(
      `SELECT role FROM users WHERE id = ? AND is_active = 1 LIMIT 1`,
      [technicianId]
    );
    if (!roleRow || roleRow.role !== 'Teknisi') {
      return res.status(403).json({ success: false, message: 'Akses ditolak.' });
    }

    // Ensure technician_settings row exists and defaults to on-duty (is_active = 1)
    await pool.query(
      `INSERT IGNORE INTO technician_settings (user_id, is_active) VALUES (?, 1)`,
      [technicianId]
    );

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
      `, [technicianId, technicianId, technicianId]),
      pool.query(`
        SELECT t.id, t.ticket_number, t.title, t.created_at,
               u.name as reporter_name, tech.name as technician_name
        FROM tickets t
        LEFT JOIN users u ON t.user_id = u.id
        LEFT JOIN users tech ON t.assigned_technician_id = tech.id
        WHERE t.status = 'Pending'
        ORDER BY t.created_at DESC
        LIMIT 10
      `),
      pool.query(`
        SELECT t.id, t.ticket_number, t.title, t.created_at,
               u.name as reporter_name, tech.name as technician_name
        FROM tickets t
        LEFT JOIN users u ON t.user_id = u.id
        LEFT JOIN users tech ON t.assigned_technician_id = tech.id
        WHERE t.status = 'Proses' AND t.assigned_technician_id = ?
        ORDER BY t.created_at DESC
        LIMIT 10
      `, [technicianId]),
      pool.query(`
        SELECT u.id,
               u.is_active,
               ts.is_active as tech_is_active,
               ts.wa_notification,
               ts.max_active_tickets,
               ts.specializations
        FROM users u
        LEFT JOIN technician_settings ts ON ts.user_id = u.id
        WHERE u.id = ?
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

router.get('/stats', auth, role('Subtekinfo'), async (req, res) => {
  try {
    const [ticketCounts] = await pool.query(`
      SELECT status, count(*) as count FROM tickets GROUP BY status
    `);
    
    let pending = 0, process = 0, done = 0;
    ticketCounts.forEach(r => {
      if (r.status === 'Pending') pending = r.count;
      if (r.status === 'Proses') process = r.count;
      if (r.status === 'Selesai') done = r.count;
    });

    const totalTickets = pending + process + done + ticketCounts.filter(r => r.status === 'Ditolak' || r.status === 'Dibatalkan').reduce((sum, r) => sum + r.count, 0);

    const [techCount] = await pool.query(`
      SELECT count(*) as count
      FROM users
      WHERE role = 'Teknisi' AND is_active = 1
    `);
    
    const [userCount] = await pool.query(`
      SELECT count(*) as count FROM users
    `);

    res.json({
      totalTickets,
      pending,
      proses: process,
      selesai: done,
      activeTechs: techCount[0]?.count || 0,
      totalUsers: userCount[0]?.count || 0
    });
  } catch (error) {
    logger.error('Failed to get dashboard stats', { error: error.message, userId: req.user?.id });
    res.status(500).json({ message: 'Server Error' });
  }
});

module.exports = router;
