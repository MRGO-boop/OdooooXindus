import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { passwordService } from './PasswordService';

/**
 * AuthService handles JWT authentication including token generation and verification
 * 
 * Implements Requirements:
 * - 1.2: JWT-based authentication with secure token generation
 * - 1.3: Token verification for protected routes
 */
export class AuthService {
  private readonly prisma: PrismaClient;
  private readonly jwtSecret: string;
  private readonly jwtExpiresIn: string;

  constructor(prisma: PrismaClient, jwtSecret?: string, jwtExpiresIn?: string) {
    this.prisma = prisma;
    this.jwtSecret = jwtSecret || process.env.JWT_SECRET || 'default-secret-key';
    this.jwtExpiresIn = jwtExpiresIn || process.env.JWT_EXPIRES_IN || '7d';

    if (this.jwtSecret === 'default-secret-key') {
      console.warn('⚠️  Warning: Using default JWT secret. Set JWT_SECRET in .env for production.');
    }
  }

  /**
   * Authenticates a user with email and password, returns JWT token
   * @param email - User's email address
   * @param password - User's plain text password
   * @returns Promise resolving to JWT token and user data
   * @throws Error if credentials are invalid or user not found
   */
  async login(email: string, password: string): Promise<{ token: string; user: { id: string; email: string; role: string } }> {
    try {
      // Validate input
      if (!email || email.trim().length === 0) {
        throw new Error('Email is required');
      }

      if (!password || password.trim().length === 0) {
        throw new Error('Password is required');
      }

      // Find user by email
      const user = await this.prisma.user.findUnique({
        where: { email: email.trim().toLowerCase() },
        select: {
          id: true,
          email: true,
          password: true,
          role: true,
        },
      });

      if (!user) {
        throw new Error('Invalid email or password');
      }

      // Verify password using PasswordService
      const isPasswordValid = await passwordService.verify(password, user.password);

      if (!isPasswordValid) {
        throw new Error('Invalid email or password');
      }

      // Generate JWT token
      const token = this.generateToken({
        userId: user.id,
        email: user.email,
        role: user.role,
      });

      // Return token and user data (excluding password)
      return {
        token,
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
        },
      };
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Login failed: ${error.message}`);
      }
      throw new Error('Login failed: Unknown error');
    }
  }

  /**
   * Generates a JWT token with user payload
   * @param payload - Token payload containing user information
   * @returns JWT token string
   */
  private generateToken(payload: { userId: string; email: string; role: string }): string {
    return jwt.sign(
      payload,
      this.jwtSecret,
      { expiresIn: this.jwtExpiresIn } as jwt.SignOptions
    );
  }

  /**
   * Verifies a JWT token and returns the decoded payload
   * @param token - JWT token to verify
   * @returns Decoded token payload
   * @throws Error if token is invalid or expired
   */
  async verifyToken(token: string): Promise<{ userId: string; email: string; role: string }> {
    try {
      if (!token || token.trim().length === 0) {
        throw new Error('Token is required');
      }

      const decoded = jwt.verify(token, this.jwtSecret) as {
        userId: string;
        email: string;
        role: string;
        iat: number;
        exp: number;
      };

      return {
        userId: decoded.userId,
        email: decoded.email,
        role: decoded.role,
      };
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new Error('Token expired');
      }
      if (error instanceof jwt.JsonWebTokenError) {
        throw new Error('Invalid token');
      }
      if (error instanceof Error) {
        throw new Error(`Token verification failed: ${error.message}`);
      }
      throw new Error('Token verification failed: Unknown error');
    }
  }
}
