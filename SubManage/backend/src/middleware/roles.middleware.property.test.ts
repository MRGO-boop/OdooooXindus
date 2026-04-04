import { Request, Response, NextFunction } from 'express';
import * as fc from 'fast-check';
import { requireRoles, requireAdmin, requireInternal, UserRole } from './roles.middleware';

/**
 * Property-Based Tests for Authorization
 * 
 * These tests validate the correctness properties of the role-based authorization system
 * using property-based testing with fast-check.
 * 
 * Properties Tested:
 * - Property 7: Admin Role Has Full Access (Requirement 4.2)
 * - Property 8: Internal User Role Has Limited Access (Requirement 4.3)
 * - Property 9: Portal User Access Is Isolated (Requirement 4.4)
 * - Property 10: Authorization Checks Are Enforced (Requirements 4.5, 4.6)
 */

describe('Authorization Property Tests', () => {
  // Helper to create mock request with user
  const createMockRequest = (role: string): Partial<Request> => ({
    user: {
      userId: fc.sample(fc.uuid(), 1)[0],
      email: fc.sample(fc.emailAddress(), 1)[0],
      role,
    },
  });

  // Helper to create mock response
  const createMockResponse = (): { res: Partial<Response>; statusCode: number | null; responseBody: any } => {
    let statusCode: number | null = null;
    let responseBody: any = null;

    const res: Partial<Response> = {
      status: jest.fn((code: number) => {
        statusCode = code;
        return res as Response;
      }),
      json: jest.fn((body: any) => {
        responseBody = body;
        return res as Response;
      }),
    };

    return { res, statusCode, responseBody };
  };

  /**
   * Property 7: Admin Role Has Full Access
   * Validates: Requirement 4.2
   * 
   * Correctness Property:
   * ∀ routes R that include Admin in role requirements:
   *   IF user.role = Admin AND Admin ∈ RR
   *   THEN authorization succeeds (next() is called)
   * 
   * This property ensures that Admin users have full system control when Admin role is required.
   * Admin has access to all Admin-designated functionality.
   */
  describe('Property 7: Admin Role Has Full Access', () => {
    it('should allow Admin access to routes that include Admin in required roles', () => {
      fc.assert(
        fc.property(
          // Generate arbitrary combinations of required roles that include Admin
          fc.subarray([UserRole.Admin, UserRole.Internal_User, UserRole.Portal_User], { minLength: 1 })
            .filter(roles => roles.includes(UserRole.Admin)),
          (requiredRoles) => {
            // Setup
            const mockRequest = createMockRequest(UserRole.Admin);
            const { res } = createMockResponse();
            const nextFunction = jest.fn();

            // Execute
            const middleware = requireRoles(requiredRoles);
            middleware(mockRequest as Request, res as Response, nextFunction);

            // Verify: Admin should pass authorization when Admin is in required roles
            expect(nextFunction).toHaveBeenCalled();
            expect(res.status).not.toHaveBeenCalled();
            expect(res.json).not.toHaveBeenCalled();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should verify Admin has full system control privileges', () => {
      fc.assert(
        fc.property(
          fc.constant(null),
          () => {
            // Admin should have access to all admin-designated functionality
            // Test various admin-only scenarios
            
            // Scenario 1: Admin-only routes
            const adminOnlyRequest = createMockRequest(UserRole.Admin);
            const adminOnlyRes = createMockResponse();
            const adminOnlyNext = jest.fn();
            requireAdmin()(adminOnlyRequest as Request, adminOnlyRes.res as Response, adminOnlyNext);
            expect(adminOnlyNext).toHaveBeenCalled();
            
            // Scenario 2: Internal routes (Admin should also have access)
            const internalRequest = createMockRequest(UserRole.Admin);
            const internalRes = createMockResponse();
            const internalNext = jest.fn();
            requireInternal()(internalRequest as Request, internalRes.res as Response, internalNext);
            expect(internalNext).toHaveBeenCalled();
            
            // Scenario 3: Any authenticated route
            const authRequest = createMockRequest(UserRole.Admin);
            const authRes = createMockResponse();
            const authNext = jest.fn();
            requireRoles([UserRole.Admin, UserRole.Internal_User, UserRole.Portal_User])(
              authRequest as Request, authRes.res as Response, authNext
            );
            expect(authNext).toHaveBeenCalled();

            return true;
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should allow Admin access through requireAdmin middleware', () => {
      fc.assert(
        fc.property(
          fc.constant(null), // No input needed, just run multiple times
          () => {
            // Setup
            const mockRequest = createMockRequest(UserRole.Admin);
            const { res } = createMockResponse();
            const nextFunction = jest.fn();

            // Execute
            const middleware = requireAdmin();
            middleware(mockRequest as Request, res as Response, nextFunction);

            // Verify
            expect(nextFunction).toHaveBeenCalled();
            expect(res.status).not.toHaveBeenCalled();
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should allow Admin access through requireInternal middleware', () => {
      fc.assert(
        fc.property(
          fc.constant(null),
          () => {
            // Setup
            const mockRequest = createMockRequest(UserRole.Admin);
            const { res } = createMockResponse();
            const nextFunction = jest.fn();

            // Execute
            const middleware = requireInternal();
            middleware(mockRequest as Request, res as Response, nextFunction);

            // Verify
            expect(nextFunction).toHaveBeenCalled();
            expect(res.status).not.toHaveBeenCalled();
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  /**
   * Property 8: Internal User Role Has Limited Access
   * Validates: Requirement 4.3
   * 
   * Correctness Property:
   * ∀ routes R with role requirements RR:
   *   IF user.role = Internal_User AND Internal_User ∈ RR
   *   THEN authorization succeeds
   *   
   *   IF user.role = Internal_User AND Internal_User ∉ RR
   *   THEN authorization fails with 403
   * 
   * This property ensures Internal_User has operational access but not full admin privileges.
   */
  describe('Property 8: Internal User Role Has Limited Access', () => {
    it('should allow Internal_User access when role is in required roles', () => {
      fc.assert(
        fc.property(
          // Generate role lists that include Internal_User
          fc.subarray([UserRole.Admin, UserRole.Internal_User, UserRole.Portal_User], { minLength: 1 })
            .filter(roles => roles.includes(UserRole.Internal_User)),
          (requiredRoles) => {
            // Setup
            const mockRequest = createMockRequest(UserRole.Internal_User);
            const { res } = createMockResponse();
            const nextFunction = jest.fn();

            // Execute
            const middleware = requireRoles(requiredRoles);
            middleware(mockRequest as Request, res as Response, nextFunction);

            // Verify: Internal_User should pass when included in required roles
            expect(nextFunction).toHaveBeenCalled();
            expect(res.status).not.toHaveBeenCalled();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should deny Internal_User access when role is not in required roles', () => {
      fc.assert(
        fc.property(
          // Generate role lists that do NOT include Internal_User
          fc.subarray([UserRole.Admin, UserRole.Portal_User], { minLength: 1 }),
          (requiredRoles) => {
            // Setup
            const mockRequest = createMockRequest(UserRole.Internal_User);
            const { res } = createMockResponse();
            const nextFunction = jest.fn();

            // Execute
            const middleware = requireRoles(requiredRoles);
            middleware(mockRequest as Request, res as Response, nextFunction);

            // Verify: Internal_User should be denied
            expect(nextFunction).not.toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.json).toHaveBeenCalledWith(
              expect.objectContaining({
                success: false,
                message: expect.stringContaining('Insufficient permissions'),
              })
            );
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should deny Internal_User access to Admin-only routes', () => {
      fc.assert(
        fc.property(
          fc.constant(null),
          () => {
            // Setup
            const mockRequest = createMockRequest(UserRole.Internal_User);
            const { res } = createMockResponse();
            const nextFunction = jest.fn();

            // Execute
            const middleware = requireAdmin();
            middleware(mockRequest as Request, res as Response, nextFunction);

            // Verify: Internal_User should be denied admin access
            expect(nextFunction).not.toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(403);
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should allow Internal_User access through requireInternal middleware', () => {
      fc.assert(
        fc.property(
          fc.constant(null),
          () => {
            // Setup
            const mockRequest = createMockRequest(UserRole.Internal_User);
            const { res } = createMockResponse();
            const nextFunction = jest.fn();

            // Execute
            const middleware = requireInternal();
            middleware(mockRequest as Request, res as Response, nextFunction);

            // Verify: Internal_User should pass requireInternal
            expect(nextFunction).toHaveBeenCalled();
            expect(res.status).not.toHaveBeenCalled();
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  /**
   * Property 9: Portal User Access Is Isolated
   * Validates: Requirement 4.4
   * 
   * Correctness Property:
   * ∀ routes R with role requirements RR:
   *   IF user.role = Portal_User AND Portal_User ∈ RR
   *   THEN authorization succeeds
   *   
   *   IF user.role = Portal_User AND Portal_User ∉ RR
   *   THEN authorization fails with 403
   * 
   * This property ensures Portal_User can only access their own subscription data
   * and cannot access administrative or internal operational functions.
   */
  describe('Property 9: Portal User Access Is Isolated', () => {
    it('should allow Portal_User access only when explicitly included in required roles', () => {
      fc.assert(
        fc.property(
          // Generate role lists that include Portal_User
          fc.subarray([UserRole.Admin, UserRole.Internal_User, UserRole.Portal_User], { minLength: 1 })
            .filter(roles => roles.includes(UserRole.Portal_User)),
          (requiredRoles) => {
            // Setup
            const mockRequest = createMockRequest(UserRole.Portal_User);
            const { res } = createMockResponse();
            const nextFunction = jest.fn();

            // Execute
            const middleware = requireRoles(requiredRoles);
            middleware(mockRequest as Request, res as Response, nextFunction);

            // Verify: Portal_User should pass when included
            expect(nextFunction).toHaveBeenCalled();
            expect(res.status).not.toHaveBeenCalled();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should deny Portal_User access when not in required roles', () => {
      fc.assert(
        fc.property(
          // Generate role lists that do NOT include Portal_User
          fc.subarray([UserRole.Admin, UserRole.Internal_User], { minLength: 1 }),
          (requiredRoles) => {
            // Setup
            const mockRequest = createMockRequest(UserRole.Portal_User);
            const { res } = createMockResponse();
            const nextFunction = jest.fn();

            // Execute
            const middleware = requireRoles(requiredRoles);
            middleware(mockRequest as Request, res as Response, nextFunction);

            // Verify: Portal_User should be denied
            expect(nextFunction).not.toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.json).toHaveBeenCalledWith(
              expect.objectContaining({
                success: false,
                message: expect.stringContaining('Insufficient permissions'),
              })
            );
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should deny Portal_User access to Admin-only routes', () => {
      fc.assert(
        fc.property(
          fc.constant(null),
          () => {
            // Setup
            const mockRequest = createMockRequest(UserRole.Portal_User);
            const { res } = createMockResponse();
            const nextFunction = jest.fn();

            // Execute
            const middleware = requireAdmin();
            middleware(mockRequest as Request, res as Response, nextFunction);

            // Verify
            expect(nextFunction).not.toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(403);
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should deny Portal_User access to Internal routes', () => {
      fc.assert(
        fc.property(
          fc.constant(null),
          () => {
            // Setup
            const mockRequest = createMockRequest(UserRole.Portal_User);
            const { res } = createMockResponse();
            const nextFunction = jest.fn();

            // Execute
            const middleware = requireInternal();
            middleware(mockRequest as Request, res as Response, nextFunction);

            // Verify
            expect(nextFunction).not.toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(403);
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  /**
   * Property 10: Authorization Checks Are Enforced
   * Validates: Requirements 4.5, 4.6
   * 
   * Correctness Properties:
   * 1. ∀ requests without authentication: authorization fails with 401
   * 2. ∀ requests with invalid role: authorization fails with 403
   * 3. ∀ authorization failures: next() is never called
   * 4. ∀ authorization successes: next() is always called exactly once
   * 
   * This property ensures the authorization system consistently enforces access control.
   */
  describe('Property 10: Authorization Checks Are Enforced', () => {
    it('should always deny unauthenticated requests with 401', () => {
      fc.assert(
        fc.property(
          // Generate arbitrary role requirements
          fc.subarray([UserRole.Admin, UserRole.Internal_User, UserRole.Portal_User], { minLength: 1 }),
          (requiredRoles) => {
            // Setup: Request without user
            const mockRequest: Partial<Request> = {};
            const { res } = createMockResponse();
            const nextFunction = jest.fn();

            // Execute
            const middleware = requireRoles(requiredRoles);
            middleware(mockRequest as Request, res as Response, nextFunction);

            // Verify: Always 401 for unauthenticated
            expect(nextFunction).not.toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith(
              expect.objectContaining({
                success: false,
                message: 'Authentication required',
              })
            );
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should always deny requests with insufficient permissions with 403', () => {
      fc.assert(
        fc.property(
          // Generate user role and required roles where user role is not in required
          fc.constantFrom(UserRole.Internal_User, UserRole.Portal_User),
          fc.subarray([UserRole.Admin, UserRole.Internal_User, UserRole.Portal_User], { minLength: 1 }),
          (userRole, requiredRoles) => {
            // Filter to ensure user role is NOT in required roles
            if (requiredRoles.includes(userRole)) {
              return true; // Skip this case
            }

            // Setup
            const mockRequest = createMockRequest(userRole);
            const { res } = createMockResponse();
            const nextFunction = jest.fn();

            // Execute
            const middleware = requireRoles(requiredRoles);
            middleware(mockRequest as Request, res as Response, nextFunction);

            // Verify: Always 403 for insufficient permissions
            expect(nextFunction).not.toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.json).toHaveBeenCalledWith(
              expect.objectContaining({
                success: false,
                message: expect.stringContaining('Insufficient permissions'),
              })
            );

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should never call next() on authorization failure', () => {
      fc.assert(
        fc.property(
          // Generate scenarios that should fail
          fc.oneof(
            // Case 1: No user (unauthenticated)
            fc.record({
              hasUser: fc.constant(false),
              userRole: fc.constant(null),
              requiredRoles: fc.subarray([UserRole.Admin, UserRole.Internal_User, UserRole.Portal_User], { minLength: 1 }),
            }),
            // Case 2: User with wrong role
            fc.record({
              hasUser: fc.constant(true),
              userRole: fc.constantFrom(UserRole.Internal_User, UserRole.Portal_User),
              requiredRoles: fc.constant([UserRole.Admin]),
            })
          ),
          (scenario) => {
            // Setup
            const mockRequest: Partial<Request> = scenario.hasUser && scenario.userRole
              ? createMockRequest(scenario.userRole)
              : {};
            const { res } = createMockResponse();
            const nextFunction = jest.fn();

            // Execute
            const middleware = requireRoles(scenario.requiredRoles);
            middleware(mockRequest as Request, res as Response, nextFunction);

            // Verify: next() should NEVER be called on failure
            expect(nextFunction).not.toHaveBeenCalled();
            expect(res.status).toHaveBeenCalled();
            expect(res.json).toHaveBeenCalled();

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should always call next() exactly once on authorization success', () => {
      fc.assert(
        fc.property(
          // Generate user role
          fc.constantFrom(UserRole.Admin, UserRole.Internal_User, UserRole.Portal_User),
          (userRole) => {
            // Setup: Required roles include the user's role
            const mockRequest = createMockRequest(userRole);
            const { res } = createMockResponse();
            const nextFunction = jest.fn();

            // Execute
            const middleware = requireRoles([userRole]);
            middleware(mockRequest as Request, res as Response, nextFunction);

            // Verify: next() called exactly once, no error responses
            expect(nextFunction).toHaveBeenCalledTimes(1);
            expect(res.status).not.toHaveBeenCalled();
            expect(res.json).not.toHaveBeenCalled();

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should enforce role hierarchy consistently', () => {
      fc.assert(
        fc.property(
          fc.constant(null),
          () => {
            // Test the role hierarchy: Admin > Internal_User > Portal_User
            const roles = [
              { role: UserRole.Admin, canAccessAdmin: true, canAccessInternal: true },
              { role: UserRole.Internal_User, canAccessAdmin: false, canAccessInternal: true },
              { role: UserRole.Portal_User, canAccessAdmin: false, canAccessInternal: false },
            ];

            roles.forEach(({ role, canAccessAdmin, canAccessInternal }) => {
              // Test Admin access
              const adminRequest = createMockRequest(role);
              const adminRes = createMockResponse();
              const adminNext = jest.fn();
              requireAdmin()(adminRequest as Request, adminRes.res as Response, adminNext);
              
              if (canAccessAdmin) {
                expect(adminNext).toHaveBeenCalled();
              } else {
                expect(adminNext).not.toHaveBeenCalled();
                expect(adminRes.res.status).toHaveBeenCalledWith(403);
              }

              // Test Internal access
              const internalRequest = createMockRequest(role);
              const internalRes = createMockResponse();
              const internalNext = jest.fn();
              requireInternal()(internalRequest as Request, internalRes.res as Response, internalNext);
              
              if (canAccessInternal) {
                expect(internalNext).toHaveBeenCalled();
              } else {
                expect(internalNext).not.toHaveBeenCalled();
                expect(internalRes.res.status).toHaveBeenCalledWith(403);
              }
            });

            return true;
          }
        ),
        { numRuns: 50 }
      );
    });
  });
});
