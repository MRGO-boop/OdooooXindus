import { Request, Response, NextFunction } from 'express';
import { z, ZodError } from 'zod';

/**
 * Validation middleware for Express routes
 * Uses Zod schemas to validate request body
 * 
 * Implements Requirement 21.2: Clear and actionable error messages
 */

/**
 * Creates a validation middleware for a given Zod schema
 * @param schema - Zod schema to validate against
 * @returns Express middleware function
 */
export const validate = (schema: z.ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate and transform request body
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        // Format Zod validation errors into clear messages
        const errors = error.issues.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        }));

        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors,
        });
      }

      // Handle unexpected errors
      console.error('Validation middleware error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  };
};
