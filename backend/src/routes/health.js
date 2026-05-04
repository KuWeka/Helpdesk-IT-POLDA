/**
 * Health Check Endpoint
 * Provides system status and metrics
 */

const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { ApiResponse } = require('../utils/apiResponse');
const { cache } = require('../utils/cache');
const { register, getMetricsText } = require('../utils/metrics');

/**
 * GET /api/health
 * System health check
 */
router.get('/', async (req, res) => {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    version: process.version,
    environment: process.env.NODE_ENV || 'development'
  };

  try {
    // Test database connection
    const connection = await pool.getConnection();
    await connection.ping();
    connection.release();

    health.database = {
      status: 'connected',
      connections: pool.pool ? pool.pool.size : 'unknown'
    };

    // Cache: do an actual PING to confirm Redis is responsive, not just the isConnected flag
    // (the flag can be stale after a network partition that hasn't fully disconnected yet)
    let cacheStatus = 'disconnected';
    if (cache.isConnected && cache.client) {
      try {
        const pong = await cache.client.ping();
        cacheStatus = pong === 'PONG' ? 'connected' : 'degraded';
      } catch {
        cacheStatus = 'degraded';
      }
    }
    health.cache = {
      status: cacheStatus,
      provider: 'redis'
    };

    res.json(ApiResponse.success(health, 'System is healthy'));

  } catch (error) {
    health.status = 'unhealthy';
    health.database = {
      status: 'disconnected',
      error: error.message
    };

    res.status(503).json(ApiResponse.error('System unhealthy', null, 503));
  }
});

/**
 * GET /api/health/ready
 * Readiness probe for Kubernetes/Docker
 */
router.get('/ready', async (req, res) => {
  try {
    // Check DB
    const connection = await pool.getConnection();
    await connection.ping();
    connection.release();

    // Check Redis (if configured) — a degraded cache should not block readiness,
    // but a completely missing Redis in a Redis-required setup should.
    // We report degraded rather than failing so a Redis outage doesn't kill the service.
    const redisOk = cache.isConnected && cache.client
      ? await cache.client.ping().then(r => r === 'PONG').catch(() => false)
      : true; // Redis is optional; if not connected, treat as OK

    res.status(200).json({ status: 'ready', cache: redisOk ? 'ok' : 'degraded' });
  } catch (error) {
    res.status(503).json({ status: 'not ready', error: error.message });
  }
});

/**
 * GET /api/health/live
 * Liveness probe for Kubernetes/Docker
 */
router.get('/live', (req, res) => {
  res.status(200).json({ status: 'alive' });
});

/**
 * GET /api/health/version
 * Runtime release metadata
 */
router.get('/version', (req, res) => {
  res.status(200).json(ApiResponse.success({
    appVersion: process.env.APP_VERSION || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    nodeVersion: process.version,
    buildSha: process.env.GIT_SHA || 'local'
  }, 'Runtime version info'));
});

/**
 * GET /api/health/metrics
 * Prometheus metrics endpoint
 */
router.get('/metrics', async (req, res) => {
  try {
    res.set('Content-Type', register.contentType);
    const metrics = await getMetricsText();
    res.end(metrics);
  } catch (error) {
    res.status(500).json(ApiResponse.error('Failed to collect metrics', { error: error.message }, 500));
  }
});

module.exports = router;