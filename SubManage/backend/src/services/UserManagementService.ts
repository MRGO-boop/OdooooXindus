import db, { generateId, getCurrentTimestamp } from '../config/database';
import { passwordService } from './PasswordService';
import { User } from '../types/models';

/**
 * UserManagementService handles admin-only user management operations
 * 
 * Implements Requirements:
 * - 5.1: Admin interface to create Internal_User accounts
 * - 5.2: Prevent non-Admin users from creating Internal_User accounts
 * - 5.3: Assign Internal_User role to created accounts
 */
export class UserManagementService {
  /**
   * Validates email format
   * @param email - Email address to validate
   * @returns true if email format is valid
   */
  private validateEmailFormat(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Validates password complexity requirements
   * @param password - Password to validate
   * @returns Object with validation result and specific error messages
   */
  private validatePasswordComplexity(password: string): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Requirement 2.1: Length > 8 characters
    if (password.length <= 8) {
      errors.push('Password must be longer than 8 characters');
    }

    // Requirement 2.2: At least one uppercase letter
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }

    // Requirement 2.3: At least one lowercase letter
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }

    // Requirement 2.4: At least one special character
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Checks if email already exists in database
   * @param email - Email address to check
   * @returns true if email exists, false otherwise
   */
  private emailExists(email: string): boolean {
    const stmt = db.prepare('SELECT id FROM users WHERE email = ?');
    const result = stmt.get(email.toLowerCase());
    return result !== undefined;
  }

  /**
   * Verifies that the requesting user has Admin role
   * @param requestingUserId - ID of the user making the request
   * @returns true if user is Admin, false otherwise
   */
  private isAdmin(requestingUserId: string): boolean {
    const stmt = db.prepare('SELECT role FROM users WHERE id = ?');
    const result = stmt.get(requestingUserId) as { role: string } | undefined;
    return result?.role === 'Admin';
  }

  /**
   * Creates a new Internal_User account (Admin only)
   * 
   * Implements Requirements:
   * - 5.1: Admin interface to create Internal_User accounts
   * - 5.2: Prevent non-Admin users from creating Internal_User accounts
   * - 5.3: Assign Internal_User role to created accounts
   * 
   * @param requestingUserId - ID of the user making the request (must be Admin)
   * @param email - Email address for the new Internal_User
   * @param password - Password for the new Internal_User
   * @returns Promise resolving to the created user (without password)
   * @throws Error if requesting user is not Admin or validation fails
   */
  async createInternalUser(
    requestingUserId: string,
    email: string,
    password: string
  ): Promise<Omit<User, 'password'>> {
    try {
      // Requirement 5.2: Verify requesting user is Admin
      if (!this.isAdmin(requestingUserId)) {
        throw new Error('Unauthorized: Only Admin users can create Internal_User accounts');
      }

      // Validate input
      if (!email || email.trim().length === 0) {
        throw new Error('Email is required');
      }

      if (!password || password.trim().length === 0) {
        throw new Error('Password is required');
      }

      // Normalize email
      const normalizedEmail = email.trim().toLowerCase();

      // Validate email format
      if (!this.validateEmailFormat(normalizedEmail)) {
        throw new Error('Invalid email format');
      }

      // Check email uniqueness
      if (this.emailExists(normalizedEmail)) {
        throw new Error('Email address is already registered');
      }

      // Validate password complexity
      const passwordValidation = this.validatePasswordComplexity(password);
      if (!passwordValidation.valid) {
        throw new Error(passwordValidation.errors.join('; '));
      }

      // Hash password using PasswordService
      const hashedPassword = await passwordService.hash(password);

      // Generate user ID and timestamps
      const userId = generateId();
      const timestamp = getCurrentTimestamp();

      // Requirement 5.3: Assign Internal_User role
      const role = 'Internal_User';

      // Insert user into database
      const stmt = db.prepare(`
        INSERT INTO users (id, email, password, role, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `);

      stmt.run(userId, normalizedEmail, hashedPassword, role, timestamp, timestamp);

      // Return user data without password
      return {
        id: userId,
        email: normalizedEmail,
        role,
        created_at: timestamp,
        updated_at: timestamp,
      };
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Internal user creation failed: ${error.message}`);
      }
      throw new Error('Internal user creation failed: Unknown error');
    }
  }
}

// Export a singleton instance for convenience
export const userManagementService = new UserManagementService();
