const pool = require('../config/db');
const { cache } = require('./cache');
const logger = require('./logger');

async function warmAdminDashboardSummary() {
  const [statusRows] = await pool.query(`
    SELECT
      COUNT(*) as total,
      SUM(CASE WHEN status = 'Pending' THEN 1 ELSE 0 END) as pending,
      SUM(CASE WHEN status = 'Proses' THEN 1 ELSE 0 END) as proses,
      SUM(CASE WHEN status = 'Selesai' THEN 1 ELSE 0 END) as selesai
    FROM tickets
    WHERE deleted_at IS NULL
  `);

  const [activeTechRows] = await pool.query(`
    SELECT count(*) as count
    FROM users
    WHERE role = 'Teknisi' AND is_active = 1 AND deleted_at IS NULL
  `);

  const [totalUserRows] = await pool.query('SELECT count(*) as count FROM users WHERE deleted_at IS NULL');

  const payload = {
    success: true,
    data: {
      stats: {
        total: statusRows[0]?.total || 0,
        pending: statusRows[0]?.pending || 0,
        proses: statusRows[0]?.proses || 0,
        selesai: statusRows[0]?.selesai || 0,
        activeTechs: activeTechRows[0]?.count || 0,
        totalUsers: totalUserRows[0]?.count || 0,
      },
      tables: {
        pending: [],
        proses: [],
        selesai: [],
      },
      chartData: [],
    },
  };

  await cache.set('dashboard:admin:summary', payload, 30);
}

async function warmStartupCache() {
  if (!cache.isConnected) {
    logger.info('Skipping cache warm-up because Redis is not connected');
    return { warmed: false, reason: 'redis_disconnected' };
  }

  const startedAt = Date.now();

  try {
    await Promise.all([
      warmAdminDashboardSummary(),
      cache.set('warmup:last_run_at', { timestamp: new Date().toISOString() }, 300),
    ]);

    const duration = Date.now() - startedAt;
    logger.info('Cache warm-up completed', { durationMs: duration });
    return { warmed: true, durationMs: duration };
  } catch (error) {
    logger.error('Cache warm-up failed', { error: error.message });
    return { warmed: false, reason: 'error', error: error.message };
  }
}

module.exports = {
  warmStartupCache,
};
