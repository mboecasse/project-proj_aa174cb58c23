// File: src/middleware/security.js
// Generated: 2025-10-08 13:05:43 UTC
// Project ID: proj_aa174cb58c23
// Task ID: task_542jflrhov47


const config = require('../config');


const cors = require('cors');


const helmet = require('helmet');


const hpp = require('hpp');


const mongoSanitize = require('express-mongo-sanitize');


const xss = require('xss-clean');

/**
 * Configure Helmet security headers
 */


const configureHelmet = () => {
  return helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'https:'],
        connectSrc: ["'self'"],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"]
      }
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true
    },
    frameguard: {
      action: 'deny'
    },
    noSniff: true,
    xssFilter: true,
    referrerPolicy: {
      policy: 'strict-origin-when-cross-origin'
    }
  });
};

/**
 * Configure CORS options
 */


const configureCors = () => {
  const corsOptions = {
    origin: (origin, callback) => {
      const allowedOrigins = config.cors.origin.split(',').map(o => o.trim());

      if (!origin || allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: config.cors.credentials,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    exposedHeaders: ['X-Total-Count', 'X-Page-Count'],
    maxAge: 86400,
    optionsSuccessStatus: 200
  };

  return cors(corsOptions);
};

/**
 * Configure HTTP Parameter Pollution protection
 */


const configureHpp = () => {
  return hpp({
    whitelist: [
      'sort',
      'fields',
      'page',
      'limit',
      'filter'
    ]
  });
};

/**
 * Configure XSS protection
 */


const configureXss = () => {
  return xss();
};

/**
 * Configure MongoDB sanitization
 */


const configureMongoSanitize = () => {
  return mongoSanitize({
    replaceWith: '_',
    onSanitize: ({ req, key }) => {
      console.warn(`Sanitized potentially malicious input: ${key}`);
    }
  });
};

/**
 * Security headers middleware
 */


const securityHeaders = (req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  res.removeHeader('X-Powered-By');
  next();
};

/**
 * Apply all security middleware
 */


const applySecurity = (app) => {
  app.use(configureHelmet());
  app.use(configureCors());
  app.use(configureHpp());
  app.use(configureXss());
  app.use(configureMongoSanitize());
  app.use(securityHeaders);
};

module.exports = {
  configureHelmet,
  configureCors,
  configureHpp,
  configureXss,
  configureMongoSanitize,
  securityHeaders,
  applySecurity
};
