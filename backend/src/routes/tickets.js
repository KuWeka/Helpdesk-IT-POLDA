const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const pool = require('../config/db');
const auth = require('../middleware/auth');
const role = require('../middleware/role');
const { asyncHandler } = require('../middleware/errorHandler');
const { validateQuery } = require('../middleware/validation');
const { ticketSchemas } = require('../utils/validationSchemas');
const { ApiResponse } = require('../utils/apiResponse');
const TicketService = require('../services/TicketService');
const { invalidateAllDashboardCaches } = require('../utils/dashboardCache');

// Get all tickets
router.get('/', auth, validateQuery(ticketSchemas.list), asyncHandler(async (req, res) => {
  const { status, user_id, assigned_technician_id, unassigned, from, to, search, page, perPage, sort, order } = req.query;

  // Lookup real role from DB (JWT may be stale after role change)
  const [[dbUser]] = await pool.query('SELECT role FROM users WHERE id = ? AND is_active = 1 LIMIT 1', [req.user.id]);
  const actualRole = dbUser?.role || req.user.role;

  // Role-based filtering
  let effectiveUserId = user_id;
  let effectivePadalId = assigned_technician_id;

  if (actualRole === 'Satker') {
    // Satker hanya bisa lihat tiket miliknya sendiri
    effectiveUserId = req.user.id;
  } else if (actualRole === 'Padal') {
    // Padal hanya bisa lihat tiket yang di-assign ke dirinya
    effectivePadalId = req.user.id;
  }
  // Teknisi lihat semua (read-only), Subtekinfo lihat semua

  const result = await TicketService.getTickets(
    {
      status,
      user_id: effectiveUserId,
      assigned_technician_id: effectivePadalId,
      from,
      to,
      search,
      sort,
      order
    },
    { page, perPage }
  );

  res.json(ApiResponse.paginated(result.tickets, result.pagination));
}));

// Get ticket summary for dashboards
router.get('/summary', auth, asyncHandler(async (req, res) => {
  const { role, userId } = req.query;

  let whereClause = '';
  let params = [];

  // Role-based access control for summary scope
  if (req.user.role === 'Satker') {
    whereClause = 'WHERE user_id = ?';
    params = [req.user.id];
  } else if (req.user.role === 'Padal') {
    whereClause = 'WHERE padal_id = ?';
    params = [req.user.id];
  } else if (req.user.role === 'Subtekinfo') {
    // Subtekinfo dapat request summary dengan scope opsional
    if (role === 'satker' && userId) {
      whereClause = 'WHERE user_id = ?';
      params = [userId];
    } else if (role === 'padal' && userId) {
      whereClause = 'WHERE padal_id = ?';
      params = [userId];
    }
  }

  const [statusRows] = await pool.query(
    `SELECT status, COUNT(*) as count
     FROM tickets
     ${whereClause}
     GROUP BY status`,
    params
  );

  const unresolvedWhere = whereClause
    ? `${whereClause} AND status IN ('Pending', 'Proses')`
    : "WHERE status IN ('Pending', 'Proses')";

  const [agingRows] = await pool.query(
    `SELECT COUNT(*) as count
     FROM tickets
     ${unresolvedWhere}
     AND created_at < DATE_SUB(NOW(), INTERVAL 3 DAY)`,
    params
  );

  const [totalsRows] = await pool.query(
    `SELECT
      COUNT(*) as total_count,
      SUM(CASE WHEN status = 'Selesai' THEN 1 ELSE 0 END) as selesai_count
     FROM tickets
     ${whereClause}`,
    params
  );

  const [trendRows] = await pool.query(
    `SELECT DATE(created_at) as day, COUNT(*) as count
     FROM tickets
     ${whereClause ? `${whereClause} AND` : 'WHERE'} created_at >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)
     GROUP BY DATE(created_at)
     ORDER BY day ASC`,
    params
  );

  const pending = Number(statusRows.find((s) => s.status === 'Pending')?.count || 0);
  const proses = Number(statusRows.find((s) => s.status === 'Proses')?.count || 0);
  const selesai = Number(statusRows.find((s) => s.status === 'Selesai')?.count || 0);
  const ditolak = Number(statusRows.find((s) => s.status === 'Ditolak')?.count || 0);
  const dibatalkan = Number(statusRows.find((s) => s.status === 'Dibatalkan')?.count || 0);
  const totalCount = Number(totalsRows?.[0]?.total_count || 0);
  const selesaiCount = Number(totalsRows?.[0]?.selesai_count || 0);

  const summary = {
    pending,
    proses,
    selesai,
    ditolak,
    dibatalkan,
    sla_compliance: totalCount > 0 ? Number(((selesaiCount / totalCount) * 100).toFixed(1)) : 0,
    aging_count: Number(agingRows?.[0]?.count || 0),
    trend: trendRows.map((row) => ({
      date: row.day,
      count: Number(row.count || 0)
    }))
  };

  res.json(ApiResponse.success({ summary }));
}));

