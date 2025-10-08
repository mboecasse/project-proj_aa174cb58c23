// File: src/app.js
// Generated: 2025-10-08 13:05:59 UTC
// Project ID: proj_aa174cb58c23
// Task ID: task_h0eluc9fiyd7


const compression = require('compression');


const cors = require('cors');


const errorHandler = require('./middleware/errorHandler');


const express = require('express');


const helmet = require('helmet');


const hpp = require('hpp');


const logger = require('./utils/logger');


const mongoSanitize = require('express-mongo-sanitize');


const morgan = require('morgan');


const rateLimit = require('express-rate-limit');


const routes = require('./routes');


const xss = require('xss-clean');

const { securityMiddleware } = require('./middleware/security');

/**
 * Initialize Express application
 */


const app = express();

/**
 * Trust proxy - required for rate limiting behind reverse proxy
 */
app.set('trust proxy', 1);

/**
 * Security Middleware
 */
app.use(helmet());
app.use(securityMiddleware);

/**
 * CORS Configuration
 */


const corsOptions = {
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

/**
 * Body Parser Middleware
 */
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

/**
 * Data Sanitization against NoSQL Injection
 */
app.use(mongoSanitize());

/**
 * Data Sanitization against XSS
 */
app.use(xss());

/**
 * Prevent HTTP Parameter Pollution
 */
app.use(hpp());

/**
 * Compression Middleware
 */
app.use(compression());

/**
 * HTTP Request Logger
 */
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined', {
    stream: {
      write: (message) => logger.info(message.trim())
    }
  }));
}

/**
 * Global Rate Limiting
 */


const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests from this IP, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn('Rate limit exceeded', {
      ip: req.ip,
      path: req.path
    });
    res.status(429).json({
      success: false,
      error: 'Too many requests from this IP, please try again later'
    });
  }
});

app.use('/api/', limiter);

/**
 * Health Check Endpoint
 */
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

/**
 * API Routes
 */
app.use('/api', routes);

/**
 * 404 Handler - Route Not Found
 */
app.use((req, res, next) => {
  logger.warn('Route not found', {
    method: req.method,
    path: req.path,
    ip: req.ip
  });

  res.status(404).json({
    success: false,
    error: 'Route not found'
  });
});

/**
 * Global Error Handler
 */
app.use(errorHandler);

/**
 * Unhandled Promise Rejection Handler
 */
process.on('unhandledRejection', (err) => {
  logger.error('Unhandled Promise Rejection', {
    error: err.message,
    stack: err.stack
  });
});

/**
 * Uncaught Exception Handler
 */
process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception', {
    error: err.message,
    stack: err.stack
  });
  process.exit(1);
});

module.exports = app;
