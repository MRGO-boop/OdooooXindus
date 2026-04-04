import { z } from 'zod';

/**
 * DTOs for recurring plan management endpoints
 * 
 * Implements Requirements:
 * - 9.1: Recurring plan CRUD operations
 * - 9.2-9.6: Recurring plan field validation
 * - 21.2: Clear and actionable error messages
 */

/**
 * CreateRecurringPlanDto - Data Transfer Object for creating a recurring plan
 * Validates all required recurring plan fields
 */
export const CreateRecurringPlanDtoSchema = z.object({
  name: z
    .string()
    .min(1, 'Plan name is required')
    .transform((val) => val.trim()),
  billing_period: z
    .enum(['Daily', 'Weekly', 'Monthly', 'Yearly'], {
      message: 'Billing period must be one of: Daily, Weekly, Monthly, Yearly',
    }),
  auto_close: z
    .number()
    .int()
    .min(0)
    .max(1, 'auto_close must be 0 or 1')
    .optional()
    .default(0),
  closable: z
    .number()
    .int()
    .min(0)
    .max(1, 'closable must be 0 or 1')
    .optional()
    .default(1),
  pausable: z
    .number()
    .int()
    .min(0)
    .max(1, 'pausable must be 0 or 1')
    .optional()
    .default(0),
  renewable: z
    .number()
    .int()
    .min(0)
    .max(1, 'renewable must be 0 or 1')
    .optional()
    .default(1),
});

export type CreateRecurringPlanDto = z.infer<typeof CreateRecurringPlanDtoSchema>;

/**
 * UpdateRecurringPlanDto - Data Transfer Object for updating a recurring plan
 * All fields are optional for partial updates
 */
export const UpdateRecurringPlanDtoSchema = z.object({
  name: z
    .string()
    .min(1, 'Plan name cannot be empty')
    .transform((val) => val.trim())
    .optional(),
  billing_period: z
    .enum(['Daily', 'Weekly', 'Monthly', 'Yearly'], {
      message: 'Billing period must be one of: Daily, Weekly, Monthly, Yearly',
    })
    .optional(),
  auto_close: z
    .number()
    .int()
    .min(0)
    .max(1, 'auto_close must be 0 or 1')
    .optional(),
  closable: z
    .number()
    .int()
    .min(0)
    .max(1, 'closable must be 0 or 1')
    .optional(),
  pausable: z
    .number()
    .int()
    .min(0)
    .max(1, 'pausable must be 0 or 1')
    .optional(),
  renewable: z
    .number()
    .int()
    .min(0)
    .max(1, 'renewable must be 0 or 1')
    .optional(),
});

export type UpdateRecurringPlanDto = z.infer<typeof UpdateRecurringPlanDtoSchema>;
