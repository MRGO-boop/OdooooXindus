import db, { generateId, getCurrentTimestamp } from '../config/database';
import { Subscription } from '../types/models';

/**
 * SubscriptionService handles subscription management operations
 * 
 * Implements Requirements:
 * - 10.1: Create, read, update, and delete subscriptions
 * - 10.2: Initialize new subscriptions with Draft status
 * - 10.3: Support status transitions (Draft → Quotation → Confirmed → Active → Closed)
 * - 10.4: Validate status transition flow
 */
export class SubscriptionService {
  private readonly VALID_STATUSES = ['Draft', 'Quotation', 'Confirmed', 'Active', 'Closed'];
  private readonly STATUS_TRANSITIONS: Record<string, string[]> = {
    Draft: ['Quotation'],
    Quotation: ['Confirmed'],
    Confirmed: ['Active'],
    Active: ['Closed'],
    Closed: [],
  };

  /**
   * Creates a new subscription
   * @param user_id - User ID
   * @param recurring_plan_id - Optional recurring plan ID
   * @param start_date - Optional start date
   * @param end_date - Optional end date
   * @returns Created subscription
   * @throws Error if validation fails
   */
  async create(
    user_id: string,
    recurring_plan_id?: string | null,
    start_date?: string | null,
    end_date?: string | null
  ): Promise<Subscription> {
    // Validate user_id
    if (!user_id || user_id.trim().length === 0) {
      throw new Error('User ID is required');
    }

    // Validate recurring_plan_id if provided
    if (recurring_plan_id) {
      const planStmt = db.prepare('SELECT id FROM recurring_plans WHERE id = ?');
      const plan = planStmt.get(recurring_plan_id);
      if (!plan) {
        throw new Error('Recurring plan not found');
      }
    }

    const subscriptionId = generateId();
    const timestamp = getCurrentTimestamp();

    // Requirement 10.2: Initialize with Draft status
    const stmt = db.prepare(`
      INSERT INTO subscriptions (id, user_id, recurring_plan_id, status, start_date, end_date, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      subscriptionId,
      user_id,
      recurring_plan_id || null,
      'Draft',
      start_date || null,
      end_date || null,
      timestamp,
      timestamp
    );

    return {
      id: subscriptionId,
      user_id,
      recurring_plan_id: recurring_plan_id || null,
      status: 'Draft',
      start_date: start_date || null,
      end_date: end_date || null,
      created_at: timestamp,
      updated_at: timestamp,
    };
  }

  /**
   * Retrieves all subscriptions
   * @param user_id - Optional user ID to filter by (for Portal_User)
   * @returns Array of all subscriptions
   */
  findAll(user_id?: string): Subscription[] {
    let stmt;
    if (user_id) {
      stmt = db.prepare('SELECT * FROM subscriptions WHERE user_id = ? ORDER BY created_at DESC');
      return stmt.all(user_id) as Subscription[];
    } else {
      stmt = db.prepare('SELECT * FROM subscriptions ORDER BY created_at DESC');
      return stmt.all() as Subscription[];
    }
  }

  /**
   * Retrieves a subscription by ID
   * @param id - Subscription ID
   * @param user_id - Optional user ID to verify ownership (for Portal_User)
   * @returns Subscription or undefined if not found
   */
  findOne(id: string, user_id?: string): Subscription | undefined {
    if (!id || id.trim().length === 0) {
      throw new Error('Subscription ID is required');
    }

    let stmt;
    if (user_id) {
      stmt = db.prepare('SELECT * FROM subscriptions WHERE id = ? AND user_id = ?');
      return stmt.get(id, user_id) as Subscription | undefined;
    } else {
      stmt = db.prepare('SELECT * FROM subscriptions WHERE id = ?');
      return stmt.get(id) as Subscription | undefined;
    }
  }

  /**
   * Updates an existing subscription
   * @param id - Subscription ID
   * @param updates - Partial subscription data to update
   * @param user_id - Optional user ID to verify ownership (for Portal_User)
   * @returns Updated subscription
   * @throws Error if subscription not found or validation fails
   */
  async update(
    id: string,
    updates: Partial<Omit<Subscription, 'id' | 'created_at' | 'updated_at'>>,
    user_id?: string
  ): Promise<Subscription> {
    if (!id || id.trim().length === 0) {
      throw new Error('Subscription ID is required');
    }

    // Check if subscription exists
    const existing = this.findOne(id, user_id);
    if (!existing) {
      throw new Error('Subscription not found');
    }

    // Requirement 10.4: Validate status transition
    if (updates.status !== undefined) {
      if (!this.VALID_STATUSES.includes(updates.status)) {
        throw new Error(`Invalid status. Must be one of: ${this.VALID_STATUSES.join(', ')}`);
      }

      const allowedTransitions = this.STATUS_TRANSITIONS[existing.status];
      if (!allowedTransitions.includes(updates.status)) {
        throw new Error(
          `Invalid status transition from ${existing.status} to ${updates.status}. Allowed transitions: ${allowedTransitions.join(', ') || 'none'}`
        );
      }
    }

    // Validate recurring_plan_id if provided
    if (updates.recurring_plan_id !== undefined && updates.recurring_plan_id !== null) {
      const planStmt = db.prepare('SELECT id FROM recurring_plans WHERE id = ?');
      const plan = planStmt.get(updates.recurring_plan_id);
      if (!plan) {
        throw new Error('Recurring plan not found');
      }
    }

    // Build update query dynamically
    const fields: string[] = [];
    const values: any[] = [];

    if (updates.recurring_plan_id !== undefined) {
      fields.push('recurring_plan_id = ?');
      values.push(updates.recurring_plan_id);
    }
    if (updates.status !== undefined) {
      fields.push('status = ?');
      values.push(updates.status);
    }
    if (updates.start_date !== undefined) {
      fields.push('start_date = ?');
      values.push(updates.start_date);
    }
    if (updates.end_date !== undefined) {
      fields.push('end_date = ?');
      values.push(updates.end_date);
    }

    if (fields.length === 0) {
      // No updates provided, return existing subscription
      return existing;
    }

    const timestamp = getCurrentTimestamp();
    fields.push('updated_at = ?');
    values.push(timestamp);
    values.push(id);

    const stmt = db.prepare(`UPDATE subscriptions SET ${fields.join(', ')} WHERE id = ?`);
    stmt.run(...values);

    // Return updated subscription
    return this.findOne(id, user_id)!;
  }

  /**
   * Deletes a subscription by ID
   * @param id - Subscription ID
   * @param user_id - Optional user ID to verify ownership (for Portal_User)
   * @throws Error if subscription not found
   */
  async delete(id: string, user_id?: string): Promise<void> {
    if (!id || id.trim().length === 0) {
      throw new Error('Subscription ID is required');
    }

    // Check if subscription exists
    const existing = this.findOne(id, user_id);
    if (!existing) {
      throw new Error('Subscription not found');
    }

    const stmt = db.prepare('DELETE FROM subscriptions WHERE id = ?');
    stmt.run(id);
  }
}

// Export a singleton instance
export const subscriptionService = new SubscriptionService();
