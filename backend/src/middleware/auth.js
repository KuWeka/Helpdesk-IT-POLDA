const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { parseCookies } = require('../utils/cookies');
const { cache } = require('../utils/cache');

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
    // Prefer httpOnly cookie (most secure). Fall back to Authorization: Bearer header
    // to support cross-origin deployments where third-party cookies are blocked.
    // If cookie exists but invalid/stale, retry with Bearer instead of failing immediately.
    const cookies = parseCookies(req);
    const cookieToken = cookies[process.env.ACCESS_TOKEN_COOKIE_NAME || 'helpdesk_access_token'];
    const authHeader = req.headers.authorization;
    const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
    const tokenCandidates = [cookieToken, bearerToken].filter(Boolean);

    if (tokenCandidates.length === 0) {
      return res.status(401).json({ 
        success: false,
        message: 'Akses ditolak. Token tidak ditemukan atau tidak valid.' 
      });
    }

    let decoded = null;
    let validatedToken = null;

    for (const token of tokenCandidates) {
      try {
        const candidateDecoded = jwt.verify(token, JWT_SECRET);
        const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
        const isBlacklisted = await cache.exists(`token:blacklist:${tokenHash}`);
        if (isBlacklisted) {
          continue;
        }
        decoded = candidateDecoded;
        validatedToken = token;
        break;
      } catch (_) {
        // Try next token source
      }
    }

    if (!decoded || !validatedToken) {
      return res.status(401).json({
        success: false,
        message: 'Token tidak valid.'
      });
    }

    req.user = decoded;
    req.authToken = validatedToken;
    
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
