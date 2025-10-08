// File: src/utils/logger.js
// Generated: 2025-10-08 13:04:57 UTC
// Project ID: proj_aa174cb58c23
// Task ID: task_hqnt3x44qde3


const path = require('path');


const winston = require('winston');

/**
 * Custom log format with timestamp and colorization
 */


const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

/**
 * Console format with colors for development
 */


const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let metaString = '';
    if (Object.keys(meta).length > 0) {
      metaString = JSON.stringify(meta, null, 2);
    }
    return `${timestamp} [${level}]: ${message} ${metaString}`;
  })
);

/**
 * Determine log level based on environment
 */


const getLogLevel = () => {
  const env = process.env.NODE_ENV || 'development';
  if (env === 'production') return 'info';
  if (env === 'test') return 'error';
  return 'debug';
};

/**
 * Create logs directory if it doesn't exist
 */


const logsDir = path.join(process.cwd(), 'logs');

/**
 * Winston logger configuration
 */


const logger = winston.createLogger({
  level: getLogLevel(),
  format: logFormat,
  defaultMeta: { service: 'auth-api' },
  transports: [
    /**
     * Write all logs with level 'error' and below to error.log
     */
    new winston.transports.File({
      filename: path.join(logsDir, 'error.log'),
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5
    }),

    /**
     * Write all logs with level 'info' and below to combined.log
     */
    new winston.transports.File({
      filename: path.join(logsDir, 'combined.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5
    })
  ],
  exceptionHandlers: [
    new winston.transports.File({
      filename: path.join(logsDir, 'exceptions.log'),
      maxsize: 5242880,
      maxFiles: 5
    })
  ],
  rejectionHandlers: [
    new winston.transports.File({
      filename: path.join(logsDir, 'rejections.log'),
      maxsize: 5242880,
      maxFiles: 5
    })
  ]
});

/**
 * Add console transport for non-production environments
 */
if (process.env.NODE_ENV !== 'production') {
  logger.add(
    new winston.transports.Console({
      format: consoleFormat
    })
  );
}

/**
 * Create a stream object for Morgan HTTP logger integration
 */
logger.stream = {
  write: (message) => {
    logger.info(message.trim());
  }
};

module.exports = logger;
