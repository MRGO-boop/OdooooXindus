/**
 * Example usage of role-based authorization guards
 * 
 * This file demonstrates how to use the roles middleware
 * to protect routes based on user roles.
 */

import express from 'express';
import { jwtAuthGuard } from './auth.middleware';
import { requireRoles, requireAdmin, requireInternal, requireAuthenticated, UserRole } from './roles.middleware';

const app = express();

// Example 1: Admin-only route
app.get('/api/admin/users', 
  jwtAuthGuard(), 
  requireAdmin(), 
  (req, res) => {
    // Only Admin users can access this route
    res.json({ 
      success: true, 
      message: 'Admin access granted',
      users: [] 
    });
  }
);

// Example 2: Admin and Internal_User route
app.get('/api/internal/reports', 
  jwtAuthGuard(), 
  requireInternal(), 
  (req, res) => {
    // Admin and Internal_User can access this route
    res.json({ 
      success: true, 
      reports: [] 
    });
  }
);

// Example 3: All authenticated users
app.get('/api/profile', 
  jwtAuthGuard(), 
  requireAuthenticated(), 
  (req, res) => {
    // All authenticated users can access this route
    res.json({ 
      success: true, 
      user: req.user 
    });
  }
);

// Example 4: Custom role combination
app.post('/api/subscriptions', 
  jwtAuthGuard(), 
  requireRoles([UserRole.Admin, UserRole.Internal_User]), 
  (req, res) => {
    // Only Admin and Internal_User can create subscriptions
    res.json({ 
      success: true, 
      message: 'Subscription created' 
    });
  }
);

// Example 5: Portal users accessing their own data
app.get('/api/subscriptions/my', 
  jwtAuthGuard(), 
  requireAuthenticated(), 
  (req, res) => {
    // All authenticated users can access their own subscriptions
    const userId = req.user?.userId;
    
    // Additional logic to ensure Portal_User only sees their own data
    res.json({ 
      success: true, 
      subscriptions: [] 
    });
  }
);

// Example 6: Protecting a router
const adminRouter = express.Router();

// Apply authentication and authorization to all routes in this router
adminRouter.use(jwtAuthGuard());
adminRouter.use(requireAdmin());

adminRouter.get('/settings', (req, res) => {
  res.json({ success: true, settings: {} });
});

adminRouter.post('/config', (req, res) => {
  res.json({ success: true, message: 'Config updated' });
});

app.use('/api/admin', adminRouter);

export default app;
