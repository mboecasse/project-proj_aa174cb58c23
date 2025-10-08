// File: src/config/database.js
// Generated: 2025-10-08 13:04:56 UTC
// Project ID: proj_aa174cb58c23
// Task ID: task_gj5ama73n1gn


const logger = require('../utils/logger');


const mongoose = require('mongoose');

/**
 * MongoDB connection configuration
 */


const connectionOptions = {
  maxPoolSize: 10,
  minPoolSize: 5,
  socketTimeoutMS: 45000,
  serverSelectionTimeoutMS: 5000,
  family: 4
};

/**
 * Connect to MongoDB with retry logic
 */


const connectDB = async (retries = 5, delay = 5000) => {
  let attempt = 0;

  while (attempt < retries) {
    try {
      attempt++;

      logger.info('Attempting MongoDB connection', {
        attempt,
        maxRetries: retries,
        uri: process.env.MONGODB_URI?.replace(/\/\/([^:]+):([^@]+)@/, '//$1:****@')
      });

      const conn = await mongoose.connect(process.env.MONGODB_URI, connectionOptions);

      logger.info('MongoDB connected successfully', {
        host: conn.connection.host,
        database: conn.connection.name,
        port: conn.connection.port
      });

      return conn;
    } catch (error) {
      logger.error('MongoDB connection failed', {
        attempt,
        maxRetries: retries,
        error: error.message,
        code: error.code
      });

      if (attempt >= retries) {
        logger.error('Max MongoDB connection retries reached. Exiting...', {
          totalAttempts: attempt
        });
        process.exit(1);
      }

      logger.info('Retrying MongoDB connection', {
        nextAttempt: attempt + 1,
        delayMs: delay
      });

      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
};

/**
 * MongoDB connection event handlers
 */
mongoose.connection.on('connected', () => {
  logger.info('Mongoose connected to MongoDB');
});

mongoose.connection.on('error', (error) => {
  logger.error('Mongoose connection error', {
    error: error.message,
    code: error.code
  });
});

mongoose.connection.on('disconnected', () => {
  logger.warn('Mongoose disconnected from MongoDB');
});

mongoose.connection.on('reconnected', () => {
  logger.info('Mongoose reconnected to MongoDB');
});

/**
 * Graceful shutdown handler
 */


const gracefulShutdown = async (signal) => {
  logger.info('Received shutdown signal, closing MongoDB connection', { signal });

  try {
    await mongoose.connection.close();
    logger.info('MongoDB connection closed successfully');
    process.exit(0);
  } catch (error) {
    logger.error('Error during MongoDB connection closure', {
      error: error.message
    });
    process.exit(1);
  }
};

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

module.exports = { connectDB, mongoose };
