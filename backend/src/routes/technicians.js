const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const pool = require('../config/db');
const auth = require('../middleware/auth');
const role = require('../middleware/role');
const { asyncHandler } = require('../middleware/errorHandler');
const { validateEmail, validateInputLength, validatePasswordStrength, sanitizeInput } = require('../utils/validators');
const { invalidateAllDashboardCaches } = require('../utils/dashboardCache');
const { ApiResponse } = require('../utils/apiResponse');

/**
 * GET /api/technicians
 * Get all technicians with their settings
 */
router.get('/', auth, asyncHandler(async (req, res) => {
  const [rows] = await pool.query(`
    SELECT u.id, u.name, u.email, u.phone, u.role, u.is_active, u.created_at,
           COUNT(pm.id) AS member_count
    FROM users u
    LEFT JOIN padal_members pm ON pm.padal_id = u.id
    WHERE u.role = 'Padal'
    GROUP BY u.id
    ORDER BY u.name ASC
  `);
  
  const technicians = rows;

  res.json(ApiResponse.success({
    technicians,
    total: technicians.length
  }));
}));

/**
 * GET /api/technicians/:userId
 * Get specific technician details
 */
router.get('/:userId', auth, asyncHandler(async (req, res) => {
  const { userId } = req.params;

  // Permission check
  if (req.user.role !== 'Subtekinfo' && req.user.id !== userId) {
    return res.status(403).json(ApiResponse.error('Tidak memiliki izin untuk melihat profil teknisi lain', null, 403));
  }

  const [rows] = await pool.query(
    `
    SELECT u.id, u.name, u.email, u.phone, u.role, u.is_active, u.created_at
    FROM users u
    WHERE u.role = 'Padal' AND u.id = ?
    `,
    [userId]
  );

  if (rows.length === 0) {
    return res.status(404).json(ApiResponse.error('Teknisi tidak ditemukan', null, 404));
  }

  const technician = rows[0];

  res.json(ApiResponse.success({ technician }));
}));

/**
 * POST /api/technicians
 * Create new technician (Admin only)
 * Body: { name, email, password, phone? }
 */
router.post('/', auth, role('Subtekinfo'), asyncHandler(async (req, res) => {
  const { name, email, password, phone } = req.body;

  const errors = [];

  // Validation
  if (!name || name.toString().trim().length === 0) {
    errors.push('Nama harus diisi');
  } else {
    const nameValidation = validateInputLength(name.toString(), 2, 100);
    if (!nameValidation.isValid) {
      errors.push('Nama ' + nameValidation.error);
    }
  }

  if (!email || !validateEmail(email.toString())) {
    errors.push('Email tidak valid');
  }

  if (!password) {
    errors.push('Password harus diisi');
  } else {
    const passwordValidation = validatePasswordStrength(password.toString());
    if (!passwordValidation.isValid) {
      errors.push(...passwordValidation.errors);
    }
  }

  if (phone && phone.toString().length > 0) {
    const phoneValidation = validateInputLength(phone.toString(), 1, 20);
    if (!phoneValidation.isValid) {
      errors.push('Nomor telepon ' + phoneValidation.error);
    }
  }

  if (errors.length > 0) {
    return res.status(400).json(ApiResponse.error('Validasi gagal', errors, 400));
  }

  // Check if email already exists
  const [existingUser] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
  if (existingUser.length > 0) {
    return res.status(400).json(ApiResponse.error('Email sudah terdaftar', null, 400));
  }

  // Create technician
  const id = uuidv4();
  const salt = await bcrypt.genSalt(12);
  const password_hash = await bcrypt.hash(password, salt);

  await pool.query(
    'INSERT INTO users (id, name, email, password_hash, phone, role, is_active) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [id, sanitizeInput(name), email, password_hash, phone || null, 'Padal', 1]
  );

  await invalidateAllDashboardCaches();

  res.status(201).json(ApiResponse.success({ id }, 'Teknisi berhasil dibuat'));
}));

