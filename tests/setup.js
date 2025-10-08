// File: tests/setup.js
// Generated: 2025-10-08 13:05:16 UTC
// Project ID: proj_aa174cb58c23
// Task ID: task_tbg9a4mw28xu

  const User = require('../src/models/User');
  const bcrypt = require('bcryptjs');
  const jwt = require('jsonwebtoken');


const mongoose = require('mongoose');


const redis = require('redis-mock');

const { MongoMemoryServer } = require('mongodb-memory-server');


let mongoServer;

/**
 * Setup test environment before all tests
 */
beforeAll(async () => {
  try {
    // Create in-memory MongoDB instance
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();

    // Connect to in-memory database
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    // Mock Redis client
    jest.mock('redis', () => redis);

    // Suppress console logs during tests
    global.console = {
      ...console,
      log: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      info: jest.fn(),
      debug: jest.fn()
    };
  } catch (error) {
    console.error('Error setting up test environment:', error);
    throw error;
  }
});

/**
 * Clear all test data after each test
 */
afterEach(async () => {
  try {
    const collections = mongoose.connection.collections;

    for (const key in collections) {
      const collection = collections[key];
      await collection.deleteMany({});
    }
  } catch (error) {
    console.error('Error clearing test data:', error);
    throw error;
  }
});

/**
 * Cleanup test environment after all tests
 */
afterAll(async () => {
  try {
    // Close mongoose connection
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();

    // Stop in-memory MongoDB server
    if (mongoServer) {
      await mongoServer.stop();
    }

    // Clear all mocks
    jest.clearAllMocks();
  } catch (error) {
    console.error('Error cleaning up test environment:', error);
    throw error;
  }
});

/**
 * Set test timeout
 */
jest.setTimeout(30000);

/**
 * Mock environment variables for tests
 */
process.env.NODE_ENV = 'test';
process.env.JWT_ACCESS_SECRET = 'test-jwt-access-secret-key-for-testing-purposes-only';
process.env.JWT_ACCESS_EXPIRY = '15m';
process.env.JWT_REFRESH_SECRET = 'test-jwt-refresh-secret-key-for-testing-purposes-only';
process.env.JWT_REFRESH_EXPIRY = '7d';
process.env.EMAIL_VERIFICATION_SECRET = 'test-email-verification-secret-key';
process.env.PASSWORD_RESET_SECRET = 'test-password-reset-secret-key';
process.env.SMTP_HOST = 'smtp.test.com';
process.env.SMTP_PORT = '587';
process.env.SMTP_USER = 'test@test.com';
process.env.SMTP_PASS = 'test-password';
process.env.EMAIL_FROM = 'noreply@test.com';
process.env.CLIENT_URL = 'http://localhost:3000';

/**
 * Helper function to create test user
 */
global.createTestUser = async (userData = {}) => {

  const defaultUser = {
    name: 'Test User',
    email: 'test@example.com',
    password: await bcrypt.hash('Test123!@#', 12),
    isVerified: true,
    role: 'user'
  };

  const user = await User.create({ ...defaultUser, ...userData });
  return user;
};

/**
 * Helper function to generate test JWT token
 */
global.generateTestToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: process.env.JWT_ACCESS_EXPIRY }
  );
};

/**
 * Helper function to create authenticated request
 */
global.authenticatedRequest = async (request, userData = {}) => {
  const user = await global.createTestUser(userData);
  const token = global.generateTestToken(user._id);
  return {
    request: request.set('Authorization', `Bearer ${token}`),
    user,
    token
  };
};

module.exports = {
  mongoServer
};
