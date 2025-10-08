// File: tests/integration/auth/register.test.js
// Generated: 2025-10-08 13:06:45 UTC
// Project ID: proj_aa174cb58c23
// Task ID: task_ad6l68dt20gc


const User = require('../../../src/models/User');


const app = require('../../../src/app');


const logger = require('../../../src/utils/logger');


const mongoose = require('mongoose');


const request = require('supertest');

describe('POST /api/auth/register - User Registration', () => {
  beforeAll(async () => {
    // Connect to test database
    const mongoUri = process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/auth-api-test';
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
  });

  afterAll(async () => {
    // Clean up and close connection
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    // Clear users collection before each test
    await User.deleteMany({});
  });

  describe('Successful Registration', () => {
    it('should register a new user with valid data', async () => {
      const userData = {
        name: 'John Doe',
        email: 'john.doe@example.com',
        password: 'SecurePass123!',
        confirmPassword: 'SecurePass123!'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect('Content-Type', /json/)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data).toHaveProperty('accessToken');
      expect(response.body.data).toHaveProperty('refreshToken');
      expect(response.body.data.user.email).toBe(userData.email);
      expect(response.body.data.user.name).toBe(userData.name);
      expect(response.body.data.user).not.toHaveProperty('password');

      // Verify user was created in database
      const user = await User.findOne({ email: userData.email });
      expect(user).toBeTruthy();
      expect(user.name).toBe(userData.name);
      expect(user.email).toBe(userData.email);
      expect(user.password).not.toBe(userData.password); // Password should be hashed
    });

    it('should hash the password before storing', async () => {
      const userData = {
        name: 'Jane Smith',
        email: 'jane.smith@example.com',
        password: 'MyPassword456!',
        confirmPassword: 'MyPassword456!'
      };

      await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      const user = await User.findOne({ email: userData.email });
      expect(user.password).not.toBe(userData.password);
      expect(user.password).toMatch(/^\$2[aby]\$.{56}$/); // bcrypt hash pattern
    });

    it('should return valid JWT tokens', async () => {
      const userData = {
        name: 'Test User',
        email: 'test.user@example.com',
        password: 'TestPass789!',
        confirmPassword: 'TestPass789!'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body.data.accessToken).toMatch(/^[A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+\.?[A-Za-z0-9-_.+/=]*$/);
      expect(response.body.data.refreshToken).toMatch(/^[A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+\.?[A-Za-z0-9-_.+/=]*$/);
    });

    it('should set isEmailVerified to false by default', async () => {
      const userData = {
        name: 'Unverified User',
        email: 'unverified@example.com',
        password: 'Password123!',
        confirmPassword: 'Password123!'
      };

      await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      const user = await User.findOne({ email: userData.email });
      expect(user.isEmailVerified).toBe(false);
    });
  });

  describe('Validation Errors', () => {
    it('should reject registration without name', async () => {
      const userData = {
        email: 'noname@example.com',
        password: 'Password123!',
        confirmPassword: 'Password123!'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
      expect(response.body.errors.some(err => err.path === 'name')).toBe(true);
    });

    it('should reject registration without email', async () => {
      const userData = {
        name: 'No Email User',
        password: 'Password123!',
        confirmPassword: 'Password123!'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
      expect(response.body.errors.some(err => err.path === 'email')).toBe(true);
    });

    it('should reject registration with invalid email format', async () => {
      const userData = {
        name: 'Invalid Email User',
        email: 'not-an-email',
        password: 'Password123!',
        confirmPassword: 'Password123!'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
      expect(response.body.errors.some(err => err.path === 'email')).toBe(true);
    });

    it('should reject registration without password', async () => {
      const userData = {
        name: 'No Password User',
        email: 'nopassword@example.com',
        confirmPassword: 'Password123!'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
      expect(response.body.errors.some(err => err.path === 'password')).toBe(true);
    });

    it('should reject registration with weak password', async () => {
      const userData = {
        name: 'Weak Password User',
        email: 'weakpass@example.com',
        password: '123',
        confirmPassword: '123'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
      expect(response.body.errors.some(err => err.path === 'password')).toBe(true);
    });

    it('should reject registration when passwords do not match', async () => {
      const userData = {
        name: 'Mismatch User',
        email: 'mismatch@example.com',
        password: 'Password123!',
        confirmPassword: 'DifferentPass456!'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
      expect(response.body.errors.some(err => err.path === 'confirmPassword')).toBe(true);
    });

    it('should reject registration with name too short', async () => {
      const userData = {
        name: 'AB',
        email: 'shortname@example.com',
        password: 'Password123!',
        confirmPassword: 'Password123!'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
      expect(response.body.errors.some(err => err.path === 'name')).toBe(true);
    });

    it('should reject registration with name too long', async () => {
      const userData = {
        name: 'A'.repeat(101),
        email: 'longname@example.com',
        password: 'Password123!',
        confirmPassword: 'Password123!'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
      expect(response.body.errors.some(err => err.path === 'name')).toBe(true);
    });
  });

  describe('Duplicate Email Handling', () => {
    it('should reject registration with existing email', async () => {
      const userData = {
        name: 'First User',
        email: 'duplicate@example.com',
        password: 'Password123!',
        confirmPassword: 'Password123!'
      };

      // Register first user
      await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      // Try to register second user with same email
      const duplicateData = {
        name: 'Second User',
        email: 'duplicate@example.com',
        password: 'DifferentPass456!',
        confirmPassword: 'DifferentPass456!'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(duplicateData)
        .expect('Content-Type', /json/)
        .expect(409);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toMatch(/already exists|already registered/i);
    });

    it('should be case-insensitive for email duplicates', async () => {
      const userData = {
        name: 'First User',
        email: 'CaseSensitive@Example.com',
        password: 'Password123!',
        confirmPassword: 'Password123!'
      };

      await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      const duplicateData = {
        name: 'Second User',
        email: 'casesensitive@example.com',
        password: 'DifferentPass456!',
        confirmPassword: 'DifferentPass456!'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(duplicateData)
        .expect('Content-Type', /json/)
        .expect(409);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toMatch(/already exists|already registered/i);
    });
  });

  describe('Security', () => {
    it('should sanitize email input', async () => {
      const userData = {
        name: 'Sanitize Test',
        email: '  SANITIZE@EXAMPLE.COM  ',
        password: 'Password123!',
        confirmPassword: 'Password123!'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body.data.user.email).toBe('sanitize@example.com');
    });

    it('should prevent XSS in name field', async () => {
      const userData = {
        name: '<script>alert("XSS")</script>',
        email: 'xss@example.com',
        password: 'Password123!',
        confirmPassword: 'Password123!'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      const user = await User.findOne({ email: userData.email });
      expect(user.name).not.toContain('<script>');
    });

    it('should not expose password in response', async () => {
      const userData = {
        name: 'Security Test',
        email: 'security@example.com',
        password: 'Password123!',
        confirmPassword: 'Password123!'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body.data.user.password).toBeUndefined();
      expect(JSON.stringify(response.body)).not.toContain(userData.password);
    });

    it('should rate limit registration attempts', async () => {
      const requests = [];

      for (let i = 0; i < 10; i++) {
        const userData = {
          name: `User ${i}`,
          email: `user${i}@example.com`,
          password: 'Password123!',
          confirmPassword: 'Password123!'
        };

        requests.push(
          request(app)
            .post('/api/auth/register')
            .send(userData)
        );
      }

      const responses = await Promise.all(requests);
      const rateLimited = responses.some(res => res.status === 429);

      expect(rateLimited).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty request body', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({})
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
    });

    it('should handle malformed JSON', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .set('Content-Type', 'application/json')
        .send('{"name": "Invalid JSON"')
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should trim whitespace from name', async () => {
      const userData = {
        name: '  John Doe  ',
        email: 'trim@example.com',
        password: 'Password123!',
        confirmPassword: 'Password123!'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body.data.user.name).toBe('John Doe');
    });

    it('should handle special characters in name', async () => {
      const userData = {
        name: "O'Brien-Smith Jr.",
        email: 'special@example.com',
        password: 'Password123!',
        confirmPassword: 'Password123!'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body.data.user.name).toBe("O'Brien-Smith Jr.");
