// File: src/services/token.service.js
// Generated: 2025-10-08 13:06:38 UTC
// Project ID: proj_aa174cb58c23
// Task ID: task_b390dq3uj916


const ApiError = require('../utils/ApiError');


const config = require('../config');


const crypto = require('crypto');


const jwt = require('jsonwebtoken');


const logger = require('../utils/logger');


const redisService = require('./redis.service');

/**
 * Token Service
 * Handles JWT token generation, validation, and refresh token management
 */

/**
 * Generate access token
 * @param {Object} payload - Token payload (userId, email, role)
 * @returns {string} JWT access token
 */


const generateAccessToken = (payload) => {
  try {
    const token = jwt.sign(
      payload,
      config.jwt.accessSecret,
      {
        expiresIn: config.jwt.accessExpiry,
        issuer: 'genesis-auth-api',
        audience: 'genesis-users'
      }
    );

    logger.debug('Generated access token', { userId: payload.userId });
    return token;
  } catch (error) {
    logger.error('Failed to generate access token', { error: error.message, userId: payload.userId });
    throw new ApiError(500, 'Failed to generate access token');
  }
};

/**
 * Generate refresh token
 * @param {Object} payload - Token payload (userId)
 * @returns {string} JWT refresh token
 */


const generateRefreshToken = (payload) => {
  try {
    const token = jwt.sign(
      payload,
      config.jwt.refreshSecret,
      {
        expiresIn: config.jwt.refreshExpiry,
        issuer: 'genesis-auth-api',
        audience: 'genesis-users'
      }
    );

    logger.debug('Generated refresh token', { userId: payload.userId });
    return token;
  } catch (error) {
    logger.error('Failed to generate refresh token', { error: error.message, userId: payload.userId });
    throw new ApiError(500, 'Failed to generate refresh token');
  }
};

/**
 * Generate token pair (access + refresh)
 * @param {Object} user - User object with _id, email, role
 * @returns {Object} Object containing accessToken and refreshToken
 */


const generateTokenPair = async (user) => {
  try {
    const payload = {
      userId: user._id.toString(),
      email: user.email,
      role: user.role || 'user'
    };

    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken({ userId: user._id.toString() });

    // Store refresh token in Redis with expiry
    const refreshExpiry = parseExpiry(config.jwt.refreshExpiry);
    await redisService.setRefreshToken(user._id.toString(), refreshToken, refreshExpiry);

    logger.info('Generated token pair', { userId: user._id });

    return {
      accessToken,
      refreshToken
    };
  } catch (error) {
    logger.error('Failed to generate token pair', { error: error.message, userId: user._id });
    throw new ApiError(500, 'Failed to generate authentication tokens');
  }
};

/**
 * Verify access token
 * @param {string} token - JWT access token
 * @returns {Object} Decoded token payload
 * @throws {ApiError} If token is invalid or expired
 */


const verifyAccessToken = (token) => {
  try {
    const decoded = jwt.verify(token, config.jwt.accessSecret, {
      issuer: 'genesis-auth-api',
      audience: 'genesis-users'
    });

    logger.debug('Verified access token', { userId: decoded.userId });
    return decoded;
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      logger.warn('Access token expired', { expiredAt: error.expiredAt });
      throw new ApiError(401, 'Access token expired');
    }
    if (error.name === 'JsonWebTokenError') {
      logger.warn('Invalid access token', { error: error.message });
      throw new ApiError(401, 'Invalid access token');
    }
    logger.error('Failed to verify access token', { error: error.message });
    throw new ApiError(401, 'Token verification failed');
  }
};

/**
 * Verify refresh token
 * @param {string} token - JWT refresh token
 * @returns {Object} Decoded token payload
 * @throws {ApiError} If token is invalid or expired
 */


const verifyRefreshToken = async (token) => {
  try {
    const decoded = jwt.verify(token, config.jwt.refreshSecret, {
      issuer: 'genesis-auth-api',
      audience: 'genesis-users'
    });

    // Check if token exists in Redis (not revoked)
    const storedToken = await redisService.getRefreshToken(decoded.userId);
    if (!storedToken || storedToken !== token) {
      logger.warn('Refresh token not found or revoked', { userId: decoded.userId });
      throw new ApiError(401, 'Invalid or revoked refresh token');
    }

    logger.debug('Verified refresh token', { userId: decoded.userId });
    return decoded;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    if (error.name === 'TokenExpiredError') {
      logger.warn('Refresh token expired', { expiredAt: error.expiredAt });
      throw new ApiError(401, 'Refresh token expired');
    }
    if (error.name === 'JsonWebTokenError') {
      logger.warn('Invalid refresh token', { error: error.message });
      throw new ApiError(401, 'Invalid refresh token');
    }
    logger.error('Failed to verify refresh token', { error: error.message });
    throw new ApiError(401, 'Token verification failed');
  }
};

/**
 * Refresh access token using refresh token
 * @param {string} refreshToken - JWT refresh token
 * @returns {Object} Object containing new accessToken
 * @throws {ApiError} If refresh token is invalid
 */


const refreshAccessToken = async (refreshToken) => {
  try {
    const decoded = await verifyRefreshToken(refreshToken);

    const payload = {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role
    };

    const accessToken = generateAccessToken(payload);

    logger.info('Refreshed access token', { userId: decoded.userId });

    return { accessToken };
  } catch (error) {
    logger.error('Failed to refresh access token', { error: error.message });
    throw error;
  }
};

