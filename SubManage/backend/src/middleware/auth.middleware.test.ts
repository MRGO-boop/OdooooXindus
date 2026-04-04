import { Request, Response, NextFunction } from 'express';
import { jwtAuthGuard } from './auth.middleware';
import { AuthService } from '../services/AuthService';

/**
 * Tests for JWT Authentication Guard Middleware
 * 
 * Validates Requirements:
 * - 4.1: Role-based access control with JWT verification
 * - 20.1: Security enforcement for protected routes
 */

describe('jwtAuthGuard', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;
  let mockAuthService: jest.Mocked<AuthService>;

  beforeEach(() => {
    // Reset mocks before each test
    mockRequest = {
      headers: {},
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    mockNext = jest.fn();

    // Create mock AuthService
    mockAuthService = {
      verifyToken: jest.fn(),
    } as any;
  });

  describe('Missing Authorization Header', () => {
    it('should return 401 when Authorization header is missing', async () => {
      const middleware = jwtAuthGuard(mockAuthService);

      await middleware(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Authorization header missing',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('Invalid Authorization Header Format', () => {
    it('should return 401 when Authorization header does not start with Bearer', async () => {
      mockRequest.headers = {
        authorization: 'InvalidFormat token123',
      };

      const middleware = jwtAuthGuard(mockAuthService);

      await middleware(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid authorization header format. Expected: Bearer <token>',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 401 when Authorization header has only one part', async () => {
      mockRequest.headers = {
        authorization: 'BearerToken',
      };

      const middleware = jwtAuthGuard(mockAuthService);

      await middleware(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid authorization header format. Expected: Bearer <token>',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 401 when Authorization header has more than two parts', async () => {
      mockRequest.headers = {
        authorization: 'Bearer token extra',
      };

      const middleware = jwtAuthGuard(mockAuthService);

      await middleware(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid authorization header format. Expected: Bearer <token>',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('Valid Token', () => {
    it('should attach user to request and call next() when token is valid', async () => {
      const mockDecodedToken = {
        userId: 'user-123',
        email: 'test@example.com',
        role: 'Admin',
      };

      mockRequest.headers = {
        authorization: 'Bearer valid-token-123',
      };

      mockAuthService.verifyToken.mockResolvedValue(mockDecodedToken);

      const middleware = jwtAuthGuard(mockAuthService);

      await middleware(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockAuthService.verifyToken).toHaveBeenCalledWith('valid-token-123');
      expect(mockRequest.user).toEqual(mockDecodedToken);
      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
      expect(mockResponse.json).not.toHaveBeenCalled();
    });

    it('should handle different user roles correctly', async () => {
      const roles = ['Admin', 'Internal_User', 'Portal_User'];

      for (const role of roles) {
        const mockDecodedToken = {
          userId: `user-${role}`,
          email: `${role.toLowerCase()}@example.com`,
          role,
        };

        mockRequest = {
          headers: {
            authorization: `Bearer token-${role}`,
          },
        };

        mockAuthService.verifyToken.mockResolvedValue(mockDecodedToken);

        const middleware = jwtAuthGuard(mockAuthService);

        await middleware(
          mockRequest as Request,
          mockResponse as Response,
          mockNext
        );

        expect(mockRequest.user).toEqual(mockDecodedToken);
        expect(mockNext).toHaveBeenCalled();
      }
    });
  });

  describe('Invalid Token', () => {
    it('should return 401 when token is invalid', async () => {
      mockRequest.headers = {
        authorization: 'Bearer invalid-token',
      };

      mockAuthService.verifyToken.mockRejectedValue(new Error('Invalid token'));

      const middleware = jwtAuthGuard(mockAuthService);

      await middleware(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid token',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('Expired Token', () => {
    it('should return 401 when token is expired', async () => {
      mockRequest.headers = {
        authorization: 'Bearer expired-token',
      };

      mockAuthService.verifyToken.mockRejectedValue(new Error('Token expired'));

      const middleware = jwtAuthGuard(mockAuthService);

      await middleware(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Token expired',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('Generic Authentication Errors', () => {
    it('should return 401 for generic authentication errors', async () => {
      mockRequest.headers = {
        authorization: 'Bearer some-token',
      };

      mockAuthService.verifyToken.mockRejectedValue(new Error('Some auth error'));

      const middleware = jwtAuthGuard(mockAuthService);

      await middleware(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Authentication failed',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('Unexpected Errors', () => {
    it('should return 500 for non-Error exceptions', async () => {
      mockRequest.headers = {
        authorization: 'Bearer some-token',
      };

      mockAuthService.verifyToken.mockRejectedValue('string error');

      const middleware = jwtAuthGuard(mockAuthService);

      await middleware(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Internal server error',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty token after Bearer', async () => {
      mockRequest.headers = {
        authorization: 'Bearer ',
      };

      mockAuthService.verifyToken.mockRejectedValue(new Error('Token is required'));

      const middleware = jwtAuthGuard(mockAuthService);

      await middleware(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle case-sensitive Bearer keyword', async () => {
      mockRequest.headers = {
        authorization: 'bearer valid-token',
      };

      const middleware = jwtAuthGuard(mockAuthService);

      await middleware(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid authorization header format. Expected: Bearer <token>',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });
});
