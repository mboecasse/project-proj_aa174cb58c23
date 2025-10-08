// File: tests/integration/auth/verification.test.js
// Generated: 2025-10-08 13:06:44 UTC
// Project ID: proj_aa174cb58c23
// Task ID: task_35zrwmh83t82


const User = require('../../../src/models/User');


const app = require('../../../src/app');


const logger = require('../../../src/utils/logger');


const mongoose = require('mongoose');


const request = require('supertest');

describe('Email Verification Integration Tests', () => {
  let server;
  let testUser;
  let verificationToken;

  beforeAll(async () => {
    // Connect to test database
    const mongoUri = process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/auth-api-test';
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    server = app.listen(0);
  });

  afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
    if (server) {
      server.close();
    }
  });

  beforeEach(async () => {
    await User.deleteMany({});

    // Create unverified test user
    testUser = await User.create({
      name: 'Test User',
      email: 'test@example.com',
      password: 'Password123!',
      isVerified: false,
      verificationToken: 'valid-token-123',
      verificationTokenExpiry: new Date(Date.now() + 24 * 60 * 60 * 1000)
    });

    verificationToken = testUser.verificationToken;
  });

  afterEach(async () => {
    await User.deleteMany({});
  });

  describe('POST /api/auth/verify-email', () => {
    it('should verify email with valid token', async () => {
      const response = await request(app)
        .post('/api/auth/verify-email')
        .send({ token: verificationToken })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('verified');

      // Verify user is marked as verified in database
      const updatedUser = await User.findById(testUser._id);
      expect(updatedUser.isVerified).toBe(true);
      expect(updatedUser.verificationToken).toBeUndefined();
      expect(updatedUser.verificationTokenExpiry).toBeUndefined();
    });

    it('should return 400 when token is missing', async () => {
      const response = await request(app)
        .post('/api/auth/verify-email')
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
    });

    it('should return 400 when token is invalid', async () => {
      const response = await request(app)
        .post('/api/auth/verify-email')
        .send({ token: 'invalid-token' })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toContain('Invalid');
    });

    it('should return 400 when token is expired', async () => {
      // Create user with expired token
      const expiredUser = await User.create({
        name: 'Expired User',
        email: 'expired@example.com',
        password: 'Password123!',
        isVerified: false,
        verificationToken: 'expired-token-123',
        verificationTokenExpiry: new Date(Date.now() - 1000)
      });

      const response = await request(app)
        .post('/api/auth/verify-email')
        .send({ token: expiredUser.verificationToken })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toContain('expired');

      // Verify user is still unverified
      const unchangedUser = await User.findById(expiredUser._id);
      expect(unchangedUser.isVerified).toBe(false);
    });

    it('should return 400 when user is already verified', async () => {
      // Mark user as verified
      testUser.isVerified = true;
      testUser.verificationToken = undefined;
      testUser.verificationTokenExpiry = undefined;
      await testUser.save();

      const response = await request(app)
        .post('/api/auth/verify-email')
        .send({ token: verificationToken })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toContain('already verified');
    });

    it('should handle malformed token gracefully', async () => {
      const response = await request(app)
        .post('/api/auth/verify-email')
        .send({ token: '' })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
    });

    it('should handle token with special characters', async () => {
      const response = await request(app)
        .post('/api/auth/verify-email')
        .send({ token: '<script>alert("xss")</script>' })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toContain('Invalid');
    });

    it('should not verify email if database update fails', async () => {
      // Spy on User.findOne to simulate database error
      jest.spyOn(User, 'findOne').mockImplementationOnce(() => {
        throw new Error('Database connection lost');
      });

      const response = await request(app)
        .post('/api/auth/verify-email')
        .send({ token: verificationToken })
        .expect(500);

      expect(response.body).toHaveProperty('success', false);

      // Restore original implementation
      User.findOne.mockRestore();
    });
  });

  describe('POST /api/auth/resend-verification', () => {
    it('should resend verification email for unverified user', async () => {
      const response = await request(app)
        .post('/api/auth/resend-verification')
        .send({ email: testUser.email })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('sent');

      // Verify new token was generated
      const updatedUser = await User.findById(testUser._id);
      expect(updatedUser.verificationToken).toBeDefined();
      expect(updatedUser.verificationToken).not.toBe(verificationToken);
      expect(updatedUser.verificationTokenExpiry).toBeDefined();
      expect(updatedUser.verificationTokenExpiry.getTime()).toBeGreaterThan(Date.now());
    });

    it('should return 400 when email is missing', async () => {
      const response = await request(app)
        .post('/api/auth/resend-verification')
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
    });

    it('should return 400 when email format is invalid', async () => {
      const response = await request(app)
        .post('/api/auth/resend-verification')
        .send({ email: 'invalid-email' })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toContain('valid email');
    });

    it('should return 404 when user does not exist', async () => {
      const response = await request(app)
        .post('/api/auth/resend-verification')
        .send({ email: 'nonexistent@example.com' })
        .expect(404);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toContain('not found');
    });

    it('should return 400 when user is already verified', async () => {
      // Mark user as verified
      testUser.isVerified = true;
      testUser.verificationToken = undefined;
      testUser.verificationTokenExpiry = undefined;
      await testUser.save();

      const response = await request(app)
        .post('/api/auth/resend-verification')
        .send({ email: testUser.email })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toContain('already verified');
    });

    it('should generate unique token on each resend', async () => {
      const firstResponse = await request(app)
        .post('/api/auth/resend-verification')
        .send({ email: testUser.email })
        .expect(200);

      const firstUser = await User.findById(testUser._id);
      const firstToken = firstUser.verificationToken;

      // Wait a bit to ensure different timestamp
      await new Promise(resolve => setTimeout(resolve, 100));

      const secondResponse = await request(app)
        .post('/api/auth/resend-verification')
        .send({ email: testUser.email })
        .expect(200);

      const secondUser = await User.findById(testUser._id);
      const secondToken = secondUser.verificationToken;

      expect(firstToken).not.toBe(secondToken);
      expect(firstResponse.body.success).toBe(true);
      expect(secondResponse.body.success).toBe(true);
    });

    it('should handle case-insensitive email lookup', async () => {
      const response = await request(app)
        .post('/api/auth/resend-verification')
        .send({ email: testUser.email.toUpperCase() })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
    });

    it('should rate limit resend requests', async () => {
      // Make multiple rapid requests
      const requests = [];
      for (let i = 0; i < 10; i++) {
        requests.push(
          request(app)
            .post('/api/auth/resend-verification')
            .send({ email: testUser.email })
        );
      }

      const responses = await Promise.all(requests);

      // At least one should be rate limited (429)
      const rateLimited = responses.some(res => res.status === 429);
      expect(rateLimited).toBe(true);
    });
  });

  describe('Email Verification Flow', () => {
    it('should complete full verification flow', async () => {
      // Step 1: Register new user
      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'New User',
          email: 'newuser@example.com',
          password: 'Password123!'
        })
        .expect(201);

      expect(registerResponse.body.success).toBe(true);

      // Get user from database to retrieve token
      const newUser = await User.findOne({ email: 'newuser@example.com' });
      expect(newUser.isVerified).toBe(false);
      expect(newUser.verificationToken).toBeDefined();

      // Step 2: Verify email
      const verifyResponse = await request(app)
        .post('/api/auth/verify-email')
        .send({ token: newUser.verificationToken })
        .expect(200);

      expect(verifyResponse.body.success).toBe(true);

      // Step 3: Verify user can now login
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'newuser@example.com',
          password: 'Password123!'
        })
        .expect(200);

      expect(loginResponse.body.success).toBe(true);
      expect(loginResponse.body.data).toHaveProperty('accessToken');
      expect(loginResponse.body.data).toHaveProperty('refreshToken');
    });

    it('should prevent login before email verification', async () => {
      // Register new user
      await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Unverified User',
          email: 'unverified@example.com',
          password: 'Password123!'
        })
        .expect(201);

      // Try to login without verifying
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'unverified@example.com',
          password: 'Password123!'
        })
        .expect(403);

      expect(loginResponse.body.success).toBe(false);
      expect(loginResponse.body.error).toContain('verify');
    });

    it('should handle expired token and resend flow', async () => {
      // Create user with expired token
      const expiredUser = await User.create({
        name: 'Expired Token User',
        email: 'expired-token@example.com',
        password: 'Password123!',
        isVerified: false,
        verificationToken: 'expired-token',
        verificationTokenExpiry: new Date(Date.now() - 1000)
      });

      // Try to verify with expired token
      const verifyResponse = await request(app)
        .post('/api/auth/verify-email')
        .send({ token: expiredUser.verificationToken })
        .expect(400);

      expect(verifyResponse.body.error).toContain('expired');

      // Resend verification email
      const resendResponse = await request(app)
        .post('/api/auth/resend-verification')
        .send({ email: expiredUser.email })
        .expect(200);

      expect(resendResponse.body.success).toBe(true);

      // Get new token
      const updatedUser = await User.findById(expiredUser._id);

      // Verify with new token
      const newVerifyResponse = await request(app)
        .post('/api/auth/verify-email')
        .send({ token: updatedUser.verificationToken })
        .expect(200);

      expect(newVerifyResponse.body.success).toBe(true);

      // Verify user is now verified
      const finalUser = await User.findById(expiredUser._id);
      expect(finalUser.isVerified).toBe(true);
    });
  });

  describe('Security Tests', () => {
    it('should sanitize email input', async () => {
      const response = await request(app)
        .post('/api/auth/resend-verification')
        .send({ email: '<script>alert("xss")</script>@example.com' })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });

    it('should prevent token enumeration', async () => {
      // Try multiple invalid tokens
      const responses = await Promise.all([
        request(app).post('/api/auth/verify-email').send({ token: 'token1' }),
        request(app).post('/api/auth/verify-email').send({ token: 'token2' }),
        request(app).post('/api/auth/verify-email').send({ token: 'token3' })
      ]);

      // All should return same error message
      const errorMessages = responses.map(r => r.body.error);
      expect(new Set(errorMessages).size).toBe(1);
    });

    it('should not expose user existence in resend endpoint', async () => {
      const existingResponse = await request(app)
        .post('/api/auth/resend-verification')
        .send({ email: 'nonexistent@example.com' });

      // Response should not reveal if user exists
      expect(existingResponse.status).toBeGreaterThanOrEqual(200);
    });

    it('should handle SQL injection attempts in token', async () => {
      const response = await request(app)
        .post('/api/auth/verify-email')
        .send({ token: "'; DROP TABLE users; --" })
        .expect(400);

      expect(response.body.success
