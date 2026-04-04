import db, { generateId, getCurrentTimestamp } from '../config/database';
import { QuotationTemplate, Subscription } from '../types/models';
import { SubscriptionService } from './SubscriptionService';
import { OrderLineService } from './OrderLineService';

/**
 * QuotationTemplateService handles quotation template management operations
 * 
 * Implements Requirements:
 * - 11.1: Create, read, update, and delete quotation templates
 * - 11.2: Store predefined products and pricing
 * - 11.3: Create subscriptions from templates
 */

export interface TemplateOrderLine {
  product_id: string;
  product_variant_id?: string | null;
  quantity: number;
  unit_price: number;
  amount: number;
  tax_ids?: string[];
}

export interface TemplateData {
  recurring_plan_id?: string | null;
  order_lines: TemplateOrderLine[];
}

export class QuotationTemplateService {
  private subscriptionService: SubscriptionService;
  private orderLineService: OrderLineService;

  constructor(subscriptionService?: SubscriptionService, orderLineService?: OrderLineService) {
    this.subscriptionService = subscriptionService || new SubscriptionService();
    this.orderLineService = orderLineService || new OrderLineService();
  }

  /**
   * Creates a new quotation template
   * @param name - Template name
   * @param template_data - Template data as object (will be stringified)
   * @param description - Optional description
   * @returns Created quotation template
   * @throws Error if validation fails
   */
  async create(
    name: string,
    template_data: TemplateData,
    description?: string | null
  ): Promise<QuotationTemplate> {
    // Validate name
    if (!name || name.trim().length === 0) {
      throw new Error('Template name is required');
    }

    // Validate template_data
    if (!template_data || typeof template_data !== 'object') {
      throw new Error('Template data is required and must be an object');
    }

    if (!template_data.order_lines || !Array.isArray(template_data.order_lines)) {
      throw new Error('Template data must include order_lines array');
    }

    if (template_data.order_lines.length === 0) {
      throw new Error('Template must include at least one order line');
    }

    // Validate each order line
    for (const line of template_data.order_lines) {
      if (!line.product_id) {
        throw new Error('Each order line must have a product_id');
      }
      if (line.quantity === undefined || line.quantity <= 0) {
        throw new Error('Each order line must have a quantity greater than 0');
      }
      if (line.unit_price === undefined || line.unit_price < 0) {
        throw new Error('Each order line must have a non-negative unit_price');
      }
      if (line.amount === undefined || line.amount < 0) {
        throw new Error('Each order line must have a non-negative amount');
      }
    }

    // Validate recurring_plan_id if provided
    if (template_data.recurring_plan_id) {
      const planStmt = db.prepare('SELECT id FROM recurring_plans WHERE id = ?');
      const plan = planStmt.get(template_data.recurring_plan_id);
      if (!plan) {
        throw new Error('Recurring plan not found');
      }
    }

    const templateId = generateId();
    const timestamp = getCurrentTimestamp();

    // Requirement 11.2: Store as JSON string
    const templateDataString = JSON.stringify(template_data);

    const stmt = db.prepare(`
      INSERT INTO quotation_templates (id, name, description, template_data, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    stmt.run(templateId, name.trim(), description || null, templateDataString, timestamp, timestamp);

    return {
      id: templateId,
      name: name.trim(),
      description: description || null,
      template_data: templateDataString,
      created_at: timestamp,
      updated_at: timestamp,
    };
  }

  /**
   * Retrieves all quotation templates
   * @returns Array of all quotation templates
   */
  findAll(): QuotationTemplate[] {
    const stmt = db.prepare('SELECT * FROM quotation_templates ORDER BY created_at DESC');
    return stmt.all() as QuotationTemplate[];
  }

  /**
   * Retrieves a quotation template by ID
   * @param id - Template ID
   * @returns Quotation template or undefined if not found
   */
  findOne(id: string): QuotationTemplate | undefined {
    if (!id || id.trim().length === 0) {
      throw new Error('Template ID is required');
    }

    const stmt = db.prepare('SELECT * FROM quotation_templates WHERE id = ?');
    return stmt.get(id) as QuotationTemplate | undefined;
  }

  /**
   * Updates an existing quotation template
   * @param id - Template ID
   * @param updates - Partial template data to update
   * @returns Updated quotation template
   * @throws Error if template not found or validation fails
   */
  async update(
    id: string,
    updates: Partial<Omit<QuotationTemplate, 'id' | 'created_at' | 'updated_at'>>
  ): Promise<QuotationTemplate> {
    if (!id || id.trim().length === 0) {
      throw new Error('Template ID is required');
    }

    // Check if template exists
    const existing = this.findOne(id);
    if (!existing) {
      throw new Error('Quotation template not found');
    }

    // Validate updates
    if (updates.name !== undefined) {
      if (!updates.name || updates.name.trim().length === 0) {
        throw new Error('Template name cannot be empty');
      }
    }

    if (updates.template_data !== undefined) {
      // If template_data is provided as string, validate it's valid JSON
      let parsedData: TemplateData;
      try {
        parsedData = typeof updates.template_data === 'string' 
          ? JSON.parse(updates.template_data) 
          : updates.template_data;
      } catch (error) {
        throw new Error('Template data must be valid JSON');
      }

      if (!parsedData.order_lines || !Array.isArray(parsedData.order_lines)) {
        throw new Error('Template data must include order_lines array');
      }

      if (parsedData.order_lines.length === 0) {
        throw new Error('Template must include at least one order line');
      }
    }

    // Build update query dynamically
    const fields: string[] = [];
    const values: any[] = [];

    if (updates.name !== undefined) {
      fields.push('name = ?');
      values.push(updates.name.trim());
    }
    if (updates.description !== undefined) {
      fields.push('description = ?');
      values.push(updates.description);
    }
    if (updates.template_data !== undefined) {
      fields.push('template_data = ?');
      const dataString = typeof updates.template_data === 'string' 
        ? updates.template_data 
        : JSON.stringify(updates.template_data);
      values.push(dataString);
    }

    if (fields.length === 0) {
      // No updates provided, return existing template
      return existing;
    }

    const timestamp = getCurrentTimestamp();
    fields.push('updated_at = ?');
    values.push(timestamp);
    values.push(id);

    const stmt = db.prepare(`UPDATE quotation_templates SET ${fields.join(', ')} WHERE id = ?`);
    stmt.run(...values);

    // Return updated template
    return this.findOne(id)!;
  }

  /**
   * Deletes a quotation template by ID
   * @param id - Template ID
   * @throws Error if template not found
   */
  async delete(id: string): Promise<void> {
    if (!id || id.trim().length === 0) {
      throw new Error('Template ID is required');
    }

    // Check if template exists
    const existing = this.findOne(id);
    if (!existing) {
      throw new Error('Quotation template not found');
    }

    const stmt = db.prepare('DELETE FROM quotation_templates WHERE id = ?');
    stmt.run(id);
  }

  /**
   * Creates a subscription from a quotation template
   * Requirement 11.3: Populate subscription with template data
   * @param template_id - Template ID
   * @param user_id - User ID for the subscription
   * @param start_date - Optional start date
   * @param end_date - Optional end date
   * @returns Created subscription with order lines
   * @throws Error if template not found or validation fails
   */
  async createSubscriptionFromTemplate(
    template_id: string,
    user_id: string,
    start_date?: string | null,
    end_date?: string | null
  ): Promise<Subscription> {
    // Validate template exists
    const template = this.findOne(template_id);
    if (!template) {
      throw new Error('Quotation template not found');
    }

    // Parse template data
    let templateData: TemplateData;
    try {
      templateData = JSON.parse(template.template_data);
    } catch (error) {
      throw new Error('Invalid template data format');
    }

    // Create subscription
    const subscription = await this.subscriptionService.create(
      user_id,
      templateData.recurring_plan_id || null,
      start_date,
      end_date
    );

    // Create order lines from template
    for (const lineData of templateData.order_lines) {
      const orderLine = await this.orderLineService.create(
        lineData.product_id,
        lineData.quantity,
        lineData.unit_price,
        lineData.amount,
        subscription.id,
        null,
        lineData.product_variant_id || null
      );

      // Associate taxes if provided
      if (lineData.tax_ids && lineData.tax_ids.length > 0) {
        await this.orderLineService.associateTaxes(orderLine.id, lineData.tax_ids);
      }
    }

    return subscription;
  }
}

// Export a singleton instance
export const quotationTemplateService = new QuotationTemplateService();
