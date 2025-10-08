// File: src/utils/gracefulShutdown.js
// Generated: 2025-10-08 13:05:21 UTC
// Project ID: proj_aa174cb58c23
// Task ID: task_hlq5dmzeqx0j


const logger = require('./logger');

/**
 * Graceful shutdown handler
 * Handles cleanup operations when receiving termination signals
 */
class GracefulShutdown {
  constructor() {
    this.connections = [];
    this.isShuttingDown = false;
    this.shutdownTimeout = 30000; // 30 seconds
  }

  /**
   * Register a connection or resource to be cleaned up on shutdown
   * @param {Object} connection - Connection object with a close() method
   * @param {string} name - Name of the connection for logging
   */
  register(connection, name) {
    if (!connection || typeof connection.close !== 'function') {
      logger.warn('Invalid connection registered for graceful shutdown', { name });
      return;
    }

    this.connections.push({ connection, name });
    logger.debug('Registered connection for graceful shutdown', { name });
  }

  /**
   * Perform graceful shutdown
   * @param {string} signal - Signal that triggered shutdown
   * @param {Object} server - HTTP server instance
   */
  async shutdown(signal, server) {
    if (this.isShuttingDown) {
      logger.warn('Shutdown already in progress');
      return;
    }

    this.isShuttingDown = true;
    logger.info('Graceful shutdown initiated', { signal });

    // Set timeout for forced shutdown
    const forceShutdownTimer = setTimeout(() => {
      logger.error('Graceful shutdown timeout exceeded, forcing exit', {
        timeout: this.shutdownTimeout
      });
      process.exit(1);
    }, this.shutdownTimeout);

    try {
      // Stop accepting new connections
      if (server) {
        await new Promise((resolve, reject) => {
          server.close((err) => {
            if (err) {
              logger.error('Error closing HTTP server', { error: err.message });
              reject(err);
            } else {
              logger.info('HTTP server closed');
              resolve();
            }
          });
        });
      }

      // Close all registered connections
      const closePromises = this.connections.map(async ({ connection, name }) => {
        try {
          logger.info('Closing connection', { name });
          await connection.close();
          logger.info('Connection closed successfully', { name });
        } catch (error) {
          logger.error('Error closing connection', {
            name,
            error: error.message
          });
          throw error;
        }
      });

      await Promise.all(closePromises);

      logger.info('All connections closed successfully');

      // Clear the force shutdown timer
      clearTimeout(forceShutdownTimer);

      logger.info('Graceful shutdown completed');
      process.exit(0);
    } catch (error) {
      logger.error('Error during graceful shutdown', { error: error.message });
      clearTimeout(forceShutdownTimer);
      process.exit(1);
    }
  }

  /**
   * Initialize graceful shutdown handlers
   * @param {Object} server - HTTP server instance
   */
  init(server) {
    // Handle termination signals
    const signals = ['SIGTERM', 'SIGINT', 'SIGUSR2'];

    signals.forEach((signal) => {
      process.on(signal, () => {
        logger.info('Received signal', { signal });
        this.shutdown(signal, server);
      });
    });

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      logger.error('Uncaught exception', {
        error: error.message,
        stack: error.stack
      });
      this.shutdown('uncaughtException', server);
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled promise rejection', {
        reason: reason instanceof Error ? reason.message : reason,
        stack: reason instanceof Error ? reason.stack : undefined
      });
      this.shutdown('unhandledRejection', server);
    });

    logger.info('Graceful shutdown handlers initialized');
  }

  /**
   * Set custom shutdown timeout
   * @param {number} timeout - Timeout in milliseconds
   */
  setTimeout(timeout) {
    if (typeof timeout !== 'number' || timeout <= 0) {
      logger.warn('Invalid shutdown timeout, using default', { timeout });
      return;
    }

    this.shutdownTimeout = timeout;
    logger.debug('Shutdown timeout set', { timeout });
  }
}

// Export singleton instance
module.exports = new GracefulShutdown();
