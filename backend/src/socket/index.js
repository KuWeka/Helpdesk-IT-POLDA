const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const logger = require('../utils/logger');
const { parseCookies } = require('../utils/cookies');
const cache = require('../utils/cache');

const socketHandler = (io) => {
  // Authenticate every socket connection using the JWT from the httpOnly cookie.
  // withCredentials: true on the client sends cookies automatically — we never
  // expose the token to JavaScript on the frontend (prevents XSS token theft).
  io.use(async (socket, next) => {
    // Read the access token from the httpOnly cookie (same cookie as HTTP requests)
    const cookies = parseCookies({ headers: { cookie: socket.handshake.headers.cookie } });
    const cookieName = process.env.ACCESS_TOKEN_COOKIE_NAME || 'helpdesk_access_token';
    const token = cookies[cookieName];

    if (!token) {
      logger.warn('Socket connection rejected: no token in cookie', { socketId: socket.id });
      return next(new Error('Authentication required'));
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Check token blacklist — prevents logged-out users from using WebSocket
      const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
      const isBlacklisted = await cache.exists(`token:blacklist:${tokenHash}`);
      if (isBlacklisted) {
        logger.warn('Socket connection rejected: token blacklisted (user logged out)', { socketId: socket.id });
        return next(new Error('Session telah berakhir'));
      }

      socket.userId = decoded.id;
      socket.userRole = decoded.role;
      next();
    } catch (err) {
      logger.warn('Socket connection rejected: invalid token', { socketId: socket.id, error: err.message });
      next(new Error('Invalid or expired token'));
    }
  });

  io.on('connection', (socket) => {
    logger.info('User connected to WebSocket', { socketId: socket.id, userId: socket.userId });

    // Join personal user room — only allowed for the authenticated user's own room
    socket.on('join_user_room', (userId) => {
      if (!userId || typeof userId !== 'string') return;

      if (userId !== socket.userId) {
        logger.warn('Socket room join rejected: userId mismatch', {
          socketId: socket.id,
          authenticatedUserId: socket.userId,
          requestedUserId: userId
        });
        socket.emit('error', { message: 'Unauthorized: cannot join another user\'s room' });
        return;
      }

      socket.join(`user:${userId}`);
      logger.info('Socket joined user room', { socketId: socket.id, userId });
    });

    // Join Subtekinfo broadcast room — only for Subtekinfo role
    socket.on('join_subtekinfo_room', () => {
      if (socket.userRole !== 'Subtekinfo') {
        logger.warn('Socket subtekinfo room join rejected: insufficient role', {
          socketId: socket.id,
          userId: socket.userId,
          role: socket.userRole
        });
        socket.emit('error', { message: 'Unauthorized: insufficient role' });
        return;
      }

      socket.join('subtekinfo');
      logger.info('Socket joined subtekinfo room', { socketId: socket.id, userId: socket.userId });
    });

    socket.on('disconnect', () => {
      logger.info('User disconnected from WebSocket', { socketId: socket.id, userId: socket.userId });
    });
  });
};

module.exports = socketHandler;
