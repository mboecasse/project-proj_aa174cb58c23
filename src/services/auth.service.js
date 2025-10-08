// File: src/services/auth.service.js
// Generated: 2025-10-08 13:07:18 UTC
// Project ID: proj_aa174cb58c23
// Task ID: task_4zdkku3oz8gy


const ApiError = require('../utils/ApiError');


const User = require('../models/User');


const crypto = require('crypto');


const emailService = require('./email.service');


const logger = require('../utils/logger');


const tokenService = require('./token.service');

/**
 * Register a new user
 * @param {Object} userData - User registration data
 * @param {string} userData.name - User's full name
 * @param {string} userData.email - User's email address
 * @param {string} userData.password - User's password
 * @returns {Promise<Object>} Created user and tokens
 */


const register = async (userData) => {
  try {
    const { name, email, password } = userData;

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      logger.warn('Registration attempt with existing email', { email });
      throw new ApiError(400, 'User with this email already exists');
    }

    // Create user
    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password
    });

    logger.info('User registered successfully', { userId: user._id, email: user.email });

    // Generate email verification token
    const verificationToken = user.generateEmailVerificationToken();
    await user.save();

    // Send verification email
    try {
      await emailService.sendVerificationEmail(user.email, verificationToken);
      logger.info('Verification email sent', { userId: user._id, email: user.email });
    } catch (emailError) {
      logger.error('Failed to send verification email', {
        userId: user._id,
        email: user.email,
        error: emailError.message
      });
      // Don't fail registration if email fails
    }

    // Generate tokens
    const accessToken = tokenService.generateAccessToken(user._id);
    const refreshToken = tokenService.generateRefreshToken(user._id);

    // Save refresh token
    user.refreshTokens.push({ token: refreshToken });
    await user.save();

    return {
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        isEmailVerified: user.isEmailVerified,
        role: user.role,
        createdAt: user.createdAt
      },
      tokens: {
        accessToken,
        refreshToken
      }
    };
  } catch (error) {
    logger.error('Registration failed', { error: error.message, userData: { email: userData.email } });
    throw error;
  }
};

/**
 * Login user
 * @param {string} email - User's email
 * @param {string} password - User's password
 * @returns {Promise<Object>} User and tokens
 */


const login = async (email, password) => {
  try {
    // Find user and include password for comparison
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

    if (!user) {
      logger.warn('Login attempt with non-existent email', { email });
      throw new ApiError(401, 'Invalid email or password');
    }

    // Check if account is active
    if (!user.isActive) {
      logger.warn('Login attempt for inactive account', { userId: user._id, email });
      throw new ApiError(403, 'Account has been deactivated');
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      logger.warn('Login attempt with invalid password', { userId: user._id, email });
      throw new ApiError(401, 'Invalid email or password');
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    logger.info('User logged in successfully', { userId: user._id, email: user.email });

    // Generate tokens
    const accessToken = tokenService.generateAccessToken(user._id);
    const refreshToken = tokenService.generateRefreshToken(user._id);

    // Save refresh token
    user.refreshTokens.push({ token: refreshToken });
    await user.save();

    return {
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        isEmailVerified: user.isEmailVerified,
        role: user.role,
        lastLogin: user.lastLogin
      },
      tokens: {
        accessToken,
        refreshToken
      }
    };
  } catch (error) {
    logger.error('Login failed', { error: error.message, email });
    throw error;
  }
};

/**
 * Logout user
 * @param {string} userId - User ID
 * @param {string} refreshToken - Refresh token to invalidate
 * @returns {Promise<void>}
 */


const logout = async (userId, refreshToken) => {
  try {
    const user = await User.findById(userId);

    if (!user) {
      logger.warn('Logout attempt for non-existent user', { userId });
      throw new ApiError(404, 'User not found');
    }

    // Remove the refresh token
    user.refreshTokens = user.refreshTokens.filter(
      (token) => token.token !== refreshToken
    );
    await user.save();

    logger.info('User logged out successfully', { userId });
  } catch (error) {
    logger.error('Logout failed', { error: error.message, userId });
    throw error;
  }
};

/**
 * Refresh access token
 * @param {string} refreshToken - Refresh token
 * @returns {Promise<Object>} New access token
 */


const refreshAccessToken = async (refreshToken) => {
  try {
    // Verify refresh token
    const decoded = tokenService.verifyRefreshToken(refreshToken);

    // Find user and check if refresh token exists
    const user = await User.findById(decoded.userId);

    if (!user) {
      logger.warn('Refresh token attempt for non-existent user', { userId: decoded.userId });
      throw new ApiError(404, 'User not found');
    }

    // Check if refresh token is in user's tokens
    const tokenExists = user.refreshTokens.some((token) => token.token === refreshToken);

    if (!tokenExists) {
      logger.warn('Invalid refresh token used', { userId: user._id });
      throw new ApiError(401, 'Invalid refresh token');
    }

    // Generate new access token
    const accessToken = tokenService.generateAccessToken(user._id);

    logger.info('Access token refreshed', { userId: user._id });

    return {
      accessToken
    };
  } catch (error) {
    logger.error('Token refresh failed', { error: error.message });
    throw error;
  }
};

