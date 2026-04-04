import { Request, Response, NextFunction } from 'express';
import { requireRoles, requireAdmin, requireInternal, requireAuthenticated, UserRole } from './roles.middleware';

describe('Roles Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let nextFunction: NextFunction;

  beforeEach(() => {
    mockRequest = {};
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    nextFunction = jest.fn();
  });

  describe('requireRoles', () => {
    it('should return 401 if user is not authenticated', () => {
      const middleware = requireRoles([UserRole.Admin]);
      
      middleware(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Authentication required',
      });
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should return 403 if user lacks required role', () => {
      mockRequest.user = {
        userId: '123',
        email: 'user@example.com',
        role: 'Portal_User',
      };

      const middleware = requireRoles([UserRole.Admin]);
      
      middleware(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Insufficient permissions. Required role(s): Admin',
      });
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should call next() if user has required role', () => {
      mockRequest.user = {
        userId: '123',
        email: 'admin@example.com',
        role: 'Admin',
      };

      const middleware = requireRoles([UserRole.Admin]);
      
      middleware(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(nextFunction).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
      expect(mockResponse.json).not.toHaveBeenCalled();
    });

    it('should allow access if user has one of multiple required roles', () => {
      mockRequest.user = {
        userId: '123',
        email: 'internal@example.com',
        role: 'Internal_User',
      };

      const middleware = requireRoles([UserRole.Admin, UserRole.Internal_User]);
      
      middleware(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(nextFunction).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should deny access if user role is not in the list of required roles', () => {
      mockRequest.user = {
        userId: '123',
        email: 'portal@example.com',
        role: 'Portal_User',
      };

      const middleware = requireRoles([UserRole.Admin, UserRole.Internal_User]);
      
      middleware(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Insufficient permissions. Required role(s): Admin, Internal_User',
      });
      expect(nextFunction).not.toHaveBeenCalled();
    });
  });

  describe('requireAdmin', () => {
    it('should allow Admin users', () => {
      mockRequest.user = {
        userId: '123',
        email: 'admin@example.com',
        role: 'Admin',
      };

      const middleware = requireAdmin();
      
      middleware(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(nextFunction).toHaveBeenCalled();
    });

    it('should deny Internal_User', () => {
      mockRequest.user = {
        userId: '123',
        email: 'internal@example.com',
        role: 'Internal_User',
      };

      const middleware = requireAdmin();
      
      middleware(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should deny Portal_User', () => {
      mockRequest.user = {
        userId: '123',
        email: 'portal@example.com',
        role: 'Portal_User',
      };

      const middleware = requireAdmin();
      
      middleware(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(nextFunction).not.toHaveBeenCalled();
    });
  });

  describe('requireInternal', () => {
    it('should allow Admin users', () => {
      mockRequest.user = {
        userId: '123',
        email: 'admin@example.com',
        role: 'Admin',
      };

      const middleware = requireInternal();
      
      middleware(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(nextFunction).toHaveBeenCalled();
    });

    it('should allow Internal_User', () => {
      mockRequest.user = {
        userId: '123',
        email: 'internal@example.com',
        role: 'Internal_User',
      };

      const middleware = requireInternal();
      
      middleware(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(nextFunction).toHaveBeenCalled();
    });

    it('should deny Portal_User', () => {
      mockRequest.user = {
        userId: '123',
        email: 'portal@example.com',
        role: 'Portal_User',
      };

      const middleware = requireInternal();
      
      middleware(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(nextFunction).not.toHaveBeenCalled();
    });
  });

  describe('requireAuthenticated', () => {
    it('should allow Admin users', () => {
      mockRequest.user = {
        userId: '123',
        email: 'admin@example.com',
        role: 'Admin',
      };

      const middleware = requireAuthenticated();
      
      middleware(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(nextFunction).toHaveBeenCalled();
    });

    it('should allow Internal_User', () => {
      mockRequest.user = {
        userId: '123',
        email: 'internal@example.com',
        role: 'Internal_User',
      };

      const middleware = requireAuthenticated();
      
      middleware(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(nextFunction).toHaveBeenCalled();
    });

    it('should allow Portal_User', () => {
      mockRequest.user = {
        userId: '123',
        email: 'portal@example.com',
        role: 'Portal_User',
      };

      const middleware = requireAuthenticated();
      
      middleware(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(nextFunction).toHaveBeenCalled();
    });

    it('should deny unauthenticated users', () => {
      const middleware = requireAuthenticated();
      
      middleware(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(nextFunction).not.toHaveBeenCalled();
    });
  });
});
