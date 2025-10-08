// File: src/routes/health.routes.js
// Generated: 2025-10-08 13:05:19 UTC
// Project ID: proj_aa174cb58c23
// Task ID: task_0lq36409cl14


const express = require('express');


const logger = require('../utils/logger');


const mongoose = require('../config/database');


const router = express.Router();

/**
 * GET /api/health
 * Basic health check endpoint
 * Returns server status and uptime
 */
router.get('/', async (req, res) => {
  try {
    const healthCheck = {
      success: true,
      message: 'Server is running',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development'
    };

    logger.info('Health check requested', { status: 'healthy' });

    res.status(200).json(healthCheck);
  } catch (error) {
    logger.error('Health check failed', { error: error.message });
    res.status(503).json({
      success: false,
      error: 'Service unavailable',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/health/ready
 * Readiness probe endpoint
 * Checks if server is ready to accept traffic
 * Verifies database connection
 */
router.get('/ready', async (req, res) => {
  try {
    const checks = {
      server: 'ok',
      database: 'checking'
    };

    // Check database connection
    if (mongoose.connection.readyState === 1) {
      checks.database = 'ok';

      logger.info('Readiness check passed', { checks });

      res.status(200).json({
        success: true,
        message: 'Service is ready',
        checks,
        timestamp: new Date().toISOString()
      });
    } else {
      checks.database = 'not connected';

      logger.warn('Readiness check failed - database not connected', { checks });

      res.status(503).json({
        success: false,
        error: 'Service not ready',
        checks,
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    logger.error('Readiness check error', { error: error.message });
    res.status(503).json({
      success: false,
      error: 'Service not ready',
      checks: {
        server: 'ok',
        database: 'error'
      },
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/health/live
 * Liveness probe endpoint
 * Checks if server process is alive
 */
router.get('/live', (req, res) => {
  try {
    logger.info('Liveness check requested', { status: 'alive' });

    res.status(200).json({
      success: true,
      message: 'Service is alive',
      timestamp: new Date().toISOString(),
      pid: process.pid,
      uptime: process.uptime()
    });
  } catch (error) {
    logger.error('Liveness check failed', { error: error.message });
    res.status(503).json({
      success: false,
      error: 'Service not alive',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/health/detailed
 * Detailed health check with system metrics
 * Returns comprehensive system information
 */
router.get('/detailed', async (req, res) => {
  try {
    const memoryUsage = process.memoryUsage();

    const healthDetails = {
      success: true,
      message: 'Detailed health check',
      timestamp: new Date().toISOString(),
      server: {
        status: 'running',
        uptime: process.uptime(),
        pid: process.pid,
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch
      },
      memory: {
        rss: `${Math.round(memoryUsage.rss / 1024 / 1024)} MB`,
        heapTotal: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)} MB`,
        heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)} MB`,
        external: `${Math.round(memoryUsage.external / 1024 / 1024)} MB`
      },
      database: {
        status: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
        name: mongoose.connection.name || 'N/A',
        host: mongoose.connection.host || 'N/A'
      },
      environment: process.env.NODE_ENV || 'development'
    };

    logger.info('Detailed health check requested', {
      status: healthDetails.server.status,
      dbStatus: healthDetails.database.status
    });

    res.status(200).json(healthDetails);
  } catch (error) {
    logger.error('Detailed health check failed', { error: error.message });
    res.status(503).json({
      success: false,
      error: 'Failed to retrieve health details',
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = router;
