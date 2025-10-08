// File: src/config/index.js
// Generated: 2025-10-08 13:05:26 UTC
// Project ID: proj_aa174cb58c23
// Task ID: task_r8iby9783ige


const dotenv = require('dotenv');


const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env') });

/**
 * Validate required environment variables
 * @throws {Error} If required environment variables are missing
 */


const validateEnv = () => {
  const required = [
    'NODE_ENV',
    'PORT',
    'MONGODB_URI',
    'JWT_ACCESS_SECRET',
    'JWT_REFRESH_SECRET'
  ];

  const missing = required.filter(key => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  // Validate JWT secrets are strong enough
  if (process.env.JWT_ACCESS_SECRET.length < 32) {
    throw new Error('JWT_ACCESS_SECRET must be at least 32 characters long');
  }

  if (process.env.JWT_REFRESH_SECRET.length < 32) {
    throw new Error('JWT_REFRESH_SECRET must be at least 32 characters long');
  }
};

// Validate environment variables on load
validateEnv();

/**
 * Centralized configuration object
 */


const config = {
  // Environment
  env: process.env.NODE_ENV || 'development',
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',
  isTest: process.env.NODE_ENV === 'test',

  // Server
  port: parseInt(process.env.PORT, 10) || 3000,
  host: process.env.HOST || '0.0.0.0',

  // Database
  mongodb: {
    uri: process.env.MONGODB_URI,
    options: {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      maxPoolSize: parseInt(process.env.DB_POOL_SIZE, 10) || 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000
    }
  },

  // JWT Configuration
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET,
    accessExpiry: process.env.JWT_ACCESS_EXPIRY || '15m',
    refreshSecret: process.env.JWT_REFRESH_SECRET,
    refreshExpiry: process.env.JWT_REFRESH_EXPIRY || '7d',
    issuer: process.env.JWT_ISSUER || 'genesis-auth-api',
    audience: process.env.JWT_AUDIENCE || 'genesis-users'
  },

  // Email Configuration
  email: {
    service: process.env.EMAIL_SERVICE || 'gmail',
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT, 10) || 587,
    secure: process.env.EMAIL_SECURE === 'true',
    user: process.env.EMAIL_USER,
    password: process.env.EMAIL_PASSWORD,
    from: process.env.EMAIL_FROM || 'noreply@genesis.com',
    fromName: process.env.EMAIL_FROM_NAME || 'Genesis Platform'
  },

  // Security
  security: {
    bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS, 10) || 12,
    rateLimitWindow: parseInt(process.env.RATE_LIMIT_WINDOW, 10) || 15 * 60 * 1000, // 15 minutes
    rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX, 10) || 100,
    corsOrigin: process.env.CORS_ORIGIN || '*',
    sessionSecret: process.env.SESSION_SECRET || 'default-session-secret-change-in-production'
  },

  // Token Expiry
  tokens: {
    emailVerificationExpiry: parseInt(process.env.EMAIL_VERIFICATION_EXPIRY, 10) || 24 * 60 * 60 * 1000, // 24 hours
    passwordResetExpiry: parseInt(process.env.PASSWORD_RESET_EXPIRY, 10) || 60 * 60 * 1000, // 1 hour
    refreshTokenExpiry: parseInt(process.env.REFRESH_TOKEN_EXPIRY, 10) || 7 * 24 * 60 * 60 * 1000 // 7 days
  },

  // Application URLs
  urls: {
    clientUrl: process.env.CLIENT_URL || 'http://localhost:3000',
    apiUrl: process.env.API_URL || 'http://localhost:3000/api',
    verifyEmailUrl: process.env.VERIFY_EMAIL_URL || 'http://localhost:3000/verify-email',
    resetPasswordUrl: process.env.RESET_PASSWORD_URL || 'http://localhost:3000/reset-password'
  },

  // Logging
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    format: process.env.LOG_FORMAT || 'json',
    directory: process.env.LOG_DIRECTORY || 'logs',
    maxFiles: parseInt(process.env.LOG_MAX_FILES, 10) || 14,
    maxSize: process.env.LOG_MAX_SIZE || '20m'
  },

  // Pagination
  pagination: {
    defaultLimit: parseInt(process.env.DEFAULT_PAGE_LIMIT, 10) || 10,
    maxLimit: parseInt(process.env.MAX_PAGE_LIMIT, 10) || 100
  }
};

/**
 * Get configuration value by path
 * @param {string} path - Dot-notation path to config value (e.g., 'jwt.accessSecret')
 * @param {*} defaultValue - Default value if path not found
 * @returns {*} Configuration value
 */
config.get = function(path, defaultValue = undefined) {
  const keys = path.split('.');
  let value = this;

  for (const key of keys) {
    if (value && typeof value === 'object' && key in value) {
      value = value[key];
    } else {
      return defaultValue;
    }
  }

  return value;
};

/**
 * Check if a configuration value exists
 * @param {string} path - Dot-notation path to config value
 * @returns {boolean} True if value exists
 */
config.has = function(path) {
  const keys = path.split('.');
  let value = this;

  for (const key of keys) {
    if (value && typeof value === 'object' && key in value) {
      value = value[key];
    } else {
      return false;
    }
  }

  return value !== undefined;
};

module.exports = config;
