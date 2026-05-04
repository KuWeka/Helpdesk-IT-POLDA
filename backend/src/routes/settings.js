const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const auth = require('../middleware/auth');
const role = require('../middleware/role');
const { asyncHandler } = require('../middleware/errorHandler');
const { QueryBuilder, parsePagination } = require('../utils/queryBuilder');
const { validateInputLength, sanitizeInput } = require('../utils/validators');

/**
 * GET /api/settings
 * Get system settings (public endpoint)
 */
router.get('/', asyncHandler(async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM system_settings WHERE id = 1');
  
  if (rows.length === 0) {
    return res.json({
      success: true,
      settings: {
        app_name: 'IT Helpdesk',
        app_description: '',
        maintenance_mode: false
      }
    });
  }

  res.json({
    success: true,
    settings: rows[0]
  });
}));

/**
 * PATCH /api/settings
 * Update system settings (Admin only)
 * Body: { app_name?, app_description?, maintenance_mode? }
 */
router.patch('/', auth, role('Subtekinfo'), asyncHandler(async (req, res) => {
  const { app_name, app_description, maintenance_mode, whatsapp_number } = req.body;

  const errors = [];

  // Validation
  if (app_name !== undefined) {
    const validation = validateInputLength(app_name.toString(), 1, 100);
    if (!validation.isValid) {
      errors.push('Nama aplikasi ' + validation.error);
    }
  }

  if (app_description !== undefined) {
    const validation = validateInputLength(app_description.toString(), 0, 500);
    if (!validation.isValid) {
      errors.push('Deskripsi aplikasi ' + validation.error);
    }
  }

  if (whatsapp_number !== undefined && whatsapp_number !== null && whatsapp_number !== '') {
    if (!/^[0-9]{8,20}$/.test(whatsapp_number.toString())) {
      errors.push('Nomor WhatsApp harus berupa angka 8-20 digit (tanpa tanda + atau spasi)');
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validasi gagal',
      errors
    });
  }

  // Build update query
  const querySets = [];
  const queryArgs = [];

  if (app_name !== undefined) {
    querySets.push('app_name = ?');
    queryArgs.push(sanitizeInput(app_name.toString()));
  }

  if (app_description !== undefined) {
    querySets.push('app_description = ?');
    queryArgs.push(sanitizeInput(app_description.toString()));
  }

  if (maintenance_mode !== undefined) {
    querySets.push('maintenance_mode = ?');
    queryArgs.push(maintenance_mode ? 1 : 0);
  }

  if (whatsapp_number !== undefined) {
    querySets.push('whatsapp_number = ?');
    queryArgs.push(whatsapp_number === null || whatsapp_number === '' ? null : whatsapp_number.toString().trim());
  }

  if (querySets.length === 0) {
    return res.json({
      success: true,
      message: 'Tidak ada perubahan'
    });
  }

  queryArgs.push(1);
  await pool.query(`UPDATE system_settings SET ${querySets.join(', ')} WHERE id = ?`, queryArgs);

  res.json({
    success: true,
    message: 'Pengaturan berhasil diperbarui'
  });
}));

/**
 * GET /api/settings/activity-logs
 * Get activity logs (Admin only)
 * Query: action_type, page, perPage, limit, offset
 */
router.get('/activity-logs', auth, role('Subtekinfo'), asyncHandler(async (req, res) => {
  const { action_type, page, perPage, limit, offset } = req.query;

  const pagination = parsePagination(page, perPage, limit, offset);

  const baseQuery = `
      SELECT l.*, u.name as admin_name 
      FROM activity_logs l
      LEFT JOIN users u ON l.admin_id = u.id
    `;

  const qb = new QueryBuilder(baseQuery);

  if (action_type) {
    const allowedActions = ['create', 'update', 'delete', 'login', 'logout'];
    if (allowedActions.includes(action_type)) {
      qb.where('l.action_type = ?', action_type);
    }
  }

  qb.orderBy('l.created_at', 'DESC');

  // Get total count
  const countQuery = qb.buildCountQuery();
  const [[{ total }]] = await pool.query(countQuery.query, countQuery.params);

  // Apply pagination and get data
  qb.paginate(pagination.limit, pagination.offset);
  const { query, params } = qb.build();
  const [rows] = await pool.query(query, params);

  if (pagination.page) {
    return res.json({
      success: true,
      logs: rows,
      totalItems: total,
      page: pagination.page,
      perPage: pagination.perPage
    });
  }

  res.json({
      success: true,
      logs: rows,
      total
    });
}));

module.exports = router;
