// File: src/services/cache.service.js
// Generated: 2025-10-08 13:06:26 UTC
// Project ID: proj_aa174cb58c23
// Task ID: task_rimwiscdygih


const logger = require('../utils/logger');


const redisService = require('./redis.service');

/**
 * Cache service for user data and rate limiting counters
 * Provides high-level caching operations with TTL management
 */
class CacheService {
  constructor() {
    this.DEFAULT_TTL = 3600; // 1 hour in seconds
    this.USER_CACHE_TTL = 1800; // 30 minutes
    this.RATE_LIMIT_WINDOW = 900; // 15 minutes
  }

  /**
   * Generate cache key for user data
   * @param {string} userId - User ID
   * @returns {string} Cache key
   */
  getUserCacheKey(userId) {
    return `user:${userId}`;
  }

  /**
   * Generate cache key for rate limiting
   * @param {string} identifier - IP address or user ID
   * @param {string} endpoint - API endpoint
   * @returns {string} Cache key
   */
  getRateLimitKey(identifier, endpoint) {
    return `ratelimit:${endpoint}:${identifier}`;
  }

  /**
   * Cache user data
   * @param {string} userId - User ID
   * @param {Object} userData - User data to cache
   * @param {number} ttl - Time to live in seconds (optional)
   * @returns {Promise<boolean>} Success status
   */
  async cacheUser(userId, userData, ttl = this.USER_CACHE_TTL) {
    try {
      const key = this.getUserCacheKey(userId);
      const success = await redisService.set(key, userData, ttl);

      if (success) {
        logger.info('User data cached', { userId, ttl });
      } else {
        logger.warn('Failed to cache user data', { userId });
      }

      return success;
    } catch (error) {
      logger.error('Error caching user data', { userId, error: error.message });
      return false;
    }
  }

  /**
   * Get cached user data
   * @param {string} userId - User ID
   * @returns {Promise<Object|null>} User data or null if not found
   */
  async getUser(userId) {
    try {
      const key = this.getUserCacheKey(userId);
      const userData = await redisService.get(key);

      if (userData) {
        logger.debug('User data retrieved from cache', { userId });
      } else {
        logger.debug('User data not found in cache', { userId });
      }

      return userData;
    } catch (error) {
      logger.error('Error retrieving user from cache', { userId, error: error.message });
      return null;
    }
  }

  /**
   * Invalidate cached user data
   * @param {string} userId - User ID
   * @returns {Promise<boolean>} Success status
   */
  async invalidateUser(userId) {
    try {
      const key = this.getUserCacheKey(userId);
      const success = await redisService.del(key);

      if (success) {
        logger.info('User cache invalidated', { userId });
      }

      return success;
    } catch (error) {
      logger.error('Error invalidating user cache', { userId, error: error.message });
      return false;
    }
  }

  /**
   * Increment rate limit counter
   * @param {string} identifier - IP address or user ID
   * @param {string} endpoint - API endpoint
   * @param {number} window - Time window in seconds (optional)
   * @returns {Promise<number>} Current count
   */
  async incrementRateLimit(identifier, endpoint, window = this.RATE_LIMIT_WINDOW) {
    try {
      const key = this.getRateLimitKey(identifier, endpoint);
      const count = await redisService.incr(key);

      // Set expiry on first increment
      if (count === 1) {
        await redisService.expire(key, window);
      }

      logger.debug('Rate limit incremented', { identifier, endpoint, count });

      return count;
    } catch (error) {
      logger.error('Error incrementing rate limit', { identifier, endpoint, error: error.message });
      throw error;
    }
  }

  /**
   * Get current rate limit count
   * @param {string} identifier - IP address or user ID
   * @param {string} endpoint - API endpoint
   * @returns {Promise<number>} Current count
   */
  async getRateLimitCount(identifier, endpoint) {
    try {
      const key = this.getRateLimitKey(identifier, endpoint);
      const value = await redisService.get(key);

      const count = value ? parseInt(value, 10) : 0;

      logger.debug('Rate limit count retrieved', { identifier, endpoint, count });

      return count;
    } catch (error) {
      logger.error('Error getting rate limit count', { identifier, endpoint, error: error.message });
      return 0;
    }
  }

