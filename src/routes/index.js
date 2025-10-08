// File: src/routes/index.js
// Generated: 2025-10-08 13:05:05 UTC
// Project ID: proj_aa174cb58c23
// Task ID: task_a9hclfm09kmb


const authRoutes = require('./authRoutes');


const express = require('express');


const logger = require('../utils/logger');


const userRoutes = require('./userRoutes');


const router = express.Router();

// Import route modules

/**
 * Health check endpoint
 */
router.get('/health', (req, res) => {
  logger.info('Health check requested');
  res.json({
    success: true,
    message: 'API is running',
    timestamp: new Date().toISOString()
  });
});

/**
 * API version info
 */
router.get('/', (req, res) => {
  logger.info('API root accessed');
  res.json({
    success: true,
    message: 'Welcome to the API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      users: '/api/users',
      health: '/api/health'
    }
  });
});

/**
 * Mount route modules
 */
router.use('/auth', authRoutes);
router.use('/users', userRoutes);

/**
 * 404 handler for undefined routes
 */
router.use('*', (req, res) => {
  logger.warn('Route not found', {
    method: req.method,
    path: req.originalUrl,
    ip: req.ip
  });

  res.status(404).json({
    success: false,
    error: 'Route not found',
    path: req.originalUrl
  });
});

module.exports = router;
