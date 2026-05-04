/**
 * refreshRole middleware
 *
 * Reads the user's actual role from the DB on every request that needs fine-grained
 * authorization. Sets `req.user.actualRole` so downstream handlers never rely on the
 * potentially-stale JWT payload role.
 *
 * Usage:
 *   router.get('/protected', auth, refreshRole, asyncHandler(async (req, res) => {
 *     const { actualRole } = req.user;
 *     ...
 *   }));
 *
 * Requirements:
 *   - `auth` middleware must run first (populates req.user.id)
 *   - The middleware performs exactly ONE DB query per request; result is memoized
 *     on req.user so it is safe to call the middleware multiple times in a chain.
 */

const pool = require('../config/db');
const { ApiResponse } = require('../utils/apiResponse');

const refreshRole = async (req, res, next) => {
  // Already resolved in this request cycle — skip
  if (req.user && req.user.actualRole) {
    return next();
  }

  try {
    const [[dbUser]] = await pool.query(
      'SELECT role FROM users WHERE id = ? AND is_active = 1 AND deleted_at IS NULL LIMIT 1',
      [req.user.id]
    );

    if (!dbUser) {
      return res
        .status(401)
        .json(ApiResponse.error('Akses ditolak. Akun tidak aktif atau tidak ditemukan.', null, 401));
    }

    req.user.actualRole = dbUser.role;
    next();
  } catch (err) {
    next(err);
  }
};

module.exports = refreshRole;
