// File: tests/unit/services/auth.service.test.js
// Generated: 2025-10-08 13:07:58 UTC
// Project ID: proj_aa174cb58c23
// Task ID: task_vby3m6fkxe92


const User = require('../../../src/models/User');


const authService = require('../../../src/services/auth.service');


const bcrypt = require('bcryptjs');


const jwt = require('jsonwebtoken');

// Mock dependencies
jest.mock('../../../src/models/User');
jest.mock('jsonwebtoken');
jest.mock('bcryptjs');

describe('Auth Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    const mockUserData = {
      name: 'Test User',
      email: 'test@example.com',
      password: 'Password123!'
    };

    it('should successfully register a new user', async () => {
      const hashedPassword = 'hashedPassword123';
      const mockUser = {
        _id: 'userId123',
        name: mockUserData.name,
        email: mockUserData.email,
        password: hashedPassword,
        save: jest.fn().mockResolvedValue(true)
      };

      User.findOne.mockResolvedValue(null);
      bcrypt.hash.mockResolvedValue(hashedPassword);
      User.mockImplementation(() => mockUser);

      const result = await authService.register(mockUserData);

      expect(User.findOne).toHaveBeenCalledWith({ email: mockUserData.email });
      expect(bcrypt.hash).toHaveBeenCalledWith(mockUserData.password, 12);
      expect(mockUser.save).toHaveBeenCalled();
      expect(result).toEqual({
        _id: mockUser._id,
        name: mockUser.name,
        email: mockUser.email
      });
    });

    it('should throw error if user already exists', async () => {
      const existingUser = {
        _id: 'existingUserId',
        email: mockUserData.email
      };

      User.findOne.mockResolvedValue(existingUser);

      await expect(authService.register(mockUserData)).rejects.toThrow('User already exists with this email');
      expect(User.findOne).toHaveBeenCalledWith({ email: mockUserData.email });
      expect(bcrypt.hash).not.toHaveBeenCalled();
    });

    it('should throw error if password hashing fails', async () => {
      User.findOne.mockResolvedValue(null);
      bcrypt.hash.mockRejectedValue(new Error('Hashing failed'));

      await expect(authService.register(mockUserData)).rejects.toThrow('Hashing failed');
      expect(bcrypt.hash).toHaveBeenCalled();
    });

    it('should throw error if user save fails', async () => {
      const mockUser = {
        _id: 'userId123',
        name: mockUserData.name,
        email: mockUserData.email,
        password: 'hashedPassword',
        save: jest.fn().mockRejectedValue(new Error('Database error'))
      };

      User.findOne.mockResolvedValue(null);
      bcrypt.hash.mockResolvedValue('hashedPassword');
      User.mockImplementation(() => mockUser);

      await expect(authService.register(mockUserData)).rejects.toThrow('Database error');
      expect(mockUser.save).toHaveBeenCalled();
    });
  });

  describe('login', () => {
    const mockCredentials = {
      email: 'test@example.com',
      password: 'Password123!'
    };

    const mockUser = {
      _id: 'userId123',
      name: 'Test User',
      email: mockCredentials.email,
      password: 'hashedPassword123',
      isEmailVerified: true
    };

    const mockTokens = {
      accessToken: 'mockAccessToken',
      refreshToken: 'mockRefreshToken'
    };

    beforeEach(() => {
      process.env.JWT_ACCESS_SECRET = 'testAccessSecret';
      process.env.JWT_ACCESS_EXPIRY = '15m';
      process.env.JWT_REFRESH_SECRET = 'testRefreshSecret';
      process.env.JWT_REFRESH_EXPIRY = '7d';
    });

    it('should successfully login with valid credentials', async () => {
      User.findOne.mockResolvedValue(mockUser);
      bcrypt.compare.mockResolvedValue(true);
      jwt.sign
        .mockReturnValueOnce(mockTokens.accessToken)
        .mockReturnValueOnce(mockTokens.refreshToken);

      const result = await authService.login(mockCredentials);

      expect(User.findOne).toHaveBeenCalledWith({ email: mockCredentials.email });
      expect(bcrypt.compare).toHaveBeenCalledWith(mockCredentials.password, mockUser.password);
      expect(jwt.sign).toHaveBeenCalledTimes(2);
      expect(jwt.sign).toHaveBeenCalledWith(
        { userId: mockUser._id, email: mockUser.email },
        process.env.JWT_ACCESS_SECRET,
        { expiresIn: process.env.JWT_ACCESS_EXPIRY }
      );
      expect(jwt.sign).toHaveBeenCalledWith(
        { userId: mockUser._id },
        process.env.JWT_REFRESH_SECRET,
        { expiresIn: process.env.JWT_REFRESH_EXPIRY }
      );
      expect(result).toEqual({
        user: {
          _id: mockUser._id,
          name: mockUser.name,
          email: mockUser.email
        },
        accessToken: mockTokens.accessToken,
        refreshToken: mockTokens.refreshToken
      });
    });

    it('should throw error if user not found', async () => {
      User.findOne.mockResolvedValue(null);

      await expect(authService.login(mockCredentials)).rejects.toThrow('Invalid email or password');
      expect(User.findOne).toHaveBeenCalledWith({ email: mockCredentials.email });
      expect(bcrypt.compare).not.toHaveBeenCalled();
    });

    it('should throw error if password is incorrect', async () => {
      User.findOne.mockResolvedValue(mockUser);
      bcrypt.compare.mockResolvedValue(false);

      await expect(authService.login(mockCredentials)).rejects.toThrow('Invalid email or password');
      expect(bcrypt.compare).toHaveBeenCalledWith(mockCredentials.password, mockUser.password);
      expect(jwt.sign).not.toHaveBeenCalled();
    });

    it('should throw error if email is not verified', async () => {
      const unverifiedUser = { ...mockUser, isEmailVerified: false };
      User.findOne.mockResolvedValue(unverifiedUser);
      bcrypt.compare.mockResolvedValue(true);

      await expect(authService.login(mockCredentials)).rejects.toThrow('Please verify your email before logging in');
      expect(jwt.sign).not.toHaveBeenCalled();
    });

    it('should throw error if JWT signing fails', async () => {
      User.findOne.mockResolvedValue(mockUser);
      bcrypt.compare.mockResolvedValue(true);
      jwt.sign.mockImplementation(() => {
        throw new Error('JWT signing failed');
      });

      await expect(authService.login(mockCredentials)).rejects.toThrow('JWT signing failed');
    });

    it('should handle missing JWT environment variables', async () => {
      delete process.env.JWT_ACCESS_SECRET;
      delete process.env.JWT_REFRESH_SECRET;

      User.findOne.mockResolvedValue(mockUser);
      bcrypt.compare.mockResolvedValue(true);
      jwt.sign
        .mockReturnValueOnce(mockTokens.accessToken)
        .mockReturnValueOnce(mockTokens.refreshToken);

      const result = await authService.login(mockCredentials);

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
    });
  });

  describe('refreshToken', () => {
    const mockRefreshToken = 'validRefreshToken';
    const mockUserId = 'userId123';
    const mockUser = {
      _id: mockUserId,
      name: 'Test User',
      email: 'test@example.com'
    };
    const newAccessToken = 'newAccessToken';

    beforeEach(() => {
      process.env.JWT_REFRESH_SECRET = 'testRefreshSecret';
      process.env.JWT_ACCESS_SECRET = 'testAccessSecret';
      process.env.JWT_ACCESS_EXPIRY = '15m';
    });

    it('should successfully refresh access token', async () => {
      jwt.verify.mockReturnValue({ userId: mockUserId });
      User.findById.mockResolvedValue(mockUser);
      jwt.sign.mockReturnValue(newAccessToken);

      const result = await authService.refreshToken(mockRefreshToken);

      expect(jwt.verify).toHaveBeenCalledWith(mockRefreshToken, process.env.JWT_REFRESH_SECRET);
      expect(User.findById).toHaveBeenCalledWith(mockUserId);
      expect(jwt.sign).toHaveBeenCalledWith(
        { userId: mockUser._id, email: mockUser.email },
        process.env.JWT_ACCESS_SECRET,
        { expiresIn: process.env.JWT_ACCESS_EXPIRY }
      );
      expect(result).toEqual({ accessToken: newAccessToken });
    });

    it('should throw error if refresh token is invalid', async () => {
      jwt.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await expect(authService.refreshToken(mockRefreshToken)).rejects.toThrow('Invalid refresh token');
      expect(User.findById).not.toHaveBeenCalled();
    });

    it('should throw error if refresh token is expired', async () => {
      jwt.verify.mockImplementation(() => {
        const error = new Error('Token expired');
        error.name = 'TokenExpiredError';
        throw error;
      });

      await expect(authService.refreshToken(mockRefreshToken)).rejects.toThrow('Invalid refresh token');
    });

    it('should throw error if user not found', async () => {
      jwt.verify.mockReturnValue({ userId: mockUserId });
      User.findById.mockResolvedValue(null);

      await expect(authService.refreshToken(mockRefreshToken)).rejects.toThrow('User not found');
      expect(User.findById).toHaveBeenCalledWith(mockUserId);
      expect(jwt.sign).not.toHaveBeenCalled();
    });

    it('should throw error if refresh token missing', async () => {
      await expect(authService.refreshToken(null)).rejects.toThrow('Refresh token is required');
      expect(jwt.verify).not.toHaveBeenCalled();
    });

    it('should throw error if refresh token is empty string', async () => {
      await expect(authService.refreshToken('')).rejects.toThrow('Refresh token is required');
      expect(jwt.verify).not.toHaveBeenCalled();
    });
  });

  describe('verifyEmail', () => {
    const mockToken = 'validVerificationToken';
    const mockUserId = 'userId123';
    const mockUser = {
      _id: mockUserId,
      email: 'test@example.com',
      isEmailVerified: false,
      emailVerificationToken: mockToken,
      emailVerificationExpires: new Date(Date.now() + 3600000),
      save: jest.fn().mockResolvedValue(true)
    };

    it('should successfully verify email with valid token', async () => {
      User.findOne.mockResolvedValue(mockUser);

      const result = await authService.verifyEmail(mockToken);

      expect(User.findOne).toHaveBeenCalledWith({
        emailVerificationToken: mockToken,
        emailVerificationExpires: { $gt: expect.any(Date) }
      });
      expect(mockUser.isEmailVerified).toBe(true);
      expect(mockUser.emailVerificationToken).toBeUndefined();
      expect(mockUser.emailVerificationExpires).toBeUndefined();
      expect(mockUser.save).toHaveBeenCalled();
      expect(result).toEqual({ message: 'Email verified successfully' });
    });

    it('should throw error if token is invalid or expired', async () => {
      User.findOne.mockResolvedValue(null);

      await expect(authService.verifyEmail(mockToken)).rejects.toThrow('Invalid or expired verification token');
      expect(User.findOne).toHaveBeenCalled();
    });

    it('should throw error if token is missing', async () => {
      await expect(authService.verifyEmail(null)).rejects.toThrow('Verification token is required');
      expect(User.findOne).not.toHaveBeenCalled();
    });

    it('should throw error if user save fails', async () => {
      const userWithSaveError = {
        ...mockUser,
        save: jest.fn().mockRejectedValue(new Error('Database error'))
      };
      User.findOne.mockResolvedValue(userWithSaveError);

      await expect(authService.verifyEmail(mockToken)).rejects.toThrow('Database error');
      expect(userWithSaveError.save).toHaveBeenCalled();
    });
  });

  describe('requestPasswordReset', () => {
    const mockEmail = 'test@example.com';
    const mockUser = {
      _id: 'userId123',
      email: mockEmail,
      passwordResetToken: undefined,
      passwordResetExpires: undefined,
      save: jest.fn().mockResolvedValue(true)
    };

    it('should successfully create password reset token', async () => {
      User.findOne.mockResolvedValue(mockUser);

      const result = await authService.requestPasswordReset(mockEmail);

      expect(User.findOne).toHaveBeenCalledWith({ email: mockEmail });
      expect(mockUser.passwordResetToken).toBeDefined();
      expect(mockUser.passwordResetExpires).toBeDefined();
      expect(mockUser.passwordResetExpires).toBeInstanceOf(Date);
      expect(mockUser.save).toHaveBeenCalled();
      expect(result).toEqual({
        message: 'Password reset token generated',
        resetToken: mockUser.passwordResetToken
      });
    });

    it('should throw error if user not found', async () => {
      User.findOne.mockResolvedValue(null);

      await expect(authService.requestPasswordReset(mockEmail)).rejects.toThrow('User not found with this email');
      expect(User.findOne).toHaveBeenCalledWith({ email: mockEmail });
    });

    it('should throw error if email is missing', async () => {
      await expect(authService.requestPasswordReset(null)).rejects.toThrow('Email is required');
      expect(User.findOne).not.toHaveBeenCalled();
    });

    it('should throw error if user save fails', async () => {
      const userWithSaveError = {
        ...mockUser,
        save: jest.fn().mockRejectedValue(new Error('Database error'))
      };
      User.findOne.mockResolvedValue(userWithSaveError);

      await expect(authService.requestPasswordReset(mockEmail)).rejects.toThrow('Database error');
    });

    it('should generate unique reset tokens', async () => {
      const user1 = { ...mockUser, save: jest.fn().mockResolvedValue(true) };
      const user2 = { ...mockUser, save: jest.fn().mockResolvedValue(true) };

      User.findOne.mockResolvedValueOnce(user1).mockResolvedValueOnce(user2);

      await authService.requestPasswordReset(mockEmail);
      const token1 = user1.passwordResetToken;
