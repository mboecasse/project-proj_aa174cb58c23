// File: src/controllers/token.controller.js
// Generated: 2025-10-08 13:05:31 UTC
// Project ID: proj_aa174cb58c23
// Task ID: task_nql1tzs74rfp


const RefreshToken = require('../models/RefreshToken');


const User = require('../models/User');


const asyncHandler = require('../utils/asyncHandler');


const jwt = require('jsonwebtoken');


const logger = require('../utils/logger');

/**
 * Refresh access token using refresh token
 * @route POST /api/auth/token/refresh
 * @access Public
 */
exports.refreshToken = asyncHandler(async (req, res, next) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(400).json({
      success: false,
      error: 'Refresh token is required'
    });
  }

  try {
    // Verify refresh token
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

    // Check if refresh token exists in database
    const storedToken = await RefreshToken.findOne({
      token: refreshToken,
      user: decoded.userId,
      revoked: false
    });

    if (!storedToken) {
      logger.warn('Invalid or revoked refresh token used', { userId: decoded.userId });
      return res.status(401).json({
        success: false,
        error: 'Invalid or revoked refresh token'
      });
    }

    // Check if token is expired
    if (storedToken.expiresAt < new Date()) {
      logger.warn('Expired refresh token used', { userId: decoded.userId });
      await RefreshToken.findByIdAndDelete(storedToken._id);
      return res.status(401).json({
        success: false,
        error: 'Refresh token expired'
      });
    }

    // Get user
    const user = await User.findById(decoded.userId).select('-password');

    if (!user) {
      logger.error('User not found for valid refresh token', { userId: decoded.userId });
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    if (!user.isActive) {
      logger.warn('Inactive user attempted token refresh', { userId: user._id });
      return res.status(403).json({
        success: false,
        error: 'Account is inactive'
      });
    }

    // Generate new access token
    const accessToken = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_ACCESS_SECRET,
      { expiresIn: process.env.JWT_ACCESS_EXPIRY || '15m' }
    );

    // Update last used timestamp
    storedToken.lastUsedAt = new Date();
    await storedToken.save();

    logger.info('Access token refreshed successfully', { userId: user._id });

    res.json({
      success: true,
      data: {
        accessToken,
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          isVerified: user.isVerified
        }
      },
      message: 'Token refreshed successfully'
    });
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      logger.warn('Invalid refresh token format', { error: error.message });
      return res.status(401).json({
        success: false,
        error: 'Invalid refresh token'
      });
    }

    if (error.name === 'TokenExpiredError') {
      logger.warn('Expired refresh token', { error: error.message });
      return res.status(401).json({
        success: false,
        error: 'Refresh token expired'
      });
    }

    logger.error('Token refresh failed', { error: error.message });
    next(error);
  }
});

/**
 * Revoke refresh token (logout)
 * @route POST /api/auth/token/revoke
 * @access Private
 */
exports.revokeToken = asyncHandler(async (req, res, next) => {
  const { refreshToken } = req.body;
  const userId = req.userId;

  if (!refreshToken) {
    return res.status(400).json({
      success: false,
      error: 'Refresh token is required'
    });
  }

  try {
    // Find and revoke the token
    const token = await RefreshToken.findOne({
      token: refreshToken,
      user: userId
    });

    if (!token) {
      logger.warn('Attempted to revoke non-existent token', { userId });
      return res.status(404).json({
        success: false,
        error: 'Token not found'
      });
    }

    if (token.revoked) {
      logger.info('Token already revoked', { userId, tokenId: token._id });
      return res.json({
        success: true,
        message: 'Token already revoked'
      });
    }

    token.revoked = true;
    token.revokedAt = new Date();
    await token.save();

    logger.info('Refresh token revoked successfully', { userId, tokenId: token._id });

    res.json({
      success: true,
      message: 'Token revoked successfully'
    });
  } catch (error) {
    logger.error('Token revocation failed', { userId, error: error.message });
    next(error);
  }
});

/**
 * Revoke all refresh tokens for user
 * @route POST /api/auth/token/revoke-all
 * @access Private
 */
exports.revokeAllTokens = asyncHandler(async (req, res, next) => {
  const userId = req.userId;

  try {
    const result = await RefreshToken.updateMany(
      { user: userId, revoked: false },
      { revoked: true, revokedAt: new Date() }
    );

    logger.info('All refresh tokens revoked', { userId, count: result.modifiedCount });

    res.json({
      success: true,
      data: {
        revokedCount: result.modifiedCount
      },
      message: 'All tokens revoked successfully'
    });
  } catch (error) {
    logger.error('Failed to revoke all tokens', { userId, error: error.message });
    next(error);
  }
});

/**
 * Get all active refresh tokens for user
 * @route GET /api/auth/token/sessions
 * @access Private
 */
exports.getActiveSessions = asyncHandler(async (req, res, next) => {
  const userId = req.userId;

  try {
    const tokens = await RefreshToken.find({
      user: userId,
      revoked: false,
      expiresAt: { $gt: new Date() }
    })
      .select('createdAt lastUsedAt expiresAt ipAddress userAgent')
      .sort({ lastUsedAt: -1 });

    logger.info('Fetched active sessions', { userId, count: tokens.length });

    res.json({
      success: true,
      data: {
        sessions: tokens.map(token => ({
          id: token._id,
          createdAt: token.createdAt,
          lastUsedAt: token.lastUsedAt,
          expiresAt: token.expiresAt,
          ipAddress: token.ipAddress,
          userAgent: token.userAgent
        }))
      }
    });
  } catch (error) {
    logger.error('Failed to fetch active sessions', { userId, error: error.message });
    next(error);
  }
});

/**
 * Revoke specific session by token ID
 * @route DELETE /api/auth/token/sessions/:tokenId
 * @access Private
 */
exports.revokeSession = asyncHandler(async (req, res, next) => {
  const userId = req.userId;
  const { tokenId } = req.params;

  try {
    const token = await RefreshToken.findOne({
      _id: tokenId,
      user: userId
    });

    if (!token) {
      logger.warn('Attempted to revoke non-existent session', { userId, tokenId });
      return res.status(404).json({
        success: false,
        error: 'Session not found'
      });
    }

    if (token.revoked) {
      logger.info('Session already revoked', { userId, tokenId });
      return res.json({
        success: true,
        message: 'Session already revoked'
      });
    }

    token.revoked = true;
    token.revokedAt = new Date();
    await token.save();

    logger.info('Session revoked successfully', { userId, tokenId });

    res.json({
      success: true,
      message: 'Session revoked successfully'
    });
  } catch (error) {
    logger.error('Failed to revoke session', { userId, tokenId: req.params.tokenId, error: error.message });
    next(error);
  }
});
