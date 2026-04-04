import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/AuthService';

/**
 * JWT Authentication Guard Middleware
 * 
 * Implements Requirements:
 * - 4.1: Role-based access control with JWT verification
 * - 20.1: Security enforcement for protected routes
 * 
 * Extracts JWT token from Authorization header (Bearer token),
 * verifies the token, and attaches decoded user info to req.user
 */

/**
 * Creates a JWT authentication middleware
 * @param authService - Optional AuthService instance for testing
 * @returns Express middleware function
 */
export const jwtAuthGuard = (authService?: AuthService) => {
  const service = authService || new AuthService();

  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Extract token from Authorization header
      const authHeader = req.headers.authorization;

      if (!authHeader) {
        return res.status(401).json({
          success: false,
          message: 'Authorization header missing',
        });
      }

      // Check for Bearer token format
      const parts = authHeader.split(' ');
      if (parts.length !== 2 || parts[0] !== 'Bearer') {
        return res.status(401).json({
          success: false,
          message: 'Invalid authorization header format. Expected: Bearer <token>',
        });
      }

      const token = parts[1];

      // Verify token using AuthService
      const decoded = await service.verifyToken(token);

      // Attach user info to request object
      req.user = {
        userId: decoded.userId,
        email: decoded.email,
        role: decoded.role,
      };

      // Continue to next middleware/route handler
      next();
    } catch (error) {
      if (error instanceof Error) {
        // Handle specific token errors
        if (error.message.includes('expired')) {
          return res.status(401).json({
            success: false,
            message: 'Token expired',
          });
        }

        if (error.message.includes('Invalid token')) {
          return res.status(401).json({
            success: false,
            message: 'Invalid token',
          });
        }

        return res.status(401).json({
          success: false,
          message: 'Authentication failed',
        });
      }

      return res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  };
};
