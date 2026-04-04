import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import Database from 'better-sqlite3';
import fs from 'fs';

// Mock the database module before importing services
const TEST_DB_PATH = './test-email-verification.db';
let testDb: Database.Database;

// Create test database
if (fs.existsSync(TEST_DB_PATH)) {
  fs.unlinkSync(TEST_DB_PATH);
}
testDb = new Database(TEST_DB_PATH);
testDb.pragma('foreign_keys = ON');

// Create tables
testDb.exec(`
  CREATE TABLE users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'Portal_User',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
  CREATE INDEX idx_users_email ON users(email);

  CREATE TABLE email_verification_tokens (
    id TEXT PRIMARY KEY,
    token TEXT UNIQUE NOT NULL,
    type TEXT NOT NULL,
    user_id TEXT NOT NULL,
    expires_at DATETIME NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );
  CREATE INDEX idx_email_tokens_token ON email_verification_tokens(token);
  CREATE INDEX idx_email_tokens_user_id ON email_verification_tokens(user_id);
`);

jest.mock('../config/database', () => ({
  __esModule: true,
  default: testDb,
  generateId: () => `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
  getCurrentTimestamp: () => new Date().toISOString(),
}));

import { EmailVerificationService } from './EmailVerificationService';
import { UserService } from './UserService';

// Mock nodemailer
const mockSendMail = jest.fn().mockResolvedValue({ messageId: 'test-message-id' });
const mockTransporter = {
  sendMail: mockSendMail,
} as any;

describe('EmailVerificationService', () => {
  let emailVerificationService: EmailVerificationService;
  let userService: UserService;
  let testUserId: string;
  let testEmail: string;

  beforeAll(() => {
    emailVerificationService = new EmailVerificationService(mockTransporter);
    userService = new UserService();
  });

  beforeEach(async () => {
    // Clean up database before each test
    testDb.exec('DELETE FROM email_verification_tokens');
    testDb.exec('DELETE FROM users');

    // Reset mock
    mockSendMail.mockClear();

    // Create a test user
    testEmail = 'test@example.com';
    const user = await userService.register(testEmail, 'TestPass123!', 'Portal_User');
    testUserId = user.id;
  });

  afterAll(() => {
    testDb.close();
    if (fs.existsSync(TEST_DB_PATH)) {
      fs.unlinkSync(TEST_DB_PATH);
    }
  });

  describe('requestPasswordReset', () => {
    it('should generate a token and store it in database for valid email', async () => {
      const token = await emailVerificationService.requestPasswordReset(testEmail);

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.length).toBeGreaterThan(0);

      // Verify token is stored in database
      const stmt = testDb.prepare('SELECT * FROM email_verification_tokens WHERE token = ?');
      const tokenRecord = stmt.get(token);
      expect(tokenRecord).toBeDefined();
    });

    it('should create token with correct type', async () => {
      const token = await emailVerificationService.requestPasswordReset(testEmail);

      const stmt = testDb.prepare('SELECT type FROM email_verification_tokens WHERE token = ?');
      const result = stmt.get(token) as { type: string };
      expect(result.type).toBe('password_reset');
    });

    it('should create token associated with correct user', async () => {
      const token = await emailVerificationService.requestPasswordReset(testEmail);

      const stmt = testDb.prepare('SELECT user_id FROM email_verification_tokens WHERE token = ?');
      const result = stmt.get(token) as { user_id: string };
      expect(result.user_id).toBe(testUserId);
    });

    it('should set expiration timestamp in the future', async () => {
      const token = await emailVerificationService.requestPasswordReset(testEmail);

      const stmt = testDb.prepare('SELECT expires_at FROM email_verification_tokens WHERE token = ?');
      const result = stmt.get(token) as { expires_at: string };
      
      const expiresAt = new Date(result.expires_at);
      const now = new Date();
      
      expect(expiresAt.getTime()).toBeGreaterThan(now.getTime());
    });

    it('should delete existing tokens before creating new one', async () => {
      // Create first token
      const token1 = await emailVerificationService.requestPasswordReset(testEmail);
      
      // Create second token
      const token2 = await emailVerificationService.requestPasswordReset(testEmail);

      // First token should be deleted
      const stmt = testDb.prepare('SELECT * FROM email_verification_tokens WHERE token = ?');
      const oldToken = stmt.get(token1);
      expect(oldToken).toBeUndefined();

      // Second token should exist
      const newToken = stmt.get(token2);
      expect(newToken).toBeDefined();
    });

    it('should handle non-existent email gracefully', async () => {
      await expect(
        emailVerificationService.requestPasswordReset('nonexistent@example.com')
      ).rejects.toThrow();
    });

    it('should normalize email to lowercase', async () => {
      const token = await emailVerificationService.requestPasswordReset('TEST@EXAMPLE.COM');

      const stmt = testDb.prepare('SELECT user_id FROM email_verification_tokens WHERE token = ?');
      const result = stmt.get(token) as { user_id: string };
      expect(result.user_id).toBe(testUserId);
    });
  });

  describe('verifyToken', () => {
    it('should return valid=true for valid unexpired token', async () => {
      const token = await emailVerificationService.requestPasswordReset(testEmail);

      const result = emailVerificationService.verifyToken(token);

      expect(result.valid).toBe(true);
      expect(result.userId).toBe(testUserId);
      expect(result.error).toBeUndefined();
    });

    it('should return valid=false for non-existent token', () => {
      const result = emailVerificationService.verifyToken('invalid-token-12345');

      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.userId).toBeUndefined();
    });

    it('should return valid=false for expired token', async () => {
      const token = await emailVerificationService.requestPasswordReset(testEmail);

      // Manually expire the token by setting expires_at to the past
      const updateStmt = testDb.prepare(
        'UPDATE email_verification_tokens SET expires_at = ? WHERE token = ?'
      );
      const pastDate = new Date();
      pastDate.setHours(pastDate.getHours() - 1);
      updateStmt.run(pastDate.toISOString(), token);

      const result = emailVerificationService.verifyToken(token);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('expired');
    });

    it('should delete expired token after verification', async () => {
      const token = await emailVerificationService.requestPasswordReset(testEmail);

      // Manually expire the token
      const updateStmt = testDb.prepare(
        'UPDATE email_verification_tokens SET expires_at = ? WHERE token = ?'
      );
      const pastDate = new Date();
      pastDate.setHours(pastDate.getHours() - 1);
      updateStmt.run(pastDate.toISOString(), token);

      emailVerificationService.verifyToken(token);

      // Token should be deleted
      const stmt = testDb.prepare('SELECT * FROM email_verification_tokens WHERE token = ?');
      const result = stmt.get(token);
      expect(result).toBeUndefined();
    });
  });

  describe('resetPassword', () => {
    it('should successfully reset password with valid token', async () => {
      const token = await emailVerificationService.requestPasswordReset(testEmail);
      const newPassword = 'NewPass456!';

      await emailVerificationService.resetPassword(token, newPassword);

      // Verify password was updated by trying to get user with new password hash
      const stmt = testDb.prepare('SELECT password FROM users WHERE id = ?');
      const result = stmt.get(testUserId) as { password: string };
      expect(result.password).toBeDefined();
      expect(result.password).not.toBe('NewPass456!'); // Should be hashed
    });

    it('should delete token after successful password reset', async () => {
      const token = await emailVerificationService.requestPasswordReset(testEmail);

      await emailVerificationService.resetPassword(token, 'NewPass456!');

      // Token should be deleted
      const stmt = testDb.prepare('SELECT * FROM email_verification_tokens WHERE token = ?');
      const result = stmt.get(token);
      expect(result).toBeUndefined();
    });

    it('should reject password reset with invalid token', async () => {
      await expect(
        emailVerificationService.resetPassword('invalid-token', 'NewPass456!')
      ).rejects.toThrow('Invalid or expired token');
    });

    it('should reject password reset with expired token', async () => {
      const token = await emailVerificationService.requestPasswordReset(testEmail);

      // Manually expire the token
      const updateStmt = testDb.prepare(
        'UPDATE email_verification_tokens SET expires_at = ? WHERE token = ?'
      );
      const pastDate = new Date();
      pastDate.setHours(pastDate.getHours() - 1);
      updateStmt.run(pastDate.toISOString(), token);

      await expect(
        emailVerificationService.resetPassword(token, 'NewPass456!')
      ).rejects.toThrow();
    });

    it('should reject empty password', async () => {
      const token = await emailVerificationService.requestPasswordReset(testEmail);

      await expect(
        emailVerificationService.resetPassword(token, '')
      ).rejects.toThrow('Password cannot be empty');
    });

    it('should update user updated_at timestamp', async () => {
      const token = await emailVerificationService.requestPasswordReset(testEmail);

      // Get original updated_at
      const beforeStmt = testDb.prepare('SELECT updated_at FROM users WHERE id = ?');
      const before = beforeStmt.get(testUserId) as { updated_at: string };

      // Wait a bit to ensure timestamp difference
      await new Promise(resolve => setTimeout(resolve, 10));

      await emailVerificationService.resetPassword(token, 'NewPass456!');

      // Get new updated_at
      const afterStmt = testDb.prepare('SELECT updated_at FROM users WHERE id = ?');
      const after = afterStmt.get(testUserId) as { updated_at: string };

      expect(after.updated_at).not.toBe(before.updated_at);
    });
  });

  describe('Integration tests', () => {
    it('should complete full password reset flow', async () => {
      // Step 1: Request password reset
      const token = await emailVerificationService.requestPasswordReset(testEmail);
      expect(token).toBeDefined();

      // Step 2: Verify token
      const verification = emailVerificationService.verifyToken(token);
      expect(verification.valid).toBe(true);
      expect(verification.userId).toBe(testUserId);

      // Step 3: Reset password
      await emailVerificationService.resetPassword(token, 'NewSecurePass123!');

      // Step 4: Verify token is no longer valid
      const secondVerification = emailVerificationService.verifyToken(token);
      expect(secondVerification.valid).toBe(false);
    });

    it('should not allow token reuse after password reset', async () => {
      const token = await emailVerificationService.requestPasswordReset(testEmail);

      // First reset
      await emailVerificationService.resetPassword(token, 'NewPass123!');

      // Try to reuse token
      await expect(
        emailVerificationService.resetPassword(token, 'AnotherPass456!')
      ).rejects.toThrow();
    });
  });
});
