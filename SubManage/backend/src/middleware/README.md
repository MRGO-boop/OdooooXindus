# Middleware Documentation

## JWT Authentication Guard

The `jwtAuthGuard` middleware provides JWT-based authentication for protected routes.

### Features

- Extracts JWT token from `Authorization` header (Bearer token format)
- Verifies token validity and expiration
- Attaches decoded user information to `req.user`
- Returns appropriate error responses for authentication failures

### Usage

#### Basic Usage

```typescript
import { jwtAuthGuard } from './middleware/auth.middleware';

// Protect a single route
app.get('/api/profile', jwtAuthGuard(), (req, res) => {
  // req.user is now available with authenticated user info
  res.json({
    success: true,
    user: req.user, // { userId, email, role }
  });
});
```

#### Protecting Multiple Routes

```typescript
// Protect all routes in a router
const protectedRouter = express.Router();
protectedRouter.use(jwtAuthGuard());

protectedRouter.get('/subscriptions', (req, res) => {
  // All routes here are protected
  const userId = req.user?.userId;
  // ... fetch user's subscriptions
});

app.use('/api/protected', protectedRouter);
```

#### Request Headers

Clients must include the JWT token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

### Response Codes

- **200**: Authentication successful, request proceeds to route handler
- **401**: Authentication failed (missing token, invalid token, expired token)
- **500**: Internal server error

### Error Responses

#### Missing Authorization Header
```json
{
  "success": false,
  "message": "Authorization header missing"
}
```

#### Invalid Header Format
```json
{
  "success": false,
  "message": "Invalid authorization header format. Expected: Bearer <token>"
}
```

#### Invalid Token
```json
{
  "success": false,
  "message": "Invalid token"
}
```

#### Expired Token
```json
{
  "success": false,
  "message": "Token expired"
}
```

### Request User Object

After successful authentication, `req.user` contains:

```typescript
{
  userId: string;   // User's unique identifier
  email: string;    // User's email address
  role: string;     // User's role (Admin, Internal_User, Portal_User)
}
```

### Testing

The middleware includes comprehensive unit tests covering:
- Missing authorization headers
- Invalid header formats
- Valid token authentication
- Invalid and expired tokens
- Different user roles
- Edge cases

Run tests with:
```bash
npm test -- auth.middleware.test.ts
```

### Requirements Implemented

- **Requirement 4.1**: Role-based access control with JWT verification
- **Requirement 20.1**: Security enforcement for protected routes

---

## Role-Based Authorization Guard

The `requireRoles` middleware provides role-based authorization for protected routes. It must be used after `jwtAuthGuard` middleware.

### Features

- Checks if authenticated user has required role(s)
- Supports multiple roles per route
- Returns 403 Forbidden for insufficient permissions
- Provides convenience functions for common role combinations

### User Roles

The system supports three user roles:

- **Admin**: Full system control and configuration privileges
- **Internal_User**: Limited operational access
- **Portal_User**: Access only to own subscription data

### Usage

#### Basic Usage

```typescript
import { jwtAuthGuard } from './middleware/auth.middleware';
import { requireRoles, UserRole } from './middleware/roles.middleware';

// Admin-only route
app.get('/api/admin/users', 
  jwtAuthGuard(), 
  requireRoles([UserRole.Admin]), 
  (req, res) => {
    // Only Admin users can access this route
    res.json({ success: true, users: [] });
  }
);

// Multiple roles allowed
app.get('/api/internal/reports', 
  jwtAuthGuard(), 
  requireRoles([UserRole.Admin, UserRole.Internal_User]), 
  (req, res) => {
    // Admin and Internal_User can access this route
    res.json({ success: true, reports: [] });
  }
);
```

#### Convenience Functions

```typescript
import { requireAdmin, requireInternal, requireAuthenticated } from './middleware/roles.middleware';

// Admin only
app.delete('/api/admin/users/:id', jwtAuthGuard(), requireAdmin(), deleteUser);

// Admin and Internal_User
app.get('/api/internal/analytics', jwtAuthGuard(), requireInternal(), getAnalytics);

// All authenticated users
app.get('/api/profile', jwtAuthGuard(), requireAuthenticated(), getProfile);
```

### Response Codes

- **200**: Authorization successful, request proceeds to route handler
- **401**: User not authenticated (jwtAuthGuard should be used first)
- **403**: User lacks required permissions

### Error Responses

#### Not Authenticated
```json
{
  "success": false,
  "message": "Authentication required"
}
```

#### Insufficient Permissions
```json
{
  "success": false,
  "message": "Insufficient permissions. Required role(s): Admin, Internal_User"
}
```

### Testing

The middleware includes comprehensive unit tests covering:
- Unauthenticated users
- Users with insufficient permissions
- Users with required roles
- Multiple role scenarios
- All convenience functions

Run tests with:
```bash
npm test -- roles.middleware.test.ts
```

### Requirements Implemented

- **Requirement 4.2**: Admin role with full system control
- **Requirement 4.3**: Internal_User role with limited operational access
- **Requirement 4.4**: Portal_User role with access to own subscription data
- **Requirement 4.5**: Role permission verification
- **Requirement 4.6**: Authorization error for insufficient permissions
