const cron = require('node-cron');
const pool = require('../config/db');
const logger = require('../utils/logger');
const { invalidateAllDashboardCaches } = require('../utils/dashboardCache');
const TicketService = require('./TicketService');

const TIMEOUT_MINUTES = parseInt(process.env.ASSIGNMENT_TIMEOUT_MINUTES || '30', 10);

async function processExpiredAssignment(io, assignment) {
  const conn = await pool.getConnection();

  try {
    await conn.beginTransaction();

    const [assignmentUpdate] = await conn.query(
      `UPDATE ticket_assignments
       SET status = 'expired', responded_at = NOW(), updated_at = NOW()
       WHERE id = ? AND status = 'pending_confirm'`,
      [assignment.assignment_id]
    );

    if (!assignmentUpdate.affectedRows) {
      await conn.rollback();
      return;
    }

    await conn.query(
      `UPDATE tickets
       SET status = 'Pending', padal_id = NULL, updated_at = NOW()
       WHERE id = ? AND deleted_at IS NULL`,
      [assignment.ticket_id]
    );

    await conn.commit();

    await TicketService.invalidateTicketCaches(assignment.ticket_id);
    await invalidateAllDashboardCaches();

    if (io) {
      io.to('subtekinfo').emit('ticket:assignment_expired', {
        ticket_id: assignment.ticket_id,
        ticket_number: assignment.ticket_number,
        title: assignment.title,
        padal_id: assignment.padal_id,
        expired_after_minutes: TIMEOUT_MINUTES,
      });
    }

    logger.info(`AssignmentTimeout: tiket ${assignment.ticket_number} dikembalikan ke Pending`);
  } catch (err) {
    await conn.rollback();
    logger.error(`AssignmentTimeout: gagal proses tiket ${assignment.ticket_number}`, {
      error: err.message,
    });
  } finally {
    conn.release();
  }
}

async function runTimeoutCheck(io) {
  try {
    const [expiredAssignments] = await pool.query(
      `SELECT ta.id AS assignment_id, ta.ticket_id, ta.padal_id,
              t.ticket_number, t.title
       FROM ticket_assignments ta
       JOIN tickets t ON t.id = ta.ticket_id
       WHERE ta.status = 'pending_confirm'
         AND ta.created_at < DATE_SUB(NOW(), INTERVAL ? MINUTE)
         AND t.deleted_at IS NULL`,
      [TIMEOUT_MINUTES]
    );

    if (expiredAssignments.length === 0) {
      return;
    }

    logger.info(`AssignmentTimeout: ditemukan ${expiredAssignments.length} assignment expired`);

    for (const assignment of expiredAssignments) {
      // Process sequentially to avoid racing updates on the same ticket.
      // eslint-disable-next-line no-await-in-loop
      await processExpiredAssignment(io, assignment);
    }
  } catch (err) {
    logger.error('AssignmentTimeout: error saat menjalankan timeout check', {
      error: err.message,
    });
  }
}

function startAssignmentTimeoutCron(io) {
  cron.schedule('*/5 * * * *', () => {
    runTimeoutCheck(io);
  }, {
    scheduled: true,
    timezone: 'Asia/Makassar',
  });

  logger.info(`AssignmentTimeout cron aktif - timeout: ${TIMEOUT_MINUTES} menit, cek setiap 5 menit`);
}

module.exports = {
  startAssignmentTimeoutCron,
  runTimeoutCheck,
};
