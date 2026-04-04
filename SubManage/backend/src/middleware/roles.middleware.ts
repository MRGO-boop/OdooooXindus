import { Request, Response, NextFunction } from 'express';

/**
 * Role-Based Authorization Guard Middleware
 * 
 * Implements Requirements:
 * - 4.2: Admin role with full system control
 * - 4.3: Internal_User role with limited operational access
 * - 4.4: Portal_User role with access to own subscription data
 * - 4.5: Role permission verification
 * - 4.6: Authorization error for insufficient permissions
 * 
 * Checks if authenticated user has required role(s) to access a route.
 * Must be used after jwtAuthGuard middleware.
 */

/**
 * Metadata key for storing required roles
 */
export const ROLES_KEY = 'roles';

/**
 * Valid user roles in the system
 */
export enum UserRole {
  Admin = 'Admin',
  Internal_User = 'Internal_User',
  Portal_User = 'Portal_User',
}

/**
 * Decorator to specify required roles for a route handler
 * @param roles - Array of roles that are allowed to access the route
 * @returns Middleware function that checks user roles
 * 
 * @example
 * app.get('/admin/users', jwtAuthGuard(), requireRoles([UserRole.Admin]), (req, res) => {
 *   // Only Admin users can access this route
 * });
 */
export const requireRoles = (roles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // Check if user is authenticated (should be set by jwtAuthGuard)
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    // Check if user has one of the required roles
    const userRole = req.user.role;
    
    if (!roles.includes(userRole as UserRole)) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions. Required role(s): ' + roles.join(', '),
      });
    }

    // User has required role, proceed to route handler
    next();
  };
};

/**
 * Convenience decorator for Admin-only routes
 */
export const requireAdmin = () => requireRoles([UserRole.Admin]);

/**
 * Convenience decorator for Admin and Internal_User routes
 */
export const requireInternal = () => requireRoles([UserRole.Admin, UserRole.Internal_User]);

/**
 * Convenience decorator for all authenticated users
 */
export const requireAuthenticated = () => requireRoles([UserRole.Admin, UserRole.Internal_User, UserRole.Portal_User]);
