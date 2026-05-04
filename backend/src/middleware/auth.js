const jwt = require('jsonwebtoken');
const { parseCookies } = require('../utils/cookies');
const cache = require('../utils/cache');

// Validate JWT_SECRET on module load
const validateJWTSecret = () => {
  const jwtSecret = process.env.JWT_SECRET;
  
  if (!jwtSecret) {
    throw new Error(
      'CRITICAL: JWT_SECRET environment variable is not set. ' +
      'This is required for authentication. Please set JWT_SECRET in your .env file.'
    );
  }
  
  if (jwtSecret.length < 32) {
    const logger = require('../utils/logger');
    logger.warn(
      'WARNING: JWT_SECRET should be at least 32 characters long for security. ' +
      `Current length: ${jwtSecret.length} characters.`
    );
  }
  
  return jwtSecret;
};

// Get JWT secret once on load
let JWT_SECRET;
const logger = require('../utils/logger');
try {
  JWT_SECRET = validateJWTSecret();
} catch (error) {
  logger.error(error.message);
  process.exit(1);
}

const auth = async (req, res, next) => {
  try {
    // Read token exclusively from httpOnly cookie — the Authorization Bearer header
    // path is removed to prevent token theft via XSS (JS cannot read httpOnly cookies).
    const cookies = parseCookies(req);
    const token = cookies[process.env.ACCESS_TOKEN_COOKIE_NAME || 'helpdesk_access_token'];

    if (!token) {
      return res.status(401).json({ 
        success: false,
        message: 'Akses ditolak. Token tidak ditemukan atau tidak valid.' 
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET);

    // Check token blacklist (set on logout) to support immediate revocation
    const isBlacklisted = await cache.exists(`token:blacklist:${decoded.id}`);
    if (isBlacklisted) {
      return res.status(401).json({
        success: false,
        message: 'Session telah berakhir. Silakan login kembali.',
      });
    }

    req.user = decoded;
    
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        success: false,
        message: 'Token kadaluarsa. Silakan login kembali.' 
      });
    }
    return res.status(401).json({ 
      success: false,
      message: 'Token tidak valid.' 
    });
  }
};

module.exports = auth;
