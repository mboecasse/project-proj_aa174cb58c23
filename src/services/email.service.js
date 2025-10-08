// File: src/services/email.service.js
// Generated: 2025-10-08 13:06:39 UTC
// Project ID: proj_aa174cb58c23
// Task ID: task_ki3jxecsjzkw


const emailConfig = require('../config/email');


const emailTemplates = require('../templates/emailTemplates');


const logger = require('../utils/logger');


const sgMail = require('@sendgrid/mail');

// Initialize SendGrid with API key
sgMail.setApiKey(emailConfig.sendgrid.apiKey);

/**
 * Email service for sending emails with retry logic
 */
class EmailService {
  /**
   * Send email with retry logic
   * @param {Object} mailOptions - Email options
   * @param {string} mailOptions.to - Recipient email
   * @param {string} mailOptions.subject - Email subject
   * @param {string} mailOptions.html - HTML content
   * @param {string} mailOptions.text - Plain text content (optional)
   * @param {number} retries - Number of retry attempts
   * @returns {Promise<Object>} SendGrid response
   */
  async sendEmail(mailOptions, retries = emailConfig.retryAttempts) {
    const msg = {
      to: mailOptions.to,
      from: {
        email: emailConfig.from.email,
        name: emailConfig.from.name
      },
      subject: mailOptions.subject,
      html: mailOptions.html,
      text: mailOptions.text || mailOptions.html.replace(/<[^>]*>/g, ''),
      trackingSettings: {
        clickTracking: { enable: false },
        openTracking: { enable: false }
      }
    };

    let lastError;

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const response = await sgMail.send(msg);

        logger.info('Email sent successfully', {
          to: mailOptions.to,
          subject: mailOptions.subject,
          attempt,
          statusCode: response[0].statusCode
        });

        return response;
      } catch (error) {
        lastError = error;

        logger.warn('Email send attempt failed', {
          to: mailOptions.to,
          subject: mailOptions.subject,
          attempt,
          retriesLeft: retries - attempt,
          error: error.message,
          statusCode: error.code
        });

        // Don't retry on client errors (4xx)
        if (error.code >= 400 && error.code < 500) {
          logger.error('Email send failed with client error - not retrying', {
            to: mailOptions.to,
            subject: mailOptions.subject,
            error: error.message,
            statusCode: error.code
          });
          throw error;
        }

        // Wait before retrying (exponential backoff)
        if (attempt < retries) {
          const delay = emailConfig.retryDelay * Math.pow(2, attempt - 1);
          logger.info('Waiting before retry', { delay, attempt });
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    // All retries failed
    logger.error('Email send failed after all retries', {
      to: mailOptions.to,
      subject: mailOptions.subject,
      attempts: retries,
      error: lastError.message
    });

    throw lastError;
  }

  /**
   * Send verification email
   * @param {string} email - Recipient email
   * @param {string} verificationToken - Verification token
   * @param {string} userName - User's name
   * @returns {Promise<Object>} SendGrid response
   */
  async sendVerificationEmail(email, verificationToken, userName) {
    try {
      const verificationUrl = `${emailConfig.appUrl}/verify-email?token=${verificationToken}`;
      const html = emailTemplates.verificationEmail(userName, verificationUrl);

      const mailOptions = {
        to: email,
        subject: 'Verify Your Email Address',
        html
      };

      logger.info('Sending verification email', { email, userName });

      return await this.sendEmail(mailOptions);
    } catch (error) {
      logger.error('Failed to send verification email', {
        email,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Send password reset email
   * @param {string} email - Recipient email
   * @param {string} resetToken - Password reset token
   * @param {string} userName - User's name
   * @returns {Promise<Object>} SendGrid response
   */
  async sendPasswordResetEmail(email, resetToken, userName) {
    try {
      const resetUrl = `${emailConfig.appUrl}/reset-password?token=${resetToken}`;
      const html = emailTemplates.passwordResetEmail(userName, resetUrl);

      const mailOptions = {
        to: email,
        subject: 'Password Reset Request',
        html
      };

      logger.info('Sending password reset email', { email, userName });

      return await this.sendEmail(mailOptions);
    } catch (error) {
      logger.error('Failed to send password reset email', {
        email,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Send welcome email
   * @param {string} email - Recipient email
   * @param {string} userName - User's name
   * @returns {Promise<Object>} SendGrid response
   */
  async sendWelcomeEmail(email, userName) {
    try {
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Welcome</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #4CAF50; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background-color: #f9f9f9; }
            .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Welcome to Our Platform!</h1>
            </div>
            <div class="content">
              <p>Hi ${userName},</p>
              <p>Thank you for verifying your email address. Your account is now fully activated!</p>
              <p>You can now enjoy all the features of our platform.</p>
              <p>If you have any questions or need assistance, please don't hesitate to contact our support team.</p>
              <p>Best regards,<br>The Team</p>
            </div>
            <div class="footer">
              <p>This is an automated message, please do not reply to this email.</p>
            </div>
          </div>
        </body>
        </html>
      `;

      const mailOptions = {
        to: email,
        subject: 'Welcome to Our Platform',
        html
      };

      logger.info('Sending welcome email', { email, userName });

      return await this.sendEmail(mailOptions);
    } catch (error) {
      logger.error('Failed to send welcome email', {
        email,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Send password changed notification
   * @param {string} email - Recipient email
   * @param {string} userName - User's name
   * @returns {Promise<Object>} SendGrid response
   */
  async sendPasswordChangedEmail(email, userName) {
    try {
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Password Changed</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #2196F3; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background-color: #f9f9f9; }
            .alert { background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; }
            .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Password Changed Successfully</h1>
            </div>
            <div class="content">
              <p>Hi ${userName},</p>
              <p>This is to confirm that your password has been changed successfully.</p>
              <div class="alert">
                <strong>Important:</strong> If you did not make this change, please contact our support team immediately.
              </div>
              <p>For your security, we recommend:</p>
              <ul>
                <li>Using a strong, unique password</li>
                <li>Enabling two-factor authentication if available</li>
                <li>Not sharing your password with anyone</li>
              </ul>
              <p>Best regards,<br>The Team</p>
            </div>
            <div class="footer">
              <p>This is an automated message, please do not reply to this email.</p>
            </div>
          </div>
        </body>
        </html>
      `;

      const mailOptions = {
        to: email,
        subject: 'Your Password Has Been Changed',
        html
      };

      logger.info('Sending password changed notification', { email, userName });

      return await this.sendEmail(mailOptions);
    } catch (error) {
      logger.error('Failed to send password changed email', {
        email,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Verify SendGrid configuration
   * @returns {Promise<boolean>} True if configuration is valid
   */
  async verifyConfiguration() {
    try {
      if (!emailConfig.sendgrid.apiKey) {
        throw new Error('SendGrid API key is not configured');
      }

      if (!emailConfig.from.email) {
        throw new Error('Sender email is not configured');
      }

      logger.info('Email service configuration verified successfully');
      return true;
    } catch (error) {
      logger.error('Email service configuration verification failed', {
        error: error.message
      });
      throw error;
    }
  }
}

module.exports = new EmailService();
