// File: tests/helpers/apiClient.js
// Generated: 2025-10-08 13:05:27 UTC
// Project ID: proj_aa174cb58c23
// Task ID: task_0p2aqkd2j1bv


const request = require('supertest');

/**
 * API Client wrapper for Supertest
 * Provides authenticated request helpers for testing
 */
class ApiClient {
  constructor(app) {
    this.app = app;
    this.accessToken = null;
    this.refreshToken = null;
  }

  /**
   * Set authentication tokens
   * @param {string} accessToken - JWT access token
   * @param {string} refreshToken - JWT refresh token (optional)
   */
  setTokens(accessToken, refreshToken = null) {
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
  }

  /**
   * Clear authentication tokens
   */
  clearTokens() {
    this.accessToken = null;
    this.refreshToken = null;
  }

  /**
   * Make authenticated GET request
   * @param {string} url - Request URL
   * @param {object} query - Query parameters (optional)
   * @returns {Promise<Response>} Supertest response
   */
  async get(url, query = {}) {
    const req = request(this.app).get(url);

    if (this.accessToken) {
      req.set('Authorization', `Bearer ${this.accessToken}`);
    }

    if (Object.keys(query).length > 0) {
      req.query(query);
    }

    return req;
  }

  /**
   * Make authenticated POST request
   * @param {string} url - Request URL
   * @param {object} data - Request body
   * @returns {Promise<Response>} Supertest response
   */
  async post(url, data = {}) {
    const req = request(this.app).post(url).send(data);

    if (this.accessToken) {
      req.set('Authorization', `Bearer ${this.accessToken}`);
    }

    return req;
  }

  /**
   * Make authenticated PUT request
   * @param {string} url - Request URL
   * @param {object} data - Request body
   * @returns {Promise<Response>} Supertest response
   */
  async put(url, data = {}) {
    const req = request(this.app).put(url).send(data);

    if (this.accessToken) {
      req.set('Authorization', `Bearer ${this.accessToken}`);
    }

    return req;
  }

  /**
   * Make authenticated PATCH request
   * @param {string} url - Request URL
   * @param {object} data - Request body
   * @returns {Promise<Response>} Supertest response
   */
  async patch(url, data = {}) {
    const req = request(this.app).patch(url).send(data);

    if (this.accessToken) {
      req.set('Authorization', `Bearer ${this.accessToken}`);
    }

    return req;
  }

  /**
   * Make authenticated DELETE request
   * @param {string} url - Request URL
   * @returns {Promise<Response>} Supertest response
   */
  async delete(url) {
    const req = request(this.app).delete(url);

    if (this.accessToken) {
      req.set('Authorization', `Bearer ${this.accessToken}`);
    }

    return req;
  }

  /**
   * Make unauthenticated GET request
   * @param {string} url - Request URL
   * @param {object} query - Query parameters (optional)
   * @returns {Promise<Response>} Supertest response
   */
  async getPublic(url, query = {}) {
    const req = request(this.app).get(url);

    if (Object.keys(query).length > 0) {
      req.query(query);
    }

    return req;
  }

  /**
   * Make unauthenticated POST request
   * @param {string} url - Request URL
   * @param {object} data - Request body
   * @returns {Promise<Response>} Supertest response
   */
  async postPublic(url, data = {}) {
    return request(this.app).post(url).send(data);
  }

  /**
   * Register a new user and set tokens
   * @param {object} userData - User registration data
   * @returns {Promise<Response>} Supertest response
   */
  async register(userData) {
    const response = await this.postPublic('/api/auth/register', userData);

    if (response.status === 201 && response.body.data) {
      if (response.body.data.accessToken) {
        this.setTokens(response.body.data.accessToken, response.body.data.refreshToken);
      }
    }

    return response;
  }

  /**
   * Login user and set tokens
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {Promise<Response>} Supertest response
   */
  async login(email, password) {
    const response = await this.postPublic('/api/auth/login', { email, password });

    if (response.status === 200 && response.body.data) {
      if (response.body.data.accessToken) {
        this.setTokens(response.body.data.accessToken, response.body.data.refreshToken);
      }
    }

    return response;
  }

  /**
   * Logout user and clear tokens
   * @returns {Promise<Response>} Supertest response
   */
  async logout() {
    const response = await this.post('/api/auth/logout');
    this.clearTokens();
    return response;
  }

  /**
   * Refresh access token
   * @returns {Promise<Response>} Supertest response
   */
  async refreshAccessToken() {
    if (!this.refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await this.postPublic('/api/auth/refresh', {
      refreshToken: this.refreshToken
    });

    if (response.status === 200 && response.body.data) {
      if (response.body.data.accessToken) {
        this.setTokens(response.body.data.accessToken, response.body.data.refreshToken);
      }
    }

    return response;
  }

  /**
   * Get current user profile
   * @returns {Promise<Response>} Supertest response
   */
  async getProfile() {
    return this.get('/api/auth/profile');
  }

  /**
   * Update current user profile
   * @param {object} data - Profile update data
   * @returns {Promise<Response>} Supertest response
   */
  async updateProfile(data) {
    return this.put('/api/auth/profile', data);
  }

  /**
   * Request password reset
   * @param {string} email - User email
   * @returns {Promise<Response>} Supertest response
   */
  async forgotPassword(email) {
    return this.postPublic('/api/auth/forgot-password', { email });
  }

  /**
   * Reset password with token
   * @param {string} token - Reset token
   * @param {string} password - New password
   * @returns {Promise<Response>} Supertest response
   */
  async resetPassword(token, password) {
    return this.postPublic('/api/auth/reset-password', { token, password });
  }

  /**
   * Verify email with token
   * @param {string} token - Verification token
   * @returns {Promise<Response>} Supertest response
   */
  async verifyEmail(token) {
    return this.getPublic(`/api/auth/verify-email/${token}`);
  }

  /**
   * Resend verification email
   * @returns {Promise<Response>} Supertest response
   */
  async resendVerification() {
    return this.post('/api/auth/resend-verification');
  }

  /**
   * Change password (authenticated)
   * @param {string} currentPassword - Current password
   * @param {string} newPassword - New password
   * @returns {Promise<Response>} Supertest response
   */
  async changePassword(currentPassword, newPassword) {
    return this.put('/api/auth/change-password', {
      currentPassword,
      newPassword
    });
  }

  /**
   * Make request with custom headers
   * @param {string} method - HTTP method
   * @param {string} url - Request URL
   * @param {object} options - Request options (data, headers, query)
   * @returns {Promise<Response>} Supertest response
   */
  async request(method, url, options = {}) {
    const { data, headers = {}, query = {} } = options;

    let req = request(this.app)[method.toLowerCase()](url);

    if (this.accessToken) {
      req.set('Authorization', `Bearer ${this.accessToken}`);
    }

    Object.keys(headers).forEach(key => {
      req.set(key, headers[key]);
    });

    if (Object.keys(query).length > 0) {
      req.query(query);
    }

    if (data && ['post', 'put', 'patch'].includes(method.toLowerCase())) {
      req.send(data);
    }

    return req;
  }
}

module.exports = ApiClient;
