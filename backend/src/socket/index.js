const logger = require('../utils/logger');

const socketHandler = (io) => {
  io.on('connection', (socket) => {
    logger.info('User connected to WebSocket', { socketId: socket.id });

    // Join personal user room (untuk notifikasi langsung ke user tertentu)
    socket.on('join_user_room', (userId) => {
      if (userId && typeof userId === 'string') {
        socket.join(`user:${userId}`);
        logger.info('Socket joined user room', { socketId: socket.id, userId });
      }
    });

    // Join Subtekinfo broadcast room (untuk notifikasi tiket baru dan assignment response)
    socket.on('join_subtekinfo_room', () => {
      socket.join('subtekinfo');
      logger.info('Socket joined subtekinfo room', { socketId: socket.id });
    });

    socket.on('disconnect', () => {
      logger.info('User disconnected from WebSocket', { socketId: socket.id });
    });
  });
};

module.exports = socketHandler;
