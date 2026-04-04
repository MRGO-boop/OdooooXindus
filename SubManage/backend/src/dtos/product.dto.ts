import { z } from 'zod';

/**
 * DTOs for product management endpoints
 * 
 * Implements Requirements:
 * - 7.1: Product CRUD operations
 * - 7.2-7.6: Product field validation
 * - 21.2: Clear and actionable error messages
 */

/**
 * CreateProductDto - Data Transfer Object for creating a product
 * Validates all required product fields
 */
export const CreateProductDtoSchema = z.object({
  name: z
    .string()
    .min(1, 'Product name is required')
    .transform((val) => val.trim()),
  type: z
    .string()
    .min(1, 'Product type is required')
    .transform((val) => val.trim()),
  sales_price: z
    .number()
    .min(0, 'Sales price must be non-negative'),
  cost_price: z
    .number()
    .min(0, 'Cost price must be non-negative'),
  is_recurring: z
    .number()
    .int()
    .min(0)
    .max(1, 'is_recurring must be 0 or 1')
    .optional()
    .default(0),
});

export type CreateProductDto = z.infer<typeof CreateProductDtoSchema>;

/**
 * UpdateProductDto - Data Transfer Object for updating a product
 * All fields are optional for partial updates
 */
export const UpdateProductDtoSchema = z.object({
  name: z
    .string()
    .min(1, 'Product name cannot be empty')
    .transform((val) => val.trim())
    .optional(),
  type: z
    .string()
    .min(1, 'Product type cannot be empty')
    .transform((val) => val.trim())
    .optional(),
  sales_price: z
    .number()
    .min(0, 'Sales price must be non-negative')
    .optional(),
  cost_price: z
    .number()
    .min(0, 'Cost price must be non-negative')
    .optional(),
  is_recurring: z
    .number()
    .int()
    .min(0)
    .max(1, 'is_recurring must be 0 or 1')
    .optional(),
});

export type UpdateProductDto = z.infer<typeof UpdateProductDtoSchema>;

/**
 * CreateProductVariantDto - Data Transfer Object for creating a product variant
 * Validates product_id, attributes, and extra_price
 */
export const CreateProductVariantDtoSchema = z.object({
  product_id: z
    .string()
    .min(1, 'Product ID is required'),
  attributes: z
    .any()
    .refine((val) => {
      if (typeof val === 'string') {
        try {
          JSON.parse(val);
          return true;
        } catch {
          return false;
        }
      }
      return typeof val === 'object' && val !== null;
    }, 'Attributes must be a valid JSON string or object'),
  extra_price: z
    .number(),
});

export type CreateProductVariantDto = z.infer<typeof CreateProductVariantDtoSchema>;

/**
 * UpdateProductVariantDto - Data Transfer Object for updating a product variant
 * All fields are optional for partial updates
 */
export const UpdateProductVariantDtoSchema = z.object({
  attributes: z
    .string()
    .refine((val) => {
      try {
        JSON.parse(val);
        return true;
      } catch {
        return false;
      }
    }, 'Attributes must be valid JSON string')
    .optional(),
  extra_price: z
    .number()
    .optional(),
});

export type UpdateProductVariantDto = z.infer<typeof UpdateProductVariantDtoSchema>;
