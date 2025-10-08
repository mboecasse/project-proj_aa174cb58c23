// File: src/controllers/health.controller.js
// Generated: 2025-10-08 13:05:46 UTC
// Project ID: proj_aa174cb58c23
// Task ID: task_azsh2l3i9xf4


const logger = require('../utils/logger');


const mongoose = require('../config/database');


const redis = require('../config/redis');

/**
 * Health check controller
 * Provides comprehensive health status including database and Redis connectivity
 */

/**
 * Basic health check
 * GET /api/health
 */
exports.healthCheck = async (req, res, next) => {
  try {
    const healthStatus = {
      status: 'UP',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development'
    };

    logger.info('Health check requested', { status: healthStatus.status });

    res.json({
      success: true,
      data: healthStatus
    });
  } catch (error) {
    logger.error('Health check failed', { error: error.message });
    next(error);
  }
};

/**
 * Detailed health check with database and Redis status
 * GET /api/health/detailed
 */
exports.detailedHealthCheck = async (req, res, next) => {
  try {
    const healthStatus = {
      status: 'UP',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      services: {}
    };

    // Check MongoDB connection
    try {
      const mongoState = mongoose.connection.readyState;
      const mongoStates = {
        0: 'disconnected',
        1: 'connected',
        2: 'connecting',
        3: 'disconnecting'
      };

      healthStatus.services.mongodb = {
        status: mongoState === 1 ? 'UP' : 'DOWN',
        state: mongoStates[mongoState] || 'unknown',
        host: mongoose.connection.host || 'unknown',
        name: mongoose.connection.name || 'unknown'
      };

      if (mongoState === 1) {
        // Perform a simple ping to verify connection
        await mongoose.connection.db.admin().ping();
        logger.debug('MongoDB ping successful');
      } else {
        healthStatus.status = 'DEGRADED';
        logger.warn('MongoDB connection not ready', { state: mongoStates[mongoState] });
      }
    } catch (error) {
      healthStatus.status = 'DEGRADED';
      healthStatus.services.mongodb = {
        status: 'DOWN',
        error: error.message
      };
      logger.error('MongoDB health check failed', { error: error.message });
    }

    // Check Redis connection
    try {
      const redisStatus = redis.status;
      healthStatus.services.redis = {
        status: redisStatus === 'ready' ? 'UP' : 'DOWN',
        state: redisStatus
      };

      if (redisStatus === 'ready') {
        // Perform a simple ping to verify connection
        await redis.ping();
        logger.debug('Redis ping successful');
      } else {
        healthStatus.status = 'DEGRADED';
        logger.warn('Redis connection not ready', { state: redisStatus });
      }
    } catch (error) {
      healthStatus.status = 'DEGRADED';
      healthStatus.services.redis = {
        status: 'DOWN',
        error: error.message
      };
      logger.error('Redis health check failed', { error: error.message });
    }

    // Add memory usage
    const memoryUsage = process.memoryUsage();
    healthStatus.memory = {
      rss: `${Math.round(memoryUsage.rss / 1024 / 1024)}MB`,
      heapTotal: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)}MB`,
      heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB`,
      external: `${Math.round(memoryUsage.external / 1024 / 1024)}MB`
    };

    logger.info('Detailed health check completed', {
      status: healthStatus.status,
      mongodb: healthStatus.services.mongodb?.status,
      redis: healthStatus.services.redis?.status
    });

    const statusCode = healthStatus.status === 'UP' ? 200 : 503;

    res.status(statusCode).json({
      success: healthStatus.status !== 'DOWN',
      data: healthStatus
    });
  } catch (error) {
    logger.error('Detailed health check failed', { error: error.message });
    next(error);
  }
};

/**
 * Readiness check - determines if service is ready to accept traffic
 * GET /api/health/ready
 */
exports.readinessCheck = async (req, res, next) => {
  try {
    const isMongoReady = mongoose.connection.readyState === 1;
    const isRedisReady = redis.status === 'ready';

    const ready = isMongoReady && isRedisReady;

    const readinessStatus = {
      ready,
      timestamp: new Date().toISOString(),
      checks: {
        mongodb: isMongoReady,
        redis: isRedisReady
      }
    };

    logger.info('Readiness check requested', { ready });

    const statusCode = ready ? 200 : 503;

    res.status(statusCode).json({
      success: ready,
      data: readinessStatus
    });
  } catch (error) {
    logger.error('Readiness check failed', { error: error.message });
    next(error);
  }
};

/**
 * Liveness check - determines if service is alive
 * GET /api/health/live
 */
exports.livenessCheck = async (req, res, next) => {
  try {
    const livenessStatus = {
      alive: true,
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    };

    logger.debug('Liveness check requested');

    res.json({
      success: true,
      data: livenessStatus
    });
  } catch (error) {
    logger.error('Liveness check failed', { error: error.message });
    next(error);
  }
};
