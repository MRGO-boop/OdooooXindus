import { z } from 'zod';

/**
 * DTOs for subscription management endpoints
 * 
 * Implements Requirements:
 * - 10.1: Subscription CRUD operations
 * - 21.2: Clear and actionable error messages
 */

/**
 * CreateSubscriptionDto - Data Transfer Object for creating a subscription
 */
export const CreateSubscriptionDtoSchema = z.object({
  user_id: z
    .string()
    .min(1, 'User ID is required')
    .transform((val) => val.trim()),
  recurring_plan_id: z
    .string()
    .optional()
    .nullable()
    .transform((val) => (val ? val.trim() : null)),
  start_date: z
    .string()
    .optional()
    .nullable()
    .refine(
      (val) => !val || !isNaN(Date.parse(val)),
      'Start date must be a valid ISO date string'
    ),
  end_date: z
    .string()
    .optional()
    .nullable()
    .refine(
      (val) => !val || !isNaN(Date.parse(val)),
      'End date must be a valid ISO date string'
    ),
});

export type CreateSubscriptionDto = z.infer<typeof CreateSubscriptionDtoSchema>;

/**
 * UpdateSubscriptionDto - Data Transfer Object for updating a subscription
 * All fields are optional for partial updates
 */
export const UpdateSubscriptionDtoSchema = z.object({
  recurring_plan_id: z
    .string()
    .optional()
    .nullable()
    .transform((val) => (val ? val.trim() : null)),
  status: z
    .enum(['Draft', 'Quotation', 'Confirmed', 'Active', 'Closed'], {
      message: 'Status must be one of: Draft, Quotation, Confirmed, Active, Closed',
    })
    .optional(),
  start_date: z
    .string()
    .optional()
    .nullable()
    .refine(
      (val) => !val || !isNaN(Date.parse(val)),
      'Start date must be a valid ISO date string'
    ),
  end_date: z
    .string()
    .optional()
    .nullable()
    .refine(
      (val) => !val || !isNaN(Date.parse(val)),
      'End date must be a valid ISO date string'
    ),
});

export type UpdateSubscriptionDto = z.infer<typeof UpdateSubscriptionDtoSchema>;

/**
 * CreateOrderLineDto - Data Transfer Object for creating an order line
 */
export const CreateOrderLineDtoSchema = z.object({
  product_id: z
    .string()
    .min(1, 'Product ID is required')
    .transform((val) => val.trim()),
  product_variant_id: z
    .string()
    .optional()
    .nullable()
    .transform((val) => (val ? val.trim() : null)),
  quantity: z
    .number()
    .int('Quantity must be an integer')
    .positive('Quantity must be greater than 0'),
  unit_price: z
    .number()
    .nonnegative('Unit price cannot be negative'),
  amount: z
    .number()
    .nonnegative('Amount cannot be negative'),
  subscription_id: z
    .string()
    .optional()
    .nullable()
    .transform((val) => (val ? val.trim() : null)),
  invoice_id: z
    .string()
    .optional()
    .nullable()
    .transform((val) => (val ? val.trim() : null)),
  tax_ids: z
    .array(z.string())
    .optional()
    .default([]),
});

export type CreateOrderLineDto = z.infer<typeof CreateOrderLineDtoSchema>;

/**
 * UpdateOrderLineDto - Data Transfer Object for updating an order line
 * All fields are optional for partial updates
 */
export const UpdateOrderLineDtoSchema = z.object({
  product_id: z
    .string()
    .min(1, 'Product ID cannot be empty')
    .transform((val) => val.trim())
    .optional(),
  product_variant_id: z
    .string()
    .optional()
    .nullable()
    .transform((val) => (val ? val.trim() : null)),
  quantity: z
    .number()
    .int('Quantity must be an integer')
    .positive('Quantity must be greater than 0')
    .optional(),
  unit_price: z
    .number()
    .nonnegative('Unit price cannot be negative')
    .optional(),
  amount: z
    .number()
    .nonnegative('Amount cannot be negative')
    .optional(),
  tax_ids: z
    .array(z.string())
    .optional(),
});

export type UpdateOrderLineDto = z.infer<typeof UpdateOrderLineDtoSchema>;

/**
 * CreateQuotationTemplateDto - Data Transfer Object for creating a quotation template
 */
export const CreateQuotationTemplateDtoSchema = z.object({
  name: z
    .string()
    .min(1, 'Template name is required')
    .transform((val) => val.trim()),
  description: z
    .string()
    .optional()
    .nullable(),
  template_data: z.object({
    recurring_plan_id: z
      .string()
      .optional()
      .nullable()
      .transform((val) => (val ? val.trim() : null)),
    order_lines: z
      .array(
        z.object({
          product_id: z.string().min(1, 'Product ID is required'),
          product_variant_id: z.string().optional().nullable(),
          quantity: z.number().int().positive('Quantity must be greater than 0'),
          unit_price: z.number().nonnegative('Unit price cannot be negative'),
          amount: z.number().nonnegative('Amount cannot be negative'),
          tax_ids: z.array(z.string()).optional(),
        })
      )
      .min(1, 'Template must include at least one order line'),
  }),
});

export type CreateQuotationTemplateDto = z.infer<typeof CreateQuotationTemplateDtoSchema>;

/**
 * UpdateQuotationTemplateDto - Data Transfer Object for updating a quotation template
 * All fields are optional for partial updates
 */
export const UpdateQuotationTemplateDtoSchema = z.object({
  name: z
    .string()
    .min(1, 'Template name cannot be empty')
    .transform((val) => val.trim())
    .optional(),
  description: z
    .string()
    .optional()
    .nullable(),
  template_data: z
    .object({
      recurring_plan_id: z
        .string()
        .optional()
        .nullable()
        .transform((val) => (val ? val.trim() : null)),
      order_lines: z
        .array(
          z.object({
            product_id: z.string().min(1, 'Product ID is required'),
            product_variant_id: z.string().optional().nullable(),
            quantity: z.number().int().positive('Quantity must be greater than 0'),
            unit_price: z.number().nonnegative('Unit price cannot be negative'),
            amount: z.number().nonnegative('Amount cannot be negative'),
            tax_ids: z.array(z.string()).optional(),
          })
        )
        .min(1, 'Template must include at least one order line'),
    })
    .optional(),
});

export type UpdateQuotationTemplateDto = z.infer<typeof UpdateQuotationTemplateDtoSchema>;

/**
 * CreateSubscriptionFromTemplateDto - Data Transfer Object for creating a subscription from a template
 */
export const CreateSubscriptionFromTemplateDtoSchema = z.object({
  template_id: z
    .string()
    .min(1, 'Template ID is required')
    .transform((val) => val.trim()),
  user_id: z
    .string()
    .min(1, 'User ID is required')
    .transform((val) => val.trim()),
  start_date: z
    .string()
    .optional()
    .nullable()
    .refine(
      (val) => !val || !isNaN(Date.parse(val)),
      'Start date must be a valid ISO date string'
    ),
  end_date: z
    .string()
    .optional()
    .nullable()
    .refine(
      (val) => !val || !isNaN(Date.parse(val)),
      'End date must be a valid ISO date string'
    ),
});

export type CreateSubscriptionFromTemplateDto = z.infer<typeof CreateSubscriptionFromTemplateDtoSchema>;
