import db, { generateId, getCurrentTimestamp } from '../config/database';
import { Product } from '../types/models';

/**
 * ProductService handles product management operations
 * 
 * Implements Requirements:
 * - 7.1: Create, read, update, and delete products
 * - 7.2: Product name validation
 * - 7.3: Product type validation
 * - 7.4: Sales price validation
 * - 7.5: Cost price validation
 * - 7.6: Recurring pricing support
 */
export class ProductService {
  /**
   * Creates a new product
   * @param name - Product name
   * @param type - Product type
   * @param sales_price - Sales price
   * @param cost_price - Cost price
   * @param is_recurring - Whether product has recurring pricing (0 or 1)
   * @returns Created product
   * @throws Error if validation fails
   */
  async create(
    name: string,
    type: string,
    sales_price: number,
    cost_price: number,
    is_recurring: number = 0
  ): Promise<Product> {
    // Requirement 7.2: Validate product name
    if (!name || name.trim().length === 0) {
      throw new Error('Product name is required');
    }

    // Requirement 7.3: Validate product type
    if (!type || type.trim().length === 0) {
      throw new Error('Product type is required');
    }

    // Requirement 7.4: Validate sales price
    if (sales_price === undefined || sales_price === null) {
      throw new Error('Sales price is required');
    }
    if (sales_price < 0) {
      throw new Error('Sales price must be non-negative');
    }

    // Requirement 7.5: Validate cost price
    if (cost_price === undefined || cost_price === null) {
      throw new Error('Cost price is required');
    }
    if (cost_price < 0) {
      throw new Error('Cost price must be non-negative');
    }

    // Validate is_recurring value
    if (is_recurring !== 0 && is_recurring !== 1) {
      throw new Error('is_recurring must be 0 or 1');
    }

    const productId = generateId();
    const timestamp = getCurrentTimestamp();

    const stmt = db.prepare(`
      INSERT INTO products (id, name, type, sales_price, cost_price, is_recurring, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(productId, name.trim(), type.trim(), sales_price, cost_price, is_recurring, timestamp, timestamp);

    return {
      id: productId,
      name: name.trim(),
      type: type.trim(),
      sales_price,
      cost_price,
      is_recurring,
      created_at: timestamp,
      updated_at: timestamp,
    };
  }

  /**
   * Retrieves all products
   * @returns Array of all products
   */
  findAll(): Product[] {
    const stmt = db.prepare('SELECT * FROM products ORDER BY created_at DESC');
    return stmt.all() as Product[];
  }

  /**
   * Retrieves a product by ID
   * @param id - Product ID
   * @returns Product or undefined if not found
   */
  findOne(id: string): Product | undefined {
    if (!id || id.trim().length === 0) {
      throw new Error('Product ID is required');
    }

    const stmt = db.prepare('SELECT * FROM products WHERE id = ?');
    return stmt.get(id) as Product | undefined;
  }

  /**
   * Updates an existing product
   * @param id - Product ID
   * @param updates - Partial product data to update
   * @returns Updated product
   * @throws Error if product not found or validation fails
   */
  async update(id: string, updates: Partial<Omit<Product, 'id' | 'created_at' | 'updated_at'>>): Promise<Product> {
    if (!id || id.trim().length === 0) {
      throw new Error('Product ID is required');
    }

    // Check if product exists
    const existing = this.findOne(id);
    if (!existing) {
      throw new Error('Product not found');
    }

    // Validate updates
    if (updates.name !== undefined) {
      if (!updates.name || updates.name.trim().length === 0) {
        throw new Error('Product name cannot be empty');
      }
    }

    if (updates.type !== undefined) {
      if (!updates.type || updates.type.trim().length === 0) {
        throw new Error('Product type cannot be empty');
      }
    }

    if (updates.sales_price !== undefined) {
      if (updates.sales_price < 0) {
        throw new Error('Sales price must be non-negative');
      }
    }

    if (updates.cost_price !== undefined) {
      if (updates.cost_price < 0) {
        throw new Error('Cost price must be non-negative');
      }
    }

    if (updates.is_recurring !== undefined) {
      if (updates.is_recurring !== 0 && updates.is_recurring !== 1) {
        throw new Error('is_recurring must be 0 or 1');
      }
    }

    // Build update query dynamically
    const fields: string[] = [];
    const values: any[] = [];

    if (updates.name !== undefined) {
      fields.push('name = ?');
      values.push(updates.name.trim());
    }
    if (updates.type !== undefined) {
      fields.push('type = ?');
      values.push(updates.type.trim());
    }
    if (updates.sales_price !== undefined) {
      fields.push('sales_price = ?');
      values.push(updates.sales_price);
    }
    if (updates.cost_price !== undefined) {
      fields.push('cost_price = ?');
      values.push(updates.cost_price);
    }
    if (updates.is_recurring !== undefined) {
      fields.push('is_recurring = ?');
      values.push(updates.is_recurring);
    }

    if (fields.length === 0) {
      // No updates provided, return existing product
      return existing;
    }

    const timestamp = getCurrentTimestamp();
    fields.push('updated_at = ?');
    values.push(timestamp);
    values.push(id);

    const stmt = db.prepare(`UPDATE products SET ${fields.join(', ')} WHERE id = ?`);
    stmt.run(...values);

    // Return updated product
    return this.findOne(id)!;
  }

  /**
   * Deletes a product by ID
   * @param id - Product ID
   * @throws Error if product not found
   */
  async delete(id: string): Promise<void> {
    if (!id || id.trim().length === 0) {
      throw new Error('Product ID is required');
    }

    // Check if product exists
    const existing = this.findOne(id);
    if (!existing) {
      throw new Error('Product not found');
    }

    const stmt = db.prepare('DELETE FROM products WHERE id = ?');
    stmt.run(id);
  }
}

// Export a singleton instance
export const productService = new ProductService();
