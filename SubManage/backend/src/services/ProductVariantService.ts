import db, { generateId, getCurrentTimestamp } from '../config/database';
import { ProductVariant } from '../types/models';

/**
 * ProductVariantService handles product variant management operations
 * 
 * Implements Requirements:
 * - 8.1: Associate variants with parent products
 * - 8.2: Store variant attributes
 * - 8.3: Store extra price adjustment
 * - 8.4: Calculate final price (base price + extra price)
 */
export class ProductVariantService {
  /**
   * Creates a new product variant
   * @param product_id - Parent product ID
   * @param attributes - Variant attributes as JSON string or object
   * @param extra_price - Extra price adjustment
   * @returns Created product variant
   * @throws Error if validation fails
   */
  async create(
    product_id: string,
    attributes: string | object,
    extra_price: number
  ): Promise<ProductVariant> {
    // Requirement 8.1: Validate parent product exists
    if (!product_id || product_id.trim().length === 0) {
      throw new Error('Product ID is required');
    }

    const productStmt = db.prepare('SELECT id FROM products WHERE id = ?');
    const product = productStmt.get(product_id);
    if (!product) {
      throw new Error('Parent product not found');
    }

    // Requirement 8.2: Validate and store attributes as JSON
    let attributesJson: string;
    if (typeof attributes === 'string') {
      try {
        JSON.parse(attributes);
        attributesJson = attributes;
      } catch (error) {
        throw new Error('Attributes must be valid JSON string');
      }
    } else if (typeof attributes === 'object') {
      attributesJson = JSON.stringify(attributes);
    } else {
      throw new Error('Attributes must be a JSON string or object');
    }

    // Requirement 8.3: Validate extra price
    if (extra_price === undefined || extra_price === null) {
      throw new Error('Extra price is required');
    }
    if (typeof extra_price !== 'number') {
      throw new Error('Extra price must be a number');
    }

    const variantId = generateId();
    const timestamp = getCurrentTimestamp();

    const stmt = db.prepare(`
      INSERT INTO product_variants (id, product_id, attributes, extra_price, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    stmt.run(variantId, product_id, attributesJson, extra_price, timestamp, timestamp);

    return {
      id: variantId,
      product_id,
      attributes: attributesJson,
      extra_price,
      created_at: timestamp,
      updated_at: timestamp,
    };
  }

  /**
   * Retrieves all product variants
   * @returns Array of all product variants
   */
  findAll(): ProductVariant[] {
    const stmt = db.prepare('SELECT * FROM product_variants ORDER BY created_at DESC');
    return stmt.all() as ProductVariant[];
  }

  /**
   * Retrieves all variants for a specific product
   * @param product_id - Parent product ID
   * @returns Array of product variants
   */
  findByProductId(product_id: string): ProductVariant[] {
    if (!product_id || product_id.trim().length === 0) {
      throw new Error('Product ID is required');
    }

    const stmt = db.prepare('SELECT * FROM product_variants WHERE product_id = ? ORDER BY created_at DESC');
    return stmt.all(product_id) as ProductVariant[];
  }

  /**
   * Retrieves a product variant by ID
   * @param id - Product variant ID
   * @returns Product variant or undefined if not found
   */
  findOne(id: string): ProductVariant | undefined {
    if (!id || id.trim().length === 0) {
      throw new Error('Product variant ID is required');
    }

    const stmt = db.prepare('SELECT * FROM product_variants WHERE id = ?');
    return stmt.get(id) as ProductVariant | undefined;
  }

  /**
   * Calculates the final price of a product variant
   * Requirement 8.4: Final price = base product price + extra price
   * @param variantId - Product variant ID
   * @returns Final calculated price
   * @throws Error if variant or product not found
   */
  calculatePrice(variantId: string): number {
    const variant = this.findOne(variantId);
    if (!variant) {
      throw new Error('Product variant not found');
    }

    const productStmt = db.prepare('SELECT sales_price FROM products WHERE id = ?');
    const product = productStmt.get(variant.product_id) as { sales_price: number } | undefined;
    if (!product) {
      throw new Error('Parent product not found');
    }

    // Requirement 8.4: Calculate final price
    return product.sales_price + variant.extra_price;
  }

  /**
   * Updates an existing product variant
   * @param id - Product variant ID
   * @param updates - Partial variant data to update
   * @returns Updated product variant
   * @throws Error if variant not found or validation fails
   */
  async update(
    id: string,
    updates: Partial<Omit<ProductVariant, 'id' | 'product_id' | 'created_at' | 'updated_at'>>
  ): Promise<ProductVariant> {
    if (!id || id.trim().length === 0) {
      throw new Error('Product variant ID is required');
    }

    // Check if variant exists
    const existing = this.findOne(id);
    if (!existing) {
      throw new Error('Product variant not found');
    }

    // Validate updates
    if (updates.attributes !== undefined) {
      if (typeof updates.attributes === 'string') {
        try {
          JSON.parse(updates.attributes);
        } catch (error) {
          throw new Error('Attributes must be valid JSON string');
        }
      } else {
        throw new Error('Attributes must be a JSON string');
      }
    }

    if (updates.extra_price !== undefined) {
      if (typeof updates.extra_price !== 'number') {
        throw new Error('Extra price must be a number');
      }
    }

    // Build update query dynamically
    const fields: string[] = [];
    const values: any[] = [];

    if (updates.attributes !== undefined) {
      fields.push('attributes = ?');
      values.push(updates.attributes);
    }
    if (updates.extra_price !== undefined) {
      fields.push('extra_price = ?');
      values.push(updates.extra_price);
    }

    if (fields.length === 0) {
      // No updates provided, return existing variant
      return existing;
    }

    const timestamp = getCurrentTimestamp();
    fields.push('updated_at = ?');
    values.push(timestamp);
    values.push(id);

    const stmt = db.prepare(`UPDATE product_variants SET ${fields.join(', ')} WHERE id = ?`);
    stmt.run(...values);

    // Return updated variant
    return this.findOne(id)!;
  }

  /**
   * Deletes a product variant by ID
   * @param id - Product variant ID
   * @throws Error if variant not found
   */
  async delete(id: string): Promise<void> {
    if (!id || id.trim().length === 0) {
      throw new Error('Product variant ID is required');
    }

    // Check if variant exists
    const existing = this.findOne(id);
    if (!existing) {
      throw new Error('Product variant not found');
    }

    const stmt = db.prepare('DELETE FROM product_variants WHERE id = ?');
    stmt.run(id);
  }
}

// Export a singleton instance
export const productVariantService = new ProductVariantService();
