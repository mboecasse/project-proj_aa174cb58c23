// File: tests/unit/services/email.service.test.js
// Generated: 2025-10-08 13:07:17 UTC
// Project ID: proj_aa174cb58c23
// Task ID: task_l3icbwjhhwsi


const emailService = require('../../../src/services/email.service');


const sgMail = require('@sendgrid/mail');

jest.mock('@sendgrid/mail');

describe('Email Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.SENDGRID_API_KEY = 'test_api_key';
    process.env.SENDGRID_FROM_EMAIL = 'test@example.com';
    process.env.SENDGRID_FROM_NAME = 'Test Sender';
  });

  afterEach(() => {
    delete process.env.SENDGRID_API_KEY;
    delete process.env.SENDGRID_FROM_EMAIL;
    delete process.env.SENDGRID_FROM_NAME;
  });

  describe('sendEmail', () => {
    it('should send email successfully', async () => {
      const mockResponse = [{ statusCode: 202 }];
      sgMail.send.mockResolvedValue(mockResponse);

      const to = 'recipient@example.com';
      const subject = 'Test Subject';
      const text = 'Test plain text';
      const html = '<p>Test HTML</p>';

      const result = await emailService.sendEmail(to, subject, text, html);

      expect(sgMail.setApiKey).toHaveBeenCalledWith('test_api_key');
      expect(sgMail.send).toHaveBeenCalledWith({
        to,
        from: {
          email: 'test@example.com',
          name: 'Test Sender'
        },
        subject,
        text,
        html
      });
      expect(result).toEqual(mockResponse);
    });

    it('should throw error when SendGrid API key is missing', async () => {
      delete process.env.SENDGRID_API_KEY;

      await expect(
        emailService.sendEmail('test@example.com', 'Subject', 'Text', 'HTML')
      ).rejects.toThrow('SendGrid API key is not configured');
    });

    it('should throw error when from email is missing', async () => {
      delete process.env.SENDGRID_FROM_EMAIL;

      await expect(
        emailService.sendEmail('test@example.com', 'Subject', 'Text', 'HTML')
      ).rejects.toThrow('SendGrid from email is not configured');
    });

    it('should retry on transient errors', async () => {
      const mockError = new Error('Service temporarily unavailable');
      mockError.code = 503;

      sgMail.send
        .mockRejectedValueOnce(mockError)
        .mockRejectedValueOnce(mockError)
        .mockResolvedValueOnce([{ statusCode: 202 }]);

      const result = await emailService.sendEmail(
        'test@example.com',
        'Subject',
        'Text',
        'HTML'
      );

      expect(sgMail.send).toHaveBeenCalledTimes(3);
      expect(result).toEqual([{ statusCode: 202 }]);
    });

    it('should fail after max retries on transient errors', async () => {
      const mockError = new Error('Service temporarily unavailable');
      mockError.code = 503;

      sgMail.send.mockRejectedValue(mockError);

      await expect(
        emailService.sendEmail('test@example.com', 'Subject', 'Text', 'HTML')
      ).rejects.toThrow('Service temporarily unavailable');

      expect(sgMail.send).toHaveBeenCalledTimes(3);
    });

    it('should not retry on permanent errors', async () => {
      const mockError = new Error('Invalid API key');
      mockError.code = 401;

      sgMail.send.mockRejectedValue(mockError);

      await expect(
        emailService.sendEmail('test@example.com', 'Subject', 'Text', 'HTML')
      ).rejects.toThrow('Invalid API key');

      expect(sgMail.send).toHaveBeenCalledTimes(1);
    });

    it('should handle network errors with retry', async () => {
      const mockError = new Error('Network error');
      mockError.code = 'ECONNRESET';

      sgMail.send
        .mockRejectedValueOnce(mockError)
        .mockResolvedValueOnce([{ statusCode: 202 }]);

      const result = await emailService.sendEmail(
        'test@example.com',
        'Subject',
        'Text',
        'HTML'
      );

      expect(sgMail.send).toHaveBeenCalledTimes(2);
      expect(result).toEqual([{ statusCode: 202 }]);
    });
  });

  describe('sendVerificationEmail', () => {
    it('should send verification email with correct template', async () => {
      const mockResponse = [{ statusCode: 202 }];
      sgMail.send.mockResolvedValue(mockResponse);

      const to = 'user@example.com';
      const token = 'verification_token_123';
      const verificationUrl = `http://localhost:3000/verify-email?token=${token}`;

      const result = await emailService.sendVerificationEmail(to, token);

      expect(sgMail.send).toHaveBeenCalledWith(
        expect.objectContaining({
          to,
          subject: 'Verify Your Email Address',
          text: expect.stringContaining(verificationUrl),
          html: expect.stringContaining(verificationUrl)
        })
      );
      expect(result).toEqual(mockResponse);
    });

    it('should include token in verification URL', async () => {
      sgMail.send.mockResolvedValue([{ statusCode: 202 }]);

      const token = 'test_token_456';
      await emailService.sendVerificationEmail('user@example.com', token);

      const callArgs = sgMail.send.mock.calls[0][0];
      expect(callArgs.text).toContain(token);
      expect(callArgs.html).toContain(token);
    });
  });

  describe('sendPasswordResetEmail', () => {
    it('should send password reset email with correct template', async () => {
      const mockResponse = [{ statusCode: 202 }];
      sgMail.send.mockResolvedValue(mockResponse);

      const to = 'user@example.com';
      const token = 'reset_token_123';
      const resetUrl = `http://localhost:3000/reset-password?token=${token}`;

      const result = await emailService.sendPasswordResetEmail(to, token);

      expect(sgMail.send).toHaveBeenCalledWith(
        expect.objectContaining({
          to,
          subject: 'Password Reset Request',
          text: expect.stringContaining(resetUrl),
          html: expect.stringContaining(resetUrl)
        })
      );
      expect(result).toEqual(mockResponse);
    });

    it('should include token in reset URL', async () => {
      sgMail.send.mockResolvedValue([{ statusCode: 202 }]);

      const token = 'test_reset_token_789';
      await emailService.sendPasswordResetEmail('user@example.com', token);

      const callArgs = sgMail.send.mock.calls[0][0];
      expect(callArgs.text).toContain(token);
      expect(callArgs.html).toContain(token);
    });

    it('should include security warning in reset email', async () => {
      sgMail.send.mockResolvedValue([{ statusCode: 202 }]);

      await emailService.sendPasswordResetEmail('user@example.com', 'token123');

      const callArgs = sgMail.send.mock.calls[0][0];
      expect(callArgs.text.toLowerCase()).toContain('did not request');
      expect(callArgs.html.toLowerCase()).toContain('did not request');
    });
  });

  describe('sendWelcomeEmail', () => {
    it('should send welcome email with user name', async () => {
      const mockResponse = [{ statusCode: 202 }];
      sgMail.send.mockResolvedValue(mockResponse);

      const to = 'user@example.com';
      const name = 'John Doe';

      const result = await emailService.sendWelcomeEmail(to, name);

      expect(sgMail.send).toHaveBeenCalledWith(
        expect.objectContaining({
          to,
          subject: 'Welcome to Our Platform',
          text: expect.stringContaining(name),
          html: expect.stringContaining(name)
        })
      );
      expect(result).toEqual(mockResponse);
    });

    it('should handle welcome email without name', async () => {
      sgMail.send.mockResolvedValue([{ statusCode: 202 }]);

      await emailService.sendWelcomeEmail('user@example.com');

      const callArgs = sgMail.send.mock.calls[0][0];
      expect(callArgs.text).toBeDefined();
      expect(callArgs.html).toBeDefined();
    });
  });

  describe('error handling', () => {
    it('should handle SendGrid API errors gracefully', async () => {
      const mockError = new Error('SendGrid API error');
      mockError.response = {
        body: {
          errors: [{ message: 'Invalid email address' }]
        }
      };
      sgMail.send.mockRejectedValue(mockError);

      await expect(
        emailService.sendEmail('invalid', 'Subject', 'Text', 'HTML')
      ).rejects.toThrow('SendGrid API error');
    });

    it('should handle rate limiting errors', async () => {
      const mockError = new Error('Rate limit exceeded');
      mockError.code = 429;
      sgMail.send.mockRejectedValue(mockError);

      await expect(
        emailService.sendEmail('test@example.com', 'Subject', 'Text', 'HTML')
      ).rejects.toThrow('Rate limit exceeded');

      expect(sgMail.send).toHaveBeenCalledTimes(3);
    });

    it('should handle timeout errors with retry', async () => {
      const mockError = new Error('Request timeout');
      mockError.code = 'ETIMEDOUT';

      sgMail.send
        .mockRejectedValueOnce(mockError)
        .mockResolvedValueOnce([{ statusCode: 202 }]);

      const result = await emailService.sendEmail(
        'test@example.com',
        'Subject',
        'Text',
        'HTML'
      );

      expect(sgMail.send).toHaveBeenCalledTimes(2);
      expect(result).toEqual([{ statusCode: 202 }]);
    });
  });

  describe('configuration validation', () => {
    it('should validate all required environment variables', async () => {
      delete process.env.SENDGRID_API_KEY;
      delete process.env.SENDGRID_FROM_EMAIL;

      await expect(
        emailService.sendEmail('test@example.com', 'Subject', 'Text', 'HTML')
      ).rejects.toThrow();
    });

    it('should use default from name if not provided', async () => {
      delete process.env.SENDGRID_FROM_NAME;
      sgMail.send.mockResolvedValue([{ statusCode: 202 }]);

      await emailService.sendEmail('test@example.com', 'Subject', 'Text', 'HTML');

      const callArgs = sgMail.send.mock.calls[0][0];
      expect(callArgs.from.email).toBe('test@example.com');
      expect(callArgs.from.name).toBeDefined();
    });
  });

  describe('email content validation', () => {
    it('should send email with only text content', async () => {
      sgMail.send.mockResolvedValue([{ statusCode: 202 }]);

      await emailService.sendEmail(
        'test@example.com',
        'Subject',
        'Plain text only'
      );

      const callArgs = sgMail.send.mock.calls[0][0];
      expect(callArgs.text).toBe('Plain text only');
      expect(callArgs.html).toBeUndefined();
    });

    it('should send email with both text and HTML content', async () => {
      sgMail.send.mockResolvedValue([{ statusCode: 202 }]);

      await emailService.sendEmail(
        'test@example.com',
        'Subject',
        'Plain text',
        '<p>HTML content</p>'
      );

      const callArgs = sgMail.send.mock.calls[0][0];
      expect(callArgs.text).toBe('Plain text');
      expect(callArgs.html).toBe('<p>HTML content</p>');
    });
  });
});
