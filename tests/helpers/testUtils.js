// File: tests/helpers/testUtils.js
// Generated: 2025-10-08 13:05:29 UTC
// Project ID: proj_aa174cb58c23
// Task ID: task_3iscu9dr8ebg


const User = require('../../src/models/User');


const bcrypt = require('bcryptjs');


const jwt = require('jsonwebtoken');


const mongoose = require('mongoose');

/**
 * Create a test user in the database
 * @param {Object} userData - User data to create
 * @returns {Promise<Object>} Created user object
 */


const createTestUser = async (userData = {}) => {
  const defaultUserData = {
    name: 'Test User',
    email: `test${Date.now()}@example.com`,
    password: 'Test123!@#',
    isVerified: true
  };

  const mergedData = { ...defaultUserData, ...userData };

  try {
    const user = await User.create(mergedData);
    return user;
  } catch (error) {
    throw new Error(`Failed to create test user: ${error.message}`);
  }
};

/**
 * Create multiple test users
 * @param {number} count - Number of users to create
 * @param {Object} baseData - Base user data
 * @returns {Promise<Array>} Array of created users
 */


const createMultipleTestUsers = async (count = 3, baseData = {}) => {
  const users = [];

  for (let i = 0; i < count; i++) {
    const userData = {
      ...baseData,
      name: `Test User ${i + 1}`,
      email: `test${Date.now()}_${i}@example.com`
    };

    const user = await createTestUser(userData);
    users.push(user);
  }

  return users;
};

/**
 * Generate JWT access token for testing
 * @param {Object} user - User object
 * @returns {string} JWT access token
 */


const generateTestAccessToken = (user) => {
  const payload = {
    userId: user._id.toString(),
    email: user.email
  };

  const token = jwt.sign(
    payload,
    process.env.JWT_ACCESS_SECRET || 'test_access_secret',
    { expiresIn: process.env.JWT_ACCESS_EXPIRY || '15m' }
  );

  return token;
};

/**
 * Generate JWT refresh token for testing
 * @param {Object} user - User object
 * @returns {string} JWT refresh token
 */


const generateTestRefreshToken = (user) => {
  const payload = {
    userId: user._id.toString(),
    email: user.email
  };

  const token = jwt.sign(
    payload,
    process.env.JWT_REFRESH_SECRET || 'test_refresh_secret',
    { expiresIn: process.env.JWT_REFRESH_EXPIRY || '7d' }
  );

  return token;
};

/**
 * Generate both access and refresh tokens
 * @param {Object} user - User object
 * @returns {Object} Object containing accessToken and refreshToken
 */


const generateTestTokens = (user) => {
  return {
    accessToken: generateTestAccessToken(user),
    refreshToken: generateTestRefreshToken(user)
  };
};

/**
 * Generate verification token for testing
 * @param {Object} user - User object
 * @returns {string} Verification token
 */


const generateTestVerificationToken = (user) => {
  const payload = {
    userId: user._id.toString(),
    email: user.email,
    type: 'verification'
  };

  const token = jwt.sign(
    payload,
    process.env.JWT_ACCESS_SECRET || 'test_access_secret',
    { expiresIn: '24h' }
  );

  return token;
};

/**
 * Generate password reset token for testing
 * @param {Object} user - User object
 * @returns {string} Password reset token
 */


const generateTestResetToken = (user) => {
  const payload = {
    userId: user._id.toString(),
    email: user.email,
    type: 'reset'
  };

  const token = jwt.sign(
    payload,
    process.env.JWT_ACCESS_SECRET || 'test_access_secret',
    { expiresIn: '1h' }
  );

  return token;
};

/**
 * Hash password for testing
 * @param {string} password - Plain text password
 * @returns {Promise<string>} Hashed password
 */


const hashTestPassword = async (password) => {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(password, salt);
};

/**
 * Compare password with hash
 * @param {string} password - Plain text password
 * @param {string} hash - Hashed password
 * @returns {Promise<boolean>} True if passwords match
 */


const compareTestPassword = async (password, hash) => {
  return await bcrypt.compare(password, hash);
};

/**
 * Clean up test users from database
 * @param {Array<string>} emails - Array of user emails to delete
 * @returns {Promise<void>}
 */


const cleanupTestUsers = async (emails = []) => {
  if (emails.length === 0) {
    return;
  }

  try {
    await User.deleteMany({ email: { $in: emails } });
  } catch (error) {
    throw new Error(`Failed to cleanup test users: ${error.message}`);
  }
};

/**
 * Clean up all test users (emails starting with 'test')
 * @returns {Promise<void>}
 */


const cleanupAllTestUsers = async () => {
  try {
    await User.deleteMany({ email: /^test.*@example\.com$/ });
  } catch (error) {
    throw new Error(`Failed to cleanup all test users: ${error.message}`);
  }
};

/**
 * Create authenticated request headers
 * @param {string} token - JWT token
 * @returns {Object} Headers object with Authorization
 */


const createAuthHeaders = (token) => {
  return {
    Authorization: `Bearer ${token}`
  };
};

/**
 * Wait for specified milliseconds
 * @param {number} ms - Milliseconds to wait
 * @returns {Promise<void>}
 */


const wait = (ms) => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

/**
 * Generate random email for testing
 * @param {string} prefix - Email prefix
 * @returns {string} Random email address
 */


const generateRandomEmail = (prefix = 'test') => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(7);
  return `${prefix}_${timestamp}_${random}@example.com`;
};

/**
 * Generate random string
 * @param {number} length - Length of string
 * @returns {string} Random string
 */


const generateRandomString = (length = 10) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

/**
 * Create test user with tokens
 * @param {Object} userData - User data
 * @returns {Promise<Object>} Object containing user and tokens
 */


const createTestUserWithTokens = async (userData = {}) => {
  const user = await createTestUser(userData);
  const tokens = generateTestTokens(user);

  return {
    user,
    ...tokens
  };
};

/**
 * Verify JWT token
 * @param {string} token - JWT token to verify
 * @param {string} secret - Secret key
 * @returns {Object} Decoded token payload
 */


const verifyTestToken = (token, secret = null) => {
  const secretKey = secret || process.env.JWT_ACCESS_SECRET || 'test_access_secret';

  try {
    return jwt.verify(token, secretKey);
  } catch (error) {
    throw new Error(`Token verification failed: ${error.message}`);
  }
};

/**
 * Create expired token for testing
 * @param {Object} user - User object
 * @returns {string} Expired JWT token
 */


const generateExpiredToken = (user) => {
  const payload = {
    userId: user._id.toString(),
    email: user.email
  };

  const token = jwt.sign(
    payload,
    process.env.JWT_ACCESS_SECRET || 'test_access_secret',
    { expiresIn: '0s' }
  );

  return token;
};

/**
 * Create invalid token for testing
 * @returns {string} Invalid JWT token
 */


const generateInvalidToken = () => {
  return 'invalid.jwt.token';
};

module.exports = {
  createTestUser,
  createMultipleTestUsers,
  generateTestAccessToken,
  generateTestRefreshToken,
  generateTestTokens,
  generateTestVerificationToken,
  generateTestResetToken,
  hashTestPassword,
  compareTestPassword,
  cleanupTestUsers,
  cleanupAllTestUsers,
  createAuthHeaders,
  wait,
  generateRandomEmail,
  generateRandomString,
  createTestUserWithTokens,
  verifyTestToken,
  generateExpiredToken,
  generateInvalidToken
};
