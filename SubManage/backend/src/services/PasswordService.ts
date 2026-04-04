import bcrypt from 'bcrypt';

/**
 * PasswordService handles secure password hashing and verification
 * using bcrypt with industry-standard algorithms.
 * 
 * Implements Requirement 20.2: Password encryption using industry-standard hashing
 */
export class PasswordService {
  private readonly saltRounds: number;

  constructor(saltRounds: number = 10) {
    this.saltRounds = saltRounds;
  }

  /**
   * Hashes a plain text password using bcrypt
   * @param password - The plain text password to hash
   * @returns Promise resolving to the hashed password
   * @throws Error if hashing fails
   */
  async hash(password: string): Promise<string> {
    try {
      if (!password || password.trim().length === 0) {
        throw new Error('Password cannot be empty');
      }
      
      const hashedPassword = await bcrypt.hash(password, this.saltRounds);
      return hashedPassword;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Password hashing failed: ${error.message}`);
      }
      throw new Error('Password hashing failed: Unknown error');
    }
  }

  /**
   * Verifies a plain text password against a hashed password
   * @param password - The plain text password to verify
   * @param hashedPassword - The hashed password to compare against
   * @returns Promise resolving to true if passwords match, false otherwise
   * @throws Error if verification fails
   */
  async verify(password: string, hashedPassword: string): Promise<boolean> {
    try {
      if (!password || password.trim().length === 0) {
        throw new Error('Password cannot be empty');
      }
      
      if (!hashedPassword || hashedPassword.trim().length === 0) {
        throw new Error('Hashed password cannot be empty');
      }
      
      const isMatch = await bcrypt.compare(password, hashedPassword);
      return isMatch;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Password verification failed: ${error.message}`);
      }
      throw new Error('Password verification failed: Unknown error');
    }
  }
}

// Export a singleton instance for convenience
export const passwordService = new PasswordService();
