// File: src/controllers/verification.controller.js
// Generated: 2025-10-08 13:05:29 UTC
// Project ID: proj_aa174cb58c23
// Task ID: task_b4qlnyovoit2


const User = require('../models/User');


const asyncHandler = require('../utils/asyncHandler');


const crypto = require('crypto');


const logger = require('../utils/logger');

const { sendVerificationEmail } = require('../utils/email');

/**
 * Verify email with token
 * @route POST /api/auth/verify-email/:token
 * @access Public
 */
exports.verifyEmail = asyncHandler(async (req, res, next) => {
  const { token } = req.params;

  if (!token) {
    logger.warn('Email verification attempted without token');
    return res.status(400).json({
      success: false,
      error: 'Verification token is required'
    });
  }

  // Hash token to compare with stored hash
  const hashedToken = crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');

  // Find user with matching token and check expiry
  const user = await User.findOne({
    verificationToken: hashedToken,
    verificationTokenExpiry: { $gt: Date.now() }
  });

  if (!user) {
    logger.warn('Invalid or expired verification token', { token: hashedToken.substring(0, 10) });
    return res.status(400).json({
      success: false,
      error: 'Invalid or expired verification token'
    });
  }

  // Update user verification status
  user.isVerified = true;
  user.verificationToken = undefined;
  user.verificationTokenExpiry = undefined;
  await user.save();

  logger.info('Email verified successfully', {
    userId: user._id,
    email: user.email
  });

  res.json({
    success: true,
    message: 'Email verified successfully. You can now log in.',
    data: {
      email: user.email,
      isVerified: user.isVerified
    }
  });
});

/**
 * Resend verification email
 * @route POST /api/auth/resend-verification
 * @access Public
 */
exports.resendVerification = asyncHandler(async (req, res, next) => {
  const { email } = req.body;

  if (!email) {
    logger.warn('Resend verification attempted without email');
    return res.status(400).json({
      success: false,
      error: 'Email is required'
    });
  }

  // Find user by email
  const user = await User.findOne({ email: email.toLowerCase() });

  if (!user) {
    logger.warn('Resend verification attempted for non-existent user', { email });
    // Don't reveal if user exists or not for security
    return res.json({
      success: true,
      message: 'If an account with that email exists and is not verified, a verification email has been sent.'
    });
  }

  // Check if already verified
  if (user.isVerified) {
    logger.info('Resend verification attempted for already verified user', {
      userId: user._id,
      email
    });
    return res.status(400).json({
      success: false,
      error: 'Email is already verified'
    });
  }

  // Check rate limiting - prevent sending too many emails
  const lastSent = user.verificationTokenExpiry
    ? new Date(user.verificationTokenExpiry).getTime() - (24 * 60 * 60 * 1000)
    : 0;
  const timeSinceLastSent = Date.now() - lastSent;
  const minWaitTime = 2 * 60 * 1000; // 2 minutes

  if (timeSinceLastSent < minWaitTime) {
    const waitSeconds = Math.ceil((minWaitTime - timeSinceLastSent) / 1000);
    logger.warn('Resend verification rate limited', {
      userId: user._id,
      email,
      waitSeconds
    });
    return res.status(429).json({
      success: false,
      error: `Please wait ${waitSeconds} seconds before requesting another verification email`
    });
  }

  // Generate new verification token
  const verificationToken = crypto.randomBytes(32).toString('hex');
  const hashedToken = crypto
    .createHash('sha256')
    .update(verificationToken)
    .digest('hex');

  // Update user with new token
  user.verificationToken = hashedToken;
  user.verificationTokenExpiry = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
  await user.save();

  // Send verification email
  try {
    await sendVerificationEmail(user.email, verificationToken);

    logger.info('Verification email resent successfully', {
      userId: user._id,
      email: user.email
    });

    res.json({
      success: true,
      message: 'Verification email sent successfully. Please check your inbox.'
    });
  } catch (emailError) {
    // Rollback token if email fails
    user.verificationToken = undefined;
    user.verificationTokenExpiry = undefined;
    await user.save();

    logger.error('Failed to send verification email', {
      userId: user._id,
      email: user.email,
      error: emailError.message
    });

    return res.status(500).json({
      success: false,
      error: 'Failed to send verification email. Please try again later.'
    });
  }
});

/**
 * Check verification status
 * @route GET /api/auth/verification-status/:email
 * @access Public
 */
exports.checkVerificationStatus = asyncHandler(async (req, res, next) => {
  const { email } = req.params;

  if (!email) {
    logger.warn('Verification status check attempted without email');
    return res.status(400).json({
      success: false,
      error: 'Email is required'
    });
  }

  const user = await User.findOne({ email: email.toLowerCase() }).select('email isVerified');

  if (!user) {
    logger.warn('Verification status check for non-existent user', { email });
    return res.status(404).json({
      success: false,
      error: 'User not found'
    });
  }

  logger.info('Verification status checked', {
    userId: user._id,
    email: user.email,
    isVerified: user.isVerified
  });

  res.json({
    success: true,
    data: {
      email: user.email,
      isVerified: user.isVerified
    }
  });
});
