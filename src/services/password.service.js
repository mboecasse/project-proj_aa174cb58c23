// File: src/services/password.service.js
// Generated: 2025-10-08 13:07:05 UTC
// Project ID: proj_aa174cb58c23
// Task ID: task_x4uwnt3u5kfg


const User = require('../models/User');


const crypto = require('crypto');


const emailService = require('./email.service');


const logger = require('../utils/logger');

const { generateToken } = require('../utils/tokenGenerator');

/**
 * Generate password reset token and send reset email
 * @param {string} email - User's email address
 * @returns {Promise<Object>} Success status and message
 */
exports.requestPasswordReset = async (email) => {
  try {
    // Find user by email
    const user = await User.findOne({ email });

    if (!user) {
      // Don't reveal if user exists for security
      logger.warn('Password reset requested for non-existent email', { email });
      return {
        success: true,
        message: 'If an account exists with this email, a password reset link has been sent'
      };
    }

    // Generate secure reset token
    const resetToken = generateToken(32);
    const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');

    // Set token and expiry (1 hour)
    user.resetPasswordToken = resetTokenHash;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
    await user.save();

    // Send reset email
    try {
      await emailService.sendPasswordResetEmail(user.email, user.name, resetToken);
      logger.info('Password reset email sent', { userId: user._id, email: user.email });
    } catch (emailError) {
      // Clear token if email fails
      user.resetPasswordToken = undefined;
      user.resetPasswordExpires = undefined;
      await user.save();

      logger.error('Failed to send password reset email', {
        userId: user._id,
        email: user.email,
        error: emailError.message
      });

      throw new Error('Failed to send password reset email. Please try again later.');
    }

    return {
      success: true,
      message: 'Password reset link has been sent to your email'
    };
  } catch (error) {
    logger.error('Password reset request failed', { email, error: error.message });
    throw error;
  }
};

/**
 * Verify reset token validity
 * @param {string} token - Reset token from email
 * @returns {Promise<Object>} User object if token is valid
 */
exports.verifyResetToken = async (token) => {
  try {
    // Hash the provided token
    const resetTokenHash = crypto.createHash('sha256').update(token).digest('hex');

    // Find user with valid token
    const user = await User.findOne({
      resetPasswordToken: resetTokenHash,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      logger.warn('Invalid or expired reset token used', { token: resetTokenHash });
      throw new Error('Invalid or expired password reset token');
    }

    logger.info('Reset token verified', { userId: user._id });

    return {
      success: true,
      user: {
        _id: user._id,
        email: user.email,
        name: user.name
      }
    };
  } catch (error) {
    logger.error('Token verification failed', { error: error.message });
    throw error;
  }
};

/**
 * Reset password using valid token
 * @param {string} token - Reset token from email
 * @param {string} newPassword - New password
 * @returns {Promise<Object>} Success status and message
 */
exports.resetPassword = async (token, newPassword) => {
  try {
    // Validate password
    if (!newPassword || newPassword.length < 8) {
      throw new Error('Password must be at least 8 characters long');
    }

    // Hash the provided token
    const resetTokenHash = crypto.createHash('sha256').update(token).digest('hex');

    // Find user with valid token
    const user = await User.findOne({
      resetPasswordToken: resetTokenHash,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      logger.warn('Password reset attempted with invalid token', { token: resetTokenHash });
      throw new Error('Invalid or expired password reset token');
    }

    // Update password (will be hashed by pre-save hook in User model)
    user.password = newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    logger.info('Password reset successful', { userId: user._id, email: user.email });

    // Send confirmation email
    try {
      await emailService.sendPasswordResetConfirmation(user.email, user.name);
    } catch (emailError) {
      // Log but don't fail the reset if confirmation email fails
      logger.error('Failed to send password reset confirmation', {
        userId: user._id,
        error: emailError.message
      });
    }

    return {
      success: true,
      message: 'Password has been reset successfully'
    };
  } catch (error) {
    logger.error('Password reset failed', { error: error.message });
    throw error;
  }
};

/**
 * Change password for authenticated user
 * @param {string} userId - User's ID
 * @param {string} currentPassword - Current password
 * @param {string} newPassword - New password
 * @returns {Promise<Object>} Success status and message
 */
exports.changePassword = async (userId, currentPassword, newPassword) => {
  try {
    // Validate inputs
    if (!currentPassword || !newPassword) {
      throw new Error('Current password and new password are required');
    }

    if (newPassword.length < 8) {
      throw new Error('New password must be at least 8 characters long');
    }

    if (currentPassword === newPassword) {
      throw new Error('New password must be different from current password');
    }

    // Find user
    const user = await User.findById(userId).select('+password');

    if (!user) {
      logger.error('User not found for password change', { userId });
      throw new Error('User not found');
    }

    // Verify current password
    const isPasswordValid = await user.comparePassword(currentPassword);

    if (!isPasswordValid) {
      logger.warn('Invalid current password provided', { userId });
      throw new Error('Current password is incorrect');
    }

    // Update password
    user.password = newPassword;
    await user.save();

    logger.info('Password changed successfully', { userId, email: user.email });

    // Send confirmation email
    try {
      await emailService.sendPasswordChangeConfirmation(user.email, user.name);
    } catch (emailError) {
      // Log but don't fail if confirmation email fails
      logger.error('Failed to send password change confirmation', {
        userId,
        error: emailError.message
      });
    }

    return {
      success: true,
      message: 'Password has been changed successfully'
    };
  } catch (error) {
    logger.error('Password change failed', { userId, error: error.message });
    throw error;
  }
};

/**
 * Clean up expired reset tokens (for scheduled cleanup)
 * @returns {Promise<Object>} Number of tokens cleaned
 */
exports.cleanupExpiredTokens = async () => {
  try {
    const result = await User.updateMany(
      { resetPasswordExpires: { $lt: Date.now() } },
      {
        $unset: {
          resetPasswordToken: 1,
          resetPasswordExpires: 1
        }
      }
    );

    logger.info('Cleaned up expired reset tokens', { count: result.modifiedCount });

    return {
      success: true,
      count: result.modifiedCount
    };
  } catch (error) {
    logger.error('Failed to cleanup expired tokens', { error: error.message });
    throw error;
  }
};
