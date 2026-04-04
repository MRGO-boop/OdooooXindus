import { SubscriptionService } from './SubscriptionService';
import { RecurringPlanService } from './RecurringPlanService';
import { UserService } from './UserService';
import db from '../config/database';

describe('SubscriptionService', () => {
  let subscriptionService: SubscriptionService;
  let recurringPlanService: RecurringPlanService;
  let userService: UserService;
  let testUserId: string;
  let testPlanId: string;

  beforeEach(async () => {
    subscriptionService = new SubscriptionService();
    recurringPlanService = new RecurringPlanService();
    userService = new UserService();

    // Clean up tables
    db.exec('DELETE FROM subscriptions');
    db.exec('DELETE FROM recurring_plans');
    db.exec('DELETE FROM users');

    // Create test user
    const user = await userService.create('test@example.com', 'Password123!', 'Portal_User');
    testUserId = user.id;

    // Create test recurring plan
    const plan = await recurringPlanService.create('Test Plan', 'Monthly');
    testPlanId = plan.id;
  });

  afterAll(() => {
    db.exec('DELETE FROM subscriptions');
    db.exec('DELETE FROM recurring_plans');
    db.exec('DELETE FROM users');
  });

  describe('create', () => {
    it('should create a subscription with Draft status', async () => {
      const subscription = await subscriptionService.create(testUserId);

      expect(subscription).toBeDefined();
      expect(subscription.id).toBeDefined();
      expect(subscription.user_id).toBe(testUserId);
      expect(subscription.status).toBe('Draft');
      expect(subscription.recurring_plan_id).toBeNull();
      expect(subscription.start_date).toBeNull();
      expect(subscription.end_date).toBeNull();
      expect(subscription.created_at).toBeDefined();
      expect(subscription.updated_at).toBeDefined();
    });

    it('should create a subscription with recurring plan', async () => {
      const subscription = await subscriptionService.create(testUserId, testPlanId);

      expect(subscription.recurring_plan_id).toBe(testPlanId);
    });

    it('should create a subscription with dates', async () => {
      const startDate = '2024-01-01T00:00:00.000Z';
      const endDate = '2024-12-31T23:59:59.999Z';

      const subscription = await subscriptionService.create(
        testUserId,
        testPlanId,
        startDate,
        endDate
      );

      expect(subscription.start_date).toBe(startDate);
      expect(subscription.end_date).toBe(endDate);
    });

    it('should throw error when user_id is missing', async () => {
      await expect(subscriptionService.create('')).rejects.toThrow('User ID is required');
    });

    it('should throw error when recurring_plan_id does not exist', async () => {
      await expect(
        subscriptionService.create(testUserId, 'non-existent-plan')
      ).rejects.toThrow('Recurring plan not found');
    });
  });

  describe('findAll', () => {
    it('should return empty array when no subscriptions exist', () => {
      const subscriptions = subscriptionService.findAll();
      expect(subscriptions).toEqual([]);
    });

    it('should return all subscriptions', async () => {
      await subscriptionService.create(testUserId);
      await subscriptionService.create(testUserId);

      const subscriptions = subscriptionService.findAll();
      expect(subscriptions).toHaveLength(2);
    });

    it('should filter by user_id when provided', async () => {
      const user2 = await userService.create('user2@example.com', 'Password123!', 'Portal_User');

      await subscriptionService.create(testUserId);
      await subscriptionService.create(user2.id);

      const subscriptions = subscriptionService.findAll(testUserId);
      expect(subscriptions).toHaveLength(1);
      expect(subscriptions[0].user_id).toBe(testUserId);
    });
  });

  describe('findOne', () => {
    it('should return subscription by ID', async () => {
      const created = await subscriptionService.create(testUserId);
      const found = subscriptionService.findOne(created.id);

      expect(found).toBeDefined();
      expect(found?.id).toBe(created.id);
    });

    it('should return undefined for non-existent ID', () => {
      const found = subscriptionService.findOne('non-existent-id');
      expect(found).toBeUndefined();
    });

    it('should filter by user_id when provided', async () => {
      const user2 = await userService.create('user2@example.com', 'Password123!', 'Portal_User');
      const subscription = await subscriptionService.create(user2.id);

      const found = subscriptionService.findOne(subscription.id, testUserId);
      expect(found).toBeUndefined();
    });

    it('should throw error when ID is empty', () => {
      expect(() => subscriptionService.findOne('')).toThrow('Subscription ID is required');
    });
  });

  describe('update', () => {
    it('should update subscription status from Draft to Quotation', async () => {
      const created = await subscriptionService.create(testUserId);
      const updated = await subscriptionService.update(created.id, { status: 'Quotation' });

      expect(updated.status).toBe('Quotation');
    });

    it('should update subscription through all status transitions', async () => {
      const created = await subscriptionService.create(testUserId);

      const quotation = await subscriptionService.update(created.id, { status: 'Quotation' });
      expect(quotation.status).toBe('Quotation');

      const confirmed = await subscriptionService.update(created.id, { status: 'Confirmed' });
      expect(confirmed.status).toBe('Confirmed');

      const active = await subscriptionService.update(created.id, { status: 'Active' });
      expect(active.status).toBe('Active');

      const closed = await subscriptionService.update(created.id, { status: 'Closed' });
      expect(closed.status).toBe('Closed');
    });

    it('should throw error for invalid status transition', async () => {
      const created = await subscriptionService.create(testUserId);

      await expect(
        subscriptionService.update(created.id, { status: 'Active' })
      ).rejects.toThrow('Invalid status transition from Draft to Active');
    });

    it('should throw error for invalid status', async () => {
      const created = await subscriptionService.create(testUserId);

      await expect(
        subscriptionService.update(created.id, { status: 'InvalidStatus' as any })
      ).rejects.toThrow('Invalid status');
    });

    it('should update recurring_plan_id', async () => {
      const created = await subscriptionService.create(testUserId);
      const updated = await subscriptionService.update(created.id, {
        recurring_plan_id: testPlanId,
      });

      expect(updated.recurring_plan_id).toBe(testPlanId);
    });

    it('should update dates', async () => {
      const created = await subscriptionService.create(testUserId);
      const startDate = '2024-01-01T00:00:00.000Z';
      const endDate = '2024-12-31T23:59:59.999Z';

      const updated = await subscriptionService.update(created.id, {
        start_date: startDate,
        end_date: endDate,
      });

      expect(updated.start_date).toBe(startDate);
      expect(updated.end_date).toBe(endDate);
    });

    it('should throw error when subscription not found', async () => {
      await expect(
        subscriptionService.update('non-existent-id', { status: 'Quotation' })
      ).rejects.toThrow('Subscription not found');
    });

    it('should throw error when recurring_plan_id does not exist', async () => {
      const created = await subscriptionService.create(testUserId);

      await expect(
        subscriptionService.update(created.id, { recurring_plan_id: 'non-existent-plan' })
      ).rejects.toThrow('Recurring plan not found');
    });

    it('should return existing subscription when no updates provided', async () => {
      const created = await subscriptionService.create(testUserId);
      const updated = await subscriptionService.update(created.id, {});

      expect(updated).toEqual(created);
    });
  });

  describe('delete', () => {
    it('should delete subscription by ID', async () => {
      const created = await subscriptionService.create(testUserId);
      await subscriptionService.delete(created.id);

      const found = subscriptionService.findOne(created.id);
      expect(found).toBeUndefined();
    });

    it('should throw error when subscription not found', async () => {
      await expect(subscriptionService.delete('non-existent-id')).rejects.toThrow(
        'Subscription not found'
      );
    });

    it('should throw error when ID is empty', async () => {
      await expect(subscriptionService.delete('')).rejects.toThrow('Subscription ID is required');
    });
  });
});
