// File: src/templates/emailTemplates.js
// Generated: 2025-10-08 13:06:06 UTC
// Project ID: proj_aa174cb58c23
// Task ID: task_cp7ejgrur94w


const config = require('../config');

/**
 * Generate email verification HTML template
 * @param {string} userName - User's name
 * @param {string} verificationUrl - Full verification URL with token
 * @returns {string} HTML email template
 */


const generateVerificationEmail = (userName, verificationUrl) => {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Email Verification</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .container {
          background-color: #f4f4f4;
          border-radius: 5px;
          padding: 30px;
        }
        .header {
          background-color: #4CAF50;
          color: white;
          padding: 20px;
          text-align: center;
          border-radius: 5px 5px 0 0;
        }
        .content {
          background-color: white;
          padding: 30px;
          border-radius: 0 0 5px 5px;
        }
        .button {
          display: inline-block;
          padding: 12px 30px;
          background-color: #4CAF50;
          color: white;
          text-decoration: none;
          border-radius: 5px;
          margin: 20px 0;
        }
        .footer {
          text-align: center;
          margin-top: 20px;
          font-size: 12px;
          color: #666;
        }
        .warning {
          background-color: #fff3cd;
          border-left: 4px solid #ffc107;
          padding: 10px;
          margin: 20px 0;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Email Verification</h1>
        </div>
        <div class="content">
          <h2>Hello ${userName},</h2>
          <p>Thank you for registering with us! To complete your registration, please verify your email address by clicking the button below:</p>

          <div style="text-align: center;">
            <a href="${verificationUrl}" class="button">Verify Email Address</a>
          </div>

          <p>Or copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #4CAF50;">${verificationUrl}</p>

          <div class="warning">
            <strong>Important:</strong> This verification link will expire in 24 hours for security reasons.
          </div>

          <p>If you did not create an account with us, please ignore this email.</p>

          <p>Best regards,<br>The Team</p>
        </div>
        <div class="footer">
          <p>This is an automated email. Please do not reply to this message.</p>
          <p>&copy; ${new Date().getFullYear()} All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

/**
 * Generate password reset HTML template
 * @param {string} userName - User's name
 * @param {string} resetUrl - Full password reset URL with token
 * @returns {string} HTML email template
 */


const generatePasswordResetEmail = (userName, resetUrl) => {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Password Reset</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .container {
          background-color: #f4f4f4;
          border-radius: 5px;
          padding: 30px;
        }
        .header {
          background-color: #2196F3;
          color: white;
          padding: 20px;
          text-align: center;
          border-radius: 5px 5px 0 0;
        }
        .content {
          background-color: white;
          padding: 30px;
          border-radius: 0 0 5px 5px;
        }
        .button {
          display: inline-block;
          padding: 12px 30px;
          background-color: #2196F3;
          color: white;
          text-decoration: none;
          border-radius: 5px;
          margin: 20px 0;
        }
        .footer {
          text-align: center;
          margin-top: 20px;
          font-size: 12px;
          color: #666;
        }
        .warning {
          background-color: #fff3cd;
          border-left: 4px solid #ffc107;
          padding: 10px;
          margin: 20px 0;
        }
        .alert {
          background-color: #f8d7da;
          border-left: 4px solid #dc3545;
          padding: 10px;
          margin: 20px 0;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Password Reset Request</h1>
        </div>
        <div class="content">
          <h2>Hello ${userName},</h2>
          <p>We received a request to reset your password. Click the button below to create a new password:</p>

          <div style="text-align: center;">
            <a href="${resetUrl}" class="button">Reset Password</a>
          </div>

          <p>Or copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #2196F3;">${resetUrl}</p>

          <div class="warning">
            <strong>Important:</strong> This password reset link will expire in 1 hour for security reasons.
          </div>

          <div class="alert">
            <strong>Security Notice:</strong> If you did not request a password reset, please ignore this email and ensure your account is secure. Your password will not be changed unless you click the link above.
          </div>

          <p>For security reasons, we recommend:</p>
          <ul>
            <li>Using a strong, unique password</li>
            <li>Not sharing your password with anyone</li>
            <li>Changing your password regularly</li>
          </ul>

          <p>Best regards,<br>The Team</p>
        </div>
        <div class="footer">
          <p>This is an automated email. Please do not reply to this message.</p>
          <p>&copy; ${new Date().getFullYear()} All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

/**
 * Generate welcome email HTML template (sent after successful verification)
 * @param {string} userName - User's name
 * @returns {string} HTML email template
 */


const generateWelcomeEmail = (userName) => {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Welcome</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .container {
          background-color: #f4f4f4;
          border-radius: 5px;
          padding: 30px;
        }
        .header {
          background-color: #4CAF50;
          color: white;
          padding: 20px;
          text-align: center;
          border-radius: 5px 5px 0 0;
        }
        .content {
          background-color: white;
          padding: 30px;
          border-radius: 0 0 5px 5px;
        }
        .footer {
          text-align: center;
          margin-top: 20px;
          font-size: 12px;
          color: #666;
        }
        .success {
          background-color: #d4edda;
          border-left: 4px solid #28a745;
          padding: 10px;
          margin: 20px 0;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Welcome!</h1>
        </div>
        <div class="content">
          <h2>Hello ${userName},</h2>

          <div class="success">
            <strong>Success!</strong> Your email has been verified and your account is now active.
          </div>

          <p>Thank you for verifying your email address. You now have full access to all features.</p>

          <p>If you have any questions or need assistance, please don't hesitate to contact our support team.</p>

          <p>We're excited to have you on board!</p>

          <p>Best regards,<br>The Team</p>
        </div>
        <div class="footer">
          <p>This is an automated email. Please do not reply to this message.</p>
          <p>&copy; ${new Date().getFullYear()} All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

/**
 * Generate password changed confirmation email HTML template
 * @param {string} userName - User's name
 * @returns {string} HTML email template
 */


const generatePasswordChangedEmail = (userName) => {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Password Changed</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .container {
          background-color: #f4f4f4;
          border-radius: 5px;
          padding: 30px;
        }
        .header {
          background-color: #4CAF50;
          color: white;
          padding: 20px;
          text-align: center;
          border-radius: 5px 5px 0 0;
        }
        .content {
          background-color: white;
          padding: 30px;
          border-radius: 0 0 5px 5px;
        }
        .footer {
          text-align: center;
          margin-top: 20px;
          font-size: 12px;
          color: #666;
        }
        .success {
          background-color: #d4edda;
          border-left: 4px solid #28a745;
          padding: 10px;
          margin: 20px 0;
        }
        .alert {
          background-color: #f8d7da;
          border-left: 4px solid #dc3545;
          padding: 10px;
          margin: 20px 0;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Password Changed</h1>
        </div>
        <div class="content">
          <h2>Hello ${userName},</h2>

          <div class="success">
            <strong>Success!</strong> Your password has been changed successfully.
          </div>

          <p>This email confirms that your password was recently changed.</p>

          <p><strong>Change Date:</strong> ${new Date().toLocaleString()}</p>

          <div class="alert">
            <strong>Security Alert:</strong> If you did not make this change, please contact our support team immediately and secure your account.
          </div>

          <p>For your security, we recommend:</p>
          <ul>
            <li>Using a strong, unique password</li>
            <li>Enabling two-factor authentication if available</li>
            <li>Never sharing your password with anyone</li>
            <li>Changing your password if you suspect unauthorized access</li>
          </ul>

          <p>Best regards,<br>The Team</p>
        </div>
        <div class="footer">
          <p>This is an automated email. Please do not reply to this message.</p>
          <p>&copy; ${new Date().getFullYear()} All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

module.exports = {
  generateVerificationEmail,
  generatePasswordResetEmail,
  generateWelcomeEmail,
  generatePasswordChangedEmail
};
