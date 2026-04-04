import db, { generateId, getCurrentTimestamp } from '../config/database';
import { passwordService } from './PasswordService';
import { User } from '../types/models';

/**
 * UserService handles user registration and management
 * 
 * Implements Requirements:
 * - 1.4: User registration interface
 * - 2.1-2.5: Password complexity validation
 * - 3.1-3.2: Email uniqueness validation
 */
export class UserService {
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
   * Registers a new user with email and password
   * @param email - User's email address
   * @param password - User's plain text password
   * @param role - User role (defaults to 'Portal_User')
   * @returns Promise resolving to the created user (without password)
   * @throws Error if validation fails or registration fails
   */
  async register(
    email: string,
    password: string,
    role: string = 'Portal_User'
  ): Promise<Omit<User, 'password'>> {
    try {
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

      // Requirement 3.1: Check email uniqueness
      if (this.emailExists(normalizedEmail)) {
        // Requirement 3.2: Reject if email exists
        throw new Error('Email address is already registered');
      }

      // Requirements 2.1-2.4: Validate password complexity
      const passwordValidation = this.validatePasswordComplexity(password);
      if (!passwordValidation.valid) {
        // Requirement 2.5: Display specific validation errors
        throw new Error(passwordValidation.errors.join('; '));
      }

      // Hash password using PasswordService
      const hashedPassword = await passwordService.hash(password);

      // Generate user ID and timestamps
      const userId = generateId();
      const timestamp = getCurrentTimestamp();

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
        throw new Error(`User registration failed: ${error.message}`);
      }
      throw new Error('User registration failed: Unknown error');
    }
  }

  /**
   * Retrieves a user by ID
   * @param userId - User ID to retrieve
   * @returns User object without password, or undefined if not found
   */
  getUserById(userId: string): Omit<User, 'password'> | undefined {
    const stmt = db.prepare('SELECT id, email, role, created_at, updated_at FROM users WHERE id = ?');
    const user = stmt.get(userId) as Omit<User, 'password'> | undefined;
    return user;
  }

  /**
   * Retrieves a user by email
   * @param email - Email address to retrieve
   * @returns User object without password, or undefined if not found
   */
  getUserByEmail(email: string): Omit<User, 'password'> | undefined {
    const normalizedEmail = email.trim().toLowerCase();
    const stmt = db.prepare('SELECT id, email, role, created_at, updated_at FROM users WHERE email = ?');
    const user = stmt.get(normalizedEmail) as Omit<User, 'password'> | undefined;
    return user;
  }
}

// Export a singleton instance for convenience
export const userService = new UserService();
