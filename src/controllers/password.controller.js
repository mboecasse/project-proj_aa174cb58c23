// File: src/controllers/password.controller.js
// Generated: 2025-10-08 13:05:26 UTC
// Project ID: proj_aa174cb58c23
// Task ID: task_m0xkm32477o2


const User = require('../models/User');


const asyncHandler = require('../utils/asyncHandler');


const crypto = require('crypto');


const logger = require('../utils/logger');


const nodemailer = require('nodemailer');

/**
 * Request password reset
 * Generates reset token and sends email
 * POST /api/password/reset-request
 */
exports.requestPasswordReset = asyncHandler(async (req, res, next) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({
      success: false,
      error: 'Email is required'
    });
  }

  const user = await User.findOne({ email });

  if (!user) {
    logger.warn('Password reset requested for non-existent email', { email });
    return res.status(200).json({
      success: true,
      message: 'If an account exists with this email, a password reset link has been sent'
    });
  }

  const resetToken = crypto.randomBytes(32).toString('hex');
  const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');

  user.resetPasswordToken = resetTokenHash;
  user.resetPasswordExpire = Date.now() + 3600000;
  await user.save();

  const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password/${resetToken}`;

  try {
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'smtp.mailtrap.io',
      port: process.env.EMAIL_PORT || 2525,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      }
    });

    const mailOptions = {
      from: process.env.EMAIL_FROM || 'noreply@example.com',
      to: user.email,
      subject: 'Password Reset Request',
      html: `
        <h1>Password Reset Request</h1>
        <p>You requested a password reset. Click the link below to reset your password:</p>
        <a href="${resetUrl}">${resetUrl}</a>
        <p>This link will expire in 1 hour.</p>
        <p>If you did not request this, please ignore this email.</p>
      `
    };

    await transporter.sendMail(mailOptions);

    logger.info('Password reset email sent', { userId: user._id, email: user.email });

    res.status(200).json({
      success: true,
      message: 'If an account exists with this email, a password reset link has been sent'
    });
  } catch (error) {
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    logger.error('Failed to send password reset email', {
      userId: user._id,
      email: user.email,
      error: error.message
    });

    return res.status(500).json({
      success: false,
      error: 'Failed to send password reset email'
    });
  }
});

/**
 * Reset password with token
 * POST /api/password/reset-confirm
 */
exports.resetPassword = asyncHandler(async (req, res, next) => {
  const { token, password } = req.body;

  if (!token || !password) {
    return res.status(400).json({
      success: false,
      error: 'Token and password are required'
    });
  }

  if (password.length < 8) {
    return res.status(400).json({
      success: false,
      error: 'Password must be at least 8 characters long'
    });
  }

  const resetTokenHash = crypto.createHash('sha256').update(token).digest('hex');

  const user = await User.findOne({
    resetPasswordToken: resetTokenHash,
    resetPasswordExpire: { $gt: Date.now() }
  });

  if (!user) {
    logger.warn('Invalid or expired password reset token', { token: resetTokenHash.substring(0, 10) });
    return res.status(400).json({
      success: false,
      error: 'Invalid or expired reset token'
    });
  }

  user.password = password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  await user.save();

  logger.info('Password reset successful', { userId: user._id, email: user.email });

  res.status(200).json({
    success: true,
    message: 'Password has been reset successfully'
  });
});

/**
 * Change password (authenticated user)
 * POST /api/password/change
 */
exports.changePassword = asyncHandler(async (req, res, next) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({
      success: false,
      error: 'Current password and new password are required'
    });
  }

  if (newPassword.length < 8) {
    return res.status(400).json({
      success: false,
      error: 'New password must be at least 8 characters long'
    });
  }

  const user = await User.findById(req.userId).select('+password');

  if (!user) {
    return res.status(404).json({
      success: false,
      error: 'User not found'
    });
  }

  const isMatch = await user.comparePassword(currentPassword);

  if (!isMatch) {
    logger.warn('Failed password change attempt - incorrect current password', { userId: user._id });
    return res.status(401).json({
      success: false,
      error: 'Current password is incorrect'
    });
  }

  user.password = newPassword;
  await user.save();

  logger.info('Password changed successfully', { userId: user._id, email: user.email });

  res.status(200).json({
    success: true,
    message: 'Password has been changed successfully'
  });
});
