// File: src/server.js
// Generated: 2025-10-08 13:06:17 UTC
// Project ID: proj_aa174cb58c23
// Task ID: task_648vtnhbu4un

      const mongoose = require('mongoose');
      const redis = require('./config/redis');


const app = require('./app');


const connectDB = require('./config/database');


const connectRedis = require('./config/redis');


const http = require('http');


const logger = require('./utils/logger');


const PORT = process.env.PORT || 3000;


const NODE_ENV = process.env.NODE_ENV || 'development';

/**
 * Normalize port value
 */


function normalizePort(val) {
  const port = parseInt(val, 10);

  if (isNaN(port)) {
    return val;
  }

  if (port >= 0) {
    return port;
  }

  return false;
}

/**
 * Event listener for HTTP server "error" event
 */


function onError(error) {
  if (error.syscall !== 'listen') {
    throw error;
  }

  const bind = typeof PORT === 'string' ? `Pipe ${PORT}` : `Port ${PORT}`;

  switch (error.code) {
    case 'EACCES':
      logger.error(`${bind} requires elevated privileges`);
      process.exit(1);
      break;
    case 'EADDRINUSE':
      logger.error(`${bind} is already in use`);
      process.exit(1);
      break;
    default:
      throw error;
  }
}

/**
 * Event listener for HTTP server "listening" event
 */


function onListening() {
  const addr = server.address();
  const bind = typeof addr === 'string' ? `pipe ${addr}` : `port ${addr.port}`;
  logger.info(`Server listening on ${bind} in ${NODE_ENV} mode`);
}

/**
 * Graceful shutdown handler
 */
async function gracefulShutdown(signal) {
  logger.info(`${signal} signal received: closing HTTP server`);

  server.close(async () => {
    logger.info('HTTP server closed');

    try {
      await mongoose.connection.close();
      logger.info('MongoDB connection closed');

      if (redis.isOpen) {
        await redis.quit();
        logger.info('Redis connection closed');
      }

      logger.info('Graceful shutdown completed');
      process.exit(0);
    } catch (error) {
      logger.error('Error during graceful shutdown', { error: error.message });
      process.exit(1);
    }
  });

  setTimeout(() => {
    logger.error('Forced shutdown after timeout');
    process.exit(1);
  }, 30000);
}

/**
 * Initialize server
 */
async function startServer() {
  try {
    await connectDB();
    logger.info('Database connected successfully');

    await connectRedis();
    logger.info('Redis connected successfully');

    const port = normalizePort(PORT);
    app.set('port', port);

    const server = http.createServer(app);

    server.listen(port);
    server.on('error', onError);
    server.on('listening', onListening);

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled Rejection at:', { promise, reason: reason.stack || reason });
    });

    process.on('uncaughtException', (error) => {
      logger.error('Uncaught Exception:', { error: error.stack || error });
      gracefulShutdown('UNCAUGHT_EXCEPTION');
    });

    return server;
  } catch (error) {
    logger.error('Failed to start server', { error: error.message, stack: error.stack });
    process.exit(1);
  }
}


const server = startServer();

module.exports = server;
