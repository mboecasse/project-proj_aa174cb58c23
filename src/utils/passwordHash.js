// File: src/utils/passwordHash.js
// Generated: 2025-10-08 13:05:12 UTC
// Project ID: proj_aa174cb58c23
// Task ID: task_0cids6qn86s7


const bcrypt = require('bcryptjs');


const logger = require('./logger');

/**
 * Hash a plain text password
 * @param {string} password - Plain text password
 * @returns {Promise<string>} Hashed password
 */


const hashPassword = async (password) => {
  try {
    if (!password) {
      throw new Error('Password is required');
    }

    if (typeof password !== 'string') {
      throw new Error('Password must be a string');
    }

    if (password.length < 8) {
      throw new Error('Password must be at least 8 characters long');
    }

    const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS) || 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    logger.debug('Password hashed successfully');

    return hashedPassword;
  } catch (error) {
    logger.error('Failed to hash password', { error: error.message });
    throw error;
  }
};

/**
 * Compare a plain text password with a hashed password
 * @param {string} password - Plain text password
 * @param {string} hashedPassword - Hashed password
 * @returns {Promise<boolean>} True if passwords match, false otherwise
 */


const comparePassword = async (password, hashedPassword) => {
  try {
    if (!password || !hashedPassword) {
      throw new Error('Password and hashed password are required');
    }

    if (typeof password !== 'string' || typeof hashedPassword !== 'string') {
      throw new Error('Password and hashed password must be strings');
    }

    const isMatch = await bcrypt.compare(password, hashedPassword);

    logger.debug('Password comparison completed', { isMatch });

    return isMatch;
  } catch (error) {
    logger.error('Failed to compare passwords', { error: error.message });
    throw error;
  }
};

/**
 * Validate password strength
 * @param {string} password - Plain text password
 * @returns {Object} Validation result with isValid and errors array
 */


const validatePasswordStrength = (password) => {
  const errors = [];

  if (!password) {
    errors.push('Password is required');
    return { isValid: false, errors };
  }

  if (typeof password !== 'string') {
    errors.push('Password must be a string');
    return { isValid: false, errors };
  }

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }

  if (password.length > 128) {
    errors.push('Password must not exceed 128 characters');
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }

  const commonPasswords = [
    'password', 'password123', '12345678', 'qwerty', 'abc123',
    'monkey', '1234567', 'letmein', 'trustno1', 'dragon'
  ];

  if (commonPasswords.includes(password.toLowerCase())) {
    errors.push('Password is too common');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

module.exports = {
  hashPassword,
  comparePassword,
  validatePasswordStrength
};
