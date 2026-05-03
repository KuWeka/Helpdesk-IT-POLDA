const express = require('express');
const cors = require('cors');
const http = require('http');
const dotenv = require('dotenv');
const { Server } = require('socket.io');
const path = require('path');
const compression = require('compression');
const helmet = require('helmet');

dotenv.config();
const NODE_ENV = process.env.NODE_ENV || 'development';

// ===== LOGGER & SWAGGER SETUP =====
const logger = require('./utils/logger');
const { cache } = require('./utils/cache');
const { metricsMiddleware } = require('./utils/metrics');
const { warmStartupCache } = require('./utils/cacheWarmup');

const isSwaggerEnabled = () => {
  if (typeof process.env.ENABLE_SWAGGER === 'string') {
    return process.env.ENABLE_SWAGGER.toLowerCase() === 'true';
  }
  return NODE_ENV !== 'production';
};

const parseAllowedOrigins = () => {
  const fallback = 'http://localhost:5173';
  const configuredOrigins = process.env.CORS_ORIGIN;

  if (process.env.NODE_ENV === 'production') {
    if (!configuredOrigins) {
      throw new Error('Missing required environment variable: CORS_ORIGIN in production');
    }

    const origins = configuredOrigins
      .split(',')
      .map(url => url.trim())
      .filter(Boolean);

    const hasLocalhost = origins.some(origin => /localhost|127\.0\.0\.1/i.test(origin));
    if (hasLocalhost) {
      throw new Error('CORS_ORIGIN must not include localhost/127.0.0.1 in production');
    }

    return origins;
  }

  return (configuredOrigins || fallback)
    .split(',')
    .map(url => url.trim())
    .filter(Boolean);
};

// ===== ENVIRONMENT VALIDATION =====
const validateEnvironment = () => {
  const requiredVars = ['JWT_SECRET'];
  const missingVars = requiredVars.filter(v => !process.env[v]);
  
  if (missingVars.length > 0) {
    const errorMsg = `Missing required environment variables: ${missingVars.join(', ')}`;
    logger.error(errorMsg);
    process.exit(1);
  }

  if (process.env.JWT_SECRET.length < 32) {
    logger.warn('JWT_SECRET should be at least 32 characters long for security');
  }

  // Validate CORS origins early so server fails fast with clear error
  parseAllowedOrigins();

  logger.info('Environment validation completed successfully');
};

validateEnvironment();

// ===== EXPRESS & HTTP SERVER SETUP =====
const app = express();
const server = http.createServer(app);
const allowedOrigins = parseAllowedOrigins();

// ===== SOCKET.IO CONFIGURATION =====
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
    credentials: true,
  },
  pingInterval: parseInt(process.env.SOCKET_PING_INTERVAL || '25000'),
  pingTimeout: parseInt(process.env.SOCKET_PING_TIMEOUT || '5000')
});

app.set('io', io);

require('./socket')(io);

// ===== CORS CONFIGURATION =====
logger.info('Allowed CORS origins configured', { origins: allowedOrigins });

app.use(cors({
  origin: function(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      logger.warn('CORS blocked request', { origin });
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

// ===== MIDDLEWARE =====
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
}));

app.use(metricsMiddleware);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Compression middleware for performance
app.use(compression({
  level: 6,
  threshold: 1024,
  filter: (req, res) => {
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  }
}));

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.request(req, `${req.method} ${req.path}`, {
      statusCode: res.statusCode,
      duration: `${duration}ms`
    });
    if (duration > 1000) {
      logger.performance(`${req.method} ${req.path}`, duration);
    }
  });
  next();
});

// API Versioning
const apiVersioning = require('./middleware/apiVersioning');
const { csrfProtection } = require('./middleware/csrf');
app.use('/api', apiVersioning);
app.use('/api', csrfProtection);

// ===== SWAGGER DOCUMENTATION =====
if (isSwaggerEnabled()) {
  const { swaggerUi, swaggerSpec } = require('./utils/swagger');
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
      displayOperationDuration: true,
    },
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'Helpdesk API Documentation'
  }));

  logger.info('Swagger documentation available at /api/docs');
} else {
  logger.info('Swagger documentation is disabled');
}

// Static file serving dengan security headers
app.use('/uploads', (req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
}, express.static(path.join(__dirname, '../uploads')));

// Security headers middleware
app.use((req, res, next) => {
  res.set({
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
    'Content-Security-Policy': "default-src 'self'",
  });
  next();
});

// ===== ROUTES =====
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const ticketRoutes = require('./routes/tickets');
const technicianRoutes = require('./routes/technicians');
const dashboardRoutes = require('./routes/dashboard');
const uploadRoutes = require('./routes/uploads');
const settingRoutes = require('./routes/settings');
const healthRoutes = require('./routes/health');
const padalShiftRoutes = require('./routes/padal-shifts');
const reportRoutes = require('./routes/reports');

// Initialize audit logging
const auditLogger = require('./utils/auditLogger');
if (NODE_ENV !== 'test') {
  auditLogger.init().catch(error => logger.error('Failed to initialize audit logger', { error }));
}

// Initialize Redis cache
if (NODE_ENV !== 'test') {
  cache.connect()
    .then(() => warmStartupCache())
    .catch(error => logger.error('Failed to connect to Redis', { error }));
}

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/technicians', technicianRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/uploads', uploadRoutes);
app.use('/api/settings', settingRoutes);
app.use('/api/health', healthRoutes);
app.use('/api/padal-shifts', padalShiftRoutes);
app.use('/api/reports', reportRoutes);

// ===== 404 HANDLER =====
app.use((req, res) => {
  logger.warn('404 Not Found', { path: req.path, method: req.method });
  res.status(404).json({
    success: false,
    message: 'Endpoint tidak ditemukan',
    path: req.path,
    method: req.method
  });
});

// ===== GLOBAL ERROR HANDLER =====
const { errorHandler } = require('./middleware/errorHandler');
app.use((err, req, res, next) => {
  logger.error('Unhandled error', { error: err.message, stack: err.stack, req });
  errorHandler(err, req, res, next);
});

// ===== START SERVER =====
const PORT = process.env.PORT || 3001;
let serverInstance = server;

if (NODE_ENV !== 'test') {
  serverInstance = server.listen(PORT, () => {
    logger.info(`Server started successfully`, {
      environment: NODE_ENV,
      port: PORT,
      nodeVersion: process.version
    });
  });
} else {
  logger.info('Server initialized in test mode without binding network port');
}

// ===== GRACEFUL SHUTDOWN =====
const shutdown = (signal) => {
  logger.info(`${signal} signal received: closing HTTP server`);
  
  // Close Redis connection
  cache.disconnect().catch(error => logger.error('Error closing Redis', { error }));
  
  serverInstance.close(() => {
    logger.info('HTTP server closed gracefully');
    process.exit(0);
  });

  // Force shutdown after 10 seconds
  setTimeout(() => {
    logger.error('Forcing shutdown after 10 seconds');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught exception', { error: error.message, stack: error.stack });
  process.exit(1);
});

// Handle unhandled rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled rejection', { reason, promise });
  process.exit(1);
});

module.exports = server;
