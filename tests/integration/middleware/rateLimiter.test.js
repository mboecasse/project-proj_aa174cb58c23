// File: tests/integration/middleware/rateLimiter.test.js
// Generated: 2025-10-08 13:06:17 UTC
// Project ID: proj_aa174cb58c23
// Task ID: task_khci99l4wp3z


const apiClient = require('../helpers/apiClient');


const express = require('express');


const logger = require('../../src/utils/logger');


const mongoose = require('mongoose');


const rateLimit = require('express-rate-limit');


const request = require('supertest');

const { MongoMemoryServer } = require('mongodb-memory-server');

// Mock logger to prevent console output during tests
jest.mock('../../src/utils/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn()
}));

describe('Rate Limiter Integration Tests', () => {
  let app;
  let mongoServer;
  let testClient;

  beforeAll(async () => {
    // Setup in-memory MongoDB
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(() => {
    // Create fresh Express app for each test
    app = express();
    app.use(express.json());

    // Initialize test client
    testClient = apiClient(app);

    // Clear all mocks
    jest.clearAllMocks();
  });

  describe('Basic Rate Limiting', () => {
    beforeEach(() => {
      // Setup basic rate limiter: 3 requests per 1 second
      const limiter = rateLimit({
        windowMs: 1000,
        max: 3,
        message: { success: false, error: 'Too many requests, please try again later' },
        standardHeaders: true,
        legacyHeaders: false
      });

      app.use('/api/test', limiter);
      app.get('/api/test', (req, res) => {
        res.json({ success: true, message: 'Request successful' });
      });
    });

    test('should allow requests within limit', async () => {
      const response1 = await request(app).get('/api/test');
      expect(response1.status).toBe(200);
      expect(response1.body.success).toBe(true);

      const response2 = await request(app).get('/api/test');
      expect(response2.status).toBe(200);
      expect(response2.body.success).toBe(true);

      const response3 = await request(app).get('/api/test');
      expect(response3.status).toBe(200);
      expect(response3.body.success).toBe(true);
    });

    test('should block requests exceeding limit', async () => {
      // Make 3 successful requests
      await request(app).get('/api/test');
      await request(app).get('/api/test');
      await request(app).get('/api/test');

      // 4th request should be blocked
      const response = await request(app).get('/api/test');
      expect(response.status).toBe(429);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Too many requests');
    });

    test('should include rate limit headers', async () => {
      const response = await request(app).get('/api/test');

      expect(response.headers['ratelimit-limit']).toBeDefined();
      expect(response.headers['ratelimit-remaining']).toBeDefined();
      expect(response.headers['ratelimit-reset']).toBeDefined();
    });

    test('should reset limit after window expires', async () => {
      // Make 3 requests to hit limit
      await request(app).get('/api/test');
      await request(app).get('/api/test');
      await request(app).get('/api/test');

      // 4th request should fail
      const blockedResponse = await request(app).get('/api/test');
      expect(blockedResponse.status).toBe(429);

      // Wait for window to reset (1 second + buffer)
      await new Promise(resolve => setTimeout(resolve, 1100));

      // Should be able to make requests again
      const response = await request(app).get('/api/test');
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('IP-based Rate Limiting', () => {
    beforeEach(() => {
      const limiter = rateLimit({
        windowMs: 1000,
        max: 2,
        message: { success: false, error: 'Rate limit exceeded' },
        standardHeaders: true,
        legacyHeaders: false,
        keyGenerator: (req) => req.ip
      });

      app.use('/api/ip-test', limiter);
      app.get('/api/ip-test', (req, res) => {
        res.json({ success: true, ip: req.ip });
      });
    });

    test('should track requests by IP address', async () => {
      const ip1 = '192.168.1.1';
      const ip2 = '192.168.1.2';

      // IP1 makes 2 requests (hits limit)
      await request(app).get('/api/ip-test').set('X-Forwarded-For', ip1);
      await request(app).get('/api/ip-test').set('X-Forwarded-For', ip1);

      // IP1's 3rd request should be blocked
      const blockedResponse = await request(app)
        .get('/api/ip-test')
        .set('X-Forwarded-For', ip1);
      expect(blockedResponse.status).toBe(429);

      // IP2 should still be able to make requests
      const ip2Response = await request(app)
        .get('/api/ip-test')
        .set('X-Forwarded-For', ip2);
      expect(ip2Response.status).toBe(200);
      expect(ip2Response.body.success).toBe(true);
    });
  });

  describe('Endpoint-specific Rate Limiting', () => {
    beforeEach(() => {
      // Strict limit for login endpoint
      const loginLimiter = rateLimit({
        windowMs: 60000, // 1 minute
        max: 3,
        message: { success: false, error: 'Too many login attempts' },
        skipSuccessfulRequests: false
      });

      // Relaxed limit for general API
      const apiLimiter = rateLimit({
        windowMs: 60000,
        max: 10,
        message: { success: false, error: 'API rate limit exceeded' }
      });

      app.post('/api/auth/login', loginLimiter, (req, res) => {
        res.json({ success: true, message: 'Login successful' });
      });

      app.get('/api/data', apiLimiter, (req, res) => {
        res.json({ success: true, data: [] });
      });
    });

    test('should apply different limits to different endpoints', async () => {
      // Login endpoint allows 3 requests
      await request(app).post('/api/auth/login').send({ email: 'test@test.com' });
      await request(app).post('/api/auth/login').send({ email: 'test@test.com' });
      await request(app).post('/api/auth/login').send({ email: 'test@test.com' });

      const loginBlocked = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@test.com' });
      expect(loginBlocked.status).toBe(429);
      expect(loginBlocked.body.error).toContain('login attempts');

      // Data endpoint should still work (different limit)
      const dataResponse = await request(app).get('/api/data');
      expect(dataResponse.status).toBe(200);
      expect(dataResponse.body.success).toBe(true);
    });
  });

  describe('Skip Successful Requests', () => {
    beforeEach(() => {
      const limiter = rateLimit({
        windowMs: 1000,
        max: 2,
        message: { success: false, error: 'Rate limit exceeded' },
        skipSuccessfulRequests: true
      });

      app.use('/api/skip-test', limiter);
      app.post('/api/skip-test', (req, res) => {
        const { fail } = req.body;
        if (fail) {
          return res.status(400).json({ success: false, error: 'Bad request' });
        }
        res.json({ success: true, message: 'Success' });
      });
    });

    test('should not count successful requests toward limit', async () => {
      // Make 5 successful requests
      for (let i = 0; i < 5; i++) {
        const response = await request(app)
          .post('/api/skip-test')
          .send({ fail: false });
        expect(response.status).toBe(200);
      }

      // All should succeed since successful requests are skipped
      const response = await request(app)
        .post('/api/skip-test')
        .send({ fail: false });
      expect(response.status).toBe(200);
    });

    test('should count failed requests toward limit', async () => {
      // Make 2 failed requests (hits limit)
      await request(app).post('/api/skip-test').send({ fail: true });
      await request(app).post('/api/skip-test').send({ fail: true });

      // 3rd failed request should be rate limited
      const response = await request(app)
        .post('/api/skip-test')
        .send({ fail: true });
      expect(response.status).toBe(429);
    });
  });

  describe('Custom Key Generator', () => {
    beforeEach(() => {
      const limiter = rateLimit({
        windowMs: 1000,
        max: 2,
        message: { success: false, error: 'User rate limit exceeded' },
        keyGenerator: (req) => {
          // Use user ID if authenticated, otherwise IP
          return req.headers['x-user-id'] || req.ip;
        }
      });

      app.use('/api/user-test', limiter);
      app.get('/api/user-test', (req, res) => {
        res.json({ success: true, userId: req.headers['x-user-id'] });
      });
    });

    test('should rate limit by user ID when provided', async () => {
      const userId = 'user123';

      // User makes 2 requests (hits limit)
      await request(app).get('/api/user-test').set('X-User-Id', userId);
      await request(app).get('/api/user-test').set('X-User-Id', userId);

      // 3rd request should be blocked
      const response = await request(app)
        .get('/api/user-test')
        .set('X-User-Id', userId);
      expect(response.status).toBe(429);
    });

    test('should rate limit by IP when user ID not provided', async () => {
      const ip = '192.168.1.100';

      // Make 2 requests from same IP
      await request(app).get('/api/user-test').set('X-Forwarded-For', ip);
      await request(app).get('/api/user-test').set('X-Forwarded-For', ip);

      // 3rd request should be blocked
      const response = await request(app)
        .get('/api/user-test')
        .set('X-Forwarded-For', ip);
      expect(response.status).toBe(429);
    });
  });

  describe('Skip Function', () => {
    beforeEach(() => {
      const limiter = rateLimit({
        windowMs: 1000,
        max: 2,
        message: { success: false, error: 'Rate limit exceeded' },
        skip: (req) => {
          // Skip rate limiting for admin users
          return req.headers['x-user-role'] === 'admin';
        }
      });

      app.use('/api/skip-role', limiter);
      app.get('/api/skip-role', (req, res) => {
        res.json({ success: true, role: req.headers['x-user-role'] });
      });
    });

    test('should skip rate limiting for admin users', async () => {
      // Admin makes 5 requests (all should succeed)
      for (let i = 0; i < 5; i++) {
        const response = await request(app)
          .get('/api/skip-role')
          .set('X-User-Role', 'admin');
        expect(response.status).toBe(200);
      }
    });

    test('should apply rate limiting for regular users', async () => {
      // Regular user makes 2 requests
      await request(app).get('/api/skip-role').set('X-User-Role', 'user');
      await request(app).get('/api/skip-role').set('X-User-Role', 'user');

      // 3rd request should be blocked
      const response = await request(app)
        .get('/api/skip-role')
        .set('X-User-Role', 'user');
      expect(response.status).toBe(429);
    });
  });

  describe('Handler Function', () => {
    beforeEach(() => {
      const customHandler = (req, res) => {
        logger.warn('Rate limit exceeded', {
          ip: req.ip,
          path: req.path,
          method: req.method
        });
        res.status(429).json({
          success: false,
          error: 'Rate limit exceeded',
          retryAfter: req.rateLimit.resetTime
        });
      };

      const limiter = rateLimit({
        windowMs: 1000,
        max: 2,
        handler: customHandler
      });

      app.use('/api/custom-handler', limiter);
      app.get('/api/custom-handler', (req, res) => {
        res.json({ success: true });
      });
    });

    test('should use custom handler when limit exceeded', async () => {
      // Make 2 requests to hit limit
      await request(app).get('/api/custom-handler');
      await request(app).get('/api/custom-handler');

      // 3rd request should trigger custom handler
      const response = await request(app).get('/api/custom-handler');
      expect(response.status).toBe(429);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Rate limit exceeded');
      expect(response.body.retryAfter).toBeDefined();
      expect(logger.warn).toHaveBeenCalledWith(
        'Rate limit exceeded',
        expect.objectContaining({
          path: '/api/custom-handler',
          method: 'GET'
        })
      );
    });
  });

  describe('Multiple Rate Limiters', () => {
    beforeEach(() => {
      // Global rate limiter
      const globalLimiter = rateLimit({
        windowMs: 60000,
        max: 100,
        message: { success: false, error: 'Global rate limit exceeded' }
      });

      // Endpoint-specific rate limiter
      const strictLimiter = rateLimit({
        windowMs: 1000,
        max: 2,
        message: { success: false, error: 'Endpoint rate limit exceeded' }
      });

      app.use(globalLimiter);
      app.get('/api/strict', strictLimiter, (req, res) => {
        res.json({ success: true });
      });
      app.get('/api/normal', (req, res) => {
        res.json({ success: true });
      });
    });

    test('should apply both global and endpoint-specific limits', async () => {
      // Strict endpoint hits its limit first
      await request(app).get('/api/strict');
      await request(app).get('/api/strict');

      const strictBlocked = await request(app).get('/api/strict');
      expect(strictBlocked.status).toBe(429);
      expect(strictBlocked.body.error).toContain('Endpoint rate limit');

      // Normal