/**
 * Verify email with token
 * @param {string} token - Email verification token
 * @returns {Promise<Object>} Success message
 */


const verifyEmail = async (token) => {
  try {
    // Hash the token to compare with stored hash
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    // Find user with matching token and not expired
    const user = await User.findOne({
      emailVerificationToken: hashedToken,
      emailVerificationExpires: { $gt: Date.now() }
    });

    if (!user) {
      logger.warn('Invalid or expired verification token', { token: hashedToken });
      throw new ApiError(400, 'Invalid or expired verification token');
    }

    // Mark email as verified
    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save();

    logger.info('Email verified successfully', { userId: user._id, email: user.email });

    return {
      message: 'Email verified successfully'
    };
  } catch (error) {
    logger.error('Email verification failed', { error: error.message });
    throw error;
  }
};

/**
 * Resend email verification
 * @param {string} email - User's email
 * @returns {Promise<Object>} Success message
 */


const resendVerificationEmail = async (email) => {
  try {
    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      logger.warn('Resend verification attempt for non-existent email', { email });
      throw new ApiError(404, 'User not found');
    }

    if (user.isEmailVerified) {
      logger.warn('Resend verification attempt for already verified email', { userId: user._id, email });
      throw new ApiError(400, 'Email is already verified');
    }

    // Generate new verification token
    const verificationToken = user.generateEmailVerificationToken();
    await user.save();

    // Send verification email
    await emailService.sendVerificationEmail(user.email, verificationToken);

    logger.info('Verification email resent', { userId: user._id, email: user.email });

    return {
      message: 'Verification email sent successfully'
    };
  } catch (error) {
    logger.error('Resend verification email failed', { error: error.message, email });
    throw error;
  }
};

/**
 * Request password reset
 * @param {string} email - User's email
 * @returns {Promise<Object>} Success message
 */


const forgotPassword = async (email) => {
  try {
    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      // Don't reveal if user exists
      logger.warn('Password reset attempt for non-existent email', { email });
      return {
        message: 'If an account exists with this email, a password reset link has been sent'
      };
    }

    // Generate reset token
    const resetToken = user.generatePasswordResetToken();
    await user.save();

    // Send reset email
    try {
      await emailService.sendPasswordResetEmail(user.email, resetToken);
      logger.info('Password reset email sent', { userId: user._id, email: user.email });
    } catch (emailError) {
      logger.error('Failed to send password reset email', {
        userId: user._id,
        email: user.email,
        error: emailError.message
      });
      // Clear reset token if email fails
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      await user.save();
      throw new ApiError(500, 'Failed to send password reset email');
    }

    return {
      message: 'If an account exists with this email, a password reset link has been sent'
    };
  } catch (error) {
    logger.error('Forgot password failed', { error: error.message, email });
    throw error;
  }
};

/**
 * Reset password with token
 * @param {string} token - Password reset token
 * @param {string} newPassword - New password
 * @returns {Promise<Object>} Success message
 */


const resetPassword = async (token, newPassword) => {
  try {
    // Hash the token to compare with stored hash
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    // Find user with matching token and not expired
    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() }
    });

    if (!user) {
      logger.warn('Invalid or expired password reset token', { token: hashedToken });
      throw new ApiError(400, 'Invalid or expired password reset token');
    }

    // Update password
    user.password = newPassword;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    user.passwordChangedAt = new Date();

    // Invalidate all refresh tokens for security
    user.refreshTokens = [];

    await user.save();

    logger.info('Password reset successfully', { userId: user._id, email: user.email });

    return {
      message: 'Password reset successfully'
    };
  } catch (error) {
    logger.error('Password reset failed', { error: error.message });
    throw error;
  }
};

/**
 * Change password for authenticated user
 * @param {string} userId - User ID
 * @param {string} currentPassword - Current password
 * @param {string} newPassword - New password
 * @returns {Promise<Object>} Success message
 */


const changePassword = async (userId, currentPassword, newPassword) => {
  try {
    const user = await User.findById(userId).select('+password');

    if (!user) {
      logger.warn('Change password attempt for non-existent user', { userId });
      throw new ApiError(404, 'User not found');
    }

    // Verify current password
    const isPasswordValid = await user.comparePassword(currentPassword);
    if (!isPasswordValid) {
      logger.warn('Change password attempt with invalid current password', { userId });
      throw new ApiError(401, 'Current password is incorrect');
    }

    // Update password
    user.password = newPassword;
    user.passwordChangedAt = new Date();

    // Invalidate all refresh tokens except current session
    user.refreshTokens = [];

    await user.save();

    logger.info('Password changed successfully', { userId });

    return {
      message: 'Password changed successfully'
    };
  } catch (error) {
    logger.error('Change password failed', { error: error.message, userId });
    throw error;
  }
};

module.exports = {
  register,
  login,
  logout,
  refreshAccessToken,
  verifyEmail,
  resendVerificationEmail,
  forgotPassword,
  resetPassword,
  changePassword
};
