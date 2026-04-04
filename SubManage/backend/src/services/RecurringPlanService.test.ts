import { RecurringPlanService } from './RecurringPlanService';
import db from '../config/database';

describe('RecurringPlanService', () => {
  let recurringPlanService: RecurringPlanService;

  beforeEach(() => {
    recurringPlanService = new RecurringPlanService();
    // Clean up recurring_plans table before each test
    db.exec('DELETE FROM recurring_plans');
  });

  afterAll(() => {
    // Clean up after all tests
    db.exec('DELETE FROM recurring_plans');
  });

  describe('create', () => {
    it('should create a recurring plan with valid data', async () => {
      const plan = await recurringPlanService.create(
        'Monthly Plan',
        'Monthly',
        0,
        1,
        0,
        1
      );

      expect(plan).toBeDefined();
      expect(plan.id).toBeDefined();
      expect(plan.name).toBe('Monthly Plan');
      expect(plan.billing_period).toBe('Monthly');
      expect(plan.auto_close).toBe(0);
      expect(plan.closable).toBe(1);
      expect(plan.pausable).toBe(0);
      expect(plan.renewable).toBe(1);
      expect(plan.created_at).toBeDefined();
      expect(plan.updated_at).toBeDefined();
    });

    it('should create a plan with default values', async () => {
      const plan = await recurringPlanService.create('Weekly Plan', 'Weekly');

      expect(plan.auto_close).toBe(0);
      expect(plan.closable).toBe(1);
      expect(plan.pausable).toBe(0);
      expect(plan.renewable).toBe(1);
    });

    it('should support all billing periods', async () => {
      const daily = await recurringPlanService.create('Daily Plan', 'Daily');
      const weekly = await recurringPlanService.create('Weekly Plan', 'Weekly');
      const monthly = await recurringPlanService.create('Monthly Plan', 'Monthly');
      const yearly = await recurringPlanService.create('Yearly Plan', 'Yearly');

      expect(daily.billing_period).toBe('Daily');
      expect(weekly.billing_period).toBe('Weekly');
      expect(monthly.billing_period).toBe('Monthly');
      expect(yearly.billing_period).toBe('Yearly');
    });

    it('should throw error when name is missing', async () => {
      await expect(
        recurringPlanService.create('', 'Monthly')
      ).rejects.toThrow('Plan name is required');
    });

    it('should throw error when billing_period is invalid', async () => {
      await expect(
        recurringPlanService.create('Test Plan', 'InvalidPeriod')
      ).rejects.toThrow('Billing period must be one of: Daily, Weekly, Monthly, Yearly');
    });

    it('should throw error when auto_close is invalid', async () => {
      await expect(
        recurringPlanService.create('Test Plan', 'Monthly', 2)
      ).rejects.toThrow('auto_close must be 0 or 1');
    });

    it('should throw error when closable is invalid', async () => {
      await expect(
        recurringPlanService.create('Test Plan', 'Monthly', 0, 3)
      ).rejects.toThrow('closable must be 0 or 1');
    });

    it('should throw error when pausable is invalid', async () => {
      await expect(
        recurringPlanService.create('Test Plan', 'Monthly', 0, 1, -1)
      ).rejects.toThrow('pausable must be 0 or 1');
    });

    it('should throw error when renewable is invalid', async () => {
      await expect(
        recurringPlanService.create('Test Plan', 'Monthly', 0, 1, 0, 5)
      ).rejects.toThrow('renewable must be 0 or 1');
    });

    it('should trim whitespace from name', async () => {
      const plan = await recurringPlanService.create('  Test Plan  ', 'Monthly');
      expect(plan.name).toBe('Test Plan');
    });
  });

  describe('findAll', () => {
    it('should return empty array when no plans exist', () => {
      const plans = recurringPlanService.findAll();
      expect(plans).toEqual([]);
    });

    it('should return all recurring plans', async () => {
      await recurringPlanService.create('Plan 1', 'Monthly');
      await recurringPlanService.create('Plan 2', 'Yearly');

      const plans = recurringPlanService.findAll();
      expect(plans).toHaveLength(2);
      expect(plans[0].name).toBe('Plan 2'); // Most recent first
      expect(plans[1].name).toBe('Plan 1');
    });
  });

  describe('findOne', () => {
    it('should return plan by ID', async () => {
      const created = await recurringPlanService.create('Test Plan', 'Monthly');
      const found = recurringPlanService.findOne(created.id);

      expect(found).toBeDefined();
      expect(found?.id).toBe(created.id);
      expect(found?.name).toBe('Test Plan');
    });

    it('should return undefined for non-existent ID', () => {
      const found = recurringPlanService.findOne('non-existent-id');
      expect(found).toBeUndefined();
    });

    it('should throw error when ID is empty', () => {
      expect(() => recurringPlanService.findOne('')).toThrow('Plan ID is required');
    });
  });

  describe('update', () => {
    it('should update plan name', async () => {
      const created = await recurringPlanService.create('Original Name', 'Monthly');
      const updated = await recurringPlanService.update(created.id, { name: 'Updated Name' });

      expect(updated.name).toBe('Updated Name');
      expect(updated.billing_period).toBe('Monthly');
      expect(updated.updated_at).not.toBe(created.updated_at);
    });

    it('should update multiple fields', async () => {
      const created = await recurringPlanService.create('Plan', 'Monthly');
      const updated = await recurringPlanService.update(created.id, {
        name: 'New Name',
        billing_period: 'Yearly',
        auto_close: 1,
        closable: 0,
        pausable: 1,
        renewable: 0,
      });

      expect(updated.name).toBe('New Name');
      expect(updated.billing_period).toBe('Yearly');
      expect(updated.auto_close).toBe(1);
      expect(updated.closable).toBe(0);
      expect(updated.pausable).toBe(1);
      expect(updated.renewable).toBe(0);
    });

    it('should throw error when plan not found', async () => {
      await expect(
        recurringPlanService.update('non-existent-id', { name: 'New Name' })
      ).rejects.toThrow('Recurring plan not found');
    });

    it('should throw error when updating name to empty', async () => {
      const created = await recurringPlanService.create('Plan', 'Monthly');
      await expect(
        recurringPlanService.update(created.id, { name: '' })
      ).rejects.toThrow('Plan name cannot be empty');
    });

    it('should throw error when updating billing_period to invalid value', async () => {
      const created = await recurringPlanService.create('Plan', 'Monthly');
      await expect(
        recurringPlanService.update(created.id, { billing_period: 'Invalid' as any })
      ).rejects.toThrow('Billing period must be one of: Daily, Weekly, Monthly, Yearly');
    });

    it('should throw error when updating auto_close to invalid value', async () => {
      const created = await recurringPlanService.create('Plan', 'Monthly');
      await expect(
        recurringPlanService.update(created.id, { auto_close: 2 })
      ).rejects.toThrow('auto_close must be 0 or 1');
    });

    it('should return existing plan when no updates provided', async () => {
      const created = await recurringPlanService.create('Plan', 'Monthly');
      const updated = await recurringPlanService.update(created.id, {});

      expect(updated).toEqual(created);
    });
  });

  describe('delete', () => {
    it('should delete plan by ID', async () => {
      const created = await recurringPlanService.create('Plan', 'Monthly');
      await recurringPlanService.delete(created.id);

      const found = recurringPlanService.findOne(created.id);
      expect(found).toBeUndefined();
    });

    it('should throw error when plan not found', async () => {
      await expect(
        recurringPlanService.delete('non-existent-id')
      ).rejects.toThrow('Recurring plan not found');
    });

    it('should throw error when ID is empty', async () => {
      await expect(
        recurringPlanService.delete('')
      ).rejects.toThrow('Plan ID is required');
    });
  });
});
