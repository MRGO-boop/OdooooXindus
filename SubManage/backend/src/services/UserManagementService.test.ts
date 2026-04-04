import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import db from '../config/database';
import { UserManagementService } from './UserManagementService';
import { passwordService } from './PasswordService';

describe('UserManagementService', () => {
  let service: UserManagementService;
  let adminUserId: string;
  let nonAdminUserId: string;

  beforeEach(async () => {
    service = new UserManagementService();

    // Create an admin user for testing
    const adminPassword = await passwordService.hash('AdminPass123!');
    const adminStmt = db.prepare(`
      INSERT INTO users (id, email, password, role, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    adminUserId = 'admin-test-id';
    adminStmt.run(
      adminUserId,
      'admin@test.com',
      adminPassword,
      'Admin',
      new Date().toISOString(),
      new Date().toISOString()
    );

    // Create a non-admin user for testing
    const userPassword = await passwordService.hash('UserPass123!');
    const userStmt = db.prepare(`
      INSERT INTO users (id, email, password, role, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    nonAdminUserId = 'user-test-id';
    userStmt.run(
      nonAdminUserId,
      'user@test.com',
      userPassword,
      'Portal_User',
      new Date().toISOString(),
      new Date().toISOString()
    );
  });

  afterEach(() => {
    // Clean up test data
    db.prepare('DELETE FROM users WHERE email LIKE ?').run('%@test.com');
  });

  describe('createInternalUser', () => {
    describe('Authorization (Requirement 5.2)', () => {
      it('should allow Admin users to create Internal_User accounts', async () => {
        const result = await service.createInternalUser(
          adminUserId,
          'internal@test.com',
          'ValidPass123!'
        );

        expect(result).toBeDefined();
        expect(result.email).toBe('internal@test.com');
        expect(result.role).toBe('Internal_User');
        expect(result.id).toBeDefined();
      });

      it('should reject non-Admin users from creating Internal_User accounts', async () => {
        await expect(
          service.createInternalUser(
            nonAdminUserId,
            'internal2@test.com',
            'ValidPass123!'
          )
        ).rejects.toThrow('Unauthorized: Only Admin users can create Internal_User accounts');
      });

      it('should reject requests from non-existent users', async () => {
        await expect(
          service.createInternalUser(
            'non-existent-id',
            'internal3@test.com',
            'ValidPass123!'
          )
        ).rejects.toThrow('Unauthorized: Only Admin users can create Internal_User accounts');
      });
    });

    describe('Role Assignment (Requirement 5.3)', () => {
      it('should assign Internal_User role to created accounts', async () => {
        const result = await service.createInternalUser(
          adminUserId,
          'internal4@test.com',
          'ValidPass123!'
        );

        expect(result.role).toBe('Internal_User');

        // Verify in database
        const stmt = db.prepare('SELECT role FROM users WHERE email = ?');
        const dbUser = stmt.get('internal4@test.com') as { role: string };
        expect(dbUser.role).toBe('Internal_User');
      });
    });

    describe('Email Validation', () => {
      it('should reject empty email', async () => {
        await expect(
          service.createInternalUser(adminUserId, '', 'ValidPass123!')
        ).rejects.toThrow('Email is required');
      });

      it('should reject invalid email format', async () => {
        await expect(
          service.createInternalUser(adminUserId, 'invalid-email', 'ValidPass123!')
        ).rejects.toThrow('Invalid email format');
      });

      it('should reject duplicate email addresses', async () => {
        await service.createInternalUser(
          adminUserId,
          'duplicate@test.com',
          'ValidPass123!'
        );

        await expect(
          service.createInternalUser(
            adminUserId,
            'duplicate@test.com',
            'ValidPass123!'
          )
        ).rejects.toThrow('Email address is already registered');
      });

      it('should normalize email to lowercase', async () => {
        const result = await service.createInternalUser(
          adminUserId,
          'MixedCase@Test.COM',
          'ValidPass123!'
        );

        expect(result.email).toBe('mixedcase@test.com');
      });
    });

    describe('Password Validation (Requirements 2.1-2.4)', () => {
      it('should reject password with 8 or fewer characters', async () => {
        await expect(
          service.createInternalUser(adminUserId, 'test5@test.com', 'Short1!')
        ).rejects.toThrow('Password must be longer than 8 characters');
      });

      it('should reject password without uppercase letter', async () => {
        await expect(
          service.createInternalUser(adminUserId, 'test6@test.com', 'nouppercase123!')
        ).rejects.toThrow('Password must contain at least one uppercase letter');
      });

      it('should reject password without lowercase letter', async () => {
        await expect(
          service.createInternalUser(adminUserId, 'test7@test.com', 'NOLOWERCASE123!')
        ).rejects.toThrow('Password must contain at least one lowercase letter');
      });

      it('should reject password without special character', async () => {
        await expect(
          service.createInternalUser(adminUserId, 'test8@test.com', 'NoSpecialChar123')
        ).rejects.toThrow('Password must contain at least one special character');
      });

      it('should accept password meeting all requirements', async () => {
        const result = await service.createInternalUser(
          adminUserId,
          'test9@test.com',
          'ValidPass123!'
        );

        expect(result).toBeDefined();
        expect(result.email).toBe('test9@test.com');
      });
    });

    describe('Password Hashing', () => {
      it('should hash password before storing', async () => {
        const plainPassword = 'ValidPass123!';
        const result = await service.createInternalUser(
          adminUserId,
          'test10@test.com',
          plainPassword
        );

        // Retrieve password from database
        const stmt = db.prepare('SELECT password FROM users WHERE id = ?');
        const dbUser = stmt.get(result.id) as { password: string };

        // Password should be hashed (not equal to plain text)
        expect(dbUser.password).not.toBe(plainPassword);

        // Verify password can be validated
        const isValid = await passwordService.verify(plainPassword, dbUser.password);
        expect(isValid).toBe(true);
      });
    });

    describe('Return Value', () => {
      it('should return user without password field', async () => {
        const result = await service.createInternalUser(
          adminUserId,
          'test11@test.com',
          'ValidPass123!'
        );

        expect(result).not.toHaveProperty('password');
        expect(result).toHaveProperty('id');
        expect(result).toHaveProperty('email');
        expect(result).toHaveProperty('role');
        expect(result).toHaveProperty('created_at');
        expect(result).toHaveProperty('updated_at');
      });

      it('should set timestamps', async () => {
        const result = await service.createInternalUser(
          adminUserId,
          'test12@test.com',
          'ValidPass123!'
        );

        expect(result.created_at).toBeDefined();
        expect(result.updated_at).toBeDefined();
        expect(new Date(result.created_at).getTime()).toBeGreaterThan(0);
        expect(new Date(result.updated_at).getTime()).toBeGreaterThan(0);
      });
    });
  });
});
