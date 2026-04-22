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
  const { status, urgency, user_id, assigned_technician_id, unassigned, search, page, perPage, sort, order } = req.query;

  // Role-based filtering
  let effectiveUserId = user_id;
  let effectiveAssignedTechnicianId = assigned_technician_id;

  if (req.user.role === 'User') {
    // Users can only see their own tickets
    effectiveUserId = req.user.id;
  } else if (req.user.role === 'Teknisi') {
    // Technicians default to their own assigned tickets.
    // Use unassigned=true to access queue tickets not assigned to any technician.
    if (unassigned === true) {
      effectiveAssignedTechnicianId = '';
    } else if (assigned_technician_id === undefined) {
      effectiveAssignedTechnicianId = req.user.id;
    }
  }
  // Admin can see all tickets

  const result = await TicketService.getTickets(
    {
      status,
      urgency,
      user_id: effectiveUserId,
      assigned_technician_id: effectiveAssignedTechnicianId,
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
  if (req.user.role === 'User') {
    whereClause = 'WHERE user_id = ?';
    params = [req.user.id];
  } else if (req.user.role === 'Teknisi') {
    whereClause = 'WHERE assigned_technician_id = ?';
    params = [req.user.id];
  } else if (req.user.role === 'Admin') {
    // Admin can request scoped summary by role/userId
    if (role === 'user' && userId) {
      whereClause = 'WHERE user_id = ?';
      params = [userId];
    } else if (role === 'technician' && userId) {
      whereClause = 'WHERE assigned_technician_id = ?';
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

  const [urgentRows] = await pool.query(
    `SELECT COUNT(*) as count
     FROM tickets
     ${unresolvedWhere}
     AND LOWER(COALESCE(urgency, '')) IN ('tinggi', 'high', 'urgent', 'critical', 'kritis')`,
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
  const totalCount = Number(totalsRows?.[0]?.total_count || 0);
  const selesaiCount = Number(totalsRows?.[0]?.selesai_count || 0);

  const summary = {
    pending,
    proses,
    selesai,
    sla_compliance: totalCount > 0 ? Number(((selesaiCount / totalCount) * 100).toFixed(1)) : 0,
    aging_count: Number(agingRows?.[0]?.count || 0),
    urgent_count: Number(urgentRows?.[0]?.count || 0),
    trend: trendRows.map((row) => ({
      date: row.day,
      count: Number(row.count || 0)
    }))
  };

  res.json(ApiResponse.success({ summary }));
}));

// Get ticket details
router.get('/:id', auth, asyncHandler(async (req, res) => {
  const [rows] = await pool.query(`
      SELECT t.*, 
             u.name as reporter_name, 
             u.email as reporter_email,
             u.phone as reporter_phone,
             d.name as reporter_division_name,
             tech.name as technician_name 
      FROM tickets t
      LEFT JOIN users u ON t.user_id = u.id
      LEFT JOIN divisions d ON u.division_id = d.id
      LEFT JOIN users tech ON t.assigned_technician_id = tech.id
      WHERE t.id = ?
    `, [req.params.id]);

  if (rows.length === 0) return res.status(404).json({ message: 'Ticket not found' });

  const ticket = rows[0];
  if (req.user.role === 'User' && ticket.user_id !== req.user.id) {
    return res.status(403).json({ message: 'Forbidden' });
  }

  ticket.expand = {
    user_id: { name: ticket.reporter_name },
    assigned_technician_id: ticket.assigned_technician_id ? { name: ticket.technician_name } : null
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

router.post('/', auth, validate(ticketSchemas.create), asyncHandler(async (req, res) => {
  const { title, description, location, urgency, category } = req.body;
  const id = uuidv4();
  
  // Generate ticket number on backend (server-side, not frontend)
  const ticket_number = generateTicketNumber();
  const now = new Date();

  await pool.query(
    'INSERT INTO tickets (id, ticket_number, title, description, location, urgency, category, status, user_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [id, ticket_number, title, description, location || '', urgency || 'Sedang', category, 'Pending', req.user.id, now, now]
  );

  await invalidateAllDashboardCaches();

  const io = req.app.get('io');
  io.to('technicians').emit('new_ticket', { id, ticket_number, title, urgency, category, status: 'Pending' });

  // Return full ticket data with success response
  const ticketData = {
    id,
    ticket_number,
    title,
    description,
    location: location || '',
    urgency: urgency || 'Sedang',
    category,
    status: 'Pending',
    user_id: req.user.id,
    assigned_technician_id: null,
    closed_at: null,
    created_at: now,
    updated_at: now
  };

  res.status(201).json(ApiResponse.success({ ticket: ticketData }, 'Tiket berhasil dibuat', 201));
}));

// Update ticket
router.patch('/:id', auth, asyncHandler(async (req, res) => {
  const { status, assigned_technician_id, closed_at, title, description } = req.body;
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

  if (querySets.length === 0) return res.json({ message: 'No updates' });

  queryArgs.push(req.params.id);
  await pool.query(`UPDATE tickets SET ${querySets.join(', ')} WHERE id = ?`, queryArgs);

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

  res.json({ message: 'Updated' });
}));

// Delete ticket
router.delete('/:id', auth, role('Admin'), asyncHandler(async (req, res) => {
  await pool.query('DELETE FROM tickets WHERE id = ?', [req.params.id]);
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

router.post('/:id/notes', auth, role('Admin', 'Teknisi'), asyncHandler(async (req, res) => {
  const { note_content } = req.body;
  await pool.query('INSERT INTO ticket_notes (ticket_id, technician_id, note_content) VALUES (?, ?, ?)', [req.params.id, req.user.id, note_content]);
  res.status(201).json({ message: 'Note added' });
}));

module.exports = router;
