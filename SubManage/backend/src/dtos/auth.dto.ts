import { z } from 'zod';

/**
 * DTOs for authentication endpoints
 * 
 * Implements Requirements:
 * - 1.1: Login interface with email and password
 * - 1.4: User registration interface
 * - 1.5: Password reset interface
 * - 21.2: Clear and actionable error messages
 */

/**
 * LoginDto - Data Transfer Object for user login
 * Validates email and password for authentication
 */
export const LoginDtoSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Invalid email format')
    .transform((val) => val.trim().toLowerCase()),
  password: z
    .string()
    .min(1, 'Password is required'),
});

export type LoginDto = z.infer<typeof LoginDtoSchema>;

/**
 * RegisterDto - Data Transfer Object for user registration
 * Validates email, password, and optional role
 */
export const RegisterDtoSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Invalid email format')
    .transform((val) => val.trim().toLowerCase()),
  password: z
    .string()
    .min(1, 'Password is required')
    .min(9, 'Password must be longer than 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/, 'Password must contain at least one special character'),
  role: z
    .enum(['Portal_User', 'Internal_User', 'Admin'])
    .optional()
    .default('Portal_User'),
});

export type RegisterDto = z.infer<typeof RegisterDtoSchema>;

/**
 * PasswordResetRequestDto - Data Transfer Object for requesting password reset
 * Validates email for password reset request
 */
export const PasswordResetRequestDtoSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Invalid email format')
    .transform((val) => val.trim().toLowerCase()),
});

export type PasswordResetRequestDto = z.infer<typeof PasswordResetRequestDtoSchema>;

/**
 * PasswordResetDto - Data Transfer Object for resetting password with token
 * Validates token and new password
 */
export const PasswordResetDtoSchema = z.object({
  token: z
    .string()
    .min(1, 'Token is required'),
  newPassword: z
    .string()
    .min(1, 'Password is required')
    .min(9, 'Password must be longer than 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/, 'Password must contain at least one special character'),
});

export type PasswordResetDto = z.infer<typeof PasswordResetDtoSchema>;
