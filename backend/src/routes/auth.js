const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const crypto = require('crypto');
const pool = require('../config/db');
const auth = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');
const { validate } = require('../middleware/validation');
const { authSchemas } = require('../utils/validationSchemas');
const { ApiResponse } = require('../utils/apiResponse');
const UserService = require('../services/UserService');
const { parseCookies, parseDurationToMs } = require('../utils/cookies');
const { CSRF_COOKIE_NAME } = require('../middleware/csrf');

const ACCESS_TOKEN_COOKIE_NAME = process.env.ACCESS_TOKEN_COOKIE_NAME || 'helpdesk_access_token';
const REFRESH_TOKEN_COOKIE_NAME = process.env.REFRESH_TOKEN_COOKIE_NAME || 'helpdesk_refresh_token';
const isProduction = process.env.NODE_ENV === 'production';

const accessTokenMaxAge = parseDurationToMs(process.env.JWT_EXPIRES || '1h', 60 * 60 * 1000);
const refreshTokenMaxAge = parseDurationToMs(process.env.JWT_REFRESH_EXPIRES || '7d', 7 * 24 * 60 * 60 * 1000);

const getAccessCookieOptions = () => ({
  httpOnly: true,
  secure: true,
  sameSite: 'none',
  path: '/',
  maxAge: accessTokenMaxAge,
});

const getRefreshCookieOptions = () => ({
  httpOnly: true,
  secure: true,
  sameSite: 'none',
  path: '/api/auth',
  maxAge: refreshTokenMaxAge,
});

const getCsrfCookieOptions = () => ({
  httpOnly: false,
  secure: true,
  sameSite: 'none',
  path: '/',
  maxAge: refreshTokenMaxAge,
});

const clearAuthCookies = (res) => {
  res.clearCookie(ACCESS_TOKEN_COOKIE_NAME, {
    httpOnly: true,
    secure: true,
    sameSite: 'none',
    path: '/',
  });
  res.clearCookie(REFRESH_TOKEN_COOKIE_NAME, {
    httpOnly: true,
    secure: true,
    sameSite: 'none',
    path: '/api/auth',
  });
  res.clearCookie(CSRF_COOKIE_NAME, {
    httpOnly: false,
    secure: true,
    sameSite: 'none',
    path: '/',
  });
};

const issueAuthCookies = (res, accessToken, refreshToken) => {
  const csrfToken = crypto.randomBytes(32).toString('hex');

  res.cookie(ACCESS_TOKEN_COOKIE_NAME, accessToken, getAccessCookieOptions());
  res.cookie(REFRESH_TOKEN_COOKIE_NAME, refreshToken, getRefreshCookieOptions());
  res.cookie(CSRF_COOKIE_NAME, csrfToken, getCsrfCookieOptions());

  return csrfToken;
};

// Rate limiter for login attempts
// Limit 5 attempts per 15 minutes per IP
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Terlalu banyak percobaan login. Silakan coba lagi dalam 15 menit.',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    return req.method !== 'POST' || !req.path.includes('/login');
  }
});

// Rate limiter for register attempts
// Limit 3 registration attempts per hour per IP
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  message: 'Terlalu banyak percobaan registrasi. Silakan coba lagi dalam 1 jam.',
  skip: (req) => {
    return req.method !== 'POST' || !req.path.includes('/register');
  }
});

const normalizeRole = (role) => {
  if (!role) return 'Satker';
  if (role === 'User' || role === 'user') return 'Satker';
  if (role === 'Admin' || role === 'admin') return 'Subtekinfo';
  if (role === 'Teknisi' || role === 'teknisi') return 'Teknisi';
  if (role === 'Padal' || role === 'padal') return 'Padal';
  if (role === 'Satker' || role === 'satker') return 'Satker';
  if (role === 'Subtekinfo' || role === 'subtekinfo') return 'Subtekinfo';
  return 'Satker'; // default fallback
};

// Apply rate limiters
router.use('/login', loginLimiter);
router.use('/register', registerLimiter);

/**
 * POST /api/auth/login
 * Login dengan email atau username
 * Body: { identifier: string, password: string }
 */
