import db, { generateId, getCurrentTimestamp } from '../config/database';
import { OrderLine } from '../types/models';

/**
 * OrderLineService handles order line management operations
 * 
 * Implements Requirements:
 * - 10.5: Create, update, and delete order lines
 * - 10.6: Validate required fields (product, quantity, unit price, amount)
 */
export class OrderLineService {
  /**
   * Creates a new order line
   * @param product_id - Product ID (required)
   * @param quantity - Quantity (required)
   * @param unit_price - Unit price (required)
   * @param amount - Total amount (required)
   * @param subscription_id - Optional subscription ID
   * @param invoice_id - Optional invoice ID
   * @param product_variant_id - Optional product variant ID
   * @returns Created order line
   * @throws Error if validation fails
   */
  async create(
    product_id: string,
    quantity: number,
    unit_price: number,
    amount: number,
    subscription_id?: string | null,
    invoice_id?: string | null,
    product_variant_id?: string | null
  ): Promise<OrderLine> {
    // Requirement 10.6: Validate required fields
    if (!product_id || product_id.trim().length === 0) {
      throw new Error('Product ID is required');
    }

    if (quantity === undefined || quantity === null) {
      throw new Error('Quantity is required');
    }

    if (quantity <= 0) {
      throw new Error('Quantity must be greater than 0');
    }

    if (unit_price === undefined || unit_price === null) {
      throw new Error('Unit price is required');
    }

    if (unit_price < 0) {
      throw new Error('Unit price cannot be negative');
    }

    if (amount === undefined || amount === null) {
      throw new Error('Amount is required');
    }

    if (amount < 0) {
      throw new Error('Amount cannot be negative');
    }

    // Validate product exists
    const productStmt = db.prepare('SELECT id FROM products WHERE id = ?');
    const product = productStmt.get(product_id);
    if (!product) {
      throw new Error('Product not found');
    }

    // Validate subscription if provided
    if (subscription_id) {
      const subStmt = db.prepare('SELECT id FROM subscriptions WHERE id = ?');
      const subscription = subStmt.get(subscription_id);
      if (!subscription) {
        throw new Error('Subscription not found');
      }
    }

    // Validate invoice if provided
    if (invoice_id) {
      const invStmt = db.prepare('SELECT id FROM invoices WHERE id = ?');
      const invoice = invStmt.get(invoice_id);
      if (!invoice) {
        throw new Error('Invoice not found');
      }
    }

    // Validate product variant if provided
    if (product_variant_id) {
      const variantStmt = db.prepare('SELECT id FROM product_variants WHERE id = ? AND product_id = ?');
      const variant = variantStmt.get(product_variant_id, product_id);
      if (!variant) {
        throw new Error('Product variant not found or does not belong to the specified product');
      }
    }

    const orderLineId = generateId();
    const timestamp = getCurrentTimestamp();

    const stmt = db.prepare(`
      INSERT INTO order_lines (id, subscription_id, invoice_id, product_id, product_variant_id, quantity, unit_price, amount, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      orderLineId,
      subscription_id || null,
      invoice_id || null,
      product_id,
      product_variant_id || null,
      quantity,
      unit_price,
      amount,
      timestamp,
      timestamp
    );

    return {
      id: orderLineId,
      subscription_id: subscription_id || null,
      invoice_id: invoice_id || null,
      product_id,
      product_variant_id: product_variant_id || null,
      quantity,
      unit_price,
      amount,
      created_at: timestamp,
      updated_at: timestamp,
    };
  }

  /**
   * Retrieves order lines by subscription ID
   * @param subscription_id - Subscription ID
   * @returns Array of order lines
   */
  findBySubscription(subscription_id: string): OrderLine[] {
    if (!subscription_id || subscription_id.trim().length === 0) {
      throw new Error('Subscription ID is required');
    }

    const stmt = db.prepare('SELECT * FROM order_lines WHERE subscription_id = ? ORDER BY created_at DESC');
    return stmt.all(subscription_id) as OrderLine[];
  }

  /**
   * Retrieves order lines by invoice ID
   * @param invoice_id - Invoice ID
   * @returns Array of order lines
   */
  findByInvoice(invoice_id: string): OrderLine[] {
    if (!invoice_id || invoice_id.trim().length === 0) {
      throw new Error('Invoice ID is required');
    }

    const stmt = db.prepare('SELECT * FROM order_lines WHERE invoice_id = ? ORDER BY created_at DESC');
    return stmt.all(invoice_id) as OrderLine[];
  }

  /**
   * Retrieves an order line by ID
   * @param id - Order line ID
   * @returns Order line or undefined if not found
   */
  findOne(id: string): OrderLine | undefined {
    if (!id || id.trim().length === 0) {
      throw new Error('Order line ID is required');
    }

    const stmt = db.prepare('SELECT * FROM order_lines WHERE id = ?');
    return stmt.get(id) as OrderLine | undefined;
  }

  /**
   * Updates an existing order line
   * @param id - Order line ID
   * @param updates - Partial order line data to update
   * @returns Updated order line
   * @throws Error if order line not found or validation fails
   */
  async update(
    id: string,
    updates: Partial<Omit<OrderLine, 'id' | 'created_at' | 'updated_at'>>
  ): Promise<OrderLine> {
    if (!id || id.trim().length === 0) {
      throw new Error('Order line ID is required');
    }

    // Check if order line exists
    const existing = this.findOne(id);
    if (!existing) {
      throw new Error('Order line not found');
    }

    // Validate updates
    if (updates.quantity !== undefined) {
      if (updates.quantity <= 0) {
        throw new Error('Quantity must be greater than 0');
      }
    }

    if (updates.unit_price !== undefined) {
      if (updates.unit_price < 0) {
        throw new Error('Unit price cannot be negative');
      }
    }

    if (updates.amount !== undefined) {
      if (updates.amount < 0) {
        throw new Error('Amount cannot be negative');
      }
    }

    if (updates.product_id !== undefined) {
      const productStmt = db.prepare('SELECT id FROM products WHERE id = ?');
      const product = productStmt.get(updates.product_id);
      if (!product) {
        throw new Error('Product not found');
      }
    }

    if (updates.product_variant_id !== undefined && updates.product_variant_id !== null) {
      const productId = updates.product_id || existing.product_id;
      const variantStmt = db.prepare('SELECT id FROM product_variants WHERE id = ? AND product_id = ?');
      const variant = variantStmt.get(updates.product_variant_id, productId);
      if (!variant) {
        throw new Error('Product variant not found or does not belong to the specified product');
      }
    }

    // Build update query dynamically
    const fields: string[] = [];
    const values: any[] = [];

    if (updates.product_id !== undefined) {
      fields.push('product_id = ?');
      values.push(updates.product_id);
    }
    if (updates.product_variant_id !== undefined) {
      fields.push('product_variant_id = ?');
      values.push(updates.product_variant_id);
    }
    if (updates.quantity !== undefined) {
      fields.push('quantity = ?');
      values.push(updates.quantity);
    }
    if (updates.unit_price !== undefined) {
      fields.push('unit_price = ?');
      values.push(updates.unit_price);
    }
    if (updates.amount !== undefined) {
      fields.push('amount = ?');
      values.push(updates.amount);
    }

    if (fields.length === 0) {
      // No updates provided, return existing order line
      return existing;
    }

    const timestamp = getCurrentTimestamp();
    fields.push('updated_at = ?');
    values.push(timestamp);
    values.push(id);

    const stmt = db.prepare(`UPDATE order_lines SET ${fields.join(', ')} WHERE id = ?`);
    stmt.run(...values);

    // Return updated order line
    return this.findOne(id)!;
  }

  /**
   * Deletes an order line by ID
   * @param id - Order line ID
   * @throws Error if order line not found
   */
  async delete(id: string): Promise<void> {
    if (!id || id.trim().length === 0) {
      throw new Error('Order line ID is required');
    }

    // Check if order line exists
    const existing = this.findOne(id);
    if (!existing) {
      throw new Error('Order line not found');
    }

    const stmt = db.prepare('DELETE FROM order_lines WHERE id = ?');
    stmt.run(id);
  }

  /**
   * Associates taxes with an order line
   * @param order_line_id - Order line ID
   * @param tax_ids - Array of tax IDs
   * @throws Error if validation fails
   */
  async associateTaxes(order_line_id: string, tax_ids: string[]): Promise<void> {
    if (!order_line_id || order_line_id.trim().length === 0) {
      throw new Error('Order line ID is required');
    }

    // Check if order line exists
    const existing = this.findOne(order_line_id);
    if (!existing) {
      throw new Error('Order line not found');
    }

    // Validate all tax IDs exist
    for (const tax_id of tax_ids) {
      const taxStmt = db.prepare('SELECT id FROM taxes WHERE id = ?');
      const tax = taxStmt.get(tax_id);
      if (!tax) {
        throw new Error(`Tax with ID ${tax_id} not found`);
      }
    }

    // Remove existing tax associations
    const deleteStmt = db.prepare('DELETE FROM order_line_taxes WHERE order_line_id = ?');
    deleteStmt.run(order_line_id);

    // Add new tax associations
    const insertStmt = db.prepare('INSERT INTO order_line_taxes (order_line_id, tax_id) VALUES (?, ?)');
    for (const tax_id of tax_ids) {
      insertStmt.run(order_line_id, tax_id);
    }
  }

  /**
   * Retrieves taxes associated with an order line
   * @param order_line_id - Order line ID
   * @returns Array of tax IDs
   */
  getTaxes(order_line_id: string): string[] {
    if (!order_line_id || order_line_id.trim().length === 0) {
      throw new Error('Order line ID is required');
    }

    const stmt = db.prepare('SELECT tax_id FROM order_line_taxes WHERE order_line_id = ?');
    const results = stmt.all(order_line_id) as { tax_id: string }[];
    return results.map((r) => r.tax_id);
  }
}

// Export a singleton instance
export const orderLineService = new OrderLineService();
