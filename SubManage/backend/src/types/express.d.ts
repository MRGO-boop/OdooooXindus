import { Request } from 'express';

/**
 * Extend Express Request type to include authenticated user
 */
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        email: string;
        role: string;
      };
    }
  }
}

export {};
