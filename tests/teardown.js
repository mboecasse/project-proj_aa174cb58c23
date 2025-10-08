// File: tests/teardown.js
// Generated: 2025-10-08 13:05:07 UTC
// Project ID: proj_aa174cb58c23
// Task ID: task_056k7p0fdd3h


const logger = require('../src/utils/logger');


const mongoose = require('mongoose');

/**
 * Jest global teardown
 * Cleans up test resources after all tests complete
 */
module.exports = async () => {
  try {
    logger.info('Starting global test teardown');

    // Close all mongoose connections
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
      logger.info('Closed mongoose connection');
    }

    // Close all other mongoose connections if any
    await mongoose.disconnect();
    logger.info('Disconnected all mongoose connections');

    // Give time for cleanup
    await new Promise(resolve => setTimeout(resolve, 500));

    logger.info('Global test teardown completed successfully');
  } catch (error) {
    logger.error('Error during global test teardown', {
      error: error.message,
      stack: error.stack
    });
    throw error;
  }
};
