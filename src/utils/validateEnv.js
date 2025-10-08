// File: src/utils/validateEnv.js
// Generated: 2025-10-08 13:05:19 UTC
// Project ID: proj_aa174cb58c23
// Task ID: task_uk4aqvqvqmmn


const Joi = require('joi');


const logger = require('./logger');

/**
 * Environment variable validation schema
 */


const envSchema = Joi.object({
  // Server Configuration
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),
  PORT: Joi.number()
    .port()
    .default(3000),

  // Database Configuration
  MONGODB_URI: Joi.string()
    .uri()
    .required()
    .description('MongoDB connection string'),

  // JWT Configuration
  JWT_ACCESS_SECRET: Joi.string()
    .min(32)
    .required()
    .description('JWT access token secret (min 32 characters)'),
  JWT_ACCESS_EXPIRY: Joi.string()
    .default('15m')
    .description('JWT access token expiry (e.g., 15m, 1h, 7d)'),
  JWT_REFRESH_SECRET: Joi.string()
    .min(32)
    .required()
    .description('JWT refresh token secret (min 32 characters)'),
  JWT_REFRESH_EXPIRY: Joi.string()
    .default('7d')
    .description('JWT refresh token expiry (e.g., 7d, 30d)'),

  // Email Configuration
  EMAIL_HOST: Joi.string()
    .required()
    .description('SMTP host'),
  EMAIL_PORT: Joi.number()
    .port()
    .required()
    .description('SMTP port'),
  EMAIL_USER: Joi.string()
    .email()
    .required()
    .description('SMTP username/email'),
  EMAIL_PASSWORD: Joi.string()
    .required()
    .description('SMTP password'),
  EMAIL_FROM: Joi.string()
    .email()
    .required()
    .description('Email sender address'),

  // Client Configuration
  CLIENT_URL: Joi.string()
    .uri()
    .required()
    .description('Frontend application URL'),

  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: Joi.number()
    .positive()
    .default(900000)
    .description('Rate limit window in milliseconds (default: 15 minutes)'),
  RATE_LIMIT_MAX_REQUESTS: Joi.number()
    .positive()
    .integer()
    .default(100)
    .description('Maximum requests per window'),

  // Security
  BCRYPT_ROUNDS: Joi.number()
    .integer()
    .min(10)
    .max(15)
    .default(12)
    .description('Bcrypt hashing rounds'),

  // Token Expiry
  EMAIL_VERIFICATION_EXPIRY: Joi.number()
    .positive()
    .default(86400000)
    .description('Email verification token expiry in milliseconds (default: 24 hours)'),
  PASSWORD_RESET_EXPIRY: Joi.number()
    .positive()
    .default(3600000)
    .description('Password reset token expiry in milliseconds (default: 1 hour)'),

  // Logging
  LOG_LEVEL: Joi.string()
    .valid('error', 'warn', 'info', 'http', 'verbose', 'debug', 'silly')
    .default('info')
    .description('Winston log level'),

  // CORS
  CORS_ORIGIN: Joi.string()
    .default('*')
    .description('CORS allowed origins (comma-separated or *)'),

  // Optional: Database Options
  DB_MAX_POOL_SIZE: Joi.number()
    .positive()
    .integer()
    .default(10)
    .description('MongoDB connection pool size'),
  DB_MIN_POOL_SIZE: Joi.number()
    .positive()
    .integer()
    .default(2)
    .description('MongoDB minimum connection pool size')
}).unknown(true);

/**
 * Validate environment variables
 * @returns {Object} Validated environment variables
 * @throws {Error} If validation fails
 */


const validateEnv = () => {
  try {
    const { error, value } = envSchema.validate(process.env, {
      abortEarly: false,
      stripUnknown: false
    });

    if (error) {
      const errorMessages = error.details.map(detail => {
        return `${detail.message}`;
      });

      logger.error('Environment variable validation failed', {
        errors: errorMessages
      });

      throw new Error(
        `Environment validation failed:\n${errorMessages.join('\n')}`
      );
    }

    // Validate JWT secrets are different
    if (value.JWT_ACCESS_SECRET === value.JWT_REFRESH_SECRET) {
      const error = 'JWT_ACCESS_SECRET and JWT_REFRESH_SECRET must be different';
      logger.error('Environment variable validation failed', { error });
      throw new Error(error);
    }

    // Validate production-specific requirements
    if (value.NODE_ENV === 'production') {
      const productionChecks = [
        {
          condition: value.JWT_ACCESS_SECRET.length < 64,
          message: 'JWT_ACCESS_SECRET should be at least 64 characters in production'
        },
        {
          condition: value.JWT_REFRESH_SECRET.length < 64,
          message: 'JWT_REFRESH_SECRET should be at least 64 characters in production'
        },
        {
          condition: value.MONGODB_URI.includes('localhost'),
          message: 'MONGODB_URI should not use localhost in production'
        },
        {
          condition: value.CLIENT_URL.includes('localhost'),
          message: 'CLIENT_URL should not use localhost in production'
        }
      ];

      const productionErrors = productionChecks
        .filter(check => check.condition)
        .map(check => check.message);

      if (productionErrors.length > 0) {
        logger.warn('Production environment warnings', {
          warnings: productionErrors
        });
      }
    }

    logger.info('Environment variables validated successfully', {
      nodeEnv: value.NODE_ENV,
      port: value.PORT
    });

    return value;
  } catch (error) {
    logger.error('Failed to validate environment variables', {
      error: error.message
    });
    throw error;
  }
};

/**
 * Get validated environment configuration
 * @returns {Object} Validated environment configuration
 */


const getValidatedEnv = () => {
  return validateEnv();
};

module.exports = {
  validateEnv,
  getValidatedEnv
};
