import { Router, Request, Response } from 'express';
import { AuthService } from '../services/AuthService';
import { userService } from '../services/UserService';
import { emailVerificationService } from '../services/EmailVerificationService';
import { validate } from '../middleware/validation.middleware';
import {
  LoginDtoSchema,
  RegisterDtoSchema,
  PasswordResetRequestDtoSchema,
  PasswordResetDtoSchema,
} from '../dtos/auth.dto';

/**
 * AuthController handles authentication-related HTTP endpoints
 * 
 * Implements Requirements:
 * - 1.1: Login interface accepting email and password
 * - 1.4: Signup interface for new user registration
 * - 1.5: Password reset interface
 * - 21.2: Clear and actionable error messages
 */
export class AuthController {
  public router: Router;
  private authService: AuthService;

  constructor(authService?: AuthService) {
    this.router = Router();
    this.authService = authService || new AuthService();
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    /**
     * POST /auth/login
     * Authenticates user with email and password
     * Implements Requirement 1.1
     */
    this.router.post('/login', validate(LoginDtoSchema), this.login.bind(this));

    /**
     * POST /auth/register
     * Registers a new user account
     * Implements Requirement 1.4
     */
    this.router.post('/register', validate(RegisterDtoSchema), this.register.bind(this));

    /**
     * POST /auth/password-reset-request
     * Requests a password reset by sending verification email
     * Implements Requirements 1.5, 1.6
     */
    this.router.post(
      '/password-reset-request',
      validate(PasswordResetRequestDtoSchema),
      this.requestPasswordReset.bind(this)
    );

    /**
     * POST /auth/password-reset
     * Resets password using verification token
     * Implements Requirements 1.5, 1.7
     */
    this.router.post('/password-reset', validate(PasswordResetDtoSchema), this.resetPassword.bind(this));
  }

  /**
   * Login endpoint handler
   * @param req - Express request with LoginDto in body
   * @param res - Express response
   */
  private async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;

      const result = await this.authService.login(email, password);

      res.status(200).json({
        success: true,
        message: 'Login successful',
        data: result,
      });
    } catch (error) {
      if (error instanceof Error) {
        // Check for authentication-specific errors
        if (error.message.includes('Invalid email or password')) {
          res.status(401).json({
            success: false,
            message: 'Invalid email or password',
          });
          return;
        }

        res.status(400).json({
          success: false,
          message: error.message,
        });
        return;
      }

      res.status(500).json({
        success: false,
        message: 'An unexpected error occurred',
      });
    }
  }

  /**
   * Register endpoint handler
   * @param req - Express request with RegisterDto in body
   * @param res - Express response
   */
  private async register(req: Request, res: Response): Promise<void> {
    try {
      const { email, password, role } = req.body;

      const user = await userService.register(email, password, role);

      res.status(201).json({
        success: true,
        message: 'Registration successful',
        data: { user },
      });
    } catch (error) {
      if (error instanceof Error) {
        // Check for specific registration errors
        if (error.message.includes('already registered')) {
          res.status(409).json({
            success: false,
            message: 'Email address is already registered',
          });
          return;
        }

        if (error.message.includes('Password must')) {
          res.status(400).json({
            success: false,
            message: error.message,
          });
          return;
        }

        res.status(400).json({
          success: false,
          message: error.message,
        });
        return;
      }

      res.status(500).json({
        success: false,
        message: 'An unexpected error occurred',
      });
    }
  }

  /**
   * Password reset request endpoint handler
   * @param req - Express request with PasswordResetRequestDto in body
   * @param res - Express response
   */
  private async requestPasswordReset(req: Request, res: Response): Promise<void> {
    try {
      const { email } = req.body;

      await emailVerificationService.requestPasswordReset(email);

      // Always return success for security (don't reveal if email exists)
      res.status(200).json({
        success: true,
        message: 'If the email exists, a password reset link has been sent',
      });
    } catch (error) {
      // Always return success for security, even on error
      res.status(200).json({
        success: true,
        message: 'If the email exists, a password reset link has been sent',
      });
    }
  }

  /**
   * Password reset endpoint handler
   * @param req - Express request with PasswordResetDto in body
   * @param res - Express response
   */
  private async resetPassword(req: Request, res: Response): Promise<void> {
    try {
      const { token, newPassword } = req.body;

      await emailVerificationService.resetPassword(token, newPassword);

      res.status(200).json({
        success: true,
        message: 'Password reset successful',
      });
    } catch (error) {
      if (error instanceof Error) {
        // Check for token-specific errors
        if (error.message.includes('Invalid') || error.message.includes('expired')) {
          res.status(400).json({
            success: false,
            message: 'Invalid or expired token',
          });
          return;
        }

        res.status(400).json({
          success: false,
          message: error.message,
        });
        return;
      }

      res.status(500).json({
        success: false,
        message: 'An unexpected error occurred',
      });
    }
  }
}

// Export a singleton instance for convenience
export const authController = new AuthController();
