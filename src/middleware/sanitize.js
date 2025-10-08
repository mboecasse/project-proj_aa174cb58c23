// File: src/middleware/sanitize.js
// Generated: 2025-10-08 13:05:05 UTC
// Project ID: proj_aa174cb58c23
// Task ID: task_ruqxturmo1lr


const logger = require('../utils/logger');


const mongoSanitize = require('express-mongo-sanitize');


const xss = require('xss-clean');

/**
 * Input sanitization middleware to prevent XSS and NoSQL injection attacks
 * Applies multiple sanitization layers to all incoming requests
 */

/**
 * Sanitize request data to prevent NoSQL injection
 * Removes any keys that start with $ or contain . in req.body, req.query, req.params
 */


const sanitizeNoSQL = mongoSanitize({
  replaceWith: '_',
  onSanitize: ({ req, key }) => {
    logger.warn('NoSQL injection attempt detected', {
      ip: req.ip,
      path: req.path,
      method: req.method,
      key: key,
      userAgent: req.get('user-agent')
    });
  }
});

/**
 * Sanitize user input to prevent XSS attacks
 * Cleans any HTML/script tags from user input
 */


const sanitizeXSS = xss();

/**
 * Additional custom sanitization for specific fields
 * Trims whitespace and removes null bytes
 */


const customSanitize = (req, res, next) => {
  try {
    // Sanitize body
    if (req.body && typeof req.body === 'object') {
      req.body = sanitizeObject(req.body);
    }

    // Sanitize query parameters
    if (req.query && typeof req.query === 'object') {
      req.query = sanitizeObject(req.query);
    }

    // Sanitize URL parameters
    if (req.params && typeof req.params === 'object') {
      req.params = sanitizeObject(req.params);
    }

    next();
  } catch (error) {
    logger.error('Error in custom sanitization middleware', {
      error: error.message,
      path: req.path,
      method: req.method
    });
    next(error);
  }
};

/**
 * Recursively sanitize an object
 * @param {Object} obj - Object to sanitize
 * @returns {Object} - Sanitized object
 */


const sanitizeObject = (obj) => {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item));
  }

  if (typeof obj === 'object') {
    const sanitized = {};
    for (const [key, value] of Object.entries(obj)) {
      // Skip prototype pollution attempts
      if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
        logger.warn('Prototype pollution attempt detected', { key });
        continue;
      }

      sanitized[key] = sanitizeObject(value);
    }
    return sanitized;
  }

  if (typeof obj === 'string') {
    // Remove null bytes
    let sanitized = obj.replace(/\0/g, '');

    // Trim whitespace
    sanitized = sanitized.trim();

    // Remove control characters except newlines and tabs
    sanitized = sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

    return sanitized;
  }

  return obj;
};

/**
 * Validate content length to prevent DoS attacks
 * @param {number} maxSize - Maximum allowed size in bytes
 */


const validateContentLength = (maxSize = 10485760) => {
  return (req, res, next) => {
    const contentLength = req.get('content-length');

    if (contentLength && parseInt(contentLength) > maxSize) {
      logger.warn('Request exceeds maximum content length', {
        contentLength,
        maxSize,
        ip: req.ip,
        path: req.path
      });

      return res.status(413).json({
        success: false,
        error: 'Request payload too large'
      });
    }

    next();
  };
};

/**
 * Sanitize file upload fields
 * Validates file names and removes dangerous characters
 */


const sanitizeFileUploads = (req, res, next) => {
  try {
    if (req.files) {
      const files = Array.isArray(req.files) ? req.files : Object.values(req.files).flat();

      for (const file of files) {
        if (file.name) {
          // Remove path traversal attempts
          file.name = file.name.replace(/\.\./g, '');

          // Remove null bytes
          file.name = file.name.replace(/\0/g, '');

          // Sanitize filename
          file.name = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');

          // Limit filename length
          if (file.name.length > 255) {
            file.name = file.name.substring(0, 255);
          }
        }
      }
    }

    next();
  } catch (error) {
    logger.error('Error in file upload sanitization', {
      error: error.message,
      path: req.path
    });
    next(error);
  }
};

/**
 * Combined sanitization middleware
 * Applies all sanitization layers in correct order
 */


const sanitize = [
  validateContentLength(),
  sanitizeNoSQL,
  sanitizeXSS,
  customSanitize,
  sanitizeFileUploads
];

module.exports = {
  sanitize,
  sanitizeNoSQL,
  sanitizeXSS,
  customSanitize,
  sanitizeFileUploads,
  validateContentLength
};
