const dotenv = require('dotenv');
dotenv.config();

// Validate all required environment variables before loading any other module.
// process.exit(1) on missing/invalid vars so we fail fast instead of at request time.
const { assertEnv } = require('./config/env');
assertEnv();

const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const compression = require('compression');
const zlib = require('zlib');
const helmet = require('helmet');
const NODE_ENV = process.env.NODE_ENV || 'development';

// ===== LOGGER & SWAGGER SETUP =====
const logger = require('./utils/logger');
const { cache } = require('./utils/cache');
const { metricsMiddleware } = require('./utils/metrics');
const { warmStartupCache } = require('./utils/cacheWarmup');
const { startAssignmentTimeoutCron } = require('./services/AssignmentTimeoutService');
const { runMigrations } = require('../scripts/migrate');

const isSwaggerEnabled = () => {
  // Swagger is NEVER available in production, regardless of env vars
  if (NODE_ENV === 'production') return false;
  if (typeof process.env.ENABLE_SWAGGER === 'string') {
    return process.env.ENABLE_SWAGGER.toLowerCase() === 'true';
  }
  return true; // enabled by default in dev/staging
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
  const requiredVars = ['JWT_SECRET', 'JWT_REFRESH_SECRET'];
  const missingVars = requiredVars.filter(v => !process.env[v]);
  
  if (missingVars.length > 0) {
    const errorMsg = `Missing required environment variables: ${missingVars.join(', ')}`;
    logger.error(errorMsg);
    process.exit(1);
  }

  if (process.env.JWT_SECRET.length < 32) {
    logger.warn('JWT_SECRET should be at least 32 characters long for security');
  }

  if (process.env.JWT_REFRESH_SECRET.length < 32) {
    logger.warn('JWT_REFRESH_SECRET should be at least 32 characters long for security');
  }

  if (process.env.JWT_REFRESH_SECRET === process.env.JWT_SECRET) {
    logger.warn('JWT_REFRESH_SECRET should differ from JWT_SECRET to prevent token type confusion');
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
// Helmet security headers — strict in production, relaxed in development
const helmetOptions = NODE_ENV === 'production'
  ? {
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"], // inline styles needed by some UI libs
          imgSrc: ["'self'", 'data:', 'blob:'],
          connectSrc: ["'self'", ...allowedOrigins],
          fontSrc: ["'self'"],
          objectSrc: ["'none'"],
          frameAncestors: ["'none'"],
          upgradeInsecureRequests: [],
        },
      },
      crossOriginEmbedderPolicy: true,
      hsts: {
        maxAge: 31536000,       // 1 year
        includeSubDomains: true,
        preload: true,
      },
    }
  : {
      // Development: disable strict policies that break local tooling
      contentSecurityPolicy: false,
      crossOriginEmbedderPolicy: false,
    };

app.use(helmet(helmetOptions));

// Enforce HTTPS in production (when behind a reverse proxy that sets x-forwarded-proto)
if (NODE_ENV === 'production') {
  app.use((req, res, next) => {
    if (req.header('x-forwarded-proto') === 'http') {
      return res.redirect(301, `https://${req.header('host')}${req.url}`);
    }
    next();
  });
}

app.use(metricsMiddleware);

// Keep JSON/urlencoded body small — file uploads go through multer (its own size limit).
// 1MB is ample for any API JSON payload; 10MB was a memory-exhaustion risk.
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ limit: '1mb', extended: true }));

// Compression: prefer Brotli (br) when client supports it, fall back to gzip/deflate.
// Uses Node.js built-in zlib — no extra package needed.
app.use((req, res, next) => {
  const acceptEncoding = req.headers['accept-encoding'] || '';
  if (!acceptEncoding.includes('br') || req.headers['x-no-compression']) {
    return next();
  }

  // Only compress text-based content types
  const shouldCompress = () => {
    const ct = String(res.getHeader('Content-Type') || '');
    return /json|text|javascript|xml|svg|wasm/.test(ct);
  };

  // Intercept res.json / res.send before they write the socket
  const originalJson = res.json.bind(res);
  res.json = function (body) {
    const payload = JSON.stringify(body);
    const buf = Buffer.from(payload, 'utf8');

    // Only brotli-compress if threshold met (>= 1KB)
    if (buf.length < 1024) {
      return originalJson(body);
    }

    zlib.brotliCompress(buf, { params: { [zlib.constants.BROTLI_PARAM_QUALITY]: 4 } }, (err, compressed) => {
      if (err) {
        return originalJson(body);
      }
      res.setHeader('Content-Encoding', 'br');
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.setHeader('Content-Length', compressed.length);
      res.end(compressed);
    });
  };

  next();
});

// Gzip/deflate fallback for clients that don't support brotli (or responses below threshold)
app.use(compression({
  level: 6,
  threshold: 1024,
  filter: (req, res) => {
    // Skip if brotli already handled it
    if (res.getHeader('Content-Encoding') === 'br') return false;
    if (req.headers['x-no-compression']) return false;
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

// Security headers middleware — only add headers that Helmet does NOT already set.
// DO NOT set Content-Security-Policy here; Helmet handles it with full configuration
// (env-aware, with nonces, allowlists, etc). Duplicating it here would override Helmet.
app.use((req, res, next) => {
  // These are defence-in-depth additions for the /uploads static files path and
  // any other path that might not go through Helmet.
  res.set({
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
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
    startAssignmentTimeoutCron(io);

    // Run pending SQL migrations on every startup — idempotent, safe for Railway deploys
    const pool = require('./config/db');
    runMigrations(pool)
      .then(() => logger.info('Database migrations applied successfully'))
      .catch((err) => logger.error('Database migration failed', { error: err.message }));
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
