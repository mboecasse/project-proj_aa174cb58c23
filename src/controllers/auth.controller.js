// File: src/controllers/auth.controller.js
// Generated: 2025-10-08 13:05:46 UTC
// Project ID: proj_aa174cb58c23
// Task ID: task_k7nf9oyl1q1r


const ApiError = require('../utils/ApiError');


const User = require('../models/User');


const asyncHandler = require('../utils/asyncHandler');


const bcrypt = require('bcryptjs');


const crypto = require('crypto');


const jwt = require('jsonwebtoken');


const logger = require('../utils/logger');

/**
 * Generate JWT tokens
 * @param {string} userId - User ID
 * @returns {Object} Access and refresh tokens
 */


const generateTokens = (userId) => {
  const accessToken = jwt.sign(
    { userId },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: process.env.JWT_ACCESS_EXPIRY || '15m' }
  );

  const refreshToken = jwt.sign(
    { userId },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRY || '7d' }
  );

  return { accessToken, refreshToken };
};

/**
 * Register new user
 * @route POST /api/auth/register
 * @access Public
 */
exports.register = asyncHandler(async (req, res, next) => {
  const { name, email, password } = req.body;

  // Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    logger.warn('Registration attempt with existing email', { email });
    throw new ApiError('User with this email already exists', 400);
  }

  // Hash password
  const salt = await bcrypt.genSalt(12);
  const hashedPassword = await bcrypt.hash(password, salt);

  // Generate email verification token
  const verificationToken = crypto.randomBytes(32).toString('hex');
  const verificationTokenHash = crypto
    .createHash('sha256')
    .update(verificationToken)
    .digest('hex');

  // Create user
  const user = await User.create({
    name,
    email,
    password: hashedPassword,
    emailVerificationToken: verificationTokenHash,
    emailVerificationExpires: Date.now() + 24 * 60 * 60 * 1000 // 24 hours
  });

  logger.info('User registered successfully', {
    userId: user._id,
    email: user.email
  });

  // Generate tokens
  const { accessToken, refreshToken } = generateTokens(user._id);

  // Save refresh token to user
  user.refreshToken = refreshToken;
  await user.save();

  // Set refresh token as httpOnly cookie
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  });

  res.status(201).json({
    success: true,
    message: 'User registered successfully. Please verify your email.',
    data: {
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        isEmailVerified: user.isEmailVerified
      },
      accessToken,
      verificationToken // In production, send this via email instead
    }
  });
});

/**
 * Login user
 * @route POST /api/auth/login
 * @access Public
 */
exports.login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  // Find user by email
  const user = await User.findOne({ email }).select('+password');
  if (!user) {
    logger.warn('Login attempt with non-existent email', { email });
    throw new ApiError('Invalid email or password', 401);
  }

  // Check if account is locked
  if (user.accountLocked && user.lockUntil > Date.now()) {
    const lockTimeRemaining = Math.ceil((user.lockUntil - Date.now()) / 1000 / 60);
    logger.warn('Login attempt on locked account', {
      userId: user._id,
      email,
      lockTimeRemaining
    });
    throw new ApiError(
      `Account is locked. Please try again in ${lockTimeRemaining} minutes.`,
      423
    );
  }

  // Reset lock if lock period has expired
  if (user.accountLocked && user.lockUntil <= Date.now()) {
    user.accountLocked = false;
    user.lockUntil = undefined;
    user.loginAttempts = 0;
  }

  // Verify password
  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    // Increment login attempts
    user.loginAttempts += 1;

    // Lock account after 5 failed attempts
    if (user.loginAttempts >= 5) {
      user.accountLocked = true;
      user.lockUntil = Date.now() + 30 * 60 * 1000; // Lock for 30 minutes
      await user.save();

      logger.warn('Account locked due to multiple failed login attempts', {
        userId: user._id,
        email
      });
      throw new ApiError('Account locked due to multiple failed login attempts. Please try again in 30 minutes.', 423);
    }

    await user.save();

    logger.warn('Failed login attempt', {
      email,
      attempts: user.loginAttempts
    });
    throw new ApiError('Invalid email or password', 401);
  }

  // Reset login attempts on successful login
  user.loginAttempts = 0;
  user.accountLocked = false;
  user.lockUntil = undefined;
  user.lastLogin = Date.now();

  // Generate tokens
  const { accessToken, refreshToken } = generateTokens(user._id);

  // Save refresh token to user
  user.refreshToken = refreshToken;
  await user.save();

  logger.info('User logged in successfully', {
    userId: user._id,
    email: user.email
  });

  // Set refresh token as httpOnly cookie
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  });

  res.json({
    success: true,
    message: 'Login successful',
    data: {
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        isEmailVerified: user.isEmailVerified
      },
      accessToken
    }
  });
});

/**
 * Logout user
 * @route POST /api/auth/logout
 * @access Private
 */
exports.logout = asyncHandler(async (req, res, next) => {
  const userId = req.userId;

  // Clear refresh token from database
  const user = await User.findById(userId);
  if (user) {
    user.refreshToken = undefined;
    await user.save();
  }

  // Clear refresh token cookie
  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  });

  logger.info('User logged out successfully', { userId });

  res.json({
    success: true,
    message: 'Logout successful'
  });
});

/**
 * Refresh access token
 * @route POST /api/auth/refresh
 * @access Public
 */