// Cek apakah user punya tiket Selesai yang belum dirating (untuk gating buat tiket baru)
router.get('/pending-rating', auth, role('Satker'), asyncHandler(async (req, res) => {
  const [rows] = await pool.query(
    `SELECT t.id, t.ticket_number, t.title, t.updated_at
     FROM tickets t
     LEFT JOIN ticket_ratings tr ON tr.ticket_id = t.id
     WHERE t.user_id = ? AND t.status = 'Selesai' AND tr.id IS NULL
     ORDER BY t.updated_at DESC
     LIMIT 1`,
    [req.user.id]
  );
  if (rows.length === 0) {
    return res.json({ pending: false });
  }
  return res.json({ pending: true, ticket: rows[0] });
}));

// Get ticket details
router.get('/:id', auth, asyncHandler(async (req, res) => {
  const [rows] = await pool.query(`
      SELECT t.*,
             u.name as reporter_name,
             u.email as reporter_email,
             u.phone as reporter_phone,
             tech.name as technician_name,
             padal.name as padal_name
      FROM tickets t
      LEFT JOIN users u ON t.user_id = u.id
      LEFT JOIN users tech ON t.assigned_technician_id = tech.id
      LEFT JOIN users padal ON t.padal_id = padal.id
      WHERE t.id = ?
    `, [req.params.id]);

  if (rows.length === 0) return res.status(404).json({ message: 'Ticket not found' });

  const ticket = rows[0];

  // Lookup real role from DB (JWT may be stale after role change)
  const [[dbUser]] = await pool.query('SELECT role FROM users WHERE id = ? AND is_active = 1 LIMIT 1', [req.user.id]);
  const actualRole = dbUser?.role || req.user.role;

  if (actualRole === 'Satker' && ticket.user_id !== req.user.id) {
    return res.status(403).json({ message: 'Forbidden' });
  }
  if (actualRole === 'Padal' && ticket.padal_id !== req.user.id) {
    return res.status(403).json({ message: 'Forbidden' });
  }

  ticket.expand = {
    user_id: { name: ticket.reporter_name },
    assigned_technician_id: ticket.assigned_technician_id ? { name: ticket.technician_name } : null,
    padal_id: ticket.padal_id ? { name: ticket.padal_name } : null
  };
  ticket.created = ticket.created_at;
  ticket.updated = ticket.updated_at;

  res.json(ticket);
}));

// Create ticket
const logger = require('../utils/logger');
const { validate } = require('../middleware/validation');

