// File: tests/unit/services/token.service.test.js
// Generated: 2025-10-08 13:07:09 UTC
// Project ID: proj_aa174cb58c23
// Task ID: task_65fna61xt7fa


const jwt = require('jsonwebtoken');


const tokenService = require('../../../src/services/token.service');

// Mock jsonwebtoken
jest.mock('jsonwebtoken');

describe('Token Service', () => {
  const mockUserId = '507f1f77bcf86cd799439011';
  const mockAccessSecret = 'test-access-secret';
  const mockRefreshSecret = 'test-refresh-secret';
  const mockAccessExpiry = '15m';
  const mockRefreshExpiry = '7d';

  beforeAll(() => {
    process.env.JWT_ACCESS_SECRET = mockAccessSecret;
    process.env.JWT_REFRESH_SECRET = mockRefreshSecret;
    process.env.JWT_ACCESS_EXPIRY = mockAccessExpiry;
    process.env.JWT_REFRESH_EXPIRY = mockRefreshExpiry;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('generateAccessToken', () => {
    it('should generate access token with correct payload and options', () => {
      const mockToken = 'mock-access-token';
      jwt.sign.mockReturnValue(mockToken);

      const token = tokenService.generateAccessToken(mockUserId);

      expect(jwt.sign).toHaveBeenCalledWith(
        { userId: mockUserId },
        mockAccessSecret,
        { expiresIn: mockAccessExpiry }
      );
      expect(token).toBe(mockToken);
    });

    it('should use default expiry if JWT_ACCESS_EXPIRY not set', () => {
      const originalExpiry = process.env.JWT_ACCESS_EXPIRY;
      delete process.env.JWT_ACCESS_EXPIRY;

      const mockToken = 'mock-access-token';
      jwt.sign.mockReturnValue(mockToken);

      tokenService.generateAccessToken(mockUserId);

      expect(jwt.sign).toHaveBeenCalledWith(
        { userId: mockUserId },
        mockAccessSecret,
        { expiresIn: '15m' }
      );

      process.env.JWT_ACCESS_EXPIRY = originalExpiry;
    });

    it('should handle token generation errors', () => {
      jwt.sign.mockImplementation(() => {
        throw new Error('Token generation failed');
      });

      expect(() => tokenService.generateAccessToken(mockUserId)).toThrow('Token generation failed');
    });
  });

  describe('generateRefreshToken', () => {
    it('should generate refresh token with correct payload and options', () => {
      const mockToken = 'mock-refresh-token';
      jwt.sign.mockReturnValue(mockToken);

      const token = tokenService.generateRefreshToken(mockUserId);

      expect(jwt.sign).toHaveBeenCalledWith(
        { userId: mockUserId },
        mockRefreshSecret,
        { expiresIn: mockRefreshExpiry }
      );
      expect(token).toBe(mockToken);
    });

    it('should use default expiry if JWT_REFRESH_EXPIRY not set', () => {
      const originalExpiry = process.env.JWT_REFRESH_EXPIRY;
      delete process.env.JWT_REFRESH_EXPIRY;

      const mockToken = 'mock-refresh-token';
      jwt.sign.mockReturnValue(mockToken);

      tokenService.generateRefreshToken(mockUserId);

      expect(jwt.sign).toHaveBeenCalledWith(
        { userId: mockUserId },
        mockRefreshSecret,
        { expiresIn: '7d' }
      );

      process.env.JWT_REFRESH_EXPIRY = originalExpiry;
    });

    it('should handle token generation errors', () => {
      jwt.sign.mockImplementation(() => {
        throw new Error('Refresh token generation failed');
      });

      expect(() => tokenService.generateRefreshToken(mockUserId)).toThrow('Refresh token generation failed');
    });
  });

  describe('verifyAccessToken', () => {
    it('should verify valid access token and return decoded payload', () => {
      const mockToken = 'valid-access-token';
      const mockDecoded = { userId: mockUserId, iat: 1234567890, exp: 1234567890 };
      jwt.verify.mockReturnValue(mockDecoded);

      const decoded = tokenService.verifyAccessToken(mockToken);

      expect(jwt.verify).toHaveBeenCalledWith(mockToken, mockAccessSecret);
      expect(decoded).toEqual(mockDecoded);
    });

    it('should throw error for invalid access token', () => {
      const mockToken = 'invalid-access-token';
      jwt.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      expect(() => tokenService.verifyAccessToken(mockToken)).toThrow('Invalid token');
    });

    it('should throw error for expired access token', () => {
      const mockToken = 'expired-access-token';
      const error = new Error('Token expired');
      error.name = 'TokenExpiredError';
      jwt.verify.mockImplementation(() => {
        throw error;
      });

      expect(() => tokenService.verifyAccessToken(mockToken)).toThrow('Token expired');
    });

    it('should throw error for malformed access token', () => {
      const mockToken = 'malformed-access-token';
      const error = new Error('Malformed token');
      error.name = 'JsonWebTokenError';
      jwt.verify.mockImplementation(() => {
        throw error;
      });

      expect(() => tokenService.verifyAccessToken(mockToken)).toThrow('Malformed token');
    });
  });

  describe('verifyRefreshToken', () => {
    it('should verify valid refresh token and return decoded payload', () => {
      const mockToken = 'valid-refresh-token';
      const mockDecoded = { userId: mockUserId, iat: 1234567890, exp: 1234567890 };
      jwt.verify.mockReturnValue(mockDecoded);

      const decoded = tokenService.verifyRefreshToken(mockToken);

      expect(jwt.verify).toHaveBeenCalledWith(mockToken, mockRefreshSecret);
      expect(decoded).toEqual(mockDecoded);
    });

    it('should throw error for invalid refresh token', () => {
      const mockToken = 'invalid-refresh-token';
      jwt.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      expect(() => tokenService.verifyRefreshToken(mockToken)).toThrow('Invalid token');
    });

    it('should throw error for expired refresh token', () => {
      const mockToken = 'expired-refresh-token';
      const error = new Error('Token expired');
      error.name = 'TokenExpiredError';
      jwt.verify.mockImplementation(() => {
        throw error;
      });

      expect(() => tokenService.verifyRefreshToken(mockToken)).toThrow('Token expired');
    });

    it('should throw error for malformed refresh token', () => {
      const mockToken = 'malformed-refresh-token';
      const error = new Error('Malformed token');
      error.name = 'JsonWebTokenError';
      jwt.verify.mockImplementation(() => {
        throw error;
      });

      expect(() => tokenService.verifyRefreshToken(mockToken)).toThrow('Malformed token');
    });
  });

  describe('generateTokenPair', () => {
    it('should generate both access and refresh tokens', () => {
      const mockAccessToken = 'mock-access-token';
      const mockRefreshToken = 'mock-refresh-token';

      jwt.sign
        .mockReturnValueOnce(mockAccessToken)
        .mockReturnValueOnce(mockRefreshToken);

      const tokens = tokenService.generateTokenPair(mockUserId);

      expect(jwt.sign).toHaveBeenCalledTimes(2);
      expect(jwt.sign).toHaveBeenNthCalledWith(
        1,
        { userId: mockUserId },
        mockAccessSecret,
        { expiresIn: mockAccessExpiry }
      );
      expect(jwt.sign).toHaveBeenNthCalledWith(
        2,
        { userId: mockUserId },
        mockRefreshSecret,
        { expiresIn: mockRefreshExpiry }
      );
      expect(tokens).toEqual({
        accessToken: mockAccessToken,
        refreshToken: mockRefreshToken
      });
    });

    it('should handle errors during token pair generation', () => {
      jwt.sign.mockImplementation(() => {
        throw new Error('Token generation failed');
      });

      expect(() => tokenService.generateTokenPair(mockUserId)).toThrow('Token generation failed');
    });
  });

  describe('decodeToken', () => {
    it('should decode token without verification', () => {
      const mockToken = 'mock-token';
      const mockDecoded = { userId: mockUserId, iat: 1234567890, exp: 1234567890 };
      jwt.decode.mockReturnValue(mockDecoded);

      const decoded = tokenService.decodeToken(mockToken);

      expect(jwt.decode).toHaveBeenCalledWith(mockToken);
      expect(decoded).toEqual(mockDecoded);
    });

    it('should return null for invalid token format', () => {
      const mockToken = 'invalid-token';
      jwt.decode.mockReturnValue(null);

      const decoded = tokenService.decodeToken(mockToken);

      expect(jwt.decode).toHaveBeenCalledWith(mockToken);
      expect(decoded).toBeNull();
    });

    it('should handle decoding errors', () => {
      const mockToken = 'malformed-token';
      jwt.decode.mockImplementation(() => {
        throw new Error('Decoding failed');
      });

      expect(() => tokenService.decodeToken(mockToken)).toThrow('Decoding failed');
    });
  });

  describe('Edge cases', () => {
    it('should handle missing JWT_ACCESS_SECRET', () => {
      const originalSecret = process.env.JWT_ACCESS_SECRET;
      delete process.env.JWT_ACCESS_SECRET;

      jwt.sign.mockImplementation(() => {
        throw new Error('Secret not provided');
      });

      expect(() => tokenService.generateAccessToken(mockUserId)).toThrow('Secret not provided');

      process.env.JWT_ACCESS_SECRET = originalSecret;
    });

    it('should handle missing JWT_REFRESH_SECRET', () => {
      const originalSecret = process.env.JWT_REFRESH_SECRET;
      delete process.env.JWT_REFRESH_SECRET;

      jwt.sign.mockImplementation(() => {
        throw new Error('Secret not provided');
      });

      expect(() => tokenService.generateRefreshToken(mockUserId)).toThrow('Secret not provided');

      process.env.JWT_REFRESH_SECRET = originalSecret;
    });

    it('should handle empty userId', () => {
      const mockToken = 'mock-token';
      jwt.sign.mockReturnValue(mockToken);

      const token = tokenService.generateAccessToken('');

      expect(jwt.sign).toHaveBeenCalledWith(
        { userId: '' },
        mockAccessSecret,
        { expiresIn: mockAccessExpiry }
      );
      expect(token).toBe(mockToken);
    });

    it('should handle null userId', () => {
      const mockToken = 'mock-token';
      jwt.sign.mockReturnValue(mockToken);

      const token = tokenService.generateAccessToken(null);

      expect(jwt.sign).toHaveBeenCalledWith(
        { userId: null },
        mockAccessSecret,
        { expiresIn: mockAccessExpiry }
      );
      expect(token).toBe(mockToken);
    });

    it('should handle undefined userId', () => {
      const mockToken = 'mock-token';
      jwt.sign.mockReturnValue(mockToken);

      const token = tokenService.generateAccessToken(undefined);

      expect(jwt.sign).toHaveBeenCalledWith(
        { userId: undefined },
        mockAccessSecret,
        { expiresIn: mockAccessExpiry }
      );
      expect(token).toBe(mockToken);
    });
  });
});
