// File: src/config/redis.js
// Generated: 2025-10-08 13:05:21 UTC
// Project ID: proj_aa174cb58c23
// Task ID: task_bn7q8fmfqx7k


const logger = require('../utils/logger');


const redis = require('redis');

/**
 * Redis client configuration with connection pooling and error handling
 */

// Redis configuration


const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT, 10) || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
  db: parseInt(process.env.REDIS_DB, 10) || 0,
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000);
    logger.warn('Redis connection retry attempt', { attempt: times, delay });
    return delay;
  },
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
  connectTimeout: 10000,
  lazyConnect: false
};

// Create Redis client

let redisClient = null;

/**
 * Initialize Redis client
 */


const initializeRedis = async () => {
  try {
    redisClient = redis.createClient(redisConfig);

    // Error handler
    redisClient.on('error', (error) => {
      logger.error('Redis client error', { error: error.message, stack: error.stack });
    });

    // Connection handler
    redisClient.on('connect', () => {
      logger.info('Redis client connecting', {
        host: redisConfig.host,
        port: redisConfig.port
      });
    });

    // Ready handler
    redisClient.on('ready', () => {
      logger.info('Redis client ready', {
        host: redisConfig.host,
        port: redisConfig.port
      });
    });

    // Reconnecting handler
    redisClient.on('reconnecting', () => {
      logger.warn('Redis client reconnecting', {
        host: redisConfig.host,
        port: redisConfig.port
      });
    });

    // End handler
    redisClient.on('end', () => {
      logger.warn('Redis client connection closed', {
        host: redisConfig.host,
        port: redisConfig.port
      });
    });

    // Connect to Redis
    await redisClient.connect();

    logger.info('Redis client initialized successfully');

    return redisClient;
  } catch (error) {
    logger.error('Failed to initialize Redis client', {
      error: error.message,
      stack: error.stack
    });
    throw error;
  }
};

/**
 * Get Redis client instance
 */


const getRedisClient = () => {
  if (!redisClient || !redisClient.isOpen) {
    throw new Error('Redis client not initialized or connection closed');
  }
  return redisClient;
};

/**
 * Close Redis connection
 */


const closeRedis = async () => {
  try {
    if (redisClient && redisClient.isOpen) {
      await redisClient.quit();
      logger.info('Redis connection closed gracefully');
    }
  } catch (error) {
    logger.error('Error closing Redis connection', {
      error: error.message,
      stack: error.stack
    });
    throw error;
  }
};

/**
 * Check Redis connection health
 */


const checkRedisHealth = async () => {
  try {
    if (!redisClient || !redisClient.isOpen) {
      return false;
    }
    await redisClient.ping();
    return true;
  } catch (error) {
    logger.error('Redis health check failed', {
      error: error.message
    });
    return false;
  }
};

/**
 * Set value in Redis with optional expiry
 */


const setCache = async (key, value, expirySeconds = null) => {
  try {
    const client = getRedisClient();
    const serializedValue = JSON.stringify(value);

    if (expirySeconds) {
      await client.setEx(key, expirySeconds, serializedValue);
    } else {
      await client.set(key, serializedValue);
    }

    logger.debug('Cache set successfully', { key, expirySeconds });
  } catch (error) {
    logger.error('Failed to set cache', {
      key,
      error: error.message
    });
    throw error;
  }
};

/**
 * Get value from Redis
 */


const getCache = async (key) => {
  try {
    const client = getRedisClient();
    const value = await client.get(key);

    if (!value) {
      logger.debug('Cache miss', { key });
      return null;
    }

    logger.debug('Cache hit', { key });
    return JSON.parse(value);
  } catch (error) {
    logger.error('Failed to get cache', {
      key,
      error: error.message
    });
    throw error;
  }
};

/**
 * Delete value from Redis
 */


const deleteCache = async (key) => {
  try {
    const client = getRedisClient();
    await client.del(key);
    logger.debug('Cache deleted successfully', { key });
  } catch (error) {
    logger.error('Failed to delete cache', {
      key,
      error: error.message
    });
    throw error;
  }
};

/**
 * Delete multiple keys matching pattern
 */


const deleteCachePattern = async (pattern) => {
  try {
    const client = getRedisClient();
    const keys = await client.keys(pattern);

    if (keys.length > 0) {
      await client.del(keys);
      logger.debug('Cache pattern deleted successfully', {
        pattern,
        deletedCount: keys.length
      });
    }
  } catch (error) {
    logger.error('Failed to delete cache pattern', {
      pattern,
      error: error.message
    });
    throw error;
  }
};

/**
 * Check if key exists in Redis
 */


const existsCache = async (key) => {
  try {
    const client = getRedisClient();
    const exists = await client.exists(key);
    return exists === 1;
  } catch (error) {
    logger.error('Failed to check cache existence', {
      key,
      error: error.message
    });
    throw error;
  }
};

/**
 * Set expiry on existing key
 */


const expireCache = async (key, seconds) => {
  try {
    const client = getRedisClient();
    await client.expire(key, seconds);
    logger.debug('Cache expiry set successfully', { key, seconds });
  } catch (error) {
    logger.error('Failed to set cache expiry', {
      key,
      seconds,
      error: error.message
    });
    throw error;
  }
};

/**
 * Increment value in Redis
 */


const incrementCache = async (key, amount = 1) => {
  try {
    const client = getRedisClient();
    const result = await client.incrBy(key, amount);
    logger.debug('Cache incremented successfully', { key, amount, result });
    return result;
  } catch (error) {
    logger.error('Failed to increment cache', {
      key,
      amount,
      error: error.message
    });
    throw error;
  }
};

module.exports = {
  initializeRedis,
  getRedisClient,
  closeRedis,
  checkRedisHealth,
  setCache,
  getCache,
  deleteCache,
  deleteCachePattern,
  existsCache,
  expireCache,
  incrementCache
};
