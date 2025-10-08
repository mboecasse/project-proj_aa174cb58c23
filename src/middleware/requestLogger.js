// File: src/middleware/requestLogger.js
// Generated: 2025-10-08 13:05:21 UTC
// Project ID: proj_aa174cb58c23
// Task ID: task_0wn6uwnvnu3i


const logger = require('../utils/logger');


const morgan = require('morgan');

/**
 * Custom Morgan token for response time in milliseconds
 */
morgan.token('response-time-ms', (req, res) => {
  if (!req._startAt || !res._startAt) {
    return '0';
  }
  const ms = (res._startAt[0] - req._startAt[0]) * 1e3 + (res._startAt[1] - req._startAt[1]) * 1e-6;
  return ms.toFixed(2);
});

/**
 * Custom Morgan token for request ID
 */
morgan.token('request-id', (req) => {
  return req.id || 'N/A';
});

/**
 * Custom Morgan token for user ID
 */
morgan.token('user-id', (req) => {
  return req.userId || req.user?._id || 'anonymous';
});

/**
 * Custom stream to integrate Morgan with Winston logger
 */


const stream = {
  write: (message) => {
    logger.info(message.trim());
  }
};

/**
 * Morgan format for development environment
 * Includes method, URL, status, response time, and content length
 */


const developmentFormat = ':method :url :status :response-time-ms ms - :res[content-length]';

/**
 * Morgan format for production environment
 * Includes timestamp, request ID, user ID, method, URL, status, response time, and IP
 */


const productionFormat = ':remote-addr - :user-id [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent" :response-time-ms ms :request-id';

/**
 * Skip function to exclude health check and monitoring endpoints
 * @param {Object} req - Express request object
 * @returns {boolean} - True to skip logging
 */


const skipHealthChecks = (req) => {
  return req.url === '/health' || req.url === '/api/health' || req.url === '/metrics';
};

/**
 * Request logger middleware factory
 * Creates Morgan middleware configured for the current environment
 * @returns {Function} Morgan middleware
 */


const requestLogger = () => {
  const isProduction = process.env.NODE_ENV === 'production';
  const format = isProduction ? productionFormat : developmentFormat;

  return morgan(format, {
    stream,
    skip: skipHealthChecks
  });
};

/**
 * Error request logger for failed requests (4xx, 5xx)
 * Logs only requests that resulted in errors
 * @returns {Function} Morgan middleware for errors
 */


const errorRequestLogger = () => {
  const format = ':remote-addr - :user-id [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent" :response-time-ms ms :request-id';

  return morgan(format, {
    stream: {
      write: (message) => {
        logger.error(message.trim());
      }
    },
    skip: (req, res) => {
      return res.statusCode < 400 || skipHealthChecks(req);
    }
  });
};

/**
 * Request ID middleware
 * Generates and attaches unique request ID to each request
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */


const attachRequestId = (req, res, next) => {
  req.id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  res.setHeader('X-Request-ID', req.id);
  next();
};

/**
 * Request start time middleware
 * Attaches start time to request for accurate response time calculation
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */


const attachStartTime = (req, res, next) => {
  req._startAt = process.hrtime();
  res.on('finish', () => {
    res._startAt = process.hrtime();
  });
  next();
};

/**
 * Combined request logging middleware
 * Includes request ID generation, start time tracking, and Morgan logging
 * @returns {Array} Array of middleware functions
 */


const requestLoggingMiddleware = () => {
  return [
    attachRequestId,
    attachStartTime,
    requestLogger(),
    errorRequestLogger()
  ];
};

module.exports = {
  requestLogger,
  errorRequestLogger,
  attachRequestId,
  attachStartTime,
  requestLoggingMiddleware
};
