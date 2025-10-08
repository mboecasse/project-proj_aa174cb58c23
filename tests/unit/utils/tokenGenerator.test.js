// File: tests/unit/utils/tokenGenerator.test.js
// Generated: 2025-10-08 13:05:15 UTC
// Project ID: proj_aa174cb58c23
// Task ID: task_qhzelurdcqr2


const crypto = require('crypto');

const { generateToken, generateRefreshToken, generateVerificationToken, generateResetToken } = require('../../../src/utils/tokenGenerator');

describe('Token Generator Utils', () => {
  describe('generateToken', () => {
    it('should generate a random token of default length (32 bytes)', () => {
      const token = generateToken();

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.length).toBe(64); // 32 bytes = 64 hex characters
    });

    it('should generate a random token of specified length', () => {
      const token = generateToken(16);

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.length).toBe(32); // 16 bytes = 32 hex characters
    });

    it('should generate unique tokens on each call', () => {
      const token1 = generateToken();
      const token2 = generateToken();

      expect(token1).not.toBe(token2);
    });

    it('should generate tokens with only hexadecimal characters', () => {
      const token = generateToken();
      const hexRegex = /^[0-9a-f]+$/;

      expect(hexRegex.test(token)).toBe(true);
    });

    it('should handle custom byte lengths correctly', () => {
      const lengths = [8, 16, 24, 32, 48, 64];

      lengths.forEach(length => {
        const token = generateToken(length);
        expect(token.length).toBe(length * 2); // bytes * 2 = hex characters
      });
    });

    it('should throw error for invalid length', () => {
      expect(() => generateToken(0)).toThrow();
      expect(() => generateToken(-1)).toThrow();
    });
  });

  describe('generateRefreshToken', () => {
    it('should generate a refresh token of 64 bytes (128 hex chars)', () => {
      const token = generateRefreshToken();

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.length).toBe(128); // 64 bytes = 128 hex characters
    });

    it('should generate unique refresh tokens', () => {
      const token1 = generateRefreshToken();
      const token2 = generateRefreshToken();

      expect(token1).not.toBe(token2);
    });

    it('should generate tokens with only hexadecimal characters', () => {
      const token = generateRefreshToken();
      const hexRegex = /^[0-9a-f]+$/;

      expect(hexRegex.test(token)).toBe(true);
    });

    it('should generate cryptographically secure tokens', () => {
      const tokens = new Set();
      const iterations = 100;

      for (let i = 0; i < iterations; i++) {
        tokens.add(generateRefreshToken());
      }

      // All tokens should be unique
      expect(tokens.size).toBe(iterations);
    });
  });

  describe('generateVerificationToken', () => {
    it('should generate a verification token of 32 bytes (64 hex chars)', () => {
      const token = generateVerificationToken();

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.length).toBe(64); // 32 bytes = 64 hex characters
    });

    it('should generate unique verification tokens', () => {
      const token1 = generateVerificationToken();
      const token2 = generateVerificationToken();

      expect(token1).not.toBe(token2);
    });

    it('should generate tokens with only hexadecimal characters', () => {
      const token = generateVerificationToken();
      const hexRegex = /^[0-9a-f]+$/;

      expect(hexRegex.test(token)).toBe(true);
    });

    it('should generate sufficiently random tokens', () => {
      const tokens = new Set();
      const iterations = 1000;

      for (let i = 0; i < iterations; i++) {
        tokens.add(generateVerificationToken());
      }

      // All tokens should be unique
      expect(tokens.size).toBe(iterations);
    });
  });

  describe('generateResetToken', () => {
    it('should generate a reset token of 32 bytes (64 hex chars)', () => {
      const token = generateResetToken();

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.length).toBe(64); // 32 bytes = 64 hex characters
    });

    it('should generate unique reset tokens', () => {
      const token1 = generateResetToken();
      const token2 = generateResetToken();

      expect(token1).not.toBe(token2);
    });

    it('should generate tokens with only hexadecimal characters', () => {
      const token = generateResetToken();
      const hexRegex = /^[0-9a-f]+$/;

      expect(hexRegex.test(token)).toBe(true);
    });

    it('should generate cryptographically secure tokens', () => {
      const tokens = new Set();
      const iterations = 500;

      for (let i = 0; i < iterations; i++) {
        tokens.add(generateResetToken());
      }

      // All tokens should be unique
      expect(tokens.size).toBe(iterations);
    });
  });

  describe('Token Security', () => {
    it('should use crypto.randomBytes for secure random generation', () => {
      const randomBytesSpy = jest.spyOn(crypto, 'randomBytes');

      generateToken();
      expect(randomBytesSpy).toHaveBeenCalled();

      randomBytesSpy.mockRestore();
    });

    it('should generate tokens with high entropy', () => {
      const token = generateToken(32);
      const uniqueChars = new Set(token.split('')).size;

      // Should have good character distribution (at least 10 unique chars)
      expect(uniqueChars).toBeGreaterThan(10);
    });

    it('should not generate predictable patterns', () => {
      const tokens = [];
      for (let i = 0; i < 10; i++) {
        tokens.push(generateToken());
      }

      // Check no sequential tokens are similar
      for (let i = 0; i < tokens.length - 1; i++) {
        const similarity = calculateSimilarity(tokens[i], tokens[i + 1]);
        expect(similarity).toBeLessThan(0.3); // Less than 30% similar
      }
    });

    it('should handle concurrent token generation', async () => {
      const promises = [];
      for (let i = 0; i < 100; i++) {
        promises.push(Promise.resolve(generateToken()));
      }

      const tokens = await Promise.all(promises);
      const uniqueTokens = new Set(tokens);

      expect(uniqueTokens.size).toBe(100);
    });
  });

  describe('Error Handling', () => {
    it('should handle crypto errors gracefully', () => {
      const originalRandomBytes = crypto.randomBytes;
      crypto.randomBytes = jest.fn(() => {
        throw new Error('Crypto error');
      });

      expect(() => generateToken()).toThrow('Crypto error');

      crypto.randomBytes = originalRandomBytes;
    });

    it('should validate input parameters', () => {
      expect(() => generateToken('invalid')).toThrow();
      expect(() => generateToken(null)).toThrow();
      expect(() => generateToken(undefined)).not.toThrow(); // Should use default
    });
  });

  describe('Performance', () => {
    it('should generate tokens quickly', () => {
      const start = Date.now();

      for (let i = 0; i < 1000; i++) {
        generateToken();
      }

      const duration = Date.now() - start;
      expect(duration).toBeLessThan(1000); // Should complete in under 1 second
    });

    it('should not leak memory during bulk generation', () => {
      const initialMemory = process.memoryUsage().heapUsed;

      for (let i = 0; i < 10000; i++) {
        generateToken();
      }

      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;

      // Memory increase should be reasonable (less than 50MB)
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);
    });
  });
});

/**
 * Helper function to calculate similarity between two strings
 * @param {string} str1 - First string
 * @param {string} str2 - Second string
 * @returns {number} Similarity ratio (0-1)
 */


function calculateSimilarity(str1, str2) {
  if (str1.length !== str2.length) return 0;

  let matches = 0;
  for (let i = 0; i < str1.length; i++) {
    if (str1[i] === str2[i]) matches++;
  }

  return matches / str1.length;
}