exports.refreshToken = asyncHandler(async (req, res, next) => {
  const { refreshToken } = req.cookies;

  if (!refreshToken) {
    throw new ApiError('Refresh token not provided', 401);
  }

  // Verify refresh token
  let decoded;
  try {
    decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
  } catch (error) {
    logger.warn('Invalid refresh token', { error: error.message });
    throw new ApiError('Invalid or expired refresh token', 401);
  }

  // Find user and verify refresh token matches
  const user = await User.findById(decoded.userId);
  if (!user || user.refreshToken !== refreshToken) {
    logger.warn('Refresh token mismatch or user not found', {
      userId: decoded.userId
    });
    throw new ApiError('Invalid refresh token', 401);
  }

  // Generate new tokens
  const tokens = generateTokens(user._id);

  // Update refresh token in database
  user.refreshToken = tokens.refreshToken;
  await user.save();

  logger.info('Access token refreshed', { userId: user._id });

  // Set new refresh token cookie
  res.cookie('refreshToken', tokens.refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  });

  res.json({
    success: true,
    message: 'Token refreshed successfully',
    data: {
      accessToken: tokens.accessToken
    }
  });
});

/**
 * Verify email
 * @route GET /api/auth/verify-email/:token
 * @access Public
 */
exports.verifyEmail = asyncHandler(async (req, res, next) => {
  const { token } = req.params;

  // Hash token to compare with stored hash
  const hashedToken = crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');

  // Find user with matching token and non-expired token
  const user = await User.findOne({
    emailVerificationToken: hashedToken,
    emailVerificationExpires: { $gt: Date.now() }
  });

  if (!user) {
    logger.warn('Invalid or expired email verification token', { token });
    throw new ApiError('Invalid or expired verification token', 400);
  }

  // Mark email as verified
  user.isEmailVerified = true;
  user.emailVerificationToken = undefined;
  user.emailVerificationExpires = undefined;
  await user.save();

  logger.info('Email verified successfully', {
    userId: user._id,
    email: user.email
  });

  res.json({
    success: true,
    message: 'Email verified successfully'
  });
});

/**
 * Request password reset
 * @route POST /api/auth/forgot-password
 * @access Public
 */
exports.forgotPassword = asyncHandler(async (req, res, next) => {
  const { email } = req.body;

  const user = await User.findOne({ email });
  if (!user) {
    // Don't reveal if user exists
    logger.warn('Password reset requested for non-existent email', { email });
    return res.json({
      success: true,
      message: 'If the email exists, a password reset link has been sent.'
    });
  }

  // Generate reset token
  const resetToken = crypto.randomBytes(32).toString('hex');
  const resetTokenHash = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  user.passwordResetToken = resetTokenHash;
  user.passwordResetExpires = Date.now() + 60 * 60 * 1000; // 1 hour
  await user.save();

  logger.info('Password reset token generated', {
    userId: user._id,
    email: user.email
  });

  res.json({
    success: true,
    message: 'If the email exists, a password reset link has been sent.',
    data: {
      resetToken // In production, send this via email instead
    }
  });
});

/**
 * Reset password
 * @route POST /api/auth/reset-password/:token
 * @access Public
 */
exports.resetPassword = asyncHandler(async (req, res, next) => {
  const { token } = req.params;
  const { password } = req.body;

  // Hash token to compare with stored hash
  const hashedToken = crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');

  // Find user with matching token and non-expired token
  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() }
  });

  if (!user) {
    logger.warn('Invalid or expired password reset token', { token });
    throw new ApiError('Invalid or expired reset token', 400);
  }

  // Hash new password
  const salt = await bcrypt.genSalt(12);
  const hashedPassword = await bcrypt.hash(password, salt);

  // Update password and clear reset token
  user.password = hashedPassword;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  user.passwordChangedAt = Date.now();
  await user.save();

  logger.info('Password reset successfully', {
    userId: user._id,
    email: user.email
  });

  res.json({
    success: true,
    message: 'Password reset successfully'
  });
});

/**
 * Get current user profile
 * @route GET /api/auth/me
 * @access Private
 */
exports.getMe = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.userId).select('-password -refreshToken');

  if (!user) {
    throw new ApiError('User not found', 404);
  }

  logger.info('User profile retrieved', { userId: user._id });

  res.json({
    success: true,
    data: { user }
  });
});

/**
 * Update password
 * @route PUT /api/auth/update-password
 * @access Private
 */
exports.updatePassword = asyncHandler(async (req, res, next) => {
  const { currentPassword, newPassword } = req.body;
  const userId = req.userId;

  const user = await User.findById(userId).select('+password');
  if (!user) {
    throw new ApiError('User not found', 404);
  }

  // Verify current password
  const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
  if (!isPasswordValid) {
    logger.warn('Failed password update attempt - invalid current password', {
      userId
    });
    throw new ApiError('Current password is incorrect', 401);
  }

  // Hash new password
  const salt = await bcrypt.genSalt(12);
  const hashedPassword = await bcrypt.hash(newPassword, salt);

  // Update password
  user.password = hashedPassword;
  user.passwordChangedAt = Date.now();
  await user.save();

  logger.info('Password updated successfully', { userId });

  res.json({
    success: true,
    message: 'Password updated successfully'
  });
});
