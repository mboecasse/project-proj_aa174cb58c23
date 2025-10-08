// File: tests/integration/auth/login.test.js
// Generated: 2025-10-08 13:06:41 UTC
// Project ID: proj_aa174cb58c23
// Task ID: task_8or7ai2qvkoo


const User = require('../../../src/models/User');


const app = require('../../../src/app');


const mongoose = require('mongoose');


const request = require('supertest');

const { generateAccessToken, generateRefreshToken } = require('../../../src/utils/jwt');

describe('POST /api/auth/login - Integration Tests', () => {
  let testUser;
  const validPassword = 'Test@1234';

  beforeAll(async () => {
    // Connect to test database
    const mongoUri = process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/auth-api-test';
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
  });

  beforeEach(async () => {
    // Clear users collection
    await User.deleteMany({});

    // Create test user
    testUser = await User.create({
      name: 'Test User',
      email: 'test@example.com',
      password: validPassword,
      isEmailVerified: true
    });
  });

  afterEach(async () => {
    // Clean up after each test
    await User.deleteMany({});
  });

  afterAll(async () => {
    // Close database connection
    await mongoose.connection.close();
  });

  describe('Successful Login Scenarios', () => {
    it('should login successfully with valid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: validPassword
        })
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('accessToken');
      expect(response.body.data).toHaveProperty('refreshToken');
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data.user).toHaveProperty('_id');
      expect(response.body.data.user).toHaveProperty('email', 'test@example.com');
      expect(response.body.data.user).toHaveProperty('name', 'Test User');
      expect(response.body.data.user).not.toHaveProperty('password');
    });

    it('should return valid JWT tokens on successful login', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: validPassword
        })
        .expect(200);

      const { accessToken, refreshToken } = response.body.data;

      expect(accessToken).toBeTruthy();
      expect(refreshToken).toBeTruthy();
      expect(typeof accessToken).toBe('string');
      expect(typeof refreshToken).toBe('string');
      expect(accessToken.split('.').length).toBe(3);
      expect(refreshToken.split('.').length).toBe(3);
    });

    it('should update lastLogin timestamp on successful login', async () => {
      const beforeLogin = new Date();

      await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: validPassword
        })
        .expect(200);

      const updatedUser = await User.findById(testUser._id);
      expect(updatedUser.lastLogin).toBeTruthy();
      expect(new Date(updatedUser.lastLogin).getTime()).toBeGreaterThanOrEqual(beforeLogin.getTime());
    });

    it('should login with email in different case', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'TEST@EXAMPLE.COM',
          password: validPassword
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe('test@example.com');
    });
  });

  describe('Failed Login Scenarios - Invalid Credentials', () => {
    it('should fail login with incorrect password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'WrongPassword123!'
        })
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toMatch(/invalid credentials/i);
      expect(response.body).not.toHaveProperty('data');
    });

    it('should fail login with non-existent email', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: validPassword
        })
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toMatch(/invalid credentials/i);
    });

    it('should not reveal whether email exists or password is wrong', async () => {
      const wrongEmailResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: validPassword
        })
        .expect(401);

      const wrongPasswordResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'WrongPassword123!'
        })
        .expect(401);

      expect(wrongEmailResponse.body.error).toBe(wrongPasswordResponse.body.error);
    });
  });

  describe('Failed Login Scenarios - Validation Errors', () => {
    it('should fail login with missing email', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          password: validPassword
        })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('errors');
      expect(Array.isArray(response.body.errors)).toBe(true);
      expect(response.body.errors.some(err => err.path === 'email')).toBe(true);
    });

    it('should fail login with missing password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com'
        })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('errors');
      expect(response.body.errors.some(err => err.path === 'password')).toBe(true);
    });

    it('should fail login with invalid email format', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'invalid-email',
          password: validPassword
        })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('errors');
      expect(response.body.errors.some(err => err.path === 'email')).toBe(true);
    });

    it('should fail login with empty email', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: '',
          password: validPassword
        })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('errors');
      expect(response.body.errors.some(err => err.path === 'email')).toBe(true);
    });

    it('should fail login with empty password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: ''
        })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('errors');
      expect(response.body.errors.some(err => err.path === 'password')).toBe(true);
    });

    it('should fail login with no request body', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('errors');
      expect(response.body.errors.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Failed Login Scenarios - Account Status', () => {
    it('should fail login with unverified email', async () => {
      await User.findByIdAndUpdate(testUser._id, { isEmailVerified: false });

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: validPassword
        })
        .expect(403);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toMatch(/email not verified/i);
    });

    it('should fail login with deleted account', async () => {
      await User.findByIdAndUpdate(testUser._id, { isDeleted: true });

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: validPassword
        })
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
    });

    it('should fail login with suspended account', async () => {
      await User.findByIdAndUpdate(testUser._id, {
        isSuspended: true,
        suspendedUntil: new Date(Date.now() + 24 * 60 * 60 * 1000)
      });

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: validPassword
        })
        .expect(403);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toMatch(/account suspended/i);
    });
  });

  describe('Security Tests', () => {
    it('should not expose password in response', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: validPassword
        })
        .expect(200);

      expect(response.body.data.user).not.toHaveProperty('password');
      expect(JSON.stringify(response.body)).not.toContain(validPassword);
    });

    it('should handle SQL injection attempts in email', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: "admin'--",
          password: validPassword
        })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });

    it('should handle XSS attempts in email', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: '<script>alert("xss")</script>@example.com',
          password: validPassword
        })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });

    it('should handle NoSQL injection attempts', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: { $ne: null },
          password: { $ne: null }
        })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });

    it('should rate limit excessive login attempts', async () => {
      const attempts = [];

      for (let i = 0; i < 10; i++) {
        attempts.push(
          request(app)
            .post('/api/auth/login')
            .send({
              email: 'test@example.com',
              password: 'WrongPassword123!'
            })
        );
      }

      const responses = await Promise.all(attempts);
      const rateLimited = responses.some(res => res.status === 429);

      expect(rateLimited).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should handle very long email addresses', async () => {
      const longEmail = 'a'.repeat(300) + '@example.com';

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: longEmail,
          password: validPassword
        })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });

    it('should handle very long passwords', async () => {
      const longPassword = 'a'.repeat(1000);

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: longPassword
        })
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
    });

    it('should handle special characters in password', async () => {
      const specialUser = await User.create({
        name: 'Special User',
        email: 'special@example.com',
        password: '!@#$%^&*()_+-=[]{}|;:,.<>?',
        isEmailVerified: true
      });

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'special@example.com',
          password: '!@#$%^&*()_+-=[]{}|;:,.<>?'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should handle unicode characters in password', async () => {
      const unicodePassword = 'Test@1234你好世界';
      const unicodeUser = await User.create({
        name: 'Unicode User',
        email: 'unicode@example.com',
        password: unicodePassword,
        isEmailVerified: true
      });

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'unicode@example.com',
          password: unicodePassword
        })
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should handle concurrent login requests', async () => {
      const requests = Array(5).fill(null).map(() =>
        request(app)
          .post('/api/auth/login')
          .send({
            email: 'test@example.com',
            password: validPassword
          })
      );

      const responses = await Promise.all(requests);

      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });
    });
  });

  describe('Response Format Tests', () => {
    it('should return consistent success response format', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: validPassword
        })
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data:
