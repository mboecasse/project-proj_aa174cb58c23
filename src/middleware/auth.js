// File: src/middleware/auth.js
// Generated: 2025-10-08 13:05:14 UTC
// Project ID: proj_aa174cb58c23
// Task ID: task_bhytx0bsd45l


const ApiError = require('../utils/ApiError');


const jwt = require('jsonwebtoken');

/**
 * Middleware to verify JWT token and authenticate user
 * Sets req.user and req.userId for authenticated requests
 */


const auth = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new ApiError(401, 'No token provided. Authorization denied.');
    }

    // Extract token
    const token = authHeader.split(' ')[1];

    if (!token) {
      throw new ApiError(401, 'No token provided. Authorization denied.');
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);

    // Set user information on request object
    req.user = decoded;
    req.userId = decoded.id || decoded._id || decoded.userId;

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return next(new ApiError(401, 'Invalid token. Authorization denied.'));
    }

    if (error.name === 'TokenExpiredError') {
      return next(new ApiError(401, 'Token expired. Please login again.'));
    }

    next(error);
  }
};

/**
 * Optional authentication middleware
 * Attempts to authenticate but continues even if no token provided
 * Sets req.user and req.userId if token is valid
 */


const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
      return next();
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);

    // Set user information on request object
    req.user = decoded;
    req.userId = decoded.id || decoded._id || decoded.userId;

    next();
  } catch (error) {
    // For optional auth, continue even if token is invalid
    next();
  }
};

/**
 * Middleware to check if user has specific role
 * Must be used after auth middleware
 */


const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new ApiError(401, 'Authentication required'));
    }

    if (!roles.includes(req.user.role)) {
      return next(new ApiError(403, 'You do not have permission to perform this action'));
    }

    next();
  };
};

/**
 * Middleware to verify refresh token
 */


const verifyRefreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      throw new ApiError(401, 'Refresh token is required');
    }

    // Verify refresh token
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

    // Set user information on request object
    req.user = decoded;
    req.userId = decoded.id || decoded._id || decoded.userId;

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return next(new ApiError(401, 'Invalid refresh token'));
    }

    if (error.name === 'TokenExpiredError') {
      return next(new ApiError(401, 'Refresh token expired. Please login again.'));
    }

    next(error);
  }
};

module.exports = {
  auth,
  optionalAuth,
  authorize,
  verifyRefreshToken,
  authenticate: auth // Alias for compatibility
};