  /**
   * Get TTL for rate limit key
   * @param {string} identifier - IP address or user ID
   * @param {string} endpoint - API endpoint
   * @returns {Promise<number>} TTL in seconds (-1 if no expiry, -2 if key doesn't exist)
   */
  async getRateLimitTTL(identifier, endpoint) {
    try {
      const key = this.getRateLimitKey(identifier, endpoint);
      const ttl = await redisService.ttl(key);

      return ttl;
    } catch (error) {
      logger.error('Error getting rate limit TTL', { identifier, endpoint, error: error.message });
      return -2;
    }
  }

  /**
   * Reset rate limit counter
   * @param {string} identifier - IP address or user ID
   * @param {string} endpoint - API endpoint
   * @returns {Promise<boolean>} Success status
   */
  async resetRateLimit(identifier, endpoint) {
    try {
      const key = this.getRateLimitKey(identifier, endpoint);
      const success = await redisService.del(key);

      if (success) {
        logger.info('Rate limit reset', { identifier, endpoint });
      }

      return success;
    } catch (error) {
      logger.error('Error resetting rate limit', { identifier, endpoint, error: error.message });
      return false;
    }
  }

  /**
   * Cache generic data with key
   * @param {string} key - Cache key
   * @param {any} data - Data to cache
   * @param {number} ttl - Time to live in seconds (optional)
   * @returns {Promise<boolean>} Success status
   */
  async set(key, data, ttl = this.DEFAULT_TTL) {
    try {
      const success = await redisService.set(key, data, ttl);

      if (success) {
        logger.debug('Data cached', { key, ttl });
      } else {
        logger.warn('Failed to cache data', { key });
      }

      return success;
    } catch (error) {
      logger.error('Error caching data', { key, error: error.message });
      return false;
    }
  }

  /**
   * Get cached data by key
   * @param {string} key - Cache key
   * @returns {Promise<any|null>} Cached data or null if not found
   */
  async get(key) {
    try {
      const data = await redisService.get(key);

      if (data) {
        logger.debug('Data retrieved from cache', { key });
      } else {
        logger.debug('Data not found in cache', { key });
      }

      return data;
    } catch (error) {
      logger.error('Error retrieving data from cache', { key, error: error.message });
      return null;
    }
  }

  /**
   * Delete cached data by key
   * @param {string} key - Cache key
   * @returns {Promise<boolean>} Success status
   */
  async delete(key) {
    try {
      const success = await redisService.del(key);

      if (success) {
        logger.debug('Cache key deleted', { key });
      }

      return success;
    } catch (error) {
      logger.error('Error deleting cache key', { key, error: error.message });
      return false;
    }
  }

  /**
   * Delete multiple keys matching a pattern
   * @param {string} pattern - Key pattern (e.g., 'user:*')
   * @returns {Promise<number>} Number of keys deleted
   */
  async deletePattern(pattern) {
    try {
      const count = await redisService.deletePattern(pattern);

      logger.info('Cache keys deleted by pattern', { pattern, count });

      return count;
    } catch (error) {
      logger.error('Error deleting cache keys by pattern', { pattern, error: error.message });
      return 0;
    }
  }

  /**
   * Check if key exists in cache
   * @param {string} key - Cache key
   * @returns {Promise<boolean>} True if key exists
   */
  async exists(key) {
    try {
      const exists = await redisService.exists(key);

      return exists;
    } catch (error) {
      logger.error('Error checking cache key existence', { key, error: error.message });
      return false;
    }
  }

  /**
   * Set expiry on existing key
   * @param {string} key - Cache key
   * @param {number} seconds - Expiry time in seconds
   * @returns {Promise<boolean>} Success status
   */
  async expire(key, seconds) {
    try {
      const success = await redisService.expire(key, seconds);

      if (success) {
        logger.debug('Expiry set on cache key', { key, seconds });
      }

      return success;
    } catch (error) {
      logger.error('Error setting expiry on cache key', { key, error: error.message });
      return false;
    }
  }

  /**
   * Get TTL for a key
   * @param {string} key - Cache key
   * @returns {Promise<number>} TTL in seconds (-1 if no expiry, -2 if key doesn't exist)
   */
  async ttl(key) {
    try {
      const ttl = await redisService.ttl(key);

      return ttl;
    } catch (error) {
      logger.error('Error getting TTL for cache key', { key, error: error.message });
      return -2;
    }
  }

  /**
   * Flush all cache data (use with caution)
   * @returns {Promise<boolean>} Success status
   */
  async flushAll() {
    try {
      const success = await redisService.flushAll();

      if (success) {
        logger.warn('All cache data flushed');
      }

      return success;
    } catch (error) {
      logger.error('Error flushing cache', { error: error.message });
      return false;
    }
  }
}

module.exports = new CacheService();
