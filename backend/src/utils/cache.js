const redis = require('redis');
const logger = require('./logger');
const { markCacheHit, markCacheMiss } = require('./metrics');

/**
 * Redis Cache Configuration
 * Provides caching layer for improved performance
 */

class RedisCache {
  constructor() {
    this.client = null;
    this.isConnected = false;
    this.redisErrorLogged = false;
    this.reconnectAttempts = 0;
  }

  async connect() {
    try {
      const redisUrl = process.env.REDIS_URL || `redis://${process.env.REDIS_HOST || 'localhost'}:${process.env.REDIS_PORT || 6379}`;

      this.client = redis.createClient({
        url: redisUrl,
        socket: {
          connectTimeout: 60000,
          reconnectStrategy: () => {
            this.reconnectAttempts += 1;
            if (this.reconnectAttempts > 10) {
              logger.warn('Redis reconnect attempts exhausted, cache disabled');
              return false;
            }

            // Exponential backoff up to 3 seconds
            return Math.min(this.reconnectAttempts * 300, 3000);
          }
        }
      });

      // Event handlers
      this.client.on('error', (err) => {
        if (!this.redisErrorLogged) {
          logger.warn('Redis unavailable, running without cache', { error: err.message });
          this.redisErrorLogged = true;
        }
        this.isConnected = false;
      });

      this.client.on('connect', () => {
        logger.info('Redis client connected');
        this.isConnected = true;
        this.redisErrorLogged = false;
        this.reconnectAttempts = 0;
      });

      this.client.on('ready', () => {
        logger.info('Redis client ready');
        this.isConnected = true;
        this.redisErrorLogged = false;
        this.reconnectAttempts = 0;
      });

      this.client.on('end', () => {
        logger.info('Redis client disconnected');
        this.isConnected = false;
      });

      await this.client.connect();
      logger.info('Redis cache initialized successfully');

    } catch (error) {
      logger.error('Failed to connect to Redis', { error: error.message });
      // Don't throw error, allow app to continue without cache
      this.isConnected = false;
    }
  }

  async disconnect() {
    if (this.client && this.isConnected) {
      await this.client.disconnect();
      logger.info('Redis client disconnected');
    }
  }

  // Basic cache operations
  async get(key) {
    if (!this.isConnected) return null;

    try {
      const value = await this.client.get(key);
      if (value) {
        markCacheHit(key.split(':')[0] || 'default');
        return JSON.parse(value);
      }

      markCacheMiss(key.split(':')[0] || 'default');
      return null;
    } catch (error) {
      logger.error('Redis GET error', { key, error: error.message });
      return null;
    }
  }

  async set(key, value, ttl = null) {
    if (!this.isConnected) return false;

    try {
      const serializedValue = JSON.stringify(value);
      if (ttl) {
        await this.client.setEx(key, ttl, serializedValue);
      } else {
        await this.client.set(key, serializedValue);
      }
      return true;
    } catch (error) {
      logger.error('Redis SET error', { key, error: error.message });
      return false;
    }
  }

  async del(key) {
    if (!this.isConnected) return false;

    try {
      await this.client.del(key);
      return true;
    } catch (error) {
      logger.error('Redis DEL error', { key, error: error.message });
      return false;
    }
  }

  async delByPattern(pattern) {
    if (!this.isConnected) return 0;

    try {
      let deleted = 0;
      for await (const key of this.client.scanIterator({ MATCH: pattern, COUNT: 100 })) {
        await this.client.del([key]);
        deleted += 1;
      }
      return deleted;
    } catch (error) {
      logger.error('Redis DEL BY PATTERN error', { pattern, error: error.message });
      return 0;
    }
  }

  async exists(key) {
    if (!this.isConnected) return false;

    try {
      const result = await this.client.exists(key);
      return result === 1;
    } catch (error) {
      logger.error('Redis EXISTS error', { key, error: error.message });
      return false;
    }
  }

  // Advanced operations
  async getMultiple(keys) {
    if (!this.isConnected) return [];

    try {
      const values = await this.client.mGet(keys);
      return values.map(value => value ? JSON.parse(value) : null);
    } catch (error) {
      logger.error('Redis MGET error', { keys, error: error.message });
      return [];
    }
  }

  async setMultiple(keyValuePairs, ttl = null) {
    if (!this.isConnected) return false;

    try {
      const pipeline = this.client.multi();

      for (const [key, value] of Object.entries(keyValuePairs)) {
        const serializedValue = JSON.stringify(value);
        if (ttl) {
          pipeline.setEx(key, ttl, serializedValue);
        } else {
          pipeline.set(key, serializedValue);
        }
      }

      await pipeline.exec();
      return true;
    } catch (error) {
      logger.error('Redis MSET error', { error: error.message });
      return false;
    }
  }

  async increment(key, amount = 1) {
    if (!this.isConnected) return null;

    try {
      const result = await this.client.incrBy(key, amount);
      return result;
    } catch (error) {
      logger.error('Redis INCR error', { key, error: error.message });
      return null;
    }
  }

  async expire(key, ttl) {
    if (!this.isConnected) return false;

    try {
      await this.client.expire(key, ttl);
      return true;
    } catch (error) {
      logger.error('Redis EXPIRE error', { key, error: error.message });
      return false;
    }
  }

  // Cache key generators
  static generateUserKey(userId) {
    return `user:${userId}`;
  }

  static generateTicketKey(ticketId) {
    return `ticket:${ticketId}`;
  }

  static generateTicketsListKey(filters = {}) {
    const filterStr = Object.entries(filters)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}:${value}`)
      .join(':');
    return `tickets:list${filterStr ? `:${filterStr}` : ''}`;
  }

  static generateChatKey(chatId) {
    return `chat:${chatId}`;
  }

  static generateMessagesKey(chatId, page = 1, limit = 20) {
    return `chat:${chatId}:messages:${page}:${limit}`;
  }

  static generateStatsKey(type) {
    return `stats:${type}`;
  }
}

// Create singleton instance
const cache = new RedisCache();

module.exports = {
  RedisCache,
  cache
};
