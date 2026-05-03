const { parseCookies } = require('../utils/cookies');

const CSRF_COOKIE_NAME = process.env.CSRF_COOKIE_NAME || 'helpdesk_csrf_token';
const CSRF_HEADER_NAME = 'x-csrf-token';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);
const EXCLUDED_PATHS = new Set([
  '/auth/login',
  '/auth/register',
  '/tickets',
]);
const EXCLUDED_PREFIXES = ['/uploads'];

const isExcludedPath = (path) => {
  if (EXCLUDED_PATHS.has(path)) {
    return true;
  }

  return EXCLUDED_PREFIXES.some((prefix) => path.startsWith(prefix));
};

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

  if (!csrfCookie || !csrfHeader || csrfCookie !== csrfHeader) {
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
