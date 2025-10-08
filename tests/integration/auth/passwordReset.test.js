// File: tests/integration/auth/passwordReset.test.js
// Generated: 2025-10-08 13:06:46 UTC
// Project ID: proj_aa174cb58c23
// Task ID: task_4u74apunxaz9


const Token = require('../../../src/models/Token');


const User = require('../../../src/models/User');


const app = require('../../../src/app');


const emailService = require('../../../src/services/emailService');


const logger = require('../../../src/utils/logger');


const mongoose = require('mongoose');


const request = require('supertest');

// Mock email service
jest.mock('../../../src/services/emailService');

describe('Password Reset Integration Tests', () => {
  let testUser;
  let resetToken;

  beforeAll(async () => {
    // Connect to test database
    const mongoUri = process.env.MONGODB_URI_TEST || 'mongodb://localhost:27017/auth-api-test';
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
  });

  afterAll(async () => {
    // Clean up and close connection
    await User.deleteMany({});
    await Token.deleteMany({});
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    // Clear collections before each test
    await User.deleteMany({});
    await Token.deleteMany({});

    // Clear all mocks
    jest.clearAllMocks();

    // Create test user
    testUser = await User.create({
      name: 'Test User',
      email: 'test@example.com',
      password: 'Password123!',
      isEmailVerified: true
    });

    logger.info('Test user created', { userId: testUser._id });
  });

  afterEach(async () => {
    // Clean up after each test
    await User.deleteMany({});
    await Token.deleteMany({});
  });

  describe('POST /api/auth/forgot-password', () => {
    it('should send password reset email for valid email', async () => {
      emailService.sendPasswordResetEmail.mockResolvedValue(true);

      const response = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: testUser.email })
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: expect.stringContaining('reset')
      });

      // Verify token was created
      const token = await Token.findOne({
        userId: testUser._id,
        type: 'passwordReset'
      });
      expect(token).toBeTruthy();
      expect(token.token).toBeTruthy();
      expect(token.expiresAt).toBeInstanceOf(Date);

      // Verify email was sent
      expect(emailService.sendPasswordResetEmail).toHaveBeenCalledWith(
        testUser.email,
        testUser.name,
        expect.any(String)
      );
    });

    it('should return success even for non-existent email (security)', async () => {
      const response = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'nonexistent@example.com' })
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: expect.stringContaining('reset')
      });

      // Verify no token was created
      const token = await Token.findOne({ type: 'passwordReset' });
      expect(token).toBeNull();

      // Verify no email was sent
      expect(emailService.sendPasswordResetEmail).not.toHaveBeenCalled();
    });

    it('should fail with invalid email format', async () => {
      const response = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'invalid-email' })
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        error: expect.stringContaining('email')
      });

      expect(emailService.sendPasswordResetEmail).not.toHaveBeenCalled();
    });

    it('should fail with missing email', async () => {
      const response = await request(app)
        .post('/api/auth/forgot-password')
        .send({})
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        error: expect.any(String)
      });

      expect(emailService.sendPasswordResetEmail).not.toHaveBeenCalled();
    });

    it('should invalidate old reset tokens when requesting new one', async () => {
      // Create old token
      const oldToken = await Token.create({
        userId: testUser._id,
        token: 'old-token-123',
        type: 'passwordReset',
        expiresAt: new Date(Date.now() + 3600000)
      });

      emailService.sendPasswordResetEmail.mockResolvedValue(true);

      await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: testUser.email })
        .expect(200);

      // Verify old token was deleted
      const deletedToken = await Token.findById(oldToken._id);
      expect(deletedToken).toBeNull();

      // Verify new token exists
      const newToken = await Token.findOne({
        userId: testUser._id,
        type: 'passwordReset'
      });
      expect(newToken).toBeTruthy();
      expect(newToken.token).not.toBe('old-token-123');
    });

    it('should handle email service failure gracefully', async () => {
      emailService.sendPasswordResetEmail.mockRejectedValue(
        new Error('Email service unavailable')
      );

      const response = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: testUser.email })
        .expect(500);

      expect(response.body).toMatchObject({
        success: false,
        error: expect.any(String)
      });

      // Token should still be created
      const token = await Token.findOne({
        userId: testUser._id,
        type: 'passwordReset'
      });
      expect(token).toBeTruthy();
    });

    it('should rate limit password reset requests', async () => {
      emailService.sendPasswordResetEmail.mockResolvedValue(true);

      // Make multiple requests rapidly
      const requests = [];
      for (let i = 0; i < 6; i++) {
        requests.push(
          request(app)
            .post('/api/auth/forgot-password')
            .send({ email: testUser.email })
        );
      }

      const responses = await Promise.all(requests);

      // At least one should be rate limited
      const rateLimited = responses.some(res => res.status === 429);
      expect(rateLimited).toBe(true);
    });
  });

  describe('POST /api/auth/reset-password', () => {
    beforeEach(async () => {
      // Create valid reset token
      const tokenDoc = await Token.create({
        userId: testUser._id,
        token: 'valid-reset-token-123',
        type: 'passwordReset',
        expiresAt: new Date(Date.now() + 3600000)
      });
      resetToken = tokenDoc.token;
    });

    it('should reset password with valid token', async () => {
      const newPassword = 'NewPassword123!';

      const response = await request(app)
        .post('/api/auth/reset-password')
        .send({
          token: resetToken,
          password: newPassword,
          confirmPassword: newPassword
        })
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: expect.stringContaining('reset')
      });

      // Verify token was deleted
      const token = await Token.findOne({ token: resetToken });
      expect(token).toBeNull();

      // Verify password was changed
      const updatedUser = await User.findById(testUser._id);
      const isPasswordValid = await updatedUser.comparePassword(newPassword);
      expect(isPasswordValid).toBe(true);

      // Verify old password no longer works
      const isOldPasswordValid = await updatedUser.comparePassword('Password123!');
      expect(isOldPasswordValid).toBe(false);
    });

    it('should fail with invalid token', async () => {
      const response = await request(app)
        .post('/api/auth/reset-password')
        .send({
          token: 'invalid-token',
          password: 'NewPassword123!',
          confirmPassword: 'NewPassword123!'
        })
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        error: expect.stringContaining('Invalid')
      });

      // Verify password was not changed
      const user = await User.findById(testUser._id);
      const isPasswordValid = await user.comparePassword('Password123!');
      expect(isPasswordValid).toBe(true);
    });

    it('should fail with expired token', async () => {
      // Create expired token
      const expiredTokenDoc = await Token.create({
        userId: testUser._id,
        token: 'expired-token-123',
        type: 'passwordReset',
        expiresAt: new Date(Date.now() - 3600000) // 1 hour ago
      });

      const response = await request(app)
        .post('/api/auth/reset-password')
        .send({
          token: expiredTokenDoc.token,
          password: 'NewPassword123!',
          confirmPassword: 'NewPassword123!'
        })
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        error: expect.stringContaining('expired')
      });

      // Verify password was not changed
      const user = await User.findById(testUser._id);
      const isPasswordValid = await user.comparePassword('Password123!');
      expect(isPasswordValid).toBe(true);
    });

    it('should fail when passwords do not match', async () => {
      const response = await request(app)
        .post('/api/auth/reset-password')
        .send({
          token: resetToken,
          password: 'NewPassword123!',
          confirmPassword: 'DifferentPassword123!'
        })
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        error: expect.stringContaining('match')
      });

      // Verify password was not changed
      const user = await User.findById(testUser._id);
      const isPasswordValid = await user.comparePassword('Password123!');
      expect(isPasswordValid).toBe(true);
    });

    it('should fail with weak password', async () => {
      const response = await request(app)
        .post('/api/auth/reset-password')
        .send({
          token: resetToken,
          password: 'weak',
          confirmPassword: 'weak'
        })
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        error: expect.stringContaining('password')
      });

      // Verify password was not changed
      const user = await User.findById(testUser._id);
      const isPasswordValid = await user.comparePassword('Password123!');
      expect(isPasswordValid).toBe(true);
    });

    it('should fail with missing token', async () => {
      const response = await request(app)
        .post('/api/auth/reset-password')
        .send({
          password: 'NewPassword123!',
          confirmPassword: 'NewPassword123!'
        })
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        error: expect.any(String)
      });
    });

    it('should fail with missing password', async () => {
      const response = await request(app)
        .post('/api/auth/reset-password')
        .send({
          token: resetToken,
          confirmPassword: 'NewPassword123!'
        })
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        error: expect.any(String)
      });
    });

    it('should not allow token reuse', async () => {
      const newPassword = 'NewPassword123!';

      // First reset - should succeed
      await request(app)
        .post('/api/auth/reset-password')
        .send({
          token: resetToken,
          password: newPassword,
          confirmPassword: newPassword
        })
        .expect(200);

      // Second reset with same token - should fail
      const response = await request(app)
        .post('/api/auth/reset-password')
        .send({
          token: resetToken,
          password: 'AnotherPassword123!',
          confirmPassword: 'AnotherPassword123!'
        })
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        error: expect.stringContaining('Invalid')
      });
    });

    it('should invalidate all user sessions after password reset', async () => {
      // Login to get access token
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: 'Password123!'
        })
        .expect(200);

      const accessToken = loginResponse.body.data.accessToken;

      // Reset password
      await request(app)
        .post('/api/auth/reset-password')
        .send({
          token: resetToken,
          password: 'NewPassword123!',
          confirmPassword: 'NewPassword123!'
        })
        .expect(200);

      // Try to use old access token - should fail
      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(401);

      expect(response.body).toMatchObject({
        success: false,
        error: expect.any(String)
      });
    });

    it('should allow login with new password after reset', async () => {
      const newPassword = 'NewPassword123!';

      // Reset password
      await request(app)
        .post('/api/auth/reset-password')
        .send({
          token: resetToken,
          password: newPassword,
          confirmPassword: newPassword
        })
        .expect(200);

      // Login with new password
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: newPassword
        })
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          accessToken: expect.any(String),
          refreshToken: expect.any(String)
        }
      });
    });

    it('should handle concurrent reset attempts', async () => {
      const newPassword = 'NewPassword123!';

      // Make concurrent reset requests
      const requests = [
        request(app)
          .post('/api/auth/reset-password')
          .send({
            token: resetToken,
            password: newPassword,
            confirmPassword: newPassword
          }),
        request(app)
          .post('/api/auth/reset-password')
          .send({
            token: resetToken,
            password: 'AnotherPassword123!',
            confirmPassword: 'AnotherPassword123!'
          })
      ];

      const responses = await Promise.all(requests);

      // Only one should succeed
      const successCount = responses.filter(res => res.status === 200).length;
      expect(successCount).toBe(1);

      // One should fail
      const failCount = responses.filter(res => res.status === 400).length;
      expect(failCount).toBe(1);
    });
  });

  describe('Password Reset Flow End-to-End', () => {
    it('should complete full password reset flow', async () => {
      emailService.sendPasswordResetEmail.mockResolvedValue(true);

      // Step 1: Request password reset
      const forgotResponse = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: testUser
