import db, { generateId, getCurrentTimestamp } from '../config/database';
import { RecurringPlan } from '../types/models';

/**
 * RecurringPlanService handles recurring plan management operations
 * 
 * Implements Requirements:
 * - 9.1: Create, read, update, and delete Recurring_Plans
 * - 9.2: Support billing periods (Daily, Weekly, Monthly, Yearly)
 * - 9.3: Configure auto-close behavior
 * - 9.4: Configure closable behavior
 * - 9.5: Configure pausable behavior
 * - 9.6: Configure renewable behavior
 */
export class RecurringPlanService {
  private readonly VALID_BILLING_PERIODS = ['Daily', 'Weekly', 'Monthly', 'Yearly'];

  /**
   * Creates a new recurring plan
   * @param name - Plan name
   * @param billing_period - Billing period (Daily, Weekly, Monthly, Yearly)
   * @param auto_close - Auto-close flag (0 or 1)
   * @param closable - Closable flag (0 or 1)
   * @param pausable - Pausable flag (0 or 1)
   * @param renewable - Renewable flag (0 or 1)
   * @returns Created recurring plan
   * @throws Error if validation fails
   */
  async create(
    name: string,
    billing_period: string,
    auto_close: number = 0,
    closable: number = 1,
    pausable: number = 0,
    renewable: number = 1
  ): Promise<RecurringPlan> {
    // Validate name
    if (!name || name.trim().length === 0) {
      throw new Error('Plan name is required');
    }

    // Requirement 9.2: Validate billing period
    if (!billing_period || !this.VALID_BILLING_PERIODS.includes(billing_period)) {
      throw new Error('Billing period must be one of: Daily, Weekly, Monthly, Yearly');
    }

    // Validate boolean flags
    if (auto_close !== 0 && auto_close !== 1) {
      throw new Error('auto_close must be 0 or 1');
    }
    if (closable !== 0 && closable !== 1) {
      throw new Error('closable must be 0 or 1');
    }
    if (pausable !== 0 && pausable !== 1) {
      throw new Error('pausable must be 0 or 1');
    }
    if (renewable !== 0 && renewable !== 1) {
      throw new Error('renewable must be 0 or 1');
    }

    const planId = generateId();
    const timestamp = getCurrentTimestamp();

    const stmt = db.prepare(`
      INSERT INTO recurring_plans (id, name, billing_period, auto_close, closable, pausable, renewable, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(planId, name.trim(), billing_period, auto_close, closable, pausable, renewable, timestamp, timestamp);

    return {
      id: planId,
      name: name.trim(),
      billing_period,
      auto_close,
      closable,
      pausable,
      renewable,
      created_at: timestamp,
      updated_at: timestamp,
    };
  }

  /**
   * Retrieves all recurring plans
   * @returns Array of all recurring plans
   */
  findAll(): RecurringPlan[] {
    const stmt = db.prepare('SELECT * FROM recurring_plans ORDER BY created_at DESC');
    return stmt.all() as RecurringPlan[];
  }

  /**
   * Retrieves a recurring plan by ID
   * @param id - Plan ID
   * @returns Recurring plan or undefined if not found
   */
  findOne(id: string): RecurringPlan | undefined {
    if (!id || id.trim().length === 0) {
      throw new Error('Plan ID is required');
    }

    const stmt = db.prepare('SELECT * FROM recurring_plans WHERE id = ?');
    return stmt.get(id) as RecurringPlan | undefined;
  }

  /**
   * Updates an existing recurring plan
   * @param id - Plan ID
   * @param updates - Partial plan data to update
   * @returns Updated recurring plan
   * @throws Error if plan not found or validation fails
   */
  async update(id: string, updates: Partial<Omit<RecurringPlan, 'id' | 'created_at' | 'updated_at'>>): Promise<RecurringPlan> {
    if (!id || id.trim().length === 0) {
      throw new Error('Plan ID is required');
    }

    // Check if plan exists
    const existing = this.findOne(id);
    if (!existing) {
      throw new Error('Recurring plan not found');
    }

    // Validate updates
    if (updates.name !== undefined) {
      if (!updates.name || updates.name.trim().length === 0) {
        throw new Error('Plan name cannot be empty');
      }
    }

    if (updates.billing_period !== undefined) {
      if (!this.VALID_BILLING_PERIODS.includes(updates.billing_period)) {
        throw new Error('Billing period must be one of: Daily, Weekly, Monthly, Yearly');
      }
    }

    if (updates.auto_close !== undefined) {
      if (updates.auto_close !== 0 && updates.auto_close !== 1) {
        throw new Error('auto_close must be 0 or 1');
      }
    }

    if (updates.closable !== undefined) {
      if (updates.closable !== 0 && updates.closable !== 1) {
        throw new Error('closable must be 0 or 1');
      }
    }

    if (updates.pausable !== undefined) {
      if (updates.pausable !== 0 && updates.pausable !== 1) {
        throw new Error('pausable must be 0 or 1');
      }
    }

    if (updates.renewable !== undefined) {
      if (updates.renewable !== 0 && updates.renewable !== 1) {
        throw new Error('renewable must be 0 or 1');
      }
    }

    // Build update query dynamically
    const fields: string[] = [];
    const values: any[] = [];

    if (updates.name !== undefined) {
      fields.push('name = ?');
      values.push(updates.name.trim());
    }
    if (updates.billing_period !== undefined) {
      fields.push('billing_period = ?');
      values.push(updates.billing_period);
    }
    if (updates.auto_close !== undefined) {
      fields.push('auto_close = ?');
      values.push(updates.auto_close);
    }
    if (updates.closable !== undefined) {
      fields.push('closable = ?');
      values.push(updates.closable);
    }
    if (updates.pausable !== undefined) {
      fields.push('pausable = ?');
      values.push(updates.pausable);
    }
    if (updates.renewable !== undefined) {
      fields.push('renewable = ?');
      values.push(updates.renewable);
    }

    if (fields.length === 0) {
      // No updates provided, return existing plan
      return existing;
    }

    const timestamp = getCurrentTimestamp();
    fields.push('updated_at = ?');
    values.push(timestamp);
    values.push(id);

    const stmt = db.prepare(`UPDATE recurring_plans SET ${fields.join(', ')} WHERE id = ?`);
    stmt.run(...values);

    // Return updated plan
    return this.findOne(id)!;
  }

  /**
   * Deletes a recurring plan by ID
   * @param id - Plan ID
   * @throws Error if plan not found
   */
  async delete(id: string): Promise<void> {
    if (!id || id.trim().length === 0) {
      throw new Error('Plan ID is required');
    }

    // Check if plan exists
    const existing = this.findOne(id);
    if (!existing) {
      throw new Error('Recurring plan not found');
    }

    const stmt = db.prepare('DELETE FROM recurring_plans WHERE id = ?');
    stmt.run(id);
  }
}

// Export a singleton instance
export const recurringPlanService = new RecurringPlanService();
