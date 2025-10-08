// File: src/validators/email.validator.js
// Generated: 2025-10-08 13:05:27 UTC
// Project ID: proj_aa174cb58c23
// Task ID: task_aptb6etp45q5


const dns = require('dns').promises;


const logger = require('../utils/logger');

const { body } = require('express-validator');

/**
 * Email format validation rules
 */


const emailValidationRules = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Invalid email format')
    .normalizeEmail()
    .isLength({ max: 255 })
    .withMessage('Email must not exceed 255 characters')
    .toLowerCase()
];

/**
 * Validate email domain exists (DNS MX record check)
 * @param {string} email - Email address to validate
 * @returns {Promise<boolean>} - True if domain is valid
 */


const validateEmailDomain = async (email) => {
  try {
    const domain = email.split('@')[1];

    if (!domain) {
      logger.warn('Email validation failed: missing domain', { email });
      return false;
    }

    // Check for MX records
    const mxRecords = await dns.resolveMx(domain);

    if (!mxRecords || mxRecords.length === 0) {
      logger.warn('Email validation failed: no MX records', { domain });
      return false;
    }

    logger.debug('Email domain validated successfully', { domain, mxCount: mxRecords.length });
    return true;
  } catch (error) {
    logger.error('Email domain validation error', {
      email,
      error: error.message,
      code: error.code
    });

    // If DNS lookup fails (ENOTFOUND, ENODATA), domain is invalid
    if (error.code === 'ENOTFOUND' || error.code === 'ENODATA') {
      return false;
    }

    // For other errors (network issues), we'll allow it to pass
    // to avoid blocking legitimate users due to temporary DNS issues
    logger.warn('DNS lookup failed, allowing email to pass', { email, error: error.code });
    return true;
  }
};

/**
 * Check if email is from a disposable email provider
 * @param {string} email - Email address to check
 * @returns {boolean} - True if email is from disposable provider
 */


const isDisposableEmail = (email) => {
  const disposableDomains = [
    'tempmail.com',
    'throwaway.email',
    'guerrillamail.com',
    'mailinator.com',
    '10minutemail.com',
    'trashmail.com',
    'yopmail.com',
    'maildrop.cc',
    'temp-mail.org',
    'getnada.com'
  ];

  const domain = email.split('@')[1];

  if (!domain) {
    return false;
  }

  const isDisposable = disposableDomains.includes(domain.toLowerCase());

  if (isDisposable) {
    logger.warn('Disposable email detected', { email, domain });
  }

  return isDisposable;
};

/**
 * Validate email format using regex
 * @param {string} email - Email address to validate
 * @returns {boolean} - True if format is valid
 */


const isValidEmailFormat = (email) => {
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  return emailRegex.test(email);
};

/**
 * Comprehensive email validation
 * @param {string} email - Email address to validate
 * @param {Object} options - Validation options
 * @param {boolean} options.checkDomain - Whether to check domain DNS records
 * @param {boolean} options.blockDisposable - Whether to block disposable emails
 * @returns {Promise<Object>} - Validation result
 */


const validateEmail = async (email, options = {}) => {
  const { checkDomain = false, blockDisposable = false } = options;

  try {
    // Basic format validation
    if (!email || typeof email !== 'string') {
      return {
        valid: false,
        error: 'Email is required and must be a string'
      };
    }

    const trimmedEmail = email.trim().toLowerCase();

    if (trimmedEmail.length === 0) {
      return {
        valid: false,
        error: 'Email cannot be empty'
      };
    }

    if (trimmedEmail.length > 255) {
      return {
        valid: false,
        error: 'Email must not exceed 255 characters'
      };
    }

    // Format validation
    if (!isValidEmailFormat(trimmedEmail)) {
      return {
        valid: false,
        error: 'Invalid email format'
      };
    }

    // Check for disposable email
    if (blockDisposable && isDisposableEmail(trimmedEmail)) {
      return {
        valid: false,
        error: 'Disposable email addresses are not allowed'
      };
    }

    // Domain validation (DNS check)
    if (checkDomain) {
      const domainValid = await validateEmailDomain(trimmedEmail);
      if (!domainValid) {
        return {
          valid: false,
          error: 'Email domain does not exist or cannot receive emails'
        };
      }
    }

    logger.debug('Email validation successful', { email: trimmedEmail });

    return {
      valid: true,
      email: trimmedEmail
    };
  } catch (error) {
    logger.error('Email validation error', {
      email,
      error: error.message
    });

    return {
      valid: false,
      error: 'Email validation failed'
    };
  }
};

/**
 * Express-validator middleware for email with domain check
 */


const emailWithDomainCheck = [
  ...emailValidationRules,
  body('email').custom(async (email) => {
    const result = await validateEmail(email, { checkDomain: true });
    if (!result.valid) {
      throw new Error(result.error);
    }
    return true;
  })
];

/**
 * Express-validator middleware for email blocking disposable providers
 */


const emailWithDisposableCheck = [
  ...emailValidationRules,
  body('email').custom(async (email) => {
    const result = await validateEmail(email, { blockDisposable: true });
    if (!result.valid) {
      throw new Error(result.error);
    }
    return true;
  })
];

/**
 * Express-validator middleware for comprehensive email validation
 */


const emailWithFullValidation = [
  ...emailValidationRules,
  body('email').custom(async (email) => {
    const result = await validateEmail(email, {
      checkDomain: true,
      blockDisposable: true
    });
    if (!result.valid) {
      throw new Error(result.error);
    }
    return true;
  })
];

module.exports = {
  emailValidationRules,
  validateEmailDomain,
  isDisposableEmail,
  isValidEmailFormat,
  validateEmail,
  emailWithDomainCheck,
  emailWithDisposableCheck,
  emailWithFullValidation
};
