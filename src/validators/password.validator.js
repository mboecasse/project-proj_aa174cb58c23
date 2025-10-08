// File: src/validators/password.validator.js
// Generated: 2025-10-08 13:05:24 UTC
// Project ID: proj_aa174cb58c23
// Task ID: task_y5dnufn6aj56


const { body } = require('express-validator');

/**
 * Password validation rules
 * Ensures strong password requirements for security
 */


const passwordRules = {
  minLength: 8,
  maxLength: 128,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: true,
  specialChars: '!@#$%^&*()_+-=[]{}|;:,.<>?'
};

/**
 * Custom password strength validator
 * Checks password against security requirements
 */


const isStrongPassword = (password) => {
  if (!password || typeof password !== 'string') {
    return false;
  }

  // Check minimum length
  if (password.length < passwordRules.minLength) {
    return false;
  }

  // Check maximum length
  if (password.length > passwordRules.maxLength) {
    return false;
  }

  // Check for uppercase letter
  if (passwordRules.requireUppercase && !/[A-Z]/.test(password)) {
    return false;
  }

  // Check for lowercase letter
  if (passwordRules.requireLowercase && !/[a-z]/.test(password)) {
    return false;
  }

  // Check for number
  if (passwordRules.requireNumbers && !/\d/.test(password)) {
    return false;
  }

  // Check for special character
  if (passwordRules.requireSpecialChars) {
    const specialCharsRegex = new RegExp(`[${passwordRules.specialChars.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}]`);
    if (!specialCharsRegex.test(password)) {
      return false;
    }
  }

  return true;
};

/**
 * Password validation chain for registration/password change
 */


const passwordValidation = [
  body('password')
    .trim()
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: passwordRules.minLength, max: passwordRules.maxLength })
    .withMessage(`Password must be between ${passwordRules.minLength} and ${passwordRules.maxLength} characters`)
    .custom((value) => {
      if (!isStrongPassword(value)) {
        throw new Error(
          'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character (!@#$%^&*()_+-=[]{}|;:,.<>?)'
        );
      }
      return true;
    })
];

/**
 * Password confirmation validation
 */


const passwordConfirmValidation = [
  body('confirmPassword')
    .trim()
    .notEmpty()
    .withMessage('Password confirmation is required')
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('Passwords do not match');
      }
      return true;
    })
];

/**
 * Current password validation for password change
 */


const currentPasswordValidation = [
  body('currentPassword')
    .trim()
    .notEmpty()
    .withMessage('Current password is required')
];

/**
 * New password validation for password change
 */


const newPasswordValidation = [
  body('newPassword')
    .trim()
    .notEmpty()
    .withMessage('New password is required')
    .isLength({ min: passwordRules.minLength, max: passwordRules.maxLength })
    .withMessage(`New password must be between ${passwordRules.minLength} and ${passwordRules.maxLength} characters`)
    .custom((value) => {
      if (!isStrongPassword(value)) {
        throw new Error(
          'New password must contain at least one uppercase letter, one lowercase letter, one number, and one special character (!@#$%^&*()_+-=[]{}|;:,.<>?)'
        );
      }
      return true;
    })
    .custom((value, { req }) => {
      if (value === req.body.currentPassword) {
        throw new Error('New password must be different from current password');
      }
      return true;
    })
];

/**
 * Reset token validation
 */


const resetTokenValidation = [
  body('token')
    .trim()
    .notEmpty()
    .withMessage('Reset token is required')
    .isLength({ min: 32, max: 256 })
    .withMessage('Invalid reset token format')
];

/**
 * Complete validation for password change
 */


const changePasswordValidation = [
  ...currentPasswordValidation,
  ...newPasswordValidation,
  body('confirmNewPassword')
    .trim()
    .notEmpty()
    .withMessage('New password confirmation is required')
    .custom((value, { req }) => {
      if (value !== req.body.newPassword) {
        throw new Error('New passwords do not match');
      }
      return true;
    })
];

/**
 * Complete validation for password reset
 */


const resetPasswordValidation = [
  ...resetTokenValidation,
  body('newPassword')
    .trim()
    .notEmpty()
    .withMessage('New password is required')
    .isLength({ min: passwordRules.minLength, max: passwordRules.maxLength })
    .withMessage(`New password must be between ${passwordRules.minLength} and ${passwordRules.maxLength} characters`)
    .custom((value) => {
      if (!isStrongPassword(value)) {
        throw new Error(
          'New password must contain at least one uppercase letter, one lowercase letter, one number, and one special character (!@#$%^&*()_+-=[]{}|;:,.<>?)'
        );
      }
      return true;
    }),
  body('confirmNewPassword')
    .trim()
    .notEmpty()
    .withMessage('New password confirmation is required')
    .custom((value, { req }) => {
      if (value !== req.body.newPassword) {
        throw new Error('New passwords do not match');
      }
      return true;
    })
];

/**
 * Get password strength score (0-4)
 * 0: Very weak, 1: Weak, 2: Fair, 3: Good, 4: Strong
 */


const getPasswordStrength = (password) => {
  if (!password || typeof password !== 'string') {
    return 0;
  }

  let score = 0;

  // Length score
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;

  // Character variety score
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (new RegExp(`[${passwordRules.specialChars.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}]`).test(password)) score++;

  // Cap at 4
  return Math.min(score, 4);
};

module.exports = {
  passwordRules,
  isStrongPassword,
  passwordValidation,
  passwordConfirmValidation,
  currentPasswordValidation,
  newPasswordValidation,
  resetTokenValidation,
  changePasswordValidation,
  resetPasswordValidation,
  getPasswordStrength
};
