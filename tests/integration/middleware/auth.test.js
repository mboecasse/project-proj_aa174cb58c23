// File: tests/integration/middleware/auth.test.js
// Generated: 2025-10-08 13:06:09 UTC
// Project ID: proj_aa174cb58c23
// Task ID: task_vj7n60j1u967


const User = require('../../src/models/User');


const apiClient = require('../helpers/apiClient');


const app = require('../../src/app');


const jwt = require('jsonwebtoken');


const mongoose = require('mongoose');


const request = require('supertest');

const { generateAccessToken, generateRefreshToken } = require('../../src/utils/jwt');

describe('Auth Middleware Integration Tests', () => {
  let testUser;
  let validAccessToken;
  let expiredAccessToken;
  let invalidToken;
  let refreshToken;

  beforeAll(async () => {
    // Connect to test database
    const mongoUri = process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/auth-api-test';
    await mongoose.connect(mongoUri);
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    // Clear database
    await User.deleteMany({});

    // Create test user
    testUser = await User.create({
      name: 'Test User',
      email: 'test@example.com',
      password: 'Password123!',
      isVerified: true
    });

    // Generate valid tokens
    validAccessToken = generateAccessToken(testUser._id);
    refreshToken = generateRefreshToken(testUser._id);

    // Generate expired token (using past expiry)
    expiredAccessToken = jwt.sign(
      { userId: testUser._id.toString() },
      process.env.JWT_ACCESS_SECRET,
      { expiresIn: '-1h' }
    );

    // Generate invalid token (wrong secret)
    invalidToken = jwt.sign(
      { userId: testUser._id.toString() },
      'wrong-secret',
      { expiresIn: '15m' }
    );
  });

  afterEach(async () => {
    await User.deleteMany({});
  });

  describe('Protected Route Access', () => {
    test('should allow access with valid access token', async () => {
      const response = await apiClient
        .get('/api/auth/profile')
        .setAuth(validAccessToken);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.email).toBe(testUser.email);
    });

    test('should deny access without token', async () => {
      const response = await request(app)
        .get('/api/auth/profile');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('token');
    });

    test('should deny access with expired token', async () => {
      const response = await apiClient
        .get('/api/auth/profile')
        .setAuth(expiredAccessToken);

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toMatch(/expired|invalid/i);
    });

    test('should deny access with invalid token', async () => {
      const response = await apiClient
        .get('/api/auth/profile')
        .setAuth(invalidToken);

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toMatch(/invalid|token/i);
    });

    test('should deny access with malformed token', async () => {
      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', 'Bearer malformed.token.here');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    test('should deny access with token for non-existent user', async () => {
      const nonExistentUserId = new mongoose.Types.ObjectId();
      const tokenForDeletedUser = generateAccessToken(nonExistentUserId);

      const response = await apiClient
        .get('/api/auth/profile')
        .setAuth(tokenForDeletedUser);

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toMatch(/user.*not found/i);
    });
  });

  describe('Token Format Validation', () => {
    test('should reject token without Bearer prefix', async () => {
      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', validAccessToken);

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    test('should reject empty Authorization header', async () => {
      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', '');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    test('should reject Bearer without token', async () => {
      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', 'Bearer ');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    test('should handle multiple Bearer keywords', async () => {
      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer Bearer ${validAccessToken}`);

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('User Context in Request', () => {
    test('should attach user object to request', async () => {
      const response = await apiClient
        .get('/api/auth/profile')
        .setAuth(validAccessToken);

      expect(response.status).toBe(200);
      expect(response.body.data._id).toBe(testUser._id.toString());
      expect(response.body.data.email).toBe(testUser.email);
      expect(response.body.data.name).toBe(testUser.name);
    });

    test('should attach userId to request', async () => {
      const response = await apiClient
        .get('/api/auth/profile')
        .setAuth(validAccessToken);

      expect(response.status).toBe(200);
      expect(response.body.data._id).toBe(testUser._id.toString());
    });

    test('should not include password in user object', async () => {
      const response = await apiClient
        .get('/api/auth/profile')
        .setAuth(validAccessToken);

      expect(response.status).toBe(200);
      expect(response.body.data.password).toBeUndefined();
    });
  });

  describe('Unverified User Access', () => {
    test('should deny access for unverified user', async () => {
      const unverifiedUser = await User.create({
        name: 'Unverified User',
        email: 'unverified@example.com',
        password: 'Password123!',
        isVerified: false
      });

      const unverifiedToken = generateAccessToken(unverifiedUser._id);

      const response = await apiClient
        .get('/api/auth/profile')
        .setAuth(unverifiedToken);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toMatch(/verify|verified/i);
    });

    test('should allow verified user access', async () => {
      const response = await apiClient
        .get('/api/auth/profile')
        .setAuth(validAccessToken);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('Token Refresh Flow', () => {
    test('should accept valid refresh token', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.accessToken).toBeDefined();
      expect(response.body.data.refreshToken).toBeDefined();
    });

    test('should reject expired refresh token', async () => {
      const expiredRefreshToken = jwt.sign(
        { userId: testUser._id.toString() },
        process.env.JWT_REFRESH_SECRET,
        { expiresIn: '-1d' }
      );

      const response = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken: expiredRefreshToken });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    test('should reject access token used as refresh token', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken: validAccessToken });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('Optional Auth Middleware', () => {
    test('should allow access without token for optional auth routes', async () => {
      const response = await request(app)
        .get('/api/posts');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    test('should attach user if valid token provided for optional auth', async () => {
      const response = await apiClient
        .get('/api/posts')
        .setAuth(validAccessToken);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    test('should not fail if invalid token provided for optional auth', async () => {
      const response = await request(app)
        .get('/api/posts')
        .set('Authorization', 'Bearer invalid.token.here');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('Concurrent Requests', () => {
    test('should handle multiple concurrent authenticated requests', async () => {
      const requests = Array(10).fill(null).map(() =>
        apiClient
          .get('/api/auth/profile')
          .setAuth(validAccessToken)
      );

      const responses = await Promise.all(requests);

      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.email).toBe(testUser.email);
      });
    });

    test('should handle mixed valid and invalid tokens concurrently', async () => {
      const requests = [
        apiClient.get('/api/auth/profile').setAuth(validAccessToken),
        apiClient.get('/api/auth/profile').setAuth(invalidToken),
        apiClient.get('/api/auth/profile').setAuth(validAccessToken),
        apiClient.get('/api/auth/profile').setAuth(expiredAccessToken),
        apiClient.get('/api/auth/profile').setAuth(validAccessToken)
      ];

      const responses = await Promise.all(requests);

      expect(responses[0].status).toBe(200);
      expect(responses[1].status).toBe(401);
      expect(responses[2].status).toBe(200);
      expect(responses[3].status).toBe(401);
      expect(responses[4].status).toBe(200);
    });
  });

  describe('User Deletion During Session', () => {
    test('should deny access if user deleted after token issued', async () => {
      await User.findByIdAndDelete(testUser._id);

      const response = await apiClient
        .get('/api/auth/profile')
        .setAuth(validAccessToken);

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toMatch(/user.*not found/i);
    });
  });

  describe('Token Payload Validation', () => {
    test('should reject token with missing userId', async () => {
      const tokenWithoutUserId = jwt.sign(
        { email: testUser.email },
        process.env.JWT_ACCESS_SECRET,
        { expiresIn: '15m' }
      );

      const response = await apiClient
        .get('/api/auth/profile')
        .setAuth(tokenWithoutUserId);

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    test('should reject token with invalid userId format', async () => {
      const tokenWithInvalidUserId = jwt.sign(
        { userId: 'not-a-valid-id' },
        process.env.JWT_ACCESS_SECRET,
        { expiresIn: '15m' }
      );

      const response = await apiClient
        .get('/api/auth/profile')
        .setAuth(tokenWithInvalidUserId);

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('Security Headers', () => {
    test('should not expose sensitive information in error responses', async () => {
      const response = await apiClient
        .get('/api/auth/profile')
        .setAuth(invalidToken);

      expect(response.status).toBe(401);
      expect(response.body.error).not.toContain('JWT_ACCESS_SECRET');
      expect(response.body.error).not.toContain('stack');
      expect(response.body.error).not.toContain('mongoose');
    });

    test('should not leak user existence through error messages', async () => {
      const nonExistentUserId = new mongoose.Types.ObjectId();
      const tokenForNonExistent = generateAccessToken(nonExistentUserId);

      const response = await apiClient
        .get('/api/auth/profile')
        .setAuth(tokenForNonExistent);

      expect(response.status).toBe(401);
      expect(response.body.error).not.toContain(nonExistentUserId.toString());
    });
  });

  describe('Route Protection Consistency', () => {
    test('should protect all sensitive routes', async () => {
      const protectedRoutes = [
        { method: 'get', path: '/api/auth/profile' },
        { method: 'put', path: '/api/auth/profile' },
        { method: 'post', path: '/api/auth/change-password' },
        { method: 'post', path: '/api/auth/logout' }
      ];

      for (const route of protectedRoutes) {
        const response = await request(app)[route.method](route.path);
        expect(response.status).toBe(401);
        expect(response.body.success).toBe(false);
      }
    });

    test('should allow public routes without authentication', async () => {
      const publicRoutes = [
        { method: 'post', path: '/api/auth/register' },
        { method: 'post', path: '/api/auth/login' },
        { method: 'post', path: '/api/auth/forgot-password' }
      ];

      for (const route of publicRoutes) {
        const response = await request(app)[route.method](route.path)
          .send({});
        expect(response.status).not.toBe(401);
      }
    });
  });
});
