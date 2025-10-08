// File: tests/integration/security/csrf.test.js
// Generated: 2025-10-08 13:06:22 UTC
// Project ID: proj_aa174cb58c23
// Task ID: task_j3ju5ees3kqp


const cookieParser = require('cookie-parser');


const express = require('express');


const request = require('supertest');

const { securityMiddleware, csrfProtection, generateCsrfToken } = require('../../../src/middleware/security');

describe('CSRF Protection Integration Tests', () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
    app.use(cookieParser());
    app.use(securityMiddleware);
  });

  describe('CSRF Token Generation', () => {
    it('should generate CSRF token on GET request', async () => {
      app.get('/api/csrf-token', csrfProtection, generateCsrfToken);

      const response = await request(app)
        .get('/api/csrf-token')
        .expect(200);

      expect(response.body).toHaveProperty('csrfToken');
      expect(typeof response.body.csrfToken).toBe('string');
      expect(response.body.csrfToken.length).toBeGreaterThan(0);
    });

    it('should set CSRF token in cookie', async () => {
      app.get('/api/csrf-token', csrfProtection, generateCsrfToken);

      const response = await request(app)
        .get('/api/csrf-token')
        .expect(200);

      const cookies = response.headers['set-cookie'];
      expect(cookies).toBeDefined();
      expect(cookies.some(cookie => cookie.includes('_csrf'))).toBe(true);
    });

    it('should generate different tokens for different requests', async () => {
      app.get('/api/csrf-token', csrfProtection, generateCsrfToken);

      const response1 = await request(app)
        .get('/api/csrf-token')
        .expect(200);

      const response2 = await request(app)
        .get('/api/csrf-token')
        .expect(200);

      expect(response1.body.csrfToken).not.toBe(response2.body.csrfToken);
    });
  });

  describe('CSRF Token Validation', () => {
    let csrfToken;
    let cookies;

    beforeEach(async () => {
      app.get('/api/csrf-token', csrfProtection, generateCsrfToken);
      app.post('/api/protected', csrfProtection, (req, res) => {
        res.json({ success: true, message: 'Request successful' });
      });

      const response = await request(app).get('/api/csrf-token');
      csrfToken = response.body.csrfToken;
      cookies = response.headers['set-cookie'];
    });

    it('should accept valid CSRF token in header', async () => {
      const response = await request(app)
        .post('/api/protected')
        .set('Cookie', cookies)
        .set('X-CSRF-Token', csrfToken)
        .send({ data: 'test' })
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should accept valid CSRF token in body', async () => {
      const response = await request(app)
        .post('/api/protected')
        .set('Cookie', cookies)
        .send({ _csrf: csrfToken, data: 'test' })
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should reject request without CSRF token', async () => {
      const response = await request(app)
        .post('/api/protected')
        .set('Cookie', cookies)
        .send({ data: 'test' })
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('CSRF');
    });

    it('should reject request with invalid CSRF token', async () => {
      const response = await request(app)
        .post('/api/protected')
        .set('Cookie', cookies)
        .set('X-CSRF-Token', 'invalid-token')
        .send({ data: 'test' })
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('CSRF');
    });

    it('should reject request with expired CSRF token', async () => {
      const response = await request(app)
        .post('/api/protected')
        .set('X-CSRF-Token', csrfToken)
        .send({ data: 'test' })
        .expect(403);

      expect(response.body.success).toBe(false);
    });

    it('should reject request with mismatched token and cookie', async () => {
      const response1 = await request(app).get('/api/csrf-token');
      const token1 = response1.body.csrfToken;

      const response2 = await request(app).get('/api/csrf-token');
      const cookies2 = response2.headers['set-cookie'];

      const response = await request(app)
        .post('/api/protected')
        .set('Cookie', cookies2)
        .set('X-CSRF-Token', token1)
        .send({ data: 'test' })
        .expect(403);

      expect(response.body.success).toBe(false);
    });
  });

  describe('CSRF Protection for Different HTTP Methods', () => {
    let csrfToken;
    let cookies;

    beforeEach(async () => {
      app.get('/api/csrf-token', csrfProtection, generateCsrfToken);
      app.get('/api/data', csrfProtection, (req, res) => {
        res.json({ success: true, data: 'test' });
      });
      app.post('/api/data', csrfProtection, (req, res) => {
        res.json({ success: true, message: 'Created' });
      });
      app.put('/api/data', csrfProtection, (req, res) => {
        res.json({ success: true, message: 'Updated' });
      });
      app.patch('/api/data', csrfProtection, (req, res) => {
        res.json({ success: true, message: 'Patched' });
      });
      app.delete('/api/data', csrfProtection, (req, res) => {
        res.json({ success: true, message: 'Deleted' });
      });

      const response = await request(app).get('/api/csrf-token');
      csrfToken = response.body.csrfToken;
      cookies = response.headers['set-cookie'];
    });

    it('should not require CSRF token for GET requests', async () => {
      await request(app)
        .get('/api/data')
        .expect(200);
    });

    it('should require CSRF token for POST requests', async () => {
      await request(app)
        .post('/api/data')
        .set('Cookie', cookies)
        .send({ data: 'test' })
        .expect(403);

      await request(app)
        .post('/api/data')
        .set('Cookie', cookies)
        .set('X-CSRF-Token', csrfToken)
        .send({ data: 'test' })
        .expect(200);
    });

    it('should require CSRF token for PUT requests', async () => {
      await request(app)
        .put('/api/data')
        .set('Cookie', cookies)
        .send({ data: 'test' })
        .expect(403);

      await request(app)
        .put('/api/data')
        .set('Cookie', cookies)
        .set('X-CSRF-Token', csrfToken)
        .send({ data: 'test' })
        .expect(200);
    });

    it('should require CSRF token for PATCH requests', async () => {
      await request(app)
        .patch('/api/data')
        .set('Cookie', cookies)
        .send({ data: 'test' })
        .expect(403);

      await request(app)
        .patch('/api/data')
        .set('Cookie', cookies)
        .set('X-CSRF-Token', csrfToken)
        .send({ data: 'test' })
        .expect(200);
    });

    it('should require CSRF token for DELETE requests', async () => {
      await request(app)
        .delete('/api/data')
        .set('Cookie', cookies)
        .expect(403);

      await request(app)
        .delete('/api/data')
        .set('Cookie', cookies)
        .set('X-CSRF-Token', csrfToken)
        .expect(200);
    });
  });

  describe('CSRF Token Refresh', () => {
    it('should allow token refresh', async () => {
      app.get('/api/csrf-token', csrfProtection, generateCsrfToken);

      const response1 = await request(app)
        .get('/api/csrf-token')
        .expect(200);

      const token1 = response1.body.csrfToken;
      const cookies1 = response1.headers['set-cookie'];

      const response2 = await request(app)
        .get('/api/csrf-token')
        .set('Cookie', cookies1)
        .expect(200);

      const token2 = response2.body.csrfToken;

      expect(token1).not.toBe(token2);
    });

    it('should invalidate old token after refresh', async () => {
      app.get('/api/csrf-token', csrfProtection, generateCsrfToken);
      app.post('/api/protected', csrfProtection, (req, res) => {
        res.json({ success: true });
      });

      const response1 = await request(app).get('/api/csrf-token');
      const token1 = response1.body.csrfToken;
      const cookies1 = response1.headers['set-cookie'];

      const response2 = await request(app)
        .get('/api/csrf-token')
        .set('Cookie', cookies1);
      const token2 = response2.body.csrfToken;
      const cookies2 = response2.headers['set-cookie'];

      await request(app)
        .post('/api/protected')
        .set('Cookie', cookies2)
        .set('X-CSRF-Token', token1)
        .send({ data: 'test' })
        .expect(403);

      await request(app)
        .post('/api/protected')
        .set('Cookie', cookies2)
        .set('X-CSRF-Token', token2)
        .send({ data: 'test' })
        .expect(200);
    });
  });

  describe('CSRF Cookie Security', () => {
    it('should set secure cookie attributes in production', async () => {
      process.env.NODE_ENV = 'production';

      const prodApp = express();
      prodApp.use(express.json());
      prodApp.use(cookieParser());
      prodApp.use(securityMiddleware);
      prodApp.get('/api/csrf-token', csrfProtection, generateCsrfToken);

      const response = await request(prodApp)
        .get('/api/csrf-token')
        .expect(200);

      const cookies = response.headers['set-cookie'];
      const csrfCookie = cookies.find(cookie => cookie.includes('_csrf'));

      expect(csrfCookie).toContain('HttpOnly');
      expect(csrfCookie).toContain('Secure');
      expect(csrfCookie).toContain('SameSite=Strict');

      process.env.NODE_ENV = 'test';
    });

    it('should not expose CSRF secret in response', async () => {
      app.get('/api/csrf-token', csrfProtection, generateCsrfToken);

      const response = await request(app)
        .get('/api/csrf-token')
        .expect(200);

      expect(response.body).not.toHaveProperty('secret');
      expect(response.body).not.toHaveProperty('_csrfSecret');
      expect(JSON.stringify(response.body)).not.toContain('secret');
    });
  });

  describe('CSRF Protection Edge Cases', () => {
    let csrfToken;
    let cookies;

    beforeEach(async () => {
      app.get('/api/csrf-token', csrfProtection, generateCsrfToken);
      app.post('/api/protected', csrfProtection, (req, res) => {
        res.json({ success: true });
      });

      const response = await request(app).get('/api/csrf-token');
      csrfToken = response.body.csrfToken;
      cookies = response.headers['set-cookie'];
    });

    it('should handle empty CSRF token', async () => {
      await request(app)
        .post('/api/protected')
        .set('Cookie', cookies)
        .set('X-CSRF-Token', '')
        .send({ data: 'test' })
        .expect(403);
    });

    it('should handle malformed CSRF token', async () => {
      await request(app)
        .post('/api/protected')
        .set('Cookie', cookies)
        .set('X-CSRF-Token', 'malformed@#$%^&*()')
        .send({ data: 'test' })
        .expect(403);
    });

    it('should handle very long CSRF token', async () => {
      const longToken = 'a'.repeat(10000);

      await request(app)
        .post('/api/protected')
        .set('Cookie', cookies)
        .set('X-CSRF-Token', longToken)
        .send({ data: 'test' })
        .expect(403);
    });

    it('should handle multiple CSRF tokens in request', async () => {
      await request(app)
        .post('/api/protected')
        .set('Cookie', cookies)
        .set('X-CSRF-Token', csrfToken)
        .send({ _csrf: 'different-token', data: 'test' })
        .expect(200);
    });

    it('should handle case-sensitive token validation', async () => {
      const upperToken = csrfToken.toUpperCase();

      await request(app)
        .post('/api/protected')
        .set('Cookie', cookies)
        .set('X-CSRF-Token', upperToken)
        .send({ data: 'test' })
        .expect(403);
    });
  });

  describe('CSRF Protection with CORS', () => {
    beforeEach(() => {
      app.use((req, res, next) => {
        res.header('Access-Control-Allow-Origin', 'http://localhost:3000');
        res.header('Access-Control-Allow-Credentials', 'true');
        res.header('Access-Control-Allow-Headers', 'Content-Type, X-CSRF-Token');
        next();
      });
    });

    it('should work with CORS preflight requests', async () => {
      app.post('/api/protected', csrfProtection, (req, res) => {
        res.json({ success: true });
      });

      await request(app)
        .options('/api/protected')
        .set('Origin', 'http://localhost:3000')
        .set('Access-Control-Request-Method', 'POST')
        .set('Access-Control-Request-Headers', 'X-CSRF-Token')
        .expect(200);
    });

    it('should validate CSRF token in cross-origin requests', async () => {
      app.get('/api/csrf-token', csrfProtection, generateCsrfToken);
      app.post('/api/protected', csrfProtection, (req, res) => {
        res.json({ success: true });
      });

      const tokenResponse = await request(app)
        .get('/api/csrf-token')
        .set('Origin', 'http://localhost:3000');

      const csrfToken = tokenResponse.body.csrfToken;
