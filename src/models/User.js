// File: src/models/User.js
// Generated: 2025-10-08 13:05:27 UTC
// Project ID: proj_aa174cb58c23
// Task ID: task_viyvpkharsp3

  const crypto = require('crypto');


const bcrypt = require('bcryptjs');


const mongoose = require('mongoose');


const validator = require('validator');

/**
 * User Schema
 * Handles user authentication, profile management, and security features
 */


const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters long'],
      maxlength: [50, 'Name cannot exceed 50 characters']
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      validate: {
        validator: validator.isEmail,
        message: 'Please provide a valid email address'
      }
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters long'],
      select: false
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user'
    },
    isEmailVerified: {
      type: Boolean,
      default: false
    },
    emailVerificationToken: {
      type: String,
      select: false
    },
    emailVerificationExpires: {
      type: Date,
      select: false
    },
    passwordResetToken: {
      type: String,
      select: false
    },
    passwordResetExpires: {
      type: Date,
      select: false
    },
    passwordChangedAt: {
      type: Date,
      select: false
    },
    refreshTokens: {
      type: [String],
      default: [],
      select: false
    },
    loginAttempts: {
      type: Number,
      default: 0,
      select: false
    },
    lockUntil: {
      type: Date,
      select: false
    },
    lastLogin: {
      type: Date
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

/**
 * Indexes for performance optimization
 */
userSchema.index({ email: 1 });
userSchema.index({ emailVerificationToken: 1 });
userSchema.index({ passwordResetToken: 1 });
userSchema.index({ isActive: 1 });
userSchema.index({ createdAt: -1 });

/**
 * Virtual for account lock status
 */
userSchema.virtual('isLocked').get(function () {
  return !!(this.lockUntil && this.lockUntil > Date.now());
});

/**
 * Pre-save middleware to hash password
 */
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);

    if (!this.isNew) {
      this.passwordChangedAt = Date.now() - 1000;
    }

    next();
  } catch (error) {
    next(error);
  }
});

/**
 * Instance method to compare passwords
 * @param {string} candidatePassword - Password to compare
 * @returns {Promise<boolean>} - True if passwords match
 */
userSchema.methods.comparePassword = async function (candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw new Error('Password comparison failed');
  }
};

/**
 * Instance method to check if password was changed after JWT was issued
 * @param {number} jwtTimestamp - JWT issued at timestamp
 * @returns {boolean} - True if password was changed after JWT issued
 */
userSchema.methods.changedPasswordAfter = function (jwtTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10);
    return jwtTimestamp < changedTimestamp;
  }
  return false;
};

/**
 * Instance method to increment login attempts
 * @returns {Promise<void>}
 */
userSchema.methods.incLoginAttempts = async function () {
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.updateOne({
      $set: { loginAttempts: 1 },
      $unset: { lockUntil: 1 }
    });
  }

  const updates = { $inc: { loginAttempts: 1 } };
  const maxAttempts = 5;
  const lockTime = 2 * 60 * 60 * 1000;

  if (this.loginAttempts + 1 >= maxAttempts && !this.isLocked) {
    updates.$set = { lockUntil: Date.now() + lockTime };
  }

  return this.updateOne(updates);
};

/**
 * Instance method to reset login attempts
 * @returns {Promise<void>}
 */
userSchema.methods.resetLoginAttempts = async function () {
  return this.updateOne({
    $set: { loginAttempts: 0, lastLogin: Date.now() },
    $unset: { lockUntil: 1 }
  });
};

/**
 * Instance method to add refresh token
 * @param {string} token - Refresh token to add
 * @returns {Promise<void>}
 */
userSchema.methods.addRefreshToken = async function (token) {
  const maxTokens = 5;

  if (this.refreshTokens.length >= maxTokens) {
    this.refreshTokens.shift();
  }

  this.refreshTokens.push(token);
  await this.save();
};

/**
 * Instance method to remove refresh token
 * @param {string} token - Refresh token to remove
 * @returns {Promise<void>}
 */
userSchema.methods.removeRefreshToken = async function (token) {
  this.refreshTokens = this.refreshTokens.filter(t => t !== token);
  await this.save();
};

/**
 * Instance method to clear all refresh tokens
 * @returns {Promise<void>}
 */
userSchema.methods.clearRefreshTokens = async function () {
  this.refreshTokens = [];
  await this.save();
};

/**
 * Instance method to generate email verification token
 * @returns {string} - Verification token
 */
userSchema.methods.generateEmailVerificationToken = function () {
  const token = crypto.randomBytes(32).toString('hex');

  this.emailVerificationToken = crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');

  this.emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000;

  return token;
};

/**
 * Instance method to generate password reset token
 * @returns {string} - Reset token
 */
userSchema.methods.generatePasswordResetToken = function () {
  const token = crypto.randomBytes(32).toString('hex');

  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');

  this.passwordResetExpires = Date.now() + 60 * 60 * 1000;

  return token;
};

/**
 * Static method to find user by email verification token
 * @param {string} token - Verification token
 * @returns {Promise<User|null>} - User document or null
 */
userSchema.statics.findByEmailVerificationToken = function (token) {
  const hashedToken = crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');

  return this.findOne({
    emailVerificationToken: hashedToken,
    emailVerificationExpires: { $gt: Date.now() }
  });
};

/**
 * Static method to find user by password reset token
 * @param {string} token - Reset token
 * @returns {Promise<User|null>} - User document or null
 */
userSchema.statics.findByPasswordResetToken = function (token) {
  const hashedToken = crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');

  return this.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() }
  });
};

/**
 * Instance method to verify email
 * @returns {Promise<void>}
 */
userSchema.methods.verifyEmail = async function () {
  this.isEmailVerified = true;
  this.emailVerificationToken = undefined;
  this.emailVerificationExpires = undefined;
  await this.save();
};

/**
 * Instance method to reset password
 * @param {string} newPassword - New password
 * @returns {Promise<void>}
 */
userSchema.methods.resetPassword = async function (newPassword) {
  this.password = newPassword;
  this.passwordResetToken = undefined;
  this.passwordResetExpires = undefined;
  this.passwordChangedAt = Date.now() - 1000;
  await this.save();
};

/**
 * Query middleware to exclude inactive users by default
 */
userSchema.pre(/^find/, function (next) {
  if (!this.getOptions().includeInactive) {
    this.find({ isActive: { $ne: false } });
  }
  next();
});


const User = mongoose.model('User', userSchema);

module.exports = User;
