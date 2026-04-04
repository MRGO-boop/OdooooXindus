import { AuthService } from './AuthService';
import { passwordService } from './PasswordService';
import jwt from 'jsonwebtoken';
import db from '../config/database';

// Mock the database
jest.mock('../config/database', () => ({
  __esModule: true,
  default: {
    prepare: jest.fn(),
  },
}));

describe('AuthService', () => {
  let authService: AuthService;
  const testSecret = 'test-secret-key';
  const testExpiresIn = '1h';

  beforeEach(() => {
    authService = new AuthService(testSecret, testExpiresIn);
    jest.clearAllMocks();
  });

  describe('login', () => {
    const mockUser = {
      id: 'user-123',
      email: 'test@example.com',
      password: '$2b$10$hashedpassword',
      role: 'Portal_User',
    };

    it('should successfully login with valid credentials', async () => {
      // Mock database query
      const mockGet = jest.fn().mockReturnValue(mockUser);
      const mockPrepare = jest.fn().mockReturnValue({ get: mockGet });
      (db.prepare as jest.Mock) = mockPrepare;
      
      // Mock password verification
      jest.spyOn(passwordService, 'verify').mockResolvedValue(true);

      const result = await authService.login('test@example.com', 'password123');

      expect(result).toHaveProperty('token');
      expect(result).toHaveProperty('user');
      expect(result.user).toEqual({
        id: 'user-123',
        email: 'test@example.com',
        role: 'Portal_User',
      });
      expect(typeof result.token).toBe('string');
      expect(mockPrepare).toHaveBeenCalledWith('SELECT id, email, password, role FROM users WHERE email = ?');
      expect(mockGet).toHaveBeenCalledWith('test@example.com');
    });

    it('should throw error when email is empty', async () => {
      await expect(authService.login('', 'password123')).rejects.toThrow('Email is required');
    });

    it('should throw error when password is empty', async () => {
      await expect(authService.login('test@example.com', '')).rejects.toThrow('Password is required');
    });

    it('should throw error when user is not found', async () => {
      const mockGet = jest.fn().mockReturnValue(undefined);
      const mockPrepare = jest.fn().mockReturnValue({ get: mockGet });
      (db.prepare as jest.Mock) = mockPrepare;

      await expect(authService.login('nonexistent@example.com', 'password123')).rejects.toThrow(
        'Invalid email or password'
      );
    });

    it('should throw error when password is invalid', async () => {
      const mockGet = jest.fn().mockReturnValue(mockUser);
      const mockPrepare = jest.fn().mockReturnValue({ get: mockGet });
      (db.prepare as jest.Mock) = mockPrepare;
      
      jest.spyOn(passwordService, 'verify').mockResolvedValue(false);

      await expect(authService.login('test@example.com', 'wrongpassword')).rejects.toThrow(
        'Invalid email or password'
      );
    });

    it('should normalize email to lowercase', async () => {
      const mockGet = jest.fn().mockReturnValue(mockUser);
      const mockPrepare = jest.fn().mockReturnValue({ get: mockGet });
      (db.prepare as jest.Mock) = mockPrepare;
      
      jest.spyOn(passwordService, 'verify').mockResolvedValue(true);

      await authService.login('TEST@EXAMPLE.COM', 'password123');

      expect(mockGet).toHaveBeenCalledWith('test@example.com');
    });
  });

  describe('verifyToken', () => {
    it('should successfully verify a valid token', async () => {
      const payload = {
        userId: 'user-123',
        email: 'test@example.com',
        role: 'Portal_User',
      };

      const token = jwt.sign(payload, testSecret, { expiresIn: testExpiresIn });

      const result = await authService.verifyToken(token);

      expect(result).toEqual(payload);
    });

    it('should throw error when token is empty', async () => {
      await expect(authService.verifyToken('')).rejects.toThrow('Token is required');
    });

    it('should throw error when token is invalid', async () => {
      await expect(authService.verifyToken('invalid-token')).rejects.toThrow('Invalid token');
    });

    it('should throw error when token is expired', async () => {
      const payload = {
        userId: 'user-123',
        email: 'test@example.com',
        role: 'Portal_User',
      };

      // Create an expired token (expires in -1 second)
      const expiredToken = jwt.sign(payload, testSecret, { expiresIn: '-1s' });

      await expect(authService.verifyToken(expiredToken)).rejects.toThrow('Token expired');
    });

    it('should throw error when token signature is invalid', async () => {
      const payload = {
        userId: 'user-123',
        email: 'test@example.com',
        role: 'Portal_User',
      };

      // Create token with different secret
      const tokenWithWrongSecret = jwt.sign(payload, 'wrong-secret', { expiresIn: testExpiresIn });

      await expect(authService.verifyToken(tokenWithWrongSecret)).rejects.toThrow('Invalid token');
    });
  });

  describe('integration: login and verifyToken', () => {
    it('should generate a token that can be verified', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        password: '$2b$10$hashedpassword',
        role: 'Admin',
      };

      const mockGet = jest.fn().mockReturnValue(mockUser);
      const mockPrepare = jest.fn().mockReturnValue({ get: mockGet });
      (db.prepare as jest.Mock) = mockPrepare;
      
      jest.spyOn(passwordService, 'verify').mockResolvedValue(true);

      // Login to get token
      const loginResult = await authService.login('test@example.com', 'password123');

      // Verify the token
      const verifyResult = await authService.verifyToken(loginResult.token);

      expect(verifyResult).toEqual({
        userId: 'user-123',
        email: 'test@example.com',
        role: 'Admin',
      });
    });
  });
});
