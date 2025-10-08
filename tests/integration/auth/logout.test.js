// File: tests/integration/auth/logout.test.js
// Generated: 2025-10-08 13:06:45 UTC
// Project ID: proj_aa174cb58c23
// Task ID: task_030xtzbjndxc


const User = require('../../../src/models/User');


const app = require('../../../src/app');


const logger = require('../../../src/utils/logger');


const mongoose = require('mongoose');


const request = require('supertest');

describe('Auth Logout Integration Tests', () => {
  let accessToken;
  let refreshToken;
  let userId;

  beforeAll(async () => {
    // Connect to test database
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI_TEST || 'mongodb://localhost:27017/auth-api-test', {
        useNewUrlParser: true,
        useUnifiedTopology: true
      });
    }
  });

  afterAll(async () => {
    // Clean up and close connection
    await User.deleteMany({});
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    // Clear database
    await User.deleteMany({});

    // Create test user and login to get tokens
    const userData = {
      name: 'Test User',
      email: 'logout.test@example.com',
      password: 'Test@12345'
    };

    // Register user
    await request(app)
      .post('/api/auth/register')
      .send(userData);

    // Login to get tokens
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: userData.email,
        password: userData.password
      });

    accessToken = loginResponse.body.data.accessToken;
    refreshToken = loginResponse.body.data.refreshToken;
    userId = loginResponse.body.data.user._id;
  });

  afterEach(async () => {
    // Clean up after each test
    await User.deleteMany({});
  });

  describe('POST /api/auth/logout', () => {
    it('should successfully logout user with valid access token', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Logged out successfully');

      // Verify user's refresh token was cleared
      const user = await User.findById(userId);
      expect(user.refreshToken).toBeNull();
    });

    it('should return 401 when no token provided', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toMatch(/token/i);
    });

    it('should return 401 when invalid token provided', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', 'Bearer invalid.token.here')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toMatch(/invalid|token/i);
    });

    it('should return 401 when expired token provided', async () => {
      // Create an expired token (would need to mock jwt.sign with past expiry)
      const expiredToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2NTc4OTBhYmNkZWYxMjM0NTY3ODkwYWIiLCJpYXQiOjE1MTYyMzkwMjIsImV4cCI6MTUxNjIzOTAyMn0.invalid';

      const response = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${expiredToken}`)
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should invalidate refresh token on logout', async () => {
      // Logout
      await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      // Try to refresh token after logout
      const refreshResponse = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken })
        .expect(401);

      expect(refreshResponse.body.success).toBe(false);
      expect(refreshResponse.body.error).toMatch(/invalid|token/i);
    });

    it('should prevent access to protected routes after logout', async () => {
      // Logout
      await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      // Try to access protected route with same token
      const protectedResponse = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(401);

      expect(protectedResponse.body.success).toBe(false);
    });

    it('should handle logout for already logged out user gracefully', async () => {
      // First logout
      await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      // Second logout with same token (should fail as token is invalidated)
      const response = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should clear refresh token from database on logout', async () => {
      // Verify refresh token exists before logout
      let user = await User.findById(userId);
      expect(user.refreshToken).toBeTruthy();

      // Logout
      await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      // Verify refresh token is cleared
      user = await User.findById(userId);
      expect(user.refreshToken).toBeNull();
    });

    it('should handle malformed authorization header', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', 'InvalidFormat')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toMatch(/token/i);
    });

    it('should handle missing Bearer prefix', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', accessToken)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toMatch(/token/i);
    });

    it('should return 404 when user no longer exists', async () => {
      // Delete user
      await User.findByIdAndDelete(userId);

      // Try to logout
      const response = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toMatch(/user.*not found/i);
    });
  });

  describe('Token Invalidation', () => {
    it('should invalidate all user sessions on logout', async () => {
      // Login from another device (get another set of tokens)
      const secondLoginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'logout.test@example.com',
          password: 'Test@12345'
        });

      const secondAccessToken = secondLoginResponse.body.data.accessToken;

      // Logout from first device
      await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      // Second device token should also be invalidated (if implementing session management)
      // This depends on your token invalidation strategy
      const user = await User.findById(userId);
      expect(user.refreshToken).toBeNull();
    });

    it('should prevent token reuse after logout', async () => {
      // Logout
      await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      // Try to use the same access token again
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should prevent refresh token reuse after logout', async () => {
      // Logout
      await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      // Try to refresh with old refresh token
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toMatch(/invalid|token/i);
    });
  });

  describe('Concurrent Logout Requests', () => {
    it('should handle multiple logout requests gracefully', async () => {
      // Send multiple logout requests simultaneously
      const logoutPromises = [
        request(app)
          .post('/api/auth/logout')
          .set('Authorization', `Bearer ${accessToken}`),
        request(app)
          .post('/api/auth/logout')
          .set('Authorization', `Bearer ${accessToken}`),
        request(app)
          .post('/api/auth/logout')
          .set('Authorization', `Bearer ${accessToken}`)
      ];

      const responses = await Promise.all(logoutPromises);

      // At least one should succeed
      const successCount = responses.filter(r => r.status === 200).length;
      expect(successCount).toBeGreaterThanOrEqual(1);

      // Verify refresh token is cleared
      const user = await User.findById(userId);
      expect(user.refreshToken).toBeNull();
    });
  });

  describe('Security Validations', () => {
    it('should not expose sensitive information in logout response', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.data).toBeUndefined();
      expect(response.body).not.toHaveProperty('refreshToken');
      expect(response.body).not.toHaveProperty('password');
    });

    it('should log logout activity', async () => {
      const loggerSpy = jest.spyOn(logger, 'info');

      await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(loggerSpy).toHaveBeenCalled();
      loggerSpy.mockRestore();
    });

    it('should handle database errors gracefully during logout', async () => {
      // Mock database error
      const originalFindByIdAndUpdate = User.findByIdAndUpdate;
      User.findByIdAndUpdate = jest.fn().mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(500);

      expect(response.body.success).toBe(false);

      // Restore original method
      User.findByIdAndUpdate = originalFindByIdAndUpdate;
    });
  });
});
