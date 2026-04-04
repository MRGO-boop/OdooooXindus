import request from 'supertest';
import express, { Express } from 'express';
import nodemailer from 'nodemailer';
import { AuthController } from './auth.controller';
import { AuthService } from '../services/AuthService';
import { userService } from '../services/UserService';
import { EmailVerificationService } from '../services/EmailVerificationService';
import db, { initializeDatabase } from '../config/database';

/**
 * Tests for AuthController
 * 
 * Validates Requirements:
 * - 1.1: Login interface with email and password
 * - 1.4: User registration interface
 * - 1.5: Password reset interface
 * - 21.2: Clear and actionable error messages
 */

describe('AuthController', () => {
  let app: Express;
  let authController: AuthController;
  let emailVerificationService: EmailVerificationService;

  beforeAll(() => {
    // Initialize database for testing
    initializeDatabase();

    // Create mock email transporter
    const mockTransporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: 'test@test.com',
        pass: 'testpass',
      },
    });

    // Mock sendMail to avoid actual email sending
    mockTransporter.sendMail = jest.fn().mockResolvedValue({ messageId: 'test-message-id' });

    // Create email verification service with mock transporter
    emailVerificationService = new EmailVerificationService(mockTransporter);
  });

  beforeEach(() => {
    // Clear users table before each test
    db.prepare('DELETE FROM users').run();
    db.prepare('DELETE FROM email_verification_tokens').run();

    // Create Express app with AuthController
    app = express();
    app.use(express.json());
    authController = new AuthController();
    app.use('/api/auth', authController.router);
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user with valid data', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          password: 'Test@1234',
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Registration successful');
      expect(response.body.data.user).toHaveProperty('id');
      expect(response.body.data.user.email).toBe('test@example.com');
      expect(response.body.data.user.role).toBe('Portal_User');
      expect(response.body.data.user).not.toHaveProperty('password');
    });

    it('should reject registration with invalid email format', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'invalid-email',
          password: 'Test@1234',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Validation failed');
      expect(response.body.errors).toHaveLength(1);
      expect(response.body.errors[0].field).toBe('email');
    });

    it('should reject registration with weak password', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          password: 'weak',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Validation failed');
    });

    it('should reject registration with duplicate email', async () => {
      // Register first user
      await userService.register('test@example.com', 'Test@1234');

      // Try to register with same email
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          password: 'Test@1234',
        });

      expect(response.status).toBe(409);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Email address is already registered');
    });

    it('should normalize email to lowercase', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'Test@Example.COM',
          password: 'Test@1234',
        });

      expect(response.status).toBe(201);
      expect(response.body.data.user.email).toBe('test@example.com');
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      // Create a test user
      await userService.register('test@example.com', 'Test@1234');
    });

    it('should login with valid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'Test@1234',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Login successful');
      expect(response.body.data).toHaveProperty('token');
      expect(response.body.data.user.email).toBe('test@example.com');
      expect(response.body.data.user).not.toHaveProperty('password');
    });

    it('should reject login with invalid email', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'wrong@example.com',
          password: 'Test@1234',
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid email or password');
    });

    it('should reject login with invalid password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'WrongPassword@123',
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid email or password');
    });

    it('should reject login with missing email', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          password: 'Test@1234',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Validation failed');
    });

    it('should reject login with missing password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Validation failed');
    });

    it('should normalize email to lowercase during login', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'Test@Example.COM',
          password: 'Test@1234',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('POST /api/auth/password-reset-request', () => {
    beforeEach(async () => {
      // Create a test user
      await userService.register('test@example.com', 'Test@1234');
    });

    it('should accept password reset request for existing email', async () => {
      const response = await request(app)
        .post('/api/auth/password-reset-request')
        .send({
          email: 'test@example.com',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('password reset link has been sent');
    });

    it('should return success even for non-existent email (security)', async () => {
      const response = await request(app)
        .post('/api/auth/password-reset-request')
        .send({
          email: 'nonexistent@example.com',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('password reset link has been sent');
    });

    it('should reject request with invalid email format', async () => {
      const response = await request(app)
        .post('/api/auth/password-reset-request')
        .send({
          email: 'invalid-email',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Validation failed');
    });

    it('should reject request with missing email', async () => {
      const response = await request(app)
        .post('/api/auth/password-reset-request')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Validation failed');
    });
  });

  describe('POST /api/auth/password-reset', () => {
    let resetToken: string;

    beforeEach(async () => {
      // Create a test user and request password reset
      await userService.register('test@example.com', 'Test@1234');
      resetToken = await emailVerificationService.requestPasswordReset('test@example.com');
    });

    it('should reset password with valid token', async () => {
      const response = await request(app)
        .post('/api/auth/password-reset')
        .send({
          token: resetToken,
          newPassword: 'NewTest@1234',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Password reset successful');

      // Verify can login with new password
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'NewTest@1234',
        });

      expect(loginResponse.status).toBe(200);
    });

    it('should reject password reset with invalid token', async () => {
      const response = await request(app)
        .post('/api/auth/password-reset')
        .send({
          token: 'invalid-token',
          newPassword: 'NewTest@1234',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid or expired token');
    });

    it('should reject password reset with weak password', async () => {
      const response = await request(app)
        .post('/api/auth/password-reset')
        .send({
          token: resetToken,
          newPassword: 'weak',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Validation failed');
    });

    it('should reject password reset with missing token', async () => {
      const response = await request(app)
        .post('/api/auth/password-reset')
        .send({
          newPassword: 'NewTest@1234',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Validation failed');
    });

    it('should reject password reset with missing password', async () => {
      const response = await request(app)
        .post('/api/auth/password-reset')
        .send({
          token: resetToken,
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Validation failed');
    });
  });
});
