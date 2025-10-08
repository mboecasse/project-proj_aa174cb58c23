// File: src/routes/auth.routes.js
// Generated: 2025-10-08 13:06:13 UTC
// Project ID: proj_aa174cb58c23
// Task ID: task_r18ducj62w6q

        const authController = require('../controllers/auth.controller');
      const { auth } = require('../middleware/auth');


const express = require('express');

const { authLimiter, strictAuthLimiter } = require('../middleware/rateLimiter');

const { body } = require('express-validator');

const { validate } = require('../middleware/validation');


const router = express.Router();

/**
 * Authentication Routes
 * Handles user registration, login, logout, token refresh, and password operations
 */

// Validation rules


const registerValidation = [
  body('email')
    .trim()
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must contain uppercase, lowercase, number, and special character'),
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters')
    .matches(/^[a-zA-Z\s'-]+$/)
    .withMessage('Name can only contain letters, spaces, hyphens, and apostrophes')
];


const loginValidation = [
  body('email')
    .trim()
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
];


const refreshTokenValidation = [
  body('refreshToken')
    .notEmpty()
    .withMessage('Refresh token is required')
];


const forgotPasswordValidation = [
  body('email')
    .trim()
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required')
];


const resetPasswordValidation = [
  body('token')
    .notEmpty()
    .withMessage('Reset token is required'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must contain uppercase, lowercase, number, and special character')
];


const changePasswordValidation = [
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 8 })
    .withMessage('New password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('New password must contain uppercase, lowercase, number, and special character')
    .custom((value, { req }) => {
      if (value === req.body.currentPassword) {
        throw new Error('New password must be different from current password');
      }
      return true;
    })
];


const verifyEmailValidation = [
  body('token')
    .notEmpty()
    .withMessage('Verification token is required')
];

/**
 * POST /api/auth/register
 * Register a new user
 * Rate limited: 5 requests per 15 minutes per IP
 */
router.post(
  '/register',
  authLimiter,
  registerValidation,
  validate,
  async (req, res, next) => {
    try {
      await authController.register(req, res, next);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/auth/login
 * Authenticate user and return tokens
 * Rate limited: 5 requests per 15 minutes per IP
 */
router.post(
  '/login',
  authLimiter,
  loginValidation,
  validate,
  async (req, res, next) => {
    try {
      await authController.login(req, res, next);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/auth/logout
 * Logout user and invalidate refresh token
 * Requires authentication
 */
router.post('/logout', async (req, res, next) => {
  try {
    await auth(req, res, async () => {
      await authController.logout(req, res, next);
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/auth/refresh
 * Refresh access token using refresh token
 * Rate limited: 10 requests per 15 minutes per IP
 */
router.post(
  '/refresh',
  authLimiter,
  refreshTokenValidation,
  validate,
  async (req, res, next) => {
    try {
      await authController.refreshToken(req, res, next);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/auth/forgot-password
 * Request password reset email
 * Rate limited: 3 requests per 15 minutes per IP
 */
router.post(
  '/forgot-password',
  strictAuthLimiter,
  forgotPasswordValidation,
  validate,
  async (req, res, next) => {
    try {
      await authController.forgotPassword(req, res, next);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/auth/reset-password
 * Reset password using token from email
 * Rate limited: 3 requests per 15 minutes per IP
 */
router.post(
  '/reset-password',
  strictAuthLimiter,
  resetPasswordValidation,
  validate,
  async (req, res, next) => {
    try {
      await authController.resetPassword(req, res, next);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/auth/change-password
 * Change password for authenticated user
 * Requires authentication
 * Rate limited: 5 requests per 15 minutes per IP
 */
router.post(
  '/change-password',
  authLimiter,
  changePasswordValidation,
  validate,
  async (req, res, next) => {
    try {
      await auth(req, res, async () => {
        await authController.changePassword(req, res, next);
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/auth/verify-email
 * Verify email address using token
 * Rate limited: 5 requests per 15 minutes per IP
 */
router.post(
  '/verify-email',
  authLimiter,
  verifyEmailValidation,
  validate,
  async (req, res, next) => {
    try {
      await authController.verifyEmail(req, res, next);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/auth/resend-verification
 * Resend email verification token
 * Requires authentication
 * Rate limited: 3 requests per 15 minutes per IP
 */
router.post('/resend-verification', strictAuthLimiter, async (req, res, next) => {
  try {
    await auth(req, res, async () => {
      await authController.resendVerification(req, res, next);
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/auth/me
 * Get current authenticated user profile
 * Requires authentication
 */
router.get('/me', async (req, res, next) => {
  try {
    await auth(req, res, async () => {
      await authController.getCurrentUser(req, res, next);
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
