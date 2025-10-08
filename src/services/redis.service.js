// File: src/services/redis.service.js
// Generated: 2025-10-08 13:05:55 UTC
// Project ID: proj_aa174cb58c23
// Task ID: task_o0cghd4meb5p


const logger = require('../utils/logger');


const redisClient = require('../config/redis');

/**
 * Redis Service
 * Wrapper for Redis operations with error handling and logging
 */

class RedisService {
  /**
   * Set a key-value pair with optional expiration
   * @param {string} key - Redis key
   * @param {any} value - Value to store (will be JSON stringified)
   * @param {number} expiryInSeconds - Optional expiration time in seconds
   * @returns {Promise<boolean>} Success status
   */
  async set(key, value, expiryInSeconds = null) {
    try {
      const stringValue = typeof value === 'string' ? value : JSON.stringify(value);

      if (expiryInSeconds) {
        await redisClient.setex(key, expiryInSeconds, stringValue);
      } else {
        await redisClient.set(key, stringValue);
      }

      logger.debug('Redis SET operation successful', { key, hasExpiry: !!expiryInSeconds });
      return true;
    } catch (error) {
      logger.error('Redis SET operation failed', { key, error: error.message });
      throw error;
    }
  }

  /**
   * Get value by key
   * @param {string} key - Redis key
   * @returns {Promise<any>} Parsed value or null if not found
   */
  async get(key) {
    try {
      const value = await redisClient.get(key);

      if (!value) {
        logger.debug('Redis GET operation - key not found', { key });
        return null;
      }

      try {
        return JSON.parse(value);
      } catch (parseError) {
        return value;
      }
    } catch (error) {
      logger.error('Redis GET operation failed', { key, error: error.message });
      throw error;
    }
  }

  /**
   * Delete a key
   * @param {string} key - Redis key
   * @returns {Promise<boolean>} True if key was deleted, false if key didn't exist
   */
  async delete(key) {
    try {
      const result = await redisClient.del(key);
      logger.debug('Redis DELETE operation', { key, deleted: result === 1 });
      return result === 1;
    } catch (error) {
      logger.error('Redis DELETE operation failed', { key, error: error.message });
      throw error;
    }
  }

  /**
   * Check if key exists
   * @param {string} key - Redis key
   * @returns {Promise<boolean>} True if key exists
   */
  async exists(key) {
    try {
      const result = await redisClient.exists(key);
      return result === 1;
    } catch (error) {
      logger.error('Redis EXISTS operation failed', { key, error: error.message });
      throw error;
    }
  }

  /**
   * Set expiration on a key
   * @param {string} key - Redis key
   * @param {number} seconds - Expiration time in seconds
   * @returns {Promise<boolean>} True if expiration was set
   */
  async expire(key, seconds) {
    try {
      const result = await redisClient.expire(key, seconds);
      logger.debug('Redis EXPIRE operation', { key, seconds, success: result === 1 });
      return result === 1;
    } catch (error) {
      logger.error('Redis EXPIRE operation failed', { key, error: error.message });
      throw error;
    }
  }

  /**
   * Get time to live for a key
   * @param {string} key - Redis key
   * @returns {Promise<number>} TTL in seconds, -1 if no expiry, -2 if key doesn't exist
   */
  async ttl(key) {
    try {
      const ttl = await redisClient.ttl(key);
      return ttl;
    } catch (error) {
      logger.error('Redis TTL operation failed', { key, error: error.message });
      throw error;
    }
  }

  /**
   * Add token to blacklist with expiration
   * @param {string} token - JWT token to blacklist
   * @param {number} expiryInSeconds - Token expiration time
   * @returns {Promise<boolean>} Success status
   */
  async blacklistToken(token, expiryInSeconds) {
    try {
      const key = `blacklist:${token}`;
      await this.set(key, 'blacklisted', expiryInSeconds);
      logger.info('Token blacklisted', { tokenPrefix: token.substring(0, 20) });
      return true;
    } catch (error) {
      logger.error('Failed to blacklist token', { error: error.message });
      throw error;
    }
  }

  /**
   * Check if token is blacklisted
   * @param {string} token - JWT token to check
   * @returns {Promise<boolean>} True if token is blacklisted
   */
  async isTokenBlacklisted(token) {
    try {
      const key = `blacklist:${token}`;
      const exists = await this.exists(key);
      return exists;
    } catch (error) {
      logger.error('Failed to check token blacklist status', { error: error.message });
      throw error;
    }
  }

  /**
   * Store refresh token with user ID
   * @param {string} userId - User ID
   * @param {string} refreshToken - Refresh token
   * @param {number} expiryInSeconds - Token expiration time
   * @returns {Promise<boolean>} Success status
   */
  async storeRefreshToken(userId, refreshToken, expiryInSeconds) {
    try {
      const key = `refresh:${userId}`;
      await this.set(key, refreshToken, expiryInSeconds);
      logger.info('Refresh token stored', { userId });
      return true;
    } catch (error) {
      logger.error('Failed to store refresh token', { userId, error: error.message });
      throw error;
    }
  }

  /**
   * Get refresh token for user
   * @param {string} userId - User ID
   * @returns {Promise<string|null>} Refresh token or null
   */
  async getRefreshToken(userId) {
    try {
      const key = `refresh:${userId}`;
      const token = await this.get(key);
      return token;
    } catch (error) {
      logger.error('Failed to get refresh token', { userId, error: error.message });
      throw error;
    }
  }

