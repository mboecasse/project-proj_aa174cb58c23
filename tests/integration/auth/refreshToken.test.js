// File: tests/integration/auth/refreshToken.test.js
// Generated: 2025-10-08 13:06:44 UTC
// Project ID: proj_aa174cb58c23
// Task ID: task_3ajkl8yycrsh


const RefreshToken = require('../../../src/models/RefreshToken');


const User = require('../../../src/models/User');


const app = require('../../../src/app');


const logger = require('../../../src/utils/logger');


const mongoose = require('mongoose');


const request = require('supertest');

const { generateAccessToken, generateRefreshToken, verifyRefreshToken } = require('../../../src/utils/jwt');

describe('Refresh Token Integration Tests', () => {
  let testUser;
  let validRefreshToken;
  let validAccessToken;

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
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    // Clear database
    await User.deleteMany({});
    await RefreshToken.deleteMany({});

    // Create test user
    testUser = await User.create({
      name: 'Test User',
      email: 'test@example.com',
      password: 'Password123!',
      isVerified: true
    });

    // Generate valid tokens
    validAccessToken = generateAccessToken({ userId: testUser._id, email: testUser.email });
    validRefreshToken = await generateRefreshToken(testUser._id);
  });

  afterEach(async () => {
    await User.deleteMany({});
    await RefreshToken.deleteMany({});
  });

  describe('POST /api/auth/refresh', () => {
    it('should successfully refresh tokens with valid refresh token', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken: validRefreshToken })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('accessToken');
      expect(response.body.data).toHaveProperty('refreshToken');
      expect(response.body.data.accessToken).toBeTruthy();
      expect(response.body.data.refreshToken).toBeTruthy();
      expect(response.body.data.refreshToken).not.toBe(validRefreshToken);

      // Verify old refresh token is invalidated
      const oldToken = await RefreshToken.findOne({ token: validRefreshToken });
      expect(oldToken).toBeNull();

      // Verify new refresh token exists
      const newToken = await RefreshToken.findOne({ token: response.body.data.refreshToken });
      expect(newToken).toBeTruthy();
      expect(newToken.userId.toString()).toBe(testUser._id.toString());
      expect(newToken.isRevoked).toBe(false);
    });

    it('should reject request without refresh token', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toMatch(/refresh token/i);
    });

    it('should reject request with invalid refresh token format', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken: 'invalid-token-format' })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toMatch(/invalid|expired/i);
    });

    it('should reject expired refresh token', async () => {
      // Create expired token
      const expiredToken = await RefreshToken.create({
        token: 'expired-token-value',
        userId: testUser._id,
        expiresAt: new Date(Date.now() - 1000 * 60 * 60) // 1 hour ago
      });

      const response = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken: expiredToken.token })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toMatch(/expired/i);
    });

    it('should reject revoked refresh token', async () => {
      // Revoke the token
      await RefreshToken.findOneAndUpdate(
        { token: validRefreshToken },
        { isRevoked: true }
      );

      const response = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken: validRefreshToken })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toMatch(/revoked|invalid/i);
    });

    it('should reject refresh token for non-existent user', async () => {
      // Delete user but keep token
      await User.findByIdAndDelete(testUser._id);

      const response = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken: validRefreshToken })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toMatch(/user|found/i);
    });

    it('should reject refresh token for unverified user', async () => {
      // Unverify user
      await User.findByIdAndUpdate(testUser._id, { isVerified: false });

      const response = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken: validRefreshToken })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toMatch(/verified|verify/i);
    });

    it('should handle token rotation correctly', async () => {
      // First refresh
      const firstResponse = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken: validRefreshToken })
        .expect(200);

      const firstNewToken = firstResponse.body.data.refreshToken;

      // Verify old token is gone
      const oldToken = await RefreshToken.findOne({ token: validRefreshToken });
      expect(oldToken).toBeNull();

      // Second refresh with new token
      const secondResponse = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken: firstNewToken })
        .expect(200);

      const secondNewToken = secondResponse.body.data.refreshToken;

      // Verify first new token is gone
      const firstToken = await RefreshToken.findOne({ token: firstNewToken });
      expect(firstToken).toBeNull();

      // Verify second new token exists
      const secondToken = await RefreshToken.findOne({ token: secondNewToken });
      expect(secondToken).toBeTruthy();
      expect(secondToken.userId.toString()).toBe(testUser._id.toString());
    });

    it('should prevent reuse of old refresh token after rotation', async () => {
      // First refresh
      const firstResponse = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken: validRefreshToken })
        .expect(200);

      // Try to reuse old token
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken: validRefreshToken })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toMatch(/invalid|expired/i);
    });

    it('should generate new access token with correct user data', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken: validRefreshToken })
        .expect(200);

      const newAccessToken = response.body.data.accessToken;

      // Verify new access token by using it
      const protectedResponse = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${newAccessToken}`)
        .expect(200);

      expect(protectedResponse.body.success).toBe(true);
      expect(protectedResponse.body.data.email).toBe(testUser.email);
      expect(protectedResponse.body.data._id).toBe(testUser._id.toString());
    });

    it('should handle concurrent refresh requests safely', async () => {
      // Send multiple refresh requests simultaneously
      const requests = Array(5).fill(null).map(() =>
        request(app)
          .post('/api/auth/refresh')
          .send({ refreshToken: validRefreshToken })
      );

      const responses = await Promise.allSettled(requests);

      // Only one should succeed
      const successfulResponses = responses.filter(r => r.status === 'fulfilled' && r.value.status === 200);
      const failedResponses = responses.filter(r => r.status === 'fulfilled' && r.value.status !== 200);

      expect(successfulResponses.length).toBe(1);
      expect(failedResponses.length).toBe(4);

      // Verify only one new token exists
      const tokens = await RefreshToken.find({ userId: testUser._id });
      expect(tokens.length).toBe(1);
      expect(tokens[0].isRevoked).toBe(false);
    });

    it('should clean up old refresh tokens on successful refresh', async () => {
      // Create multiple old tokens for same user
      await RefreshToken.create([
        {
          token: 'old-token-1',
          userId: testUser._id,
          expiresAt: new Date(Date.now() - 1000 * 60 * 60)
        },
        {
          token: 'old-token-2',
          userId: testUser._id,
          expiresAt: new Date(Date.now() - 1000 * 60 * 60 * 24)
        }
      ]);

      await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken: validRefreshToken })
        .expect(200);

      // Verify old expired tokens are cleaned up
      const expiredTokens = await RefreshToken.find({
        userId: testUser._id,
        expiresAt: { $lt: new Date() }
      });

      expect(expiredTokens.length).toBe(0);
    });

    it('should maintain refresh token expiry time correctly', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken: validRefreshToken })
        .expect(200);

      const newToken = await RefreshToken.findOne({ token: response.body.data.refreshToken });

      // Verify expiry is set correctly (7 days from now)
      const expectedExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      const timeDiff = Math.abs(newToken.expiresAt.getTime() - expectedExpiry.getTime());

      // Allow 5 second difference for test execution time
      expect(timeDiff).toBeLessThan(5000);
    });

    it('should reject malformed JSON in request body', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .set('Content-Type', 'application/json')
        .send('{"refreshToken": invalid}')
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should handle database errors gracefully', async () => {
      // Force database error by closing connection
      await mongoose.connection.close();

      const response = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken: validRefreshToken })
        .expect(500);

      expect(response.body.success).toBe(false);

      // Reconnect for cleanup
      await mongoose.connect(process.env.MONGODB_URI_TEST || 'mongodb://localhost:27017/auth-api-test', {
        useNewUrlParser: true,
        useUnifiedTopology: true
      });
    });

    it('should rate limit excessive refresh requests', async () => {
      const requests = [];

      // Send many requests quickly
      for (let i = 0; i < 150; i++) {
        requests.push(
          request(app)
            .post('/api/auth/refresh')
            .send({ refreshToken: validRefreshToken })
        );
      }

      const responses = await Promise.all(requests);

      // Some requests should be rate limited
      const rateLimitedResponses = responses.filter(r => r.status === 429);
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    });

    it('should validate refresh token belongs to requesting user', async () => {
      // Create another user
      const otherUser = await User.create({
        name: 'Other User',
        email: 'other@example.com',
        password: 'Password123!',
        isVerified: true
      });

      const otherUserToken = await generateRefreshToken(otherUser._id);

      // Try to use other user's token
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken: otherUserToken })
        .expect(200);

      // Should succeed but return tokens for correct user
      expect(response.body.success).toBe(true);

      // Verify new access token is for other user
      const protectedResponse = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${response.body.data.accessToken}`)
        .expect(200);

      expect(protectedResponse.body.data.email).toBe(otherUser.email);
    });
  });
});
