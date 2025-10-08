// File: tests/unit/utils/passwordHash.test.js
// Generated: 2025-10-08 13:05:36 UTC
// Project ID: proj_aa174cb58c23
// Task ID: task_4tzwl4imffvx


const bcrypt = require('bcryptjs');

const { hashPassword, comparePassword } = require('../../../src/utils/passwordHash');

describe('Password Hash Utility', () => {
  describe('hashPassword', () => {
    it('should hash a password successfully', async () => {
      const password = 'TestPassword123!';
      const hashedPassword = await hashPassword(password);

      expect(hashedPassword).toBeDefined();
      expect(typeof hashedPassword).toBe('string');
      expect(hashedPassword).not.toBe(password);
      expect(hashedPassword.length).toBeGreaterThan(0);
    });

    it('should generate different hashes for the same password', async () => {
      const password = 'TestPassword123!';
      const hash1 = await hashPassword(password);
      const hash2 = await hashPassword(password);

      expect(hash1).not.toBe(hash2);
    });

    it('should generate bcrypt hash with correct format', async () => {
      const password = 'TestPassword123!';
      const hashedPassword = await hashPassword(password);

      // Bcrypt hashes start with $2a$, $2b$, or $2y$
      expect(hashedPassword).toMatch(/^\$2[aby]\$/);
    });

    it('should throw error for empty password', async () => {
      await expect(hashPassword('')).rejects.toThrow();
    });

    it('should throw error for null password', async () => {
      await expect(hashPassword(null)).rejects.toThrow();
    });

    it('should throw error for undefined password', async () => {
      await expect(hashPassword(undefined)).rejects.toThrow();
    });

    it('should handle long passwords', async () => {
      const longPassword = 'a'.repeat(100);
      const hashedPassword = await hashPassword(longPassword);

      expect(hashedPassword).toBeDefined();
      expect(typeof hashedPassword).toBe('string');
    });

    it('should handle special characters in password', async () => {
      const password = '!@#$%^&*()_+-=[]{}|;:,.<>?';
      const hashedPassword = await hashPassword(password);

      expect(hashedPassword).toBeDefined();
      expect(typeof hashedPassword).toBe('string');
    });

    it('should handle unicode characters in password', async () => {
      const password = '密码测试🔐';
      const hashedPassword = await hashPassword(password);

      expect(hashedPassword).toBeDefined();
      expect(typeof hashedPassword).toBe('string');
    });

    it('should use sufficient salt rounds (minimum 12)', async () => {
      const password = 'TestPassword123!';
      const hashedPassword = await hashPassword(password);

      // Extract salt rounds from bcrypt hash
      const rounds = parseInt(hashedPassword.split('$')[2]);
      expect(rounds).toBeGreaterThanOrEqual(12);
    });
  });

  describe('comparePassword', () => {
    it('should return true for matching password', async () => {
      const password = 'TestPassword123!';
      const hashedPassword = await hashPassword(password);
      const isMatch = await comparePassword(password, hashedPassword);

      expect(isMatch).toBe(true);
    });

    it('should return false for non-matching password', async () => {
      const password = 'TestPassword123!';
      const wrongPassword = 'WrongPassword456!';
      const hashedPassword = await hashPassword(password);
      const isMatch = await comparePassword(wrongPassword, hashedPassword);

      expect(isMatch).toBe(false);
    });

    it('should be case sensitive', async () => {
      const password = 'TestPassword123!';
      const hashedPassword = await hashPassword(password);
      const isMatch = await comparePassword('testpassword123!', hashedPassword);

      expect(isMatch).toBe(false);
    });

    it('should return false for empty password', async () => {
      const password = 'TestPassword123!';
      const hashedPassword = await hashPassword(password);
      const isMatch = await comparePassword('', hashedPassword);

      expect(isMatch).toBe(false);
    });

    it('should throw error for null password', async () => {
      const password = 'TestPassword123!';
      const hashedPassword = await hashPassword(password);

      await expect(comparePassword(null, hashedPassword)).rejects.toThrow();
    });

    it('should throw error for undefined password', async () => {
      const password = 'TestPassword123!';
      const hashedPassword = await hashPassword(password);

      await expect(comparePassword(undefined, hashedPassword)).rejects.toThrow();
    });

    it('should throw error for invalid hash', async () => {
      const password = 'TestPassword123!';
      const invalidHash = 'not-a-valid-hash';

      await expect(comparePassword(password, invalidHash)).rejects.toThrow();
    });

    it('should throw error for empty hash', async () => {
      const password = 'TestPassword123!';

      await expect(comparePassword(password, '')).rejects.toThrow();
    });

    it('should throw error for null hash', async () => {
      const password = 'TestPassword123!';

      await expect(comparePassword(password, null)).rejects.toThrow();
    });

    it('should handle special characters correctly', async () => {
      const password = '!@#$%^&*()_+-=[]{}|;:,.<>?';
      const hashedPassword = await hashPassword(password);
      const isMatch = await comparePassword(password, hashedPassword);

      expect(isMatch).toBe(true);
    });

    it('should handle unicode characters correctly', async () => {
      const password = '密码测试🔐';
      const hashedPassword = await hashPassword(password);
      const isMatch = await comparePassword(password, hashedPassword);

      expect(isMatch).toBe(true);
    });

    it('should handle long passwords correctly', async () => {
      const longPassword = 'a'.repeat(100);
      const hashedPassword = await hashPassword(longPassword);
      const isMatch = await comparePassword(longPassword, hashedPassword);

      expect(isMatch).toBe(true);
    });

    it('should detect single character difference', async () => {
      const password = 'TestPassword123!';
      const hashedPassword = await hashPassword(password);
      const isMatch = await comparePassword('TestPassword123@', hashedPassword);

      expect(isMatch).toBe(false);
    });

    it('should detect whitespace differences', async () => {
      const password = 'TestPassword123!';
      const hashedPassword = await hashPassword(password);
      const isMatch = await comparePassword('TestPassword123! ', hashedPassword);

      expect(isMatch).toBe(false);
    });
  });

  describe('Integration tests', () => {
    it('should complete full hash and compare cycle', async () => {
      const password = 'SecurePassword123!';

      // Hash the password
      const hashedPassword = await hashPassword(password);
      expect(hashedPassword).toBeDefined();

      // Compare correct password
      const isCorrect = await comparePassword(password, hashedPassword);
      expect(isCorrect).toBe(true);

      // Compare incorrect password
      const isIncorrect = await comparePassword('WrongPassword456!', hashedPassword);
      expect(isIncorrect).toBe(false);
    });

    it('should handle multiple hash operations concurrently', async () => {
      const passwords = ['Password1!', 'Password2!', 'Password3!'];

      const hashPromises = passwords.map(pwd => hashPassword(pwd));
      const hashes = await Promise.all(hashPromises);

      expect(hashes).toHaveLength(3);
      expect(hashes[0]).not.toBe(hashes[1]);
      expect(hashes[1]).not.toBe(hashes[2]);

      // Verify each hash
      const comparePromises = passwords.map((pwd, idx) =>
        comparePassword(pwd, hashes[idx])
      );
      const results = await Promise.all(comparePromises);

      expect(results).toEqual([true, true, true]);
    });

    it('should maintain hash integrity over time', async () => {
      const password = 'TestPassword123!';
      const hashedPassword = await hashPassword(password);

      // Simulate delay
      await new Promise(resolve => setTimeout(resolve, 100));

      // Hash should still be valid
      const isMatch = await comparePassword(password, hashedPassword);
      expect(isMatch).toBe(true);
    });
  });

  describe('Performance tests', () => {
    it('should hash password within reasonable time', async () => {
      const password = 'TestPassword123!';
      const startTime = Date.now();

      await hashPassword(password);

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Hashing should take less than 2 seconds
      expect(duration).toBeLessThan(2000);
    });

    it('should compare password within reasonable time', async () => {
      const password = 'TestPassword123!';
      const hashedPassword = await hashPassword(password);

      const startTime = Date.now();
      await comparePassword(password, hashedPassword);
      const endTime = Date.now();

      const duration = endTime - startTime;

      // Comparison should take less than 2 seconds
      expect(duration).toBeLessThan(2000);
    });
  });

  describe('Security tests', () => {
    it('should not expose original password in hash', async () => {
      const password = 'TestPassword123!';
      const hashedPassword = await hashPassword(password);

      expect(hashedPassword).not.toContain(password);
      expect(hashedPassword.toLowerCase()).not.toContain(password.toLowerCase());
    });

    it('should produce cryptographically strong hashes', async () => {
      const password = 'TestPassword123!';
      const hashes = [];

      // Generate multiple hashes
      for (let i = 0; i < 10; i++) {
        hashes.push(await hashPassword(password));
      }

      // All hashes should be unique
      const uniqueHashes = new Set(hashes);
      expect(uniqueHashes.size).toBe(10);
    });

    it('should resist timing attacks', async () => {
      const password = 'TestPassword123!';
      const hashedPassword = await hashPassword(password);

      const timings = [];

      // Test with correct password
      for (let i = 0; i < 5; i++) {
        const start = Date.now();
        await comparePassword(password, hashedPassword);
        timings.push(Date.now() - start);
      }

      // Test with incorrect password
      for (let i = 0; i < 5; i++) {
        const start = Date.now();
        await comparePassword('WrongPassword!', hashedPassword);
        timings.push(Date.now() - start);
      }

      // Timing variance should be minimal (bcrypt is constant-time)
      const avgTiming = timings.reduce((a, b) => a + b, 0) / timings.length;
      const maxDeviation = Math.max(...timings.map(t => Math.abs(t - avgTiming)));

      // Allow for some variance but should be relatively consistent
      expect(maxDeviation).toBeLessThan(avgTiming * 2);
    });
  });
});
