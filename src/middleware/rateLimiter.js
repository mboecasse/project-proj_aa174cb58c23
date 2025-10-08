// File: src/middleware/rateLimiter.js
// Generated: 2025-10-08 13:05:48 UTC
// Project ID: proj_aa174cb58c23
// Task ID: task_c7p7o85kgeyx


const RedisStore = require('rate-limit-redis');


const logger = require('../utils/logger');


const rateLimit = require('express-rate-limit');


const redisClient = require('../config/redis');

/**
 * Create rate limiter with Redis store for distributed rate limiting
 * @param {Object} options - Rate limiter configuration options
 * @param {number} options.windowMs - Time window in milliseconds
 * @param {number} options.max - Maximum number of requests per window
 * @param {string} options.message - Error message when limit exceeded
 * @param {string} options.keyPrefix - Redis key prefix for this limiter
 * @returns {Function} Express middleware function
 */


const createRateLimiter = (options = {}) => {
  const {
    windowMs = 15 * 60 * 1000, // 15 minutes default
    max = 100, // 100 requests per window default
    message = 'Too many requests from this IP, please try again later',
    keyPrefix = 'rl',
    skipSuccessfulRequests = false,
    skipFailedRequests = false
  } = options;

  try {
    const limiter = rateLimit({
      store: new RedisStore({
        client: redisClient,
        prefix: keyPrefix
      }),
      windowMs,
      max,
      message: {
        success: false,
        error: message
      },
      standardHeaders: true,
      legacyHeaders: false,
      skipSuccessfulRequests,
      skipFailedRequests,
      handler: (req, res) => {
        logger.warn('Rate limit exceeded', {
          ip: req.ip,
          path: req.path,
          method: req.method,
          userId: req.userId || 'anonymous'
        });

        res.status(429).json({
          success: false,
          error: message
        });
      },
      skip: (req) => {
        // Skip rate limiting for health check endpoints
        if (req.path === '/health' || req.path === '/api/health') {
          return true;
        }
        return false;
      }
    });

    logger.info('Rate limiter created', {
      windowMs,
      max,
      keyPrefix
    });

    return limiter;
  } catch (error) {
    logger.error('Failed to create rate limiter', {
      error: error.message,
      stack: error.stack
    });

    // Fallback to memory store if Redis fails
    logger.warn('Falling back to memory-based rate limiter');

    return rateLimit({
      windowMs,
      max,
      message: {
        success: false,
        error: message
      },
      standardHeaders: true,
      legacyHeaders: false,
      handler: (req, res) => {
        logger.warn('Rate limit exceeded (memory store)', {
          ip: req.ip,
          path: req.path,
          method: req.method
        });

        res.status(429).json({
          success: false,
          error: message
        });
      }
    });
  }
};

/**
 * Strict rate limiter for authentication endpoints
 * 5 requests per 15 minutes
 */


const authLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Too many authentication attempts, please try again after 15 minutes',
  keyPrefix: 'rl:auth',
  skipSuccessfulRequests: false,
  skipFailedRequests: false
});

/**
 * Moderate rate limiter for API endpoints
 * 100 requests per 15 minutes
 */


const apiLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many API requests, please try again later',
  keyPrefix: 'rl:api',
  skipSuccessfulRequests: false,
  skipFailedRequests: false
});

/**
 * Strict rate limiter for password reset endpoints
 * 3 requests per hour
 */


const passwordResetLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000,
  max: 3,
  message: 'Too many password reset attempts, please try again after an hour',
  keyPrefix: 'rl:password-reset',
  skipSuccessfulRequests: false,
  skipFailedRequests: false
});

/**
 * Strict rate limiter for email verification endpoints
 * 3 requests per hour
 */


const emailVerificationLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000,
  max: 3,
  message: 'Too many email verification requests, please try again after an hour',
  keyPrefix: 'rl:email-verify',
  skipSuccessfulRequests: false,
  skipFailedRequests: false
});

/**
 * Lenient rate limiter for general routes
 * 1000 requests per 15 minutes
 */


const generalLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  message: 'Too many requests, please slow down',
  keyPrefix: 'rl:general',
  skipSuccessfulRequests: true,
  skipFailedRequests: false
});

/**
 * Very strict rate limiter for account creation
 * 3 requests per hour per IP
 */


const accountCreationLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000,
  max: 3,
  message: 'Too many accounts created from this IP, please try again after an hour',
  keyPrefix: 'rl:account-creation',
  skipSuccessfulRequests: false,
  skipFailedRequests: false
});

module.exports = {
  createRateLimiter,
  authLimiter,
  apiLimiter,
  passwordResetLimiter,
  emailVerificationLimiter,
  generalLimiter,
  accountCreationLimiter
};
