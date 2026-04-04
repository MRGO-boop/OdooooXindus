import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import Database from 'better-sqlite3';
import fs from 'fs';

// Mock the database module before importing UserService
const TEST_DB_PATH = './test-user-service.db';
let testDb: Database.Database;

// Create test database
if (fs.existsSync(TEST_DB_PATH)) {
  fs.unlinkSync(TEST_DB_PATH);
}
testDb = new Database(TEST_DB_PATH);
testDb.pragma('foreign_keys = ON');

// Create users table
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
`);

jest.mock('../config/database', () => ({
  __esModule: true,
  default: testDb,
  generateId: () => `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
  getCurrentTimestamp: () => new Date().toISOString(),
}));

import { UserService } from './UserService';

describe('UserService', () => {
  let userService: UserService;

  beforeAll(() => {
    userService = new UserService();
  });

  beforeEach(() => {
    // Clear all users before each test
    testDb.exec('DELETE FROM users');
  });

  afterAll(() => {
    testDb.close();
    if (fs.existsSync(TEST_DB_PATH)) {
      fs.unlinkSync(TEST_DB_PATH);
    }
  });

  describe('register', () => {
    it('should successfully register a user with valid email and password', async () => {
      const email = 'test@example.com';
      const password = 'ValidPass123!';

      const user = await userService.register(email, password);

      expect(user).toBeDefined();
      expect(user.email).toBe('test@example.com');
      expect(user.role).toBe('Portal_User');
      expect(user.id).toBeDefined();
      expect(user.created_at).toBeDefined();
      expect(user.updated_at).toBeDefined();
      expect((user as any).password).toBeUndefined();
    });

    it('should normalize email to lowercase', async () => {
      const email = 'Test@Example.COM';
      const password = 'ValidPass123!';

      const user = await userService.register(email, password);

      expect(user.email).toBe('test@example.com');
    });

    it('should allow custom role assignment', async () => {
      const email = 'admin@example.com';
      const password = 'ValidPass123!';
      const role = 'Admin';

      const user = await userService.register(email, password, role);

      expect(user.role).toBe('Admin');
    });

    it('should reject empty email', async () => {
      await expect(userService.register('', 'ValidPass123!')).rejects.toThrow(
        'Email is required'
      );
    });

    it('should reject empty password', async () => {
      await expect(userService.register('test@example.com', '')).rejects.toThrow(
        'Password is required'
      );
    });

    it('should reject invalid email format', async () => {
      await expect(userService.register('invalid-email', 'ValidPass123!')).rejects.toThrow(
        'Invalid email format'
      );
    });

    it('should reject duplicate email addresses', async () => {
      const email = 'test@example.com';
      const password = 'ValidPass123!';

      await userService.register(email, password);

      await expect(userService.register(email, password)).rejects.toThrow(
        'Email address is already registered'
      );
    });

    it('should reject duplicate email with different casing', async () => {
      await userService.register('test@example.com', 'ValidPass123!');

      await expect(userService.register('Test@Example.COM', 'ValidPass123!')).rejects.toThrow(
        'Email address is already registered'
      );
    });

    describe('password complexity validation', () => {
      it('should reject password with length <= 8 characters', async () => {
        await expect(userService.register('test@example.com', 'Short1!')).rejects.toThrow(
          'Password must be longer than 8 characters'
        );
      });

      it('should accept password with length > 8 characters', async () => {
        const user = await userService.register('test@example.com', 'LongPass1!');
        expect(user).toBeDefined();
      });

      it('should reject password without uppercase letter', async () => {
        await expect(userService.register('test@example.com', 'lowercase123!')).rejects.toThrow(
          'Password must contain at least one uppercase letter'
        );
      });

      it('should reject password without lowercase letter', async () => {
        await expect(userService.register('test@example.com', 'UPPERCASE123!')).rejects.toThrow(
          'Password must contain at least one lowercase letter'
        );
      });

      it('should reject password without special character', async () => {
        await expect(userService.register('test@example.com', 'NoSpecial123')).rejects.toThrow(
          'Password must contain at least one special character'
        );
      });

      it('should reject password with multiple validation failures', async () => {
        try {
          await userService.register('test@example.com', 'short');
          fail('Should have thrown an error');
        } catch (error) {
          expect(error).toBeInstanceOf(Error);
          const message = (error as Error).message;
          expect(message).toContain('Password must be longer than 8 characters');
          expect(message).toContain('Password must contain at least one uppercase letter');
          expect(message).toContain('Password must contain at least one special character');
        }
      });

      it('should accept password with all complexity requirements', async () => {
        const validPasswords = [
          'ValidPass123!',
          'MyP@ssw0rd',
          'Str0ng#Pass',
          'C0mpl3x$Pass',
        ];

        for (const password of validPasswords) {
          const email = `test${Math.random()}@example.com`;
          const user = await userService.register(email, password);
          expect(user).toBeDefined();
        }
      });
    });

    it('should hash password before storing', async () => {
      const email = 'test@example.com';
      const password = 'ValidPass123!';

      await userService.register(email, password);

      // Query database directly to check password is hashed
      const stmt = testDb.prepare('SELECT password FROM users WHERE email = ?');
      const result = stmt.get(email) as { password: string };

      expect(result.password).toBeDefined();
      expect(result.password).not.toBe(password);
      expect(result.password).toMatch(/^\$2[aby]\$/); // bcrypt hash format
    });
  });

  describe('getUserById', () => {
    it('should retrieve user by ID', async () => {
      const registeredUser = await userService.register('test@example.com', 'ValidPass123!');

      const user = userService.getUserById(registeredUser.id);

      expect(user).toBeDefined();
      expect(user?.id).toBe(registeredUser.id);
      expect(user?.email).toBe('test@example.com');
      expect((user as any)?.password).toBeUndefined();
    });

    it('should return undefined for non-existent user', () => {
      const user = userService.getUserById('non-existent-id');
      expect(user).toBeUndefined();
    });
  });

  describe('getUserByEmail', () => {
    it('should retrieve user by email', async () => {
      await userService.register('test@example.com', 'ValidPass123!');

      const user = userService.getUserByEmail('test@example.com');

      expect(user).toBeDefined();
      expect(user?.email).toBe('test@example.com');
      expect((user as any)?.password).toBeUndefined();
    });

    it('should retrieve user with case-insensitive email', async () => {
      await userService.register('test@example.com', 'ValidPass123!');

      const user = userService.getUserByEmail('Test@Example.COM');

      expect(user).toBeDefined();
      expect(user?.email).toBe('test@example.com');
    });

    it('should return undefined for non-existent email', () => {
      const user = userService.getUserByEmail('nonexistent@example.com');
      expect(user).toBeUndefined();
    });
  });
});
