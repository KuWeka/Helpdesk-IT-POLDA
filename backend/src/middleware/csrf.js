const crypto = require('crypto');
const { parseCookies } = require('../utils/cookies');

const CSRF_COOKIE_NAME = process.env.CSRF_COOKIE_NAME || 'helpdesk_csrf_token';
const CSRF_HEADER_NAME = 'x-csrf-token';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);
// Login/register are excluded because they issue the CSRF token (nothing to validate yet).
// Refresh is excluded because: (a) it uses the httpOnly refresh-token cookie as proof of
// identity, (b) the CSRF token may not be available yet in cross-origin environments,
// and (c) the response only sets new httpOnly cookies — no sensitive data is leaked.
const EXCLUDED_PATHS = new Set([
  '/auth/login',
  '/auth/register',
  '/auth/refresh',
]);

const isExcludedPath = (path) => EXCLUDED_PATHS.has(path);

const csrfProtection = (req, res, next) => {
  if (SAFE_METHODS.has(req.method)) {
    return next();
  }

  if (isExcludedPath(req.path)) {
    return next();
  }

  const cookies = parseCookies(req);
  const csrfCookie = cookies[CSRF_COOKIE_NAME];
  const csrfHeader = req.headers[CSRF_HEADER_NAME];

  // Both values must be present
  if (!csrfCookie || !csrfHeader) {
    return res.status(403).json({
      success: false,
      message: 'CSRF token tidak valid',
    });
  }

  // Use timing-safe comparison to prevent byte-by-byte guessing attacks
  let tokensMatch = false;
  try {
    const cookieBuf = Buffer.from(csrfCookie);
    const headerBuf = Buffer.from(csrfHeader);
    // timingSafeEqual requires same-length buffers; length mismatch is itself non-secret
    if (cookieBuf.length === headerBuf.length) {
      tokensMatch = crypto.timingSafeEqual(cookieBuf, headerBuf);
    }
  } catch {
    tokensMatch = false;
  }

  if (!tokensMatch) {
    return res.status(403).json({
      success: false,
      message: 'CSRF token tidak valid',
    });
  }

  return next();
};

module.exports = {
  csrfProtection,
  CSRF_COOKIE_NAME,
};
