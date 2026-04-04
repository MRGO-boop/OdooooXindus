import request from 'supertest';
import express, { Express } from 'express';
import { RecurringPlanController } from './recurring-plan.controller';
import { RecurringPlanService } from '../services/RecurringPlanService';
import { AuthService } from '../services/AuthService';
import { userService } from '../services/UserService';
import db from '../config/database';

describe('RecurringPlanController', () => {
  let app: Express;
  let authToken: string;
  let recurringPlanService: RecurringPlanService;

  beforeAll(async () => {
    // Clean up and create test user
    db.exec('DELETE FROM users');
    db.exec('DELETE FROM recurring_plans');

    // Create admin user for testing using userService
    await userService.register('admin@test.com', 'Admin@1234', 'Admin');

    // Login to get token
    const authService = new AuthService();
    const loginResult = await authService.login('admin@test.com', 'Admin@1234');
    authToken = loginResult.token;
  });

  beforeEach(() => {
    // Set up Express app with controller
    app = express();
    app.use(express.json());

    recurringPlanService = new RecurringPlanService();
    const controller = new RecurringPlanController(recurringPlanService);
    app.use('/recurring-plans', controller.router);

    // Clean up recurring plans
    db.exec('DELETE FROM recurring_plans');
  });

  afterAll(() => {
    db.exec('DELETE FROM users');
    db.exec('DELETE FROM recurring_plans');
  });

  describe('POST /recurring-plans', () => {
    it('should create a recurring plan with valid data', async () => {
      const response = await request(app)
        .post('/recurring-plans')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Monthly Plan',
          billing_period: 'Monthly',
          auto_close: 0,
          closable: 1,
          pausable: 0,
          renewable: 1,
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('Monthly Plan');
      expect(response.body.data.billing_period).toBe('Monthly');
    });

    it('should create a plan with default values', async () => {
      const response = await request(app)
        .post('/recurring-plans')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Weekly Plan',
          billing_period: 'Weekly',
        });

      expect(response.status).toBe(201);
      expect(response.body.data.auto_close).toBe(0);
      expect(response.body.data.closable).toBe(1);
      expect(response.body.data.pausable).toBe(0);
      expect(response.body.data.renewable).toBe(1);
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .post('/recurring-plans')
        .send({
          name: 'Test Plan',
          billing_period: 'Monthly',
        });

      expect(response.status).toBe(401);
    });

    it('should return 400 for invalid billing period', async () => {
      const response = await request(app)
        .post('/recurring-plans')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Test Plan',
          billing_period: 'InvalidPeriod',
        });

      expect(response.status).toBe(400);
    });

    it('should return 400 for empty name', async () => {
      const response = await request(app)
        .post('/recurring-plans')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: '',
          billing_period: 'Monthly',
        });

      expect(response.status).toBe(400);
    });
  });

  describe('GET /recurring-plans', () => {
    it('should return all recurring plans', async () => {
      await recurringPlanService.create('Plan 1', 'Monthly');
      await recurringPlanService.create('Plan 2', 'Yearly');

      const response = await request(app)
        .get('/recurring-plans')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
    });

    it('should return empty array when no plans exist', async () => {
      const response = await request(app)
        .get('/recurring-plans')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toEqual([]);
    });
  });

  describe('GET /recurring-plans/:id', () => {
    it('should return plan by ID', async () => {
      const plan = await recurringPlanService.create('Test Plan', 'Monthly');

      const response = await request(app)
        .get(`/recurring-plans/${plan.id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(plan.id);
    });

    it('should return 404 for non-existent plan', async () => {
      const response = await request(app)
        .get('/recurring-plans/non-existent-id')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
    });
  });

  describe('PUT /recurring-plans/:id', () => {
    it('should update plan', async () => {
      const plan = await recurringPlanService.create('Original Name', 'Monthly');

      const response = await request(app)
        .put(`/recurring-plans/${plan.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Updated Name' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('Updated Name');
    });

    it('should update multiple fields', async () => {
      const plan = await recurringPlanService.create('Plan', 'Monthly');

      const response = await request(app)
        .put(`/recurring-plans/${plan.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'New Name',
          billing_period: 'Yearly',
          auto_close: 1,
        });

      expect(response.status).toBe(200);
      expect(response.body.data.name).toBe('New Name');
      expect(response.body.data.billing_period).toBe('Yearly');
      expect(response.body.data.auto_close).toBe(1);
    });

    it('should return 404 for non-existent plan', async () => {
      const response = await request(app)
        .put('/recurring-plans/non-existent-id')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Updated Name' });

      expect(response.status).toBe(404);
    });
  });

  describe('DELETE /recurring-plans/:id', () => {
    it('should delete plan', async () => {
      const plan = await recurringPlanService.create('Test Plan', 'Monthly');

      const response = await request(app)
        .delete(`/recurring-plans/${plan.id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      // Verify deletion
      const found = recurringPlanService.findOne(plan.id);
      expect(found).toBeUndefined();
    });

    it('should return 404 for non-existent plan', async () => {
      const response = await request(app)
        .delete('/recurring-plans/non-existent-id')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
    });
  });
});
