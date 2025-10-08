// File: tests/helpers/mockData.js
// Generated: 2025-10-08 13:05:31 UTC
// Project ID: proj_aa174cb58c23
// Task ID: task_3tuvrd8xxdud


const bcrypt = require('bcryptjs');


const jwt = require('jsonwebtoken');


const mongoose = require('mongoose');

/**
 * Generate mock user data
 * @param {Object} overrides - Properties to override defaults
 * @returns {Object} Mock user object
 */


const generateMockUser = (overrides = {}) => {
  const defaultUser = {
    _id: new mongoose.Types.ObjectId(),
    name: 'Test User',
    email: 'test@example.com',
    password: 'hashedPassword123',
    isVerified: false,
    verificationToken: null,
    verificationTokenExpiry: null,
    resetPasswordToken: null,
    resetPasswordExpiry: null,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  return { ...defaultUser, ...overrides };
};

/**
 * Generate multiple mock users
 * @param {number} count - Number of users to generate
 * @returns {Array} Array of mock user objects
 */


const generateMockUsers = (count = 5) => {
  const users = [];
  for (let i = 0; i < count; i++) {
    users.push(generateMockUser({
      _id: new mongoose.Types.ObjectId(),
      name: `Test User ${i + 1}`,
      email: `test${i + 1}@example.com`,
      isVerified: i % 2 === 0
    }));
  }
  return users;
};

/**
 * Generate mock verified user
 * @param {Object} overrides - Properties to override defaults
 * @returns {Object} Mock verified user object
 */


const generateVerifiedUser = (overrides = {}) => {
  return generateMockUser({
    isVerified: true,
    verificationToken: null,
    verificationTokenExpiry: null,
    ...overrides
  });
};

/**
 * Generate mock unverified user with verification token
 * @param {Object} overrides - Properties to override defaults
 * @returns {Object} Mock unverified user object
 */


const generateUnverifiedUser = (overrides = {}) => {
  return generateMockUser({
    isVerified: false,
    verificationToken: 'mock-verification-token-123456',
    verificationTokenExpiry: new Date(Date.now() + 24 * 60 * 60 * 1000),
    ...overrides
  });
};

/**
 * Generate mock user with reset token
 * @param {Object} overrides - Properties to override defaults
 * @returns {Object} Mock user with reset token
 */


const generateUserWithResetToken = (overrides = {}) => {
  return generateMockUser({
    resetPasswordToken: 'mock-reset-token-123456',
    resetPasswordExpiry: new Date(Date.now() + 60 * 60 * 1000),
    ...overrides
  });
};

/**
 * Generate mock JWT access token
 * @param {Object} payload - Token payload
 * @returns {string} JWT token
 */


const generateMockAccessToken = (payload = {}) => {
  const defaultPayload = {
    userId: new mongoose.Types.ObjectId().toString(),
    email: 'test@example.com'
  };

  return jwt.sign(
    { ...defaultPayload, ...payload },
    process.env.JWT_ACCESS_SECRET || 'test-access-secret',
    { expiresIn: '15m' }
  );
};

/**
 * Generate mock JWT refresh token
 * @param {Object} payload - Token payload
 * @returns {string} JWT token
 */


const generateMockRefreshToken = (payload = {}) => {
  const defaultPayload = {
    userId: new mongoose.Types.ObjectId().toString(),
    email: 'test@example.com'
  };

  return jwt.sign(
    { ...defaultPayload, ...payload },
    process.env.JWT_REFRESH_SECRET || 'test-refresh-secret',
    { expiresIn: '7d' }
  );
};

/**
 * Generate expired JWT token
 * @param {Object} payload - Token payload
 * @returns {string} Expired JWT token
 */


const generateExpiredToken = (payload = {}) => {
  const defaultPayload = {
    userId: new mongoose.Types.ObjectId().toString(),
    email: 'test@example.com'
  };

  return jwt.sign(
    { ...defaultPayload, ...payload },
    process.env.JWT_ACCESS_SECRET || 'test-access-secret',
    { expiresIn: '-1h' }
  );
};

/**
 * Generate invalid JWT token
 * @returns {string} Invalid JWT token
 */


const generateInvalidToken = () => {
  return 'invalid.jwt.token.format.12345';
};

/**
 * Hash password for testing
 * @param {string} password - Plain text password
 * @returns {Promise<string>} Hashed password
 */


const hashPassword = async (password) => {
  return await bcrypt.hash(password, 12);
};

/**
 * Generate mock registration data
 * @param {Object} overrides - Properties to override defaults
 * @returns {Object} Mock registration data
 */


const generateRegistrationData = (overrides = {}) => {
  const defaultData = {
    name: 'Test User',
    email: 'test@example.com',
    password: 'Test@1234'
  };

  return { ...defaultData, ...overrides };
};

/**
 * Generate mock login data
 * @param {Object} overrides - Properties to override defaults
 * @returns {Object} Mock login data
 */


const generateLoginData = (overrides = {}) => {
  const defaultData = {
    email: 'test@example.com',
    password: 'Test@1234'
  };

  return { ...defaultData, ...overrides };
};

/**
 * Generate mock request object
 * @param {Object} options - Request options
 * @returns {Object} Mock request object
 */


const generateMockRequest = (options = {}) => {
  const {
    body = {},
    params = {},
    query = {},
    headers = {},
    user = null,
    userId = null
  } = options;

  return {
    body,
    params,
    query,
    headers,
    user,
    userId,
    get: (header) => headers[header.toLowerCase()]
  };
};

/**
 * Generate mock response object
 * @returns {Object} Mock response object
 */


const generateMockResponse = () => {
  const res = {
    statusCode: 200,
    data: null,
    status: function(code) {
      this.statusCode = code;
      return this;
    },
    json: function(data) {
      this.data = data;
      return this;
    },
    send: function(data) {
      this.data = data;
      return this;
    },
    cookie: function(name, value, options) {
      this.cookies = this.cookies || {};
      this.cookies[name] = { value, options };
      return this;
    },
    clearCookie: function(name) {
      this.clearedCookies = this.clearedCookies || [];
      this.clearedCookies.push(name);
      return this;
    }
  };

  return res;
};

/**
 * Generate mock next function
 * @returns {Function} Mock next function
 */


const generateMockNext = () => {
  const next = jest.fn();
  return next;
};

/**
 * Generate mock email verification token
 * @returns {string} Mock verification token
 */


const generateVerificationToken = () => {
  return 'mock-verification-token-' + Math.random().toString(36).substring(2, 15);
};

/**
 * Generate mock password reset token
 * @returns {string} Mock reset token
 */


const generateResetToken = () => {
  return 'mock-reset-token-' + Math.random().toString(36).substring(2, 15);
};

/**
 * Generate mock authenticated request
 * @param {Object} user - User object
 * @returns {Object} Mock authenticated request
 */


const generateAuthenticatedRequest = (user = null) => {
  const mockUser = user || generateVerifiedUser();
  const token = generateMockAccessToken({ userId: mockUser._id.toString(), email: mockUser.email });

  return generateMockRequest({
    headers: {
      authorization: `Bearer ${token}`
    },
    user: mockUser,
    userId: mockUser._id
  });
};

/**
 * Generate mock validation error
 * @param {Array} errors - Array of error objects
 * @returns {Object} Mock validation error
 */


const generateValidationError = (errors = []) => {
  const defaultErrors = [
    {
      msg: 'Invalid value',
      param: 'email',
      location: 'body'
    }
  ];

  return {
    errors: errors.length > 0 ? errors : defaultErrors
  };
};

/**
 * Generate mock MongoDB error
 * @param {string} code - MongoDB error code
 * @returns {Error} Mock MongoDB error
 */


const generateMongoError = (code = 11000) => {
  const error = new Error('MongoDB error');
  error.code = code;
  error.keyPattern = { email: 1 };
  error.keyValue = { email: 'test@example.com' };
  return error;
};

module.exports = {
  generateMockUser,
  generateMockUsers,
  generateVerifiedUser,
  generateUnverifiedUser,
  generateUserWithResetToken,
  generateMockAccessToken,
  generateMockRefreshToken,
  generateExpiredToken,
  generateInvalidToken,
  hashPassword,
  generateRegistrationData,
  generateLoginData,
  generateMockRequest,
  generateMockResponse,
  generateMockNext,
  generateVerificationToken,
  generateResetToken,
  generateAuthenticatedRequest,
  generateValidationError,
  generateMongoError
};
