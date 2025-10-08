// File: src/models/RefreshToken.js
// Generated: 2025-10-08 13:05:12 UTC
// Project ID: proj_aa174cb58c23
// Task ID: task_zlrmp6waiq9b


const mongoose = require('mongoose');


const refreshTokenSchema = new mongoose.Schema(
  {
    token: {
      type: String,
      required: [true, 'Refresh token is required'],
      unique: true,
      index: true
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true
    },
    expiresAt: {
      type: Date,
      required: [true, 'Expiration date is required'],
      index: true
    },
    isRevoked: {
      type: Boolean,
      default: false,
      index: true
    },
    deviceInfo: {
      userAgent: {
        type: String,
        default: ''
      },
      ip: {
        type: String,
        default: ''
      }
    },
    lastUsedAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

// Index for efficient cleanup of expired tokens
refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Index for finding user's active tokens
refreshTokenSchema.index({ userId: 1, isRevoked: 1, expiresAt: 1 });

// Instance method to check if token is valid
refreshTokenSchema.methods.isValid = function() {
  return !this.isRevoked && this.expiresAt > new Date();
};

// Instance method to revoke token
refreshTokenSchema.methods.revoke = async function() {
  this.isRevoked = true;
  return await this.save();
};

// Static method to revoke all tokens for a user
refreshTokenSchema.statics.revokeAllForUser = async function(userId) {
  return await this.updateMany(
    { userId, isRevoked: false },
    { isRevoked: true }
  );
};

// Static method to cleanup expired tokens
refreshTokenSchema.statics.cleanupExpired = async function() {
  const now = new Date();
  return await this.deleteMany({
    $or: [
      { expiresAt: { $lt: now } },
      { isRevoked: true }
    ]
  });
};

// Static method to find valid token
refreshTokenSchema.statics.findValidToken = async function(token) {
  const now = new Date();
  return await this.findOne({
    token,
    isRevoked: false,
    expiresAt: { $gt: now }
  }).populate('userId', '-password');
};

// Pre-save middleware to update lastUsedAt
refreshTokenSchema.pre('save', function(next) {
  if (this.isModified('token')) {
    this.lastUsedAt = new Date();
  }
  next();
});


const RefreshToken = mongoose.model('RefreshToken', refreshTokenSchema);

module.exports = RefreshToken;