  /**
   * Delete refresh token for user
   * @param {string} userId - User ID
   * @returns {Promise<boolean>} True if token was deleted
   */
  async deleteRefreshToken(userId) {
    try {
      const key = `refresh:${userId}`;
      const deleted = await this.delete(key);
      if (deleted) {
        logger.info('Refresh token deleted', { userId });
      }
      return deleted;
    } catch (error) {
      logger.error('Failed to delete refresh token', { userId, error: error.message });
      throw error;
    }
  }

  /**
   * Store verification code with expiration
   * @param {string} email - User email
   * @param {string} code - Verification code
   * @param {number} expiryInSeconds - Code expiration time (default: 15 minutes)
   * @returns {Promise<boolean>} Success status
   */
  async storeVerificationCode(email, code, expiryInSeconds = 900) {
    try {
      const key = `verify:${email}`;
      await this.set(key, code, expiryInSeconds);
      logger.info('Verification code stored', { email });
      return true;
    } catch (error) {
      logger.error('Failed to store verification code', { email, error: error.message });
      throw error;
    }
  }

  /**
   * Get verification code for email
   * @param {string} email - User email
   * @returns {Promise<string|null>} Verification code or null
   */
  async getVerificationCode(email) {
    try {
      const key = `verify:${email}`;
      const code = await this.get(key);
      return code;
    } catch (error) {
      logger.error('Failed to get verification code', { email, error: error.message });
      throw error;
    }
  }

  /**
   * Delete verification code for email
   * @param {string} email - User email
   * @returns {Promise<boolean>} True if code was deleted
   */
  async deleteVerificationCode(email) {
    try {
      const key = `verify:${email}`;
      const deleted = await this.delete(key);
      if (deleted) {
        logger.info('Verification code deleted', { email });
      }
      return deleted;
    } catch (error) {
      logger.error('Failed to delete verification code', { email, error: error.message });
      throw error;
    }
  }

  /**
   * Store password reset token with expiration
   * @param {string} email - User email
   * @param {string} token - Reset token
   * @param {number} expiryInSeconds - Token expiration time (default: 1 hour)
   * @returns {Promise<boolean>} Success status
   */
  async storeResetToken(email, token, expiryInSeconds = 3600) {
    try {
      const key = `reset:${email}`;
      await this.set(key, token, expiryInSeconds);
      logger.info('Password reset token stored', { email });
      return true;
    } catch (error) {
      logger.error('Failed to store reset token', { email, error: error.message });
      throw error;
    }
  }

  /**
   * Get password reset token for email
   * @param {string} email - User email
   * @returns {Promise<string|null>} Reset token or null
   */
  async getResetToken(email) {
    try {
      const key = `reset:${email}`;
      const token = await this.get(key);
      return token;
    } catch (error) {
      logger.error('Failed to get reset token', { email, error: error.message });
      throw error;
    }
  }

  /**
   * Delete password reset token for email
   * @param {string} email - User email
   * @returns {Promise<boolean>} True if token was deleted
   */
  async deleteResetToken(email) {
    try {
      const key = `reset:${email}`;
      const deleted = await this.delete(key);
      if (deleted) {
        logger.info('Password reset token deleted', { email });
      }
      return deleted;
    } catch (error) {
      logger.error('Failed to delete reset token', { email, error: error.message });
      throw error;
    }
  }

  /**
   * Increment rate limit counter
   * @param {string} identifier - IP address or user ID
   * @param {number} windowInSeconds - Time window for rate limiting
   * @returns {Promise<number>} Current count
   */
  async incrementRateLimit(identifier, windowInSeconds = 900) {
    try {
      const key = `ratelimit:${identifier}`;
      const count = await redisClient.incr(key);

      if (count === 1) {
        await this.expire(key, windowInSeconds);
      }

      return count;
    } catch (error) {
      logger.error('Failed to increment rate limit', { identifier, error: error.message });
      throw error;
    }
  }

  /**
   * Get rate limit count
   * @param {string} identifier - IP address or user ID
   * @returns {Promise<number>} Current count
   */
  async getRateLimitCount(identifier) {
    try {
      const key = `ratelimit:${identifier}`;
      const value = await this.get(key);
      return value ? parseInt(value, 10) : 0;
    } catch (error) {
      logger.error('Failed to get rate limit count', { identifier, error: error.message });
      throw error;
    }
  }

  /**
   * Delete all keys matching a pattern
   * @param {string} pattern - Redis key pattern (e.g., 'user:*')
   * @returns {Promise<number>} Number of keys deleted
   */
  async deletePattern(pattern) {
    try {
      const keys = await redisClient.keys(pattern);

      if (keys.length === 0) {
        return 0;
      }

      const result = await redisClient.del(...keys);
      logger.info('Deleted keys by pattern', { pattern, count: result });
      return result;
    } catch (error) {
      logger.error('Failed to delete keys by pattern', { pattern, error: error.message });
      throw error;
    }
  }

  /**
   * Flush all data from Redis (use with caution)
   * @returns {Promise<boolean>} Success status
   */
  async flushAll() {
    try {
      await redisClient.flushall();
      logger.warn('Redis database flushed - all data deleted');
      return true;
    } catch (error) {
      logger.error('Failed to flush Redis database', { error: error.message });
      throw error;
    }
  }

  /**
   * Ping Redis to check connection
   * @returns {Promise<boolean>} True if connected
   */
  async ping() {
    try {
      const response = await redisClient.ping();
      return response === 'PONG';
    } catch (error) {
      logger.error('Redis ping failed', { error: error.message });
      return false;
    }
  }
}

module.exports = new RedisService();
