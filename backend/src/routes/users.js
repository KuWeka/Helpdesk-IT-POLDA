const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const auth = require('../middleware/auth');
const role = require('../middleware/role');
const { asyncHandler } = require('../middleware/errorHandler');
const { validate, validateQuery } = require('../middleware/validation');
const { userSchemas } = require('../utils/validationSchemas');
const { ApiResponse } = require('../utils/apiResponse');
const UserService = require('../services/UserService');
const { invalidateAllDashboardCaches } = require('../utils/dashboardCache');
const pool = require('../config/db');
const logger = require('../utils/logger');

/**
 * Write an audit log entry to the activity_logs table.
 * Non-critical: errors are logged but never thrown to avoid breaking the main flow.
 */
async function auditLog(actorId, actionType, targetType, targetId, details = {}) {
  try {
    await pool.query(
      'INSERT INTO activity_logs (admin_id, action_type, target_type, target_id, details) VALUES (?, ?, ?, ?, ?)',
      [actorId, actionType, targetType, String(targetId), JSON.stringify(details)]
    );
  } catch (err) {
    logger.error('Failed to write audit log', { error: err.message, actionType, targetType, targetId });
  }
}

// Rate limiter: max 5 password change attempts per user per hour
const passwordChangeLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  keyGenerator: (req) => req.user?.id || rateLimit.ipKeyGenerator(req.ip),
  message: 'Terlalu banyak percobaan ubah password. Silakan coba lagi dalam 1 jam.',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Only apply when the request contains a password change
    return !req.body?.password && !req.body?.oldPassword;
  },
});

// Rate limiter: max 60 list requests per user per minute (prevent scraping / DoS)
const userListLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  keyGenerator: (req) => req.user?.id || rateLimit.ipKeyGenerator(req.ip),
  message: 'Terlalu banyak permintaan daftar pengguna. Silakan coba lagi nanti.',
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * GET /api/users
 * Get list of all users.
 * Query: role, is_active, search, limit, offset, page, perPage
 */
router.get('/', auth, userListLimiter, role('Subtekinfo', 'Padal'), validateQuery(userSchemas.list), asyncHandler(async (req, res) => {
  const { role: filterRole, is_active, search, page, perPage, sort, order } = req.query;

  if (req.user.role === 'Padal' && filterRole !== 'Teknisi') {
    return res.status(403).json(ApiResponse.error('Padal hanya dapat melihat daftar Teknisi', null, 403));
  }

  const result = await UserService.getUsers(
    { role: filterRole, is_active, search, sort, order },
    { page, perPage }
  );

  res.json(ApiResponse.paginated(result.users, result.pagination));
}));

/**
 * GET /api/users/:id
 * Get user by ID
 */
router.get('/:id', auth, asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Users can only view their own profile unless they're Subtekinfo
  if (req.user.role !== 'Subtekinfo' && req.user.id !== id) {
    return res.status(403).json(ApiResponse.error('Tidak memiliki izin untuk melihat profil user lain', null, 403));
  }

  const user = await UserService.getUserById(id);

  if (!user) {
    return res.status(404).json(ApiResponse.error('User tidak ditemukan', null, 404));
  }

  res.json(ApiResponse.success({ user }));
}));

/**
 * POST /api/users
 * Create new user (Admin only)
 * Body: { name, email, password, phone?, role? }
 */
router.post('/', auth, role('Subtekinfo'), validate(userSchemas.create), asyncHandler(async (req, res) => {
  const { name, email, password, phone, role: userRole } = req.body;

  // Check if email already exists
  const emailExists = await UserService.emailExists(email);
  if (emailExists) {
    return res.status(400).json(ApiResponse.error('Email sudah terdaftar', null, 400));
  }

  // Create user
  const user = await UserService.createUser({
    name,
    email,
    password,
    phone,
    role: userRole
  });

  await invalidateAllDashboardCaches();

  res.status(201).json(ApiResponse.success({
    user
  }, 'User berhasil dibuat', 201));
}));

/**
 * PATCH /api/users/:id
 * Update user (with password validation support)
 * Body: { name, email, phone, language, theme, password, oldPassword }
 */
router.patch('/:id', auth, passwordChangeLimiter, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  // Users can only update their own profile unless they're Subtekinfo
  if (req.user.role !== 'Subtekinfo' && req.user.id !== id) {
    return res.status(403).json(ApiResponse.error('Tidak memiliki izin untuk mengubah profil user lain', null, 403));
  }

  // Check if email exists (if updating email)
  if (updates.email) {
    const emailExists = await UserService.emailExists(updates.email, id);
    if (emailExists) {
      return res.status(400).json(ApiResponse.error('Email sudah digunakan', null, 400));
    }
  }

  // Check if username exists (if updating username)
  if (updates.username) {
    const usernameExists = await UserService.usernameExists(updates.username, id);
    if (usernameExists) {
      return res.status(400).json(ApiResponse.error('Username sudah digunakan', null, 400));
    }
  }

  try {
    const updatedUser = await UserService.updateUser(id, updates);

    if (!updatedUser) {
      return res.status(404).json(ApiResponse.error('User tidak ditemukan', null, 404));
    }

    await invalidateAllDashboardCaches();

    // Audit log: role change is a security-sensitive event
    if (updates.role && updatedUser) {
      const previousUser = await UserService.getUserById(id);
      await auditLog(req.user.id, 'user.role_change', 'user', id, {
        changed_by: req.user.id,
        target_user: id,
        new_role: updates.role,
      });
    }
    // Audit log: password change
    if (updates.password) {
      await auditLog(req.user.id, 'user.password_change', 'user', id, {
        changed_by: req.user.id,
        target_user: id,
      });
    }

    res.json(ApiResponse.success({
      user: updatedUser
    }, 'User berhasil diperbarui'));
  } catch (error) {
    // Handle specific password validation errors
    if (error.message.includes('Password lama tidak sesuai')) {
      return res.status(401).json(ApiResponse.error('Password lama tidak sesuai', null, 401));
    }
    if (error.message.includes('Password lama wajib')) {
      return res.status(400).json(ApiResponse.error('Password lama wajib diisi', null, 400));
    }
    if (error.message.includes('Password baru wajib')) {
      return res.status(400).json(ApiResponse.error('Password baru wajib diisi', null, 400));
    }
    // Re-throw other errors to be handled by errorHandler
    throw error;
  }
}));

/**
 * DELETE /api/users/:id
 * Delete user (Admin only)
 */
router.delete('/:id', auth, role('Subtekinfo'), asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Prevent self-deletion
  if (req.user.id === id) {
    return res.status(400).json(ApiResponse.error('Tidak dapat menghapus akun sendiri', null, 400));
  }

  const user = await UserService.getUserById(id);
  if (!user) {
    return res.status(404).json(ApiResponse.error('User tidak ditemukan', null, 404));
  }

  // Prevent deletion of Subtekinfo (admin) accounts to protect against privilege abuse
  if (user.role === 'Subtekinfo') {
    return res.status(403).json(ApiResponse.error('Akun Subtekinfo tidak dapat dihapus melalui API ini', null, 403));
  }

  await UserService.deleteUser(id);

  await auditLog(req.user.id, 'user.deleted', 'user', id, {
    deleted_by: req.user.id,
    target_name: user.name,
    target_email: user.email,
    target_role: user.role,
  });

  await invalidateAllDashboardCaches();

  res.json(ApiResponse.success(null, 'User berhasil dihapus'));
}));

module.exports = router;
