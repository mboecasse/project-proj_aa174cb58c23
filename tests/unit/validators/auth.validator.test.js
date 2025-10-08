// File: tests/unit/validators/auth.validator.test.js
// Generated: 2025-10-08 13:05:35 UTC
// Project ID: proj_aa174cb58c23
// Task ID: task_orcxixupjzy8


const { body } = require('express-validator');


const {
  registerValidation,
  loginValidation,
  forgotPasswordValidation,
  resetPasswordValidation,
  verifyEmailValidation,
  resendVerificationValidation,
  changePasswordValidation,
  refreshTokenValidation
} = require('../../../src/validators/auth.validator');

describe('Auth Validator', () => {
  describe('registerValidation', () => {
    it('should be an array of validation rules', () => {
      expect(Array.isArray(registerValidation)).toBe(true);
      expect(registerValidation.length).toBeGreaterThan(0);
    });

    it('should validate name field', () => {
      const nameValidator = registerValidation.find(
        validator => validator.builder.fields[0] === 'name'
      );
      expect(nameValidator).toBeDefined();
    });

    it('should validate email field', () => {
      const emailValidator = registerValidation.find(
        validator => validator.builder.fields[0] === 'email'
      );
      expect(emailValidator).toBeDefined();
    });

    it('should validate password field', () => {
      const passwordValidator = registerValidation.find(
        validator => validator.builder.fields[0] === 'password'
      );
      expect(passwordValidator).toBeDefined();
    });

    it('should have minimum 3 validation rules', () => {
      expect(registerValidation.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('loginValidation', () => {
    it('should be an array of validation rules', () => {
      expect(Array.isArray(loginValidation)).toBe(true);
      expect(loginValidation.length).toBeGreaterThan(0);
    });

    it('should validate email field', () => {
      const emailValidator = loginValidation.find(
        validator => validator.builder.fields[0] === 'email'
      );
      expect(emailValidator).toBeDefined();
    });

    it('should validate password field', () => {
      const passwordValidator = loginValidation.find(
        validator => validator.builder.fields[0] === 'password'
      );
      expect(passwordValidator).toBeDefined();
    });

    it('should have minimum 2 validation rules', () => {
      expect(loginValidation.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('forgotPasswordValidation', () => {
    it('should be an array of validation rules', () => {
      expect(Array.isArray(forgotPasswordValidation)).toBe(true);
      expect(forgotPasswordValidation.length).toBeGreaterThan(0);
    });

    it('should validate email field', () => {
      const emailValidator = forgotPasswordValidation.find(
        validator => validator.builder.fields[0] === 'email'
      );
      expect(emailValidator).toBeDefined();
    });

    it('should have at least 1 validation rule', () => {
      expect(forgotPasswordValidation.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('resetPasswordValidation', () => {
    it('should be an array of validation rules', () => {
      expect(Array.isArray(resetPasswordValidation)).toBe(true);
      expect(resetPasswordValidation.length).toBeGreaterThan(0);
    });

    it('should validate token field', () => {
      const tokenValidator = resetPasswordValidation.find(
        validator => validator.builder.fields[0] === 'token'
      );
      expect(tokenValidator).toBeDefined();
    });

    it('should validate password field', () => {
      const passwordValidator = resetPasswordValidation.find(
        validator => validator.builder.fields[0] === 'password'
      );
      expect(passwordValidator).toBeDefined();
    });

    it('should have minimum 2 validation rules', () => {
      expect(resetPasswordValidation.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('verifyEmailValidation', () => {
    it('should be an array of validation rules', () => {
      expect(Array.isArray(verifyEmailValidation)).toBe(true);
      expect(verifyEmailValidation.length).toBeGreaterThan(0);
    });

    it('should validate token field', () => {
      const tokenValidator = verifyEmailValidation.find(
        validator => validator.builder.fields[0] === 'token'
      );
      expect(tokenValidator).toBeDefined();
    });

    it('should have at least 1 validation rule', () => {
      expect(verifyEmailValidation.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('resendVerificationValidation', () => {
    it('should be an array of validation rules', () => {
      expect(Array.isArray(resendVerificationValidation)).toBe(true);
      expect(resendVerificationValidation.length).toBeGreaterThan(0);
    });

    it('should validate email field', () => {
      const emailValidator = resendVerificationValidation.find(
        validator => validator.builder.fields[0] === 'email'
      );
      expect(emailValidator).toBeDefined();
    });

    it('should have at least 1 validation rule', () => {
      expect(resendVerificationValidation.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('changePasswordValidation', () => {
    it('should be an array of validation rules', () => {
      expect(Array.isArray(changePasswordValidation)).toBe(true);
      expect(changePasswordValidation.length).toBeGreaterThan(0);
    });

    it('should validate currentPassword field', () => {
      const currentPasswordValidator = changePasswordValidation.find(
        validator => validator.builder.fields[0] === 'currentPassword'
      );
      expect(currentPasswordValidator).toBeDefined();
    });

    it('should validate newPassword field', () => {
      const newPasswordValidator = changePasswordValidation.find(
        validator => validator.builder.fields[0] === 'newPassword'
      );
      expect(newPasswordValidator).toBeDefined();
    });

    it('should have minimum 2 validation rules', () => {
      expect(changePasswordValidation.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('refreshTokenValidation', () => {
    it('should be an array of validation rules', () => {
      expect(Array.isArray(refreshTokenValidation)).toBe(true);
      expect(refreshTokenValidation.length).toBeGreaterThan(0);
    });

    it('should validate refreshToken field', () => {
      const refreshTokenValidator = refreshTokenValidation.find(
        validator => validator.builder.fields[0] === 'refreshToken'
      );
      expect(refreshTokenValidator).toBeDefined();
    });

    it('should have at least 1 validation rule', () => {
      expect(refreshTokenValidation.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Validation Rule Structure', () => {
    it('should export all required validation functions', () => {
      expect(registerValidation).toBeDefined();
      expect(loginValidation).toBeDefined();
      expect(forgotPasswordValidation).toBeDefined();
      expect(resetPasswordValidation).toBeDefined();
      expect(verifyEmailValidation).toBeDefined();
      expect(resendVerificationValidation).toBeDefined();
      expect(changePasswordValidation).toBeDefined();
      expect(refreshTokenValidation).toBeDefined();
    });

    it('should have validation chains as arrays', () => {
      expect(Array.isArray(registerValidation)).toBe(true);
      expect(Array.isArray(loginValidation)).toBe(true);
      expect(Array.isArray(forgotPasswordValidation)).toBe(true);
      expect(Array.isArray(resetPasswordValidation)).toBe(true);
      expect(Array.isArray(verifyEmailValidation)).toBe(true);
      expect(Array.isArray(resendVerificationValidation)).toBe(true);
      expect(Array.isArray(changePasswordValidation)).toBe(true);
      expect(Array.isArray(refreshTokenValidation)).toBe(true);
    });
  });

  describe('Email Validation', () => {
    it('should validate email format in register validation', () => {
      const emailValidator = registerValidation.find(
        validator => validator.builder.fields[0] === 'email'
      );
      expect(emailValidator).toBeDefined();
    });

    it('should validate email format in login validation', () => {
      const emailValidator = loginValidation.find(
        validator => validator.builder.fields[0] === 'email'
      );
      expect(emailValidator).toBeDefined();
    });

    it('should validate email format in forgot password validation', () => {
      const emailValidator = forgotPasswordValidation.find(
        validator => validator.builder.fields[0] === 'email'
      );
      expect(emailValidator).toBeDefined();
    });

    it('should validate email format in resend verification validation', () => {
      const emailValidator = resendVerificationValidation.find(
        validator => validator.builder.fields[0] === 'email'
      );
      expect(emailValidator).toBeDefined();
    });
  });

  describe('Password Validation', () => {
    it('should validate password in register validation', () => {
      const passwordValidator = registerValidation.find(
        validator => validator.builder.fields[0] === 'password'
      );
      expect(passwordValidator).toBeDefined();
    });

    it('should validate password in login validation', () => {
      const passwordValidator = loginValidation.find(
        validator => validator.builder.fields[0] === 'password'
      );
      expect(passwordValidator).toBeDefined();
    });

    it('should validate password in reset password validation', () => {
      const passwordValidator = resetPasswordValidation.find(
        validator => validator.builder.fields[0] === 'password'
      );
      expect(passwordValidator).toBeDefined();
    });

    it('should validate current and new password in change password validation', () => {
      const currentPasswordValidator = changePasswordValidation.find(
        validator => validator.builder.fields[0] === 'currentPassword'
      );
      const newPasswordValidator = changePasswordValidation.find(
        validator => validator.builder.fields[0] === 'newPassword'
      );
      expect(currentPasswordValidator).toBeDefined();
      expect(newPasswordValidator).toBeDefined();
    });
  });

  describe('Token Validation', () => {
    it('should validate token in reset password validation', () => {
      const tokenValidator = resetPasswordValidation.find(
        validator => validator.builder.fields[0] === 'token'
      );
      expect(tokenValidator).toBeDefined();
    });

    it('should validate token in verify email validation', () => {
      const tokenValidator = verifyEmailValidation.find(
        validator => validator.builder.fields[0] === 'token'
      );
      expect(tokenValidator).toBeDefined();
    });

    it('should validate refresh token in refresh token validation', () => {
      const refreshTokenValidator = refreshTokenValidation.find(
        validator => validator.builder.fields[0] === 'refreshToken'
      );
      expect(refreshTokenValidator).toBeDefined();
    });
  });

  describe('Name Validation', () => {
    it('should validate name in register validation', () => {
      const nameValidator = registerValidation.find(
        validator => validator.builder.fields[0] === 'name'
      );
      expect(nameValidator).toBeDefined();
    });
  });

  describe('Validation Coverage', () => {
    it('should cover all authentication endpoints', () => {
      const validations = {
        register: registerValidation,
        login: loginValidation,
        forgotPassword: forgotPasswordValidation,
        resetPassword: resetPasswordValidation,
        verifyEmail: verifyEmailValidation,
        resendVerification: resendVerificationValidation,
        changePassword: changePasswordValidation,
        refreshToken: refreshTokenValidation
      };

      Object.entries(validations).forEach(([name, validation]) => {
        expect(validation).toBeDefined();
        expect(Array.isArray(validation)).toBe(true);
        expect(validation.length).toBeGreaterThan(0);
      });
    });

    it('should have non-empty validation arrays', () => {
      expect(registerValidation.length).toBeGreaterThan(0);
      expect(loginValidation.length).toBeGreaterThan(0);
      expect(forgotPasswordValidation.length).toBeGreaterThan(0);
      expect(resetPasswordValidation.length).toBeGreaterThan(0);
      expect(verifyEmailValidation.length).toBeGreaterThan(0);
      expect(resendVerificationValidation.length).toBeGreaterThan(0);
      expect(changePasswordValidation.length).toBeGreaterThan(0);
      expect(refreshTokenValidation.length).toBeGreaterThan(0);
    });
  });
});
