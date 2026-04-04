import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import db, { initializeDatabase } from './config/database';
import { passwordService } from './services/PasswordService';
import { AuthService } from './services/AuthService';
import { authController } from './controllers/auth.controller';
import { jwtAuthGuard } from './middleware/auth.middleware';

// Load environment variables
dotenv.config();

// Initialize database schema
initializeDatabase();

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Initialize and export services for use in other modules
export { passwordService };
export const authService = new AuthService();

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Backend server is running' });
});

// Database connection test
app.get('/db-test', (req, res) => {
  try {
    // Test database connection by running a simple query
    const result = db.prepare('SELECT 1 as test').get();
    res.json({ status: 'ok', message: 'Database connection successful', result });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Database connection failed', error });
  }
});

// API Routes
app.use('/api/auth', authController.router);

// Example protected route using JWT authentication guard
app.get('/api/profile', jwtAuthGuard(), (req, res) => {
  // req.user is now available with authenticated user info
  res.json({
    success: true,
    message: 'Profile accessed successfully',
    user: req.user,
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  db.close();
  console.log('Database connection closed');
  process.exit(0);
});
