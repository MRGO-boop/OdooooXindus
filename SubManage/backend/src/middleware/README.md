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
