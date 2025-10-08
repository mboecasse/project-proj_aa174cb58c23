// File: src/middleware/validation.js
// Generated: 2025-10-08 13:05:16 UTC
// Project ID: proj_aa174cb58c23
// Task ID: task_jv5dkdmnmeh5


const logger = require('../utils/logger');

const { validationResult } = require('express-validator');

/**
 * Validation middleware that checks express-validator results
 * and returns formatted error response if validation fails
 */


const validate = (req, res, next) => {
  try {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      const formattedErrors = errors.array().map(error => ({
        field: error.path || error.param,
        message: error.msg,
        value: error.value
      }));

      logger.warn('Validation failed', {
        path: req.path,
        method: req.method,
        errors: formattedErrors,
        ip: req.ip
      });

      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: formattedErrors
      });
    }

    next();
  } catch (error) {
    logger.error('Error in validation middleware', {
      error: error.message,
      stack: error.stack,
      path: req.path
    });
    next(error);
  }
};

/**
 * Sanitize request body by trimming string values
 * and removing undefined/null values
 */


const sanitizeBody = (req, res, next) => {
  try {
    if (req.body && typeof req.body === 'object') {
      Object.keys(req.body).forEach(key => {
        const value = req.body[key];

        // Trim strings
        if (typeof value === 'string') {
          req.body[key] = value.trim();
        }

        // Remove null/undefined values
        if (value === null || value === undefined) {
          delete req.body[key];
        }
      });
    }

    next();
  } catch (error) {
    logger.error('Error in sanitizeBody middleware', {
      error: error.message,
      stack: error.stack
    });
    next(error);
  }
};

/**
 * Sanitize query parameters by trimming string values
 */


const sanitizeQuery = (req, res, next) => {
  try {
    if (req.query && typeof req.query === 'object') {
      Object.keys(req.query).forEach(key => {
        const value = req.query[key];

        if (typeof value === 'string') {
          req.query[key] = value.trim();
        }
      });
    }

    next();
  } catch (error) {
    logger.error('Error in sanitizeQuery middleware', {
      error: error.message,
      stack: error.stack
    });
    next(error);
  }
};

/**
 * Validate pagination parameters
 */


const validatePagination = (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    // Validate page number
    if (page < 1) {
      return res.status(400).json({
        success: false,
        error: 'Page number must be greater than 0'
      });
    }

    // Validate and cap limit
    if (limit < 1) {
      return res.status(400).json({
        success: false,
        error: 'Limit must be greater than 0'
      });
    }

    if (limit > 100) {
      return res.status(400).json({
        success: false,
        error: 'Limit cannot exceed 100'
      });
    }

    // Attach validated values to request
    req.pagination = {
      page,
      limit,
      skip: (page - 1) * limit
    };

    next();
  } catch (error) {
    logger.error('Error in validatePagination middleware', {
      error: error.message,
      stack: error.stack
    });
    next(error);
  }
};

/**
 * Validate MongoDB ObjectId format
 */


const validateObjectId = (paramName = 'id') => {
  return (req, res, next) => {
    try {
      const id = req.params[paramName];

      if (!id) {
        return res.status(400).json({
          success: false,
          error: `${paramName} parameter is required`
        });
      }

      // MongoDB ObjectId validation (24 hex characters)
      const objectIdRegex = /^[0-9a-fA-F]{24}$/;

      if (!objectIdRegex.test(id)) {
        logger.warn('Invalid ObjectId format', {
          paramName,
          value: id,
          path: req.path
        });

        return res.status(400).json({
          success: false,
          error: `Invalid ${paramName} format`
        });
      }

      next();
    } catch (error) {
      logger.error('Error in validateObjectId middleware', {
        error: error.message,
        stack: error.stack,
        paramName
      });
      next(error);
    }
  };
};

/**
 * Validate file upload
 */


const validateFileUpload = (options = {}) => {
  const {
    required = false,
    maxSize = 5 * 1024 * 1024, // 5MB default
    allowedTypes = ['image/jpeg', 'image/png', 'image/gif']
  } = options;

  return (req, res, next) => {
    try {
      const file = req.file;

      // Check if file is required
      if (required && !file) {
        return res.status(400).json({
          success: false,
          error: 'File upload is required'
        });
      }

      // If no file and not required, continue
      if (!file) {
        return next();
      }

      // Validate file size
      if (file.size > maxSize) {
        return res.status(400).json({
          success: false,
          error: `File size exceeds maximum allowed size of ${maxSize / (1024 * 1024)}MB`
        });
      }

      // Validate file type
      if (!allowedTypes.includes(file.mimetype)) {
        return res.status(400).json({
          success: false,
          error: `File type not allowed. Allowed types: ${allowedTypes.join(', ')}`
        });
      }

      logger.info('File upload validated', {
        filename: file.originalname,
        size: file.size,
        mimetype: file.mimetype
      });

      next();
    } catch (error) {
      logger.error('Error in validateFileUpload middleware', {
        error: error.message,
        stack: error.stack
      });
      next(error);
    }
  };
};

module.exports = {
  validate,
  sanitizeBody,
  sanitizeQuery,
  validatePagination,
  validateObjectId,
  validateFileUpload
};
