// File: src/utils/tokenGenerator.js
// Generated: 2025-10-08 13:05:17 UTC
// Project ID: proj_aa174cb58c23
// Task ID: task_ph6s4bb2mlqc


const crypto = require('crypto');


const logger = require('./logger');

/**
 * Generate a cryptographically secure random token
 * @param {number} length - Length of the token in bytes (default: 32)
 * @returns {string} Hex-encoded random token
 */


const generateToken = (length = 32) => {
  try {
    const token = crypto.randomBytes(length).toString('hex');
    logger.debug('Generated random token', { tokenLength: token.length });
    return token;
  } catch (error) {
    logger.error('Failed to generate random token', { error: error.message });
    throw new Error('Token generation failed');
  }
};

/**
 * Generate a verification token for email verification
 * @returns {string} Hex-encoded verification token (64 characters)
 */


const generateVerificationToken = () => {
  try {
    const token = generateToken(32);
    logger.info('Generated email verification token');
    return token;
  } catch (error) {
    logger.error('Failed to generate verification token', { error: error.message });
    throw error;
  }
};

/**
 * Generate a password reset token
 * @returns {string} Hex-encoded reset token (64 characters)
 */


const generateResetToken = () => {
  try {
    const token = generateToken(32);
    logger.info('Generated password reset token');
    return token;
  } catch (error) {
    logger.error('Failed to generate reset token', { error: error.message });
    throw error;
  }
};

/**
 * Generate a numeric OTP (One-Time Password)
 * @param {number} length - Length of OTP (default: 6)
 * @returns {string} Numeric OTP
 */


const generateOTP = (length = 6) => {
  try {
    const max = Math.pow(10, length) - 1;
    const min = Math.pow(10, length - 1);
    const otp = Math.floor(min + crypto.randomInt(0, max - min + 1));
    logger.debug('Generated OTP', { otpLength: length });
    return otp.toString().padStart(length, '0');
  } catch (error) {
    logger.error('Failed to generate OTP', { error: error.message });
    throw new Error('OTP generation failed');
  }
};

/**
 * Hash a token using SHA256
 * @param {string} token - Token to hash
 * @returns {string} Hashed token (hex-encoded)
 */


const hashToken = (token) => {
  try {
    if (!token || typeof token !== 'string') {
      throw new Error('Invalid token provided for hashing');
    }
    const hash = crypto.createHash('sha256').update(token).digest('hex');
    logger.debug('Token hashed successfully');
    return hash;
  } catch (error) {
    logger.error('Failed to hash token', { error: error.message });
    throw error;
  }
};

/**
 * Generate token with expiry timestamp
 * @param {number} expiryMinutes - Minutes until token expires (default: 60)
 * @returns {Object} Object containing token and expiry date
 */


const generateTokenWithExpiry = (expiryMinutes = 60) => {
  try {
    const token = generateToken(32);
    const expiresAt = new Date(Date.now() + expiryMinutes * 60 * 1000);

    logger.info('Generated token with expiry', {
      expiryMinutes,
      expiresAt: expiresAt.toISOString()
    });

    return {
      token,
      expiresAt
    };
  } catch (error) {
    logger.error('Failed to generate token with expiry', { error: error.message });
    throw error;
  }
};

/**
 * Verify if a token has expired
 * @param {Date} expiryDate - Token expiry date
 * @returns {boolean} True if token has expired
 */


const isTokenExpired = (expiryDate) => {
  try {
    if (!expiryDate || !(expiryDate instanceof Date)) {
      throw new Error('Invalid expiry date provided');
    }
    const expired = new Date() > expiryDate;
    logger.debug('Token expiry check', { expired, expiryDate: expiryDate.toISOString() });
    return expired;
  } catch (error) {
    logger.error('Failed to check token expiry', { error: error.message });
    throw error;
  }
};

/**
 * Generate a URL-safe token
 * @param {number} length - Length of the token in bytes (default: 32)
 * @returns {string} Base64 URL-safe encoded token
 */


const generateUrlSafeToken = (length = 32) => {
  try {
    const token = crypto.randomBytes(length)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');

    logger.debug('Generated URL-safe token', { tokenLength: token.length });
    return token;
  } catch (error) {
    logger.error('Failed to generate URL-safe token', { error: error.message });
    throw new Error('URL-safe token generation failed');
  }
};

/**
 * Generate a refresh token (longer, more secure)
 * @returns {string} Hex-encoded refresh token (128 characters)
 */


const generateRefreshToken = () => {
  try {
    const token = generateToken(64);
    logger.info('Generated refresh token');
    return token;
  } catch (error) {
    logger.error('Failed to generate refresh token', { error: error.message });
    throw error;
  }
};

module.exports = {
  generateToken,
  generateVerificationToken,
  generateResetToken,
  generateOTP,
  hashToken,
  generateTokenWithExpiry,
  isTokenExpired,
  generateUrlSafeToken,
  generateRefreshToken
};