/**
 * Revoke refresh token
 * @param {string} userId - User ID
 * @returns {Promise<void>}
 */


const revokeRefreshToken = async (userId) => {
  try {
    await redisService.deleteRefreshToken(userId);
    logger.info('Revoked refresh token', { userId });
  } catch (error) {
    logger.error('Failed to revoke refresh token', { error: error.message, userId });
    throw new ApiError(500, 'Failed to revoke refresh token');
  }
};

/**
 * Revoke all refresh tokens for a user
 * @param {string} userId - User ID
 * @returns {Promise<void>}
 */


const revokeAllRefreshTokens = async (userId) => {
  try {
    await redisService.deleteRefreshToken(userId);
    logger.info('Revoked all refresh tokens', { userId });
  } catch (error) {
    logger.error('Failed to revoke all refresh tokens', { error: error.message, userId });
    throw new ApiError(500, 'Failed to revoke refresh tokens');
  }
};

/**
 * Blacklist access token (for logout)
 * @param {string} token - JWT access token
 * @returns {Promise<void>}
 */


const blacklistAccessToken = async (token) => {
  try {
    const decoded = jwt.decode(token);
    if (!decoded || !decoded.exp) {
      throw new ApiError(400, 'Invalid token format');
    }

    const ttl = decoded.exp - Math.floor(Date.now() / 1000);
    if (ttl > 0) {
      await redisService.blacklistToken(token, ttl);
      logger.info('Blacklisted access token', { userId: decoded.userId });
    }
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    logger.error('Failed to blacklist access token', { error: error.message });
    throw new ApiError(500, 'Failed to blacklist token');
  }
};

/**
 * Check if token is blacklisted
 * @param {string} token - JWT access token
 * @returns {Promise<boolean>} True if blacklisted
 */


const isTokenBlacklisted = async (token) => {
  try {
    const isBlacklisted = await redisService.isTokenBlacklisted(token);
    return isBlacklisted;
  } catch (error) {
    logger.error('Failed to check token blacklist', { error: error.message });
    return false;
  }
};

/**
 * Generate email verification token
 * @param {string} userId - User ID
 * @returns {Promise<string>} Verification token
 */


const generateEmailVerificationToken = async (userId) => {
  try {
    const token = crypto.randomBytes(32).toString('hex');
    const expiry = 24 * 60 * 60; // 24 hours in seconds

    await redisService.setEmailVerificationToken(userId, token, expiry);

    logger.info('Generated email verification token', { userId });
    return token;
  } catch (error) {
    logger.error('Failed to generate email verification token', { error: error.message, userId });
    throw new ApiError(500, 'Failed to generate verification token');
  }
};

/**
 * Verify email verification token
 * @param {string} userId - User ID
 * @param {string} token - Verification token
 * @returns {Promise<boolean>} True if valid
 */


const verifyEmailVerificationToken = async (userId, token) => {
  try {
    const storedToken = await redisService.getEmailVerificationToken(userId);

    if (!storedToken || storedToken !== token) {
      logger.warn('Invalid email verification token', { userId });
      return false;
    }

    await redisService.deleteEmailVerificationToken(userId);
    logger.info('Verified email verification token', { userId });
    return true;
  } catch (error) {
    logger.error('Failed to verify email verification token', { error: error.message, userId });
    return false;
  }
};

/**
 * Generate password reset token
 * @param {string} userId - User ID
 * @returns {Promise<string>} Reset token
 */


const generatePasswordResetToken = async (userId) => {
  try {
    const token = crypto.randomBytes(32).toString('hex');
    const expiry = 60 * 60; // 1 hour in seconds

    await redisService.setPasswordResetToken(userId, token, expiry);

    logger.info('Generated password reset token', { userId });
    return token;
  } catch (error) {
    logger.error('Failed to generate password reset token', { error: error.message, userId });
    throw new ApiError(500, 'Failed to generate reset token');
  }
};

/**
 * Verify password reset token
 * @param {string} userId - User ID
 * @param {string} token - Reset token
 * @returns {Promise<boolean>} True if valid
 */


const verifyPasswordResetToken = async (userId, token) => {
  try {
    const storedToken = await redisService.getPasswordResetToken(userId);

    if (!storedToken || storedToken !== token) {
      logger.warn('Invalid password reset token', { userId });
      return false;
    }

    await redisService.deletePasswordResetToken(userId);
    logger.info('Verified password reset token', { userId });
    return true;
  } catch (error) {
    logger.error('Failed to verify password reset token', { error: error.message, userId });
    return false;
  }
};

/**
 * Parse expiry string to seconds
 * @param {string} expiry - Expiry string (e.g., '15m', '7d', '1h')
 * @returns {number} Expiry in seconds
 */


const parseExpiry = (expiry) => {
  const units = {
    s: 1,
    m: 60,
    h: 60 * 60,
    d: 24 * 60 * 60
  };

  const match = expiry.match(/^(\d+)([smhd])$/);
  if (!match) {
    logger.warn('Invalid expiry format, using default', { expiry });
    return 15 * 60; // Default 15 minutes
  }

  const value = parseInt(match[1], 10);
  const unit = match[2];

  return value * units[unit];
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  generateTokenPair,
  verifyAccessToken,
  verifyRefreshToken,
  refreshAccessToken,
  revokeRefreshToken,
  revokeAllRefreshTokens,
  blacklistAccessToken,
  isTokenBlacklisted,
  generateEmailVerificationToken,
  verifyEmailVerificationToken,
  generatePasswordResetToken,
  verifyPasswordResetToken
};
