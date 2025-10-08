// File: src/services/verification.service.js
// Generated: 2025-10-08 13:07:04 UTC
// Project ID: proj_aa174cb58c23
// Task ID: task_lhaf6v8jlo9l


const User = require('../models/User');


const emailService = require('./email.service');


const logger = require('../utils/logger');

const { generateToken } = require('../utils/tokenGenerator');

/**
 * Verification Service
 * Handles email verification token generation and validation
 */

/**
 * Generate and send verification email
 * @param {Object} user - User document
 * @returns {Promise<Object>} Result object with success status
 */
exports.sendVerificationEmail = async (user) => {
  try {
    // Generate verification token
    const verificationToken = generateToken();

    // Set token and expiry (24 hours)
    user.verificationToken = verificationToken;
    user.verificationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await user.save();

    // Construct verification URL
    const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-email?token=${verificationToken}`;

    // Send verification email
    await emailService.sendVerificationEmail(user.email, user.name, verificationUrl);

    logger.info('Verification email sent', {
      userId: user._id,
      email: user.email
    });

    return {
      success: true,
      message: 'Verification email sent successfully'
    };
  } catch (error) {
    logger.error('Failed to send verification email', {
      userId: user._id,
      error: error.message
    });
    throw error;
  }
};

/**
 * Verify email with token
 * @param {string} token - Verification token
 * @returns {Promise<Object>} Result object with user data
 */
exports.verifyEmail = async (token) => {
  try {
    if (!token) {
      logger.warn('Email verification attempted without token');
      return {
        success: false,
        error: 'Verification token is required'
      };
    }

    // Find user with valid token
    const user = await User.findOne({
      verificationToken: token,
      verificationTokenExpiry: { $gt: Date.now() }
    });

    if (!user) {
      logger.warn('Invalid or expired verification token', { token });
      return {
        success: false,
        error: 'Invalid or expired verification token'
      };
    }

    // Mark email as verified
    user.isEmailVerified = true;
    user.verificationToken = undefined;
    user.verificationTokenExpiry = undefined;

    await user.save();

    logger.info('Email verified successfully', {
      userId: user._id,
      email: user.email
    });

    return {
      success: true,
      message: 'Email verified successfully',
      data: {
        userId: user._id,
        email: user.email,
        name: user.name
      }
    };
  } catch (error) {
    logger.error('Email verification failed', {
      token,
      error: error.message
    });
    throw error;
  }
};

/**
 * Resend verification email
 * @param {string} email - User email address
 * @returns {Promise<Object>} Result object with success status
 */
exports.resendVerificationEmail = async (email) => {
  try {
    if (!email) {
      logger.warn('Resend verification attempted without email');
      return {
        success: false,
        error: 'Email address is required'
      };
    }

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      logger.warn('Resend verification attempted for non-existent user', { email });
      return {
        success: false,
        error: 'User not found'
      };
    }

    // Check if already verified
    if (user.isEmailVerified) {
      logger.info('Resend verification attempted for already verified user', {
        userId: user._id,
        email
      });
      return {
        success: false,
        error: 'Email is already verified'
      };
    }

    // Generate new token and send email
    await this.sendVerificationEmail(user);

    return {
      success: true,
      message: 'Verification email resent successfully'
    };
  } catch (error) {
    logger.error('Failed to resend verification email', {
      email,
      error: error.message
    });
    throw error;
  }
};

/**
 * Check if verification token is valid
 * @param {string} token - Verification token
 * @returns {Promise<Object>} Result object with validity status
 */
exports.checkTokenValidity = async (token) => {
  try {
    if (!token) {
      return {
        success: false,
        valid: false,
        error: 'Token is required'
      };
    }

    // Find user with valid token
    const user = await User.findOne({
      verificationToken: token,
      verificationTokenExpiry: { $gt: Date.now() }
    }).select('email name');

    if (!user) {
      logger.warn('Token validity check failed', { token });
      return {
        success: false,
        valid: false,
        error: 'Invalid or expired token'
      };
    }

    logger.info('Token validity check passed', {
      userId: user._id,
      email: user.email
    });

    return {
      success: true,
      valid: true,
      data: {
        email: user.email,
        name: user.name
      }
    };
  } catch (error) {
    logger.error('Token validity check failed', {
      token,
      error: error.message
    });
    throw error;
  }
};

/**
 * Clean up expired verification tokens
 * @returns {Promise<Object>} Result object with cleanup count
 */
exports.cleanupExpiredTokens = async () => {
  try {
    const result = await User.updateMany(
      {
        verificationTokenExpiry: { $lt: Date.now() },
        isEmailVerified: false
      },
      {
        $unset: {
          verificationToken: 1,
          verificationTokenExpiry: 1
        }
      }
    );

    logger.info('Cleaned up expired verification tokens', {
      count: result.modifiedCount
    });

    return {
      success: true,
      message: 'Expired tokens cleaned up',
      count: result.modifiedCount
    };
  } catch (error) {
    logger.error('Failed to cleanup expired tokens', {
      error: error.message
    });
    throw error;
  }
};