/**
 * POST /api/technicians/promote
 * Promote existing user to technician (Admin only)
 * Body: { user_id, tech_is_active?, shift_date?, specializations?, max_active_tickets?, wa_notification? }
 */
router.post('/promote', auth, role('Subtekinfo'), asyncHandler(async (req, res) => {
  const {
    user_id,
    tech_is_active,
    shift_date,
    specializations,
    max_active_tickets,
    wa_notification,
  } = req.body;

  if (!user_id) {
    return res.status(400).json(ApiResponse.error('user_id wajib diisi', null, 400));
  }

  const [users] = await pool.query('SELECT id, role FROM users WHERE id = ?', [user_id]);
  if (users.length === 0) {
    return res.status(404).json(ApiResponse.error('User tidak ditemukan', null, 404));
  }

  if (users[0].role === 'Padal') {
    return res.status(400).json(ApiResponse.error('User sudah menjadi Padal', null, 400));
  }

  await pool.query('UPDATE users SET role = ? WHERE id = ?', ['Padal', user_id]);

  await invalidateAllDashboardCaches();

  return res.status(201).json(ApiResponse.success({ user_id }, 'User berhasil dipromosikan menjadi Teknisi', 201));
}));

/**
 * PATCH /api/technicians/:id/downgrade
 * Downgrade technician to user (Admin only)
 */
router.patch('/:id/downgrade', auth, role('Subtekinfo'), asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Prevent self-downgrade
  if (req.user.id === id) {
    return res.status(400).json(ApiResponse.error('Tidak dapat menurunkan akun sendiri', null, 400));
  }

  // Verify user is technician
  const [techExists] = await pool.query('SELECT id FROM users WHERE id = ? AND role = ?', [id, 'Padal']);
  if (techExists.length === 0) {
    return res.status(404).json(ApiResponse.error('Padal tidak ditemukan', null, 404));
  }

  await pool.query('UPDATE users SET role = ? WHERE id = ?', ['Satker', id]);

  await invalidateAllDashboardCaches();

  res.json(ApiResponse.success(null, 'Teknisi berhasil diturunkan ke User'));
}));

router.patch('/:userId/status', auth, asyncHandler(async (req, res) => {
  const { userId } = req.params;
  if (req.user.role !== 'Subtekinfo' && req.user.id !== userId) {
    return res.status(403).json(ApiResponse.error('Forbidden', null, 403));
  }

  const { is_active } = req.body;
  await pool.query('UPDATE users SET is_active = ? WHERE id = ?', [is_active ? 1 : 0, userId]);
  await invalidateAllDashboardCaches();

  res.json(ApiResponse.success(null, 'Updated'));
}));

// Update technician
router.patch('/:id', auth, asyncHandler(async (req, res) => {
  if (req.user.role !== 'Subtekinfo' && req.user.id !== req.params.id) {
    return res.status(403).json(ApiResponse.error('Forbidden', null, 403));
  }

  const updates = req.body;
  const id = req.params.id;

  // Split user updates and settings updates
  const userSets = [];
  const userArgs = [];
  const techSets = [];
  const techArgs = [];

  for (const key in updates) {
    if (['name', 'email', 'phone', 'is_active'].includes(key)) {
      userSets.push(`${key} = ?`);
      userArgs.push(updates[key]);
    }
    if (['shift_date', 'specializations', 'max_active_tickets', 'wa_notification'].includes(key)) {
      techSets.push(`${key} = ?`);
      techArgs.push(typeof updates[key] === 'object' ? JSON.stringify(updates[key]) : updates[key]);
    }
    // tech is_active is different from user is_active
    if (key === 'tech_is_active') {
      techSets.push('is_active = ?');
      techArgs.push(updates[key]);
    }
  }

  if (userSets.length > 0) {
    userArgs.push(id);
    await pool.query(`UPDATE users SET ${userSets.join(', ')} WHERE id = ?`, userArgs);
  }

  // technician_settings table has been removed in migration 001_revision_schema.sql

  await invalidateAllDashboardCaches();

  res.json(ApiResponse.success(null, 'Updated'));
}));

module.exports = router;