router.post('/login', validate(authSchemas.login), asyncHandler(async (req, res) => {
  const { identifier, password } = req.body;

  const [rows] = await pool.query(
    'SELECT * FROM users WHERE (email = ? OR username = ?) AND is_active = 1',
    [identifier, identifier]
  );

  if (rows.length === 0) {
    return res.status(401).json(ApiResponse.error('Akun dengan kredensial tersebut tidak ditemukan atau tidak aktif', null, 401));
  }

  const user = rows[0];

  const isMatch = await bcrypt.compare(password, user.password_hash);
  if (!isMatch) {
    return res.status(401).json(ApiResponse.error('Email/Username atau password salah', null, 401));
  }

  // Generate access token (short-lived)
  const accessToken = jwt.sign(
    {
      id: user.id,
      role: user.role,
      name: user.name,
      email: user.email
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES || '1h' }
  );

  // Generate refresh token (long-lived)
  const refreshToken = jwt.sign(
    { id: user.id },
    process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES || '7d' }
  );

  const csrfToken = issueAuthCookies(res, accessToken, refreshToken);

  delete user.password_hash;

  res.json(ApiResponse.success({
    user,
    csrfToken
  }, 'Login berhasil'));
}));

/**
 * POST /api/auth/register
 * Registrasi user baru
 * Body: { name: string, email: string, password: string, phone?: string }
 */
router.post('/register', validate(authSchemas.register), asyncHandler(async (req, res) => {
  const { name, email, password, phone, role } = req.body;

  // Check if email already exists
  const emailExists = await UserService.emailExists(email);
  if (emailExists) {
    return res.status(400).json(ApiResponse.error('Email sudah terdaftar', null, 400));
  }

  // Create user
  // Force role to 'Satker' for self-registration regardless of what was sent
  const finalRole = 'Satker';

  const user = await UserService.createUser({
    name,
    email,
    password,
    phone,
    role: finalRole
  });

  res.status(201).json(ApiResponse.success({
    user
  }, 'Registrasi berhasil', 201));
}));

/**
 * POST /api/auth/refresh
 * Refresh access token using refresh token cookie
 */
router.post('/refresh', asyncHandler(async (req, res) => {
  const cookies = parseCookies(req);
  const refreshToken = req.body?.refreshToken || cookies[REFRESH_TOKEN_COOKIE_NAME];

  if (!refreshToken) {
    return res.status(400).json({ 
      success: false,
      message: 'Refresh token harus diisi' 
    });
  }

  try {
    const decoded = jwt.verify(
      refreshToken, 
      process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET
    );

    // Get fresh user data
    const user = await UserService.getUserById(decoded.id);

    if (!user || !user.is_active) {
      return res.status(401).json(ApiResponse.error('User tidak ditemukan atau tidak aktif', null, 401));
    }

    // Generate new access token
    const newAccessToken = jwt.sign(
      {
        id: user.id,
        role: user.role,
        name: user.name,
        email: user.email
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES || '1h' }
    );

    // Rotate refresh token
    const rotatedRefreshToken = jwt.sign(
      { id: user.id },
      process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_REFRESH_EXPIRES || '7d' }
    );

    const csrfToken = issueAuthCookies(res, newAccessToken, rotatedRefreshToken);

    res.json(ApiResponse.success({
      csrfToken
    }, 'Token berhasil diperbarui'));
  } catch (error) {
    clearAuthCookies(res);
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json(ApiResponse.error('Refresh token kadaluarsa. Silakan login kembali.', null, 401));
    }
    return res.status(401).json(ApiResponse.error('Refresh token tidak valid', null, 401));
  }
}));

/**
 * POST /api/auth/logout
 */
router.post('/logout', auth, asyncHandler(async (req, res) => {
  clearAuthCookies(res);
  return res.json(ApiResponse.success(null, 'Logout berhasil'));
}));

/**
 * GET /api/auth/me
 * Get current user info
 */
router.get('/me', auth, asyncHandler(async (req, res) => {
  const user = await UserService.getUserById(req.user.id);

  if (!user) {
    return res.status(404).json(ApiResponse.error('User tidak ditemukan', null, 404));
  }

  // Re-issue CSRF token so cross-origin clients (e.g. Vercel) can store it
  const csrfToken = crypto.randomBytes(32).toString('hex');
  const { CSRF_COOKIE_NAME } = require('../middleware/csrf');
  res.cookie(CSRF_COOKIE_NAME, csrfToken, getCsrfCookieOptions());

  res.json(ApiResponse.success({
    user,
    csrfToken
  }));
}));

module.exports = router;