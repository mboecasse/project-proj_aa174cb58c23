// File: src/config/email.js
// Generated: 2025-10-08 13:05:16 UTC
// Project ID: proj_aa174cb58c23
// Task ID: task_1h19al11mgls


const logger = require('../utils/logger');

/**
 * Email service configuration for SendGrid integration
 * Handles email sending for verification, password reset, and notifications
 */


const emailConfig = {
  // SendGrid API configuration
  sendgrid: {
    apiKey: process.env.SENDGRID_API_KEY,
    fromEmail: process.env.EMAIL_FROM || 'noreply@yourdomain.com',
    fromName: process.env.EMAIL_FROM_NAME || 'Your App Name',
  },

  // Email templates configuration
  templates: {
    verification: {
      subject: 'Verify Your Email Address',
      templateId: process.env.SENDGRID_VERIFICATION_TEMPLATE_ID || null,
    },
    passwordReset: {
      subject: 'Reset Your Password',
      templateId: process.env.SENDGRID_PASSWORD_RESET_TEMPLATE_ID || null,
    },
    welcome: {
      subject: 'Welcome to Our Platform',
      templateId: process.env.SENDGRID_WELCOME_TEMPLATE_ID || null,
    },
    passwordChanged: {
      subject: 'Your Password Has Been Changed',
      templateId: process.env.SENDGRID_PASSWORD_CHANGED_TEMPLATE_ID || null,
    },
  },

  // Email sending options
  options: {
    // Maximum retry attempts for failed emails
    maxRetries: parseInt(process.env.EMAIL_MAX_RETRIES) || 3,

    // Retry delay in milliseconds
    retryDelay: parseInt(process.env.EMAIL_RETRY_DELAY) || 1000,

    // Enable/disable email sending (useful for testing)
    enabled: process.env.EMAIL_ENABLED !== 'false',

    // Sandbox mode (for testing without actually sending emails)
    sandboxMode: process.env.EMAIL_SANDBOX_MODE === 'true',
  },

  // Frontend URLs for email links
  urls: {
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
    verificationPath: '/verify-email',
    passwordResetPath: '/reset-password',
  },

  /**
   * Validate email configuration
   * Ensures all required environment variables are set
   */
  validate() {
    const errors = [];

    if (!this.sendgrid.apiKey) {
      errors.push('SENDGRID_API_KEY is not set');
    }

    if (!this.sendgrid.fromEmail) {
      errors.push('EMAIL_FROM is not set');
    }

    if (!this.urls.frontendUrl) {
      errors.push('FRONTEND_URL is not set');
    }

    if (errors.length > 0) {
      const errorMessage = `Email configuration errors: ${errors.join(', ')}`;
      logger.error(errorMessage);

      if (process.env.NODE_ENV === 'production') {
        throw new Error(errorMessage);
      } else {
        logger.warn('Email service will not function properly without proper configuration');
      }
    }

    logger.info('Email configuration validated successfully', {
      enabled: this.options.enabled,
      sandboxMode: this.options.sandboxMode,
      fromEmail: this.sendgrid.fromEmail,
    });

    return errors.length === 0;
  },

  /**
   * Get verification email URL
   * @param {string} token - Verification token
   * @returns {string} Full verification URL
   */
  getVerificationUrl(token) {
    return `${this.urls.frontendUrl}${this.urls.verificationPath}?token=${token}`;
  },

  /**
   * Get password reset URL
   * @param {string} token - Password reset token
   * @returns {string} Full password reset URL
   */
  getPasswordResetUrl(token) {
    return `${this.urls.frontendUrl}${this.urls.passwordResetPath}?token=${token}`;
  },

  /**
   * Check if email service is properly configured
   * @returns {boolean} True if configured, false otherwise
   */
  isConfigured() {
    return !!(
      this.sendgrid.apiKey &&
      this.sendgrid.fromEmail &&
      this.urls.frontendUrl
    );
  },

  /**
   * Get email configuration for logging (without sensitive data)
   * @returns {object} Safe configuration object
   */
  getSafeConfig() {
    return {
      fromEmail: this.sendgrid.fromEmail,
      fromName: this.sendgrid.fromName,
      enabled: this.options.enabled,
      sandboxMode: this.options.sandboxMode,
      frontendUrl: this.urls.frontendUrl,
      configured: this.isConfigured(),
    };
  },
};

// Validate configuration on module load
try {
  emailConfig.validate();
} catch (error) {
  logger.error('Failed to validate email configuration', {
    error: error.message,
  });

  if (process.env.NODE_ENV === 'production') {
    throw error;
  }
}

module.exports = emailConfig;
