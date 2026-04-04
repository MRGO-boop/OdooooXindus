import crypto from 'crypto';
import nodemailer from 'nodemailer';
import db, { generateId, getCurrentTimestamp } from '../config/database';
import { EmailVerificationToken } from '../types/models';
import { passwordService } from './PasswordService';

/**
 * EmailVerificationService handles password reset tokens and email verification
 * 
 * Implements Requirements:
 * - 1.5: Password reset interface
 * - 1.6: Send email verification link for password reset
 * - 1.7: Allow user to set new password via verification link
 */
export class EmailVerificationService {
  private transporter: nodemailer.Transporter;
  private readonly TOKEN_EXPIRY_HOURS = 24;

  constructor(transporter?: nodemailer.Transporter) {
    // Allow injecting transporter for testing
    if (transporter) {
      this.transporter = transporter;
    } else {
      // Configure nodemailer transporter
      // In development, use ethereal email for testing
      // In production, use actual SMTP settings from environment variables
      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.ethereal.email',
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER || '',
          pass: process.env.SMTP_PASS || '',
        },
      });
    }
  }

  /**
   * Generates a secure random token
   * @returns A cryptographically secure random token
   */
  private generateToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Calculates token expiration timestamp
   * @returns ISO timestamp for token expiration
   */
  private getExpirationTimestamp(): string {
    const expiryDate = new Date();
    expiryDate.setHours(expiryDate.getHours() + this.TOKEN_EXPIRY_HOURS);
    return expiryDate.toISOString();
  }

  /**
   * Requests a password reset by generating a token and sending an email
   * Implements Requirements 1.5 and 1.6
   * 
   * @param email - User's email address
   * @returns Promise resolving to the generated token (for testing purposes)
   * @throws Error if user not found or email sending fails
   */
  async requestPasswordReset(email: string): Promise<string> {
    try {
      // Normalize email
      const normalizedEmail = email.trim().toLowerCase();

      // Check if user exists
      const userStmt = db.prepare('SELECT id, email FROM users WHERE email = ?');
      const user = userStmt.get(normalizedEmail) as { id: string; email: string } | undefined;

      if (!user) {
        // For security, don't reveal if email exists or not
        // Return success but don't send email
        throw new Error('If the email exists, a password reset link has been sent');
      }

      // Delete any existing password reset tokens for this user
      const deleteStmt = db.prepare(
        'DELETE FROM email_verification_tokens WHERE user_id = ? AND type = ?'
      );
      deleteStmt.run(user.id, 'password_reset');

      // Generate new token
      const token = this.generateToken();
      const tokenId = generateId();
      const expiresAt = this.getExpirationTimestamp();
      const createdAt = getCurrentTimestamp();

      // Store token in database
      const insertStmt = db.prepare(`
        INSERT INTO email_verification_tokens (id, token, type, user_id, expires_at, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `);
      insertStmt.run(tokenId, token, 'password_reset', user.id, expiresAt, createdAt);

      // Send password reset email
      const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${token}`;
      
      await this.transporter.sendMail({
        from: process.env.SMTP_FROM || 'noreply@submanage.com',
        to: user.email,
        subject: 'Password Reset Request',
        html: `
          <h2>Password Reset Request</h2>
          <p>You requested to reset your password. Click the link below to set a new password:</p>
          <p><a href="${resetLink}">${resetLink}</a></p>
          <p>This link will expire in ${this.TOKEN_EXPIRY_HOURS} hours.</p>
          <p>If you didn't request this, please ignore this email.</p>
        `,
      });

      return token;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Password reset request failed: ${error.message}`);
      }
      throw new Error('Password reset request failed: Unknown error');
    }
  }

  /**
   * Verifies a password reset token
   * Implements Requirement 1.7
   * 
   * @param token - The token to verify
   * @returns Object with verification result and user_id if valid
   */
  verifyToken(token: string): { valid: boolean; userId?: string; error?: string } {
    try {
      // Find token in database
      const stmt = db.prepare(`
        SELECT id, token, user_id, expires_at, created_at
        FROM email_verification_tokens
        WHERE token = ? AND type = ?
      `);
      const tokenRecord = stmt.get(token, 'password_reset') as EmailVerificationToken | undefined;

      if (!tokenRecord) {
        return { valid: false, error: 'Invalid or expired token' };
      }

      // Check if token has expired
      const now = new Date();
      const expiresAt = new Date(tokenRecord.expires_at);

      if (now > expiresAt) {
        // Delete expired token
        const deleteStmt = db.prepare('DELETE FROM email_verification_tokens WHERE id = ?');
        deleteStmt.run(tokenRecord.id);
        return { valid: false, error: 'Token has expired' };
      }

      return { valid: true, userId: tokenRecord.user_id };
    } catch (error) {
      if (error instanceof Error) {
        return { valid: false, error: error.message };
      }
      return { valid: false, error: 'Token verification failed' };
    }
  }

  /**
   * Resets user password with a valid token
   * Implements Requirement 1.7
   * 
   * @param token - The password reset token
   * @param newPassword - The new password to set
   * @returns Promise resolving to success status
   * @throws Error if token is invalid or password update fails
   */
  async resetPassword(token: string, newPassword: string): Promise<void> {
    try {
      // Verify token
      const verification = this.verifyToken(token);

      if (!verification.valid || !verification.userId) {
        throw new Error(verification.error || 'Invalid token');
      }

      // Validate new password (basic validation, detailed validation in UserService)
      if (!newPassword || newPassword.trim().length === 0) {
        throw new Error('Password cannot be empty');
      }

      // Hash new password
      const hashedPassword = await passwordService.hash(newPassword);

      // Update user password
      const updateStmt = db.prepare(`
        UPDATE users
        SET password = ?, updated_at = ?
        WHERE id = ?
      `);
      const timestamp = getCurrentTimestamp();
      updateStmt.run(hashedPassword, timestamp, verification.userId);

      // Delete the used token
      const deleteStmt = db.prepare('DELETE FROM email_verification_tokens WHERE token = ?');
      deleteStmt.run(token);
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Password reset failed: ${error.message}`);
      }
      throw new Error('Password reset failed: Unknown error');
    }
  }
}

// Export a singleton instance for convenience
export const emailVerificationService = new EmailVerificationService();