// Helper function to generate unique ticket number
function generateTicketNumber() {
  // Format: TKT-YYYYMMDDHHMM-RANDOM
  // Example: TKT-202604221430-A7K9
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  
  // Random 4-character alphanumeric suffix
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let randomSuffix = '';
  for (let i = 0; i < 4; i++) {
    randomSuffix += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return `TKT-${year}${month}${day}${hours}${minutes}-${randomSuffix}`;
}

router.post('/', auth, role('Satker'), validate(ticketSchemas.create), asyncHandler(async (req, res) => {
  const { title, description, location, category } = req.body;

  // Cek apakah ada tiket Selesai yang belum dirating
  const [[unrated]] = await pool.query(
    `SELECT t.id, t.ticket_number FROM tickets t
     LEFT JOIN ticket_ratings tr ON tr.ticket_id = t.id
     WHERE t.user_id = ? AND t.status = 'Selesai' AND tr.id IS NULL
     LIMIT 1`,
    [req.user.id]
  );
  if (unrated) {
    return res.status(403).json({
      message: 'Harap beri rating tiket sebelumnya sebelum membuat tiket baru',
      pendingRating: true,
      ticket_id: unrated.id,
      ticket_number: unrated.ticket_number,
    });
  }

  const id = uuidv4();

  // Generate ticket number on backend (server-side, not frontend)
  const ticket_number = generateTicketNumber();
  const now = new Date();

  await pool.query(
    'INSERT INTO tickets (id, ticket_number, title, description, location, category, status, user_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [id, ticket_number, title, description, location || '', category, 'Pending', req.user.id, now, now]
  );

  await TicketService.invalidateTicketCaches(id);
  await invalidateAllDashboardCaches();

  const io = req.app.get('io');
  io.to('subtekinfo').emit('ticket:new', { ticket_id: id, ticket_number, title, satker_name: req.user.name, created_at: now });

  // Return full ticket data with success response
  const ticketData = {
    id,
    ticket_number,
    title,
    description,
    location: location || '',
    category,
    status: 'Pending',
    user_id: req.user.id,
    padal_id: null,
    assigned_technician_id: null,
    closed_at: null,
    created_at: now,
    updated_at: now
  };

  res.status(201).json(ApiResponse.success({ ticket: ticketData }, 'Tiket berhasil dibuat', 201));
}));

// Update ticket
router.patch('/:id', auth, asyncHandler(async (req, res) => {
  const { status, assigned_technician_id, closed_at, title, description, location, category } = req.body;
  const [[existingTicket]] = await pool.query(
    'SELECT id, user_id, status FROM tickets WHERE id = ? LIMIT 1',
    [req.params.id]
  );

  if (!existingTicket) {
    return res.status(404).json({ message: 'Tiket tidak ditemukan' });
  }

  const [[dbUser]] = await pool.query('SELECT role FROM users WHERE id = ? AND is_active = 1 LIMIT 1', [req.user.id]);
  const actualRole = dbUser?.role || req.user.role;

  // Satker hanya boleh update tiket miliknya sendiri dan hanya saat status Pending.
  if (actualRole === 'Satker') {
    if (existingTicket.user_id !== req.user.id) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    if (existingTicket.status !== 'Pending') {
      return res.status(403).json({ message: 'Tiket hanya dapat diubah saat status Pending' });
    }
    if (assigned_technician_id !== undefined || closed_at !== undefined) {
      return res.status(403).json({ message: 'Satker tidak diizinkan mengubah assignment atau closed_at' });
    }
    if (status !== undefined && status !== 'Dibatalkan') {
      return res.status(400).json({ message: 'Satker hanya dapat mengubah status menjadi Dibatalkan' });
    }
  }

  if (actualRole === 'Teknisi') {
    return res.status(403).json({ message: 'Teknisi tidak diizinkan mengubah tiket' });
  }

  const querySets = [];
  const queryArgs = [];

  if (status !== undefined) { querySets.push('status = ?'); queryArgs.push(status); }
  if (assigned_technician_id !== undefined) { querySets.push('assigned_technician_id = ?'); queryArgs.push(assigned_technician_id); }
  if (closed_at !== undefined) {
    // Convert ISO format to MySQL datetime format
    const date = new Date(closed_at);
    const mysqlDate = date.toISOString().slice(0, 19).replace('T', ' ');
    querySets.push('closed_at = ?');
    queryArgs.push(mysqlDate);
  }
  if (title !== undefined) { querySets.push('title = ?'); queryArgs.push(title); }
  if (description !== undefined) { querySets.push('description = ?'); queryArgs.push(description); }
  if (location !== undefined) { querySets.push('location = ?'); queryArgs.push(location); }
  if (category !== undefined) { querySets.push('category = ?'); queryArgs.push(category); }

  if (querySets.length === 0) return res.json({ message: 'No updates' });

  querySets.push('updated_at = NOW()');
  queryArgs.push(req.params.id);
  await pool.query(`UPDATE tickets SET ${querySets.join(', ')} WHERE id = ?`, queryArgs);

  await TicketService.invalidateTicketCaches(req.params.id);
  await invalidateAllDashboardCaches();

  // Emit update event
  const io = req.app.get('io');
  io.emit('ticket_updated', {
    id: req.params.id,
    status,
    assigned_technician_id,
    updated_by: req.user.id,
    updated_by_role: req.user.role
  });

  // Jika status berubah ke Selesai, emit ticket:rating_required ke Satker
  if (status === 'Selesai') {
    const [[ticketInfo]] = await pool.query(
      'SELECT user_id, ticket_number, title FROM tickets WHERE id = ?',
      [req.params.id]
    );
    if (ticketInfo?.user_id) {
      io.to(`user:${ticketInfo.user_id}`).emit('ticket:rating_required', {
        ticket_id: req.params.id,
        ticket_number: ticketInfo.ticket_number,
        title: ticketInfo.title,
      });
    }
  }

  res.json({ message: 'Updated' });
}));

// Delete ticket
router.delete('/:id', auth, role('Subtekinfo', 'Padal'), asyncHandler(async (req, res) => {
  await pool.query('DELETE FROM tickets WHERE id = ?', [req.params.id]);
  await TicketService.invalidateTicketCaches(req.params.id);
  await invalidateAllDashboardCaches();
  res.json({ message: 'Deleted' });
}));

// Notes endpoints
router.get('/:id/notes', auth, asyncHandler(async (req, res) => {
  const [rows] = await pool.query('SELECT n.*, u.name as technician_name, u.role FROM ticket_notes n JOIN users u ON n.technician_id = u.id WHERE n.ticket_id = ? ORDER BY n.created_at ASC', [req.params.id]);
  rows.forEach((r) => {
    r.created = r.created_at;
    r.updated = r.created_at;
    r.expand = { technician_id: { name: r.technician_name, role: r.role } };
  });
  res.json(rows);
}));

router.post('/:id/notes', auth, role('Subtekinfo', 'Padal'), asyncHandler(async (req, res) => {
  const { note_content } = req.body;
  await pool.query('INSERT INTO ticket_notes (ticket_id, technician_id, note_content) VALUES (?, ?, ?)', [req.params.id, req.user.id, note_content]);
  res.status(201).json({ message: 'Note added' });
}));

// Tolak tiket dengan alasan wajib (Subtekinfo only)
router.post('/:id/reject', auth, role('Subtekinfo'), asyncHandler(async (req, res) => {
  const ticketId = req.params.id;
  const { reason } = req.body;

  if (!reason || typeof reason !== 'string' || reason.trim().length === 0) {
    return res.status(400).json({ message: 'Alasan penolakan wajib diisi' });
  }

  const [[ticket]] = await pool.query(
    'SELECT id, ticket_number, title, status, user_id FROM tickets WHERE id = ?',
    [ticketId]
  );
  if (!ticket) return res.status(404).json({ message: 'Tiket tidak ditemukan' });

  if (ticket.status === 'Ditolak') {
    return res.status(400).json({ message: 'Tiket sudah dalam status Ditolak' });
  }

  await pool.query(
    "UPDATE tickets SET status = 'Ditolak', rejection_reason = ?, updated_at = NOW() WHERE id = ?",
    [reason.trim(), ticketId]
  );

  await TicketService.invalidateTicketCaches(ticketId);
  await invalidateAllDashboardCaches();

  // Emit notifikasi ke Satker (reporter)
  const io = req.app.get('io');
  if (ticket.user_id) {
    io.to(`user:${ticket.user_id}`).emit('ticket:status_changed', {
      ticket_id: ticketId,
      ticket_number: ticket.ticket_number,
      new_status: 'Ditolak',
      reason: reason.trim(),
    });
  }

  res.json({ message: 'Tiket berhasil ditolak' });
}));

// Assign Padal ke tiket (Subtekinfo only)
router.post('/:id/assign', auth, role('Subtekinfo'), asyncHandler(async (req, res) => {
  const ticketId = req.params.id;
  const { padal_id } = req.body;

  if (!padal_id) {
    return res.status(400).json({ message: 'padal_id harus diisi' });
  }

  // Cek tiket ada
  const [[ticket]] = await pool.query('SELECT id, ticket_number, title, status, user_id AS satker_id FROM tickets WHERE id = ?', [ticketId]);
  if (!ticket) return res.status(404).json({ message: 'Tiket tidak ditemukan' });

  // Cek Padal ada dan memang role Padal
  const [[padal]] = await pool.query('SELECT id, name FROM users WHERE id = ? AND role = ?', [padal_id, 'Padal']);
  if (!padal) return res.status(404).json({ message: 'Padal tidak ditemukan' });

  // Hapus assignment aktif sebelumnya jika ada
  await pool.query(
    "UPDATE ticket_assignments SET status = 'cancelled' WHERE ticket_id = ? AND status = 'pending_confirm'",
    [ticketId]
  );

  // Buat assignment baru
  await pool.query(
    "INSERT INTO ticket_assignments (id, ticket_id, padal_id, assigned_by, status) VALUES (?, ?, ?, ?, 'pending_confirm')",
    [uuidv4(), ticketId, padal_id, req.user.id]
  );

  // Update padal_id di tiket
  await pool.query('UPDATE tickets SET padal_id = ? WHERE id = ?', [padal_id, ticketId]);

  await TicketService.invalidateTicketCaches(ticketId);
  await invalidateAllDashboardCaches();

  // Emit notifikasi ke Padal yang dituju
  const io = req.app.get('io');
  io.to(`user:${padal_id}`).emit('ticket:assigned', {
    ticket_id: ticketId,
    ticket_number: ticket.ticket_number,
    title: ticket.title,
    assigned_by: req.user.name,
  });

  res.status(201).json({ message: 'Tiket berhasil di-assign ke Padal', padal_name: padal.name });
}));

// Hapus assignment Padal dari tiket (Subtekinfo only)
router.delete('/:id/assign', auth, role('Subtekinfo'), asyncHandler(async (req, res) => {
  const ticketId = req.params.id;

  const [[ticket]] = await pool.query('SELECT id FROM tickets WHERE id = ?', [ticketId]);
  if (!ticket) return res.status(404).json({ message: 'Tiket tidak ditemukan' });

  // Batalkan semua assignment pending/accepted
  await pool.query(
    "UPDATE ticket_assignments SET status = 'cancelled' WHERE ticket_id = ? AND status IN ('pending_confirm', 'accepted')",
    [ticketId]
  );

  // Kembalikan tiket ke Pending dan clear padal_id
  await pool.query(
    "UPDATE tickets SET padal_id = NULL, status = 'Pending' WHERE id = ?",
    [ticketId]
  );

  await TicketService.invalidateTicketCaches(ticketId);
  await invalidateAllDashboardCaches();

  res.json({ message: 'Assignment berhasil dihapus, tiket kembali ke Pending' });
}));

// Padal merespons assignment (Padal only)
router.patch('/:id/assignment/respond', auth, role('Padal'), asyncHandler(async (req, res) => {
  const ticketId = req.params.id;
  const { accepted, note } = req.body;

  if (typeof accepted !== 'boolean') {
    return res.status(400).json({ message: 'Field accepted (boolean) harus diisi' });
  }

  // Cek assignment pending untuk Padal ini
  const [[assignment]] = await pool.query(
    "SELECT ta.id, t.ticket_number, t.title, t.user_id AS satker_id FROM ticket_assignments ta JOIN tickets t ON t.id = ta.ticket_id WHERE ta.ticket_id = ? AND ta.padal_id = ? AND ta.status = 'pending_confirm'",
    [ticketId, req.user.id]
  );
  if (!assignment) return res.status(404).json({ message: 'Assignment pending tidak ditemukan' });

  const io = req.app.get('io');

  if (accepted) {
    // Padal terima: update assignment -> accepted, tiket -> Proses
    await pool.query(
      "UPDATE ticket_assignments SET status = 'accepted', responded_at = NOW() WHERE id = ?",
      [assignment.id]
    );
    await pool.query(
      "UPDATE tickets SET status = 'Proses' WHERE id = ?",
      [ticketId]
    );

    // Emit ke Subtekinfo bahwa assignment diterima
    io.to('subtekinfo').emit('ticket:assignment_responded', {
      ticket_id: ticketId,
      ticket_number: assignment.ticket_number,
      padal_id: req.user.id,
      padal_name: req.user.name,
      accepted: true,
      note: note || null,
    });

    // Emit status_changed ke reporter (satker)
    if (assignment.satker_id) {
      io.to(`user:${assignment.satker_id}`).emit('ticket:status_changed', {
        ticket_id: ticketId,
        ticket_number: assignment.ticket_number,
        new_status: 'Proses',
      });
    }
  } else {
    // Padal tolak: update assignment -> rejected, tiket -> Pending, clear padal_id
    await pool.query(
      "UPDATE ticket_assignments SET status = 'rejected', reject_note = ?, responded_at = NOW() WHERE id = ?",
      [note || null, assignment.id]
    );
    await pool.query(
      "UPDATE tickets SET status = 'Pending', padal_id = NULL WHERE id = ?",
      [ticketId]
    );

    // Emit ke Subtekinfo bahwa assignment ditolak
    io.to('subtekinfo').emit('ticket:assignment_responded', {
      ticket_id: ticketId,
      ticket_number: assignment.ticket_number,
      padal_id: req.user.id,
      padal_name: req.user.name,
      accepted: false,
      note: note || null,
    });
  }

  await TicketService.invalidateTicketCaches(ticketId);
  await invalidateAllDashboardCaches();

  res.json({ message: accepted ? 'Assignment diterima' : 'Assignment ditolak' });
}));

// Rating tiket oleh Satker (hanya untuk tiket Selesai miliknya yang belum dirating)
router.post('/:id/rating', auth, role('Satker'), asyncHandler(async (req, res) => {
  const ticketId = req.params.id;
  const { rating } = req.body;

  const ratingNum = Number(rating);
  if (!Number.isInteger(ratingNum) || ratingNum < 1 || ratingNum > 5) {
    return res.status(400).json({ message: 'Rating harus berupa angka 1–5' });
  }

  // Cek tiket ada, milik user ini, dan berstatus Selesai
  const [[ticket]] = await pool.query(
    "SELECT id, ticket_number, padal_id, status, user_id FROM tickets WHERE id = ? AND user_id = ?",
    [ticketId, req.user.id]
  );
  if (!ticket) return res.status(404).json({ message: 'Tiket tidak ditemukan' });
  if (ticket.status !== 'Selesai') {
    return res.status(400).json({ message: 'Hanya tiket yang sudah Selesai yang bisa dirating' });
  }
  if (!ticket.padal_id) {
    return res.status(400).json({ message: 'Tiket tidak memiliki Padal yang ditugaskan' });
  }

  // Cek belum pernah dirating
  const [[existing]] = await pool.query(
    'SELECT id FROM ticket_ratings WHERE ticket_id = ?',
    [ticketId]
  );
  if (existing) return res.status(400).json({ message: 'Tiket ini sudah dirating' });

  await pool.query(
    'INSERT INTO ticket_ratings (id, ticket_id, satker_id, padal_id, rating) VALUES (?, ?, ?, ?, ?)',
    [uuidv4(), ticketId, req.user.id, ticket.padal_id, ratingNum]
  );

  // Emit notifikasi ke Padal
  const io = req.app.get('io');
  io.to(`user:${ticket.padal_id}`).emit('ticket:rating_received', {
    ticket_id: ticketId,
    ticket_number: ticket.ticket_number,
    rating: ratingNum,
  });

  res.status(201).json({ message: 'Rating berhasil diberikan' });
}));

module.exports = router;
