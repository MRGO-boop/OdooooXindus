import { QuotationTemplateService, TemplateData } from './QuotationTemplateService';
import { RecurringPlanService } from './RecurringPlanService';
import { ProductService } from './ProductService';
import { UserService } from './UserService';
import { SubscriptionService } from './SubscriptionService';
import { OrderLineService } from './OrderLineService';
import db from '../config/database';

describe('QuotationTemplateService', () => {
  let quotationTemplateService: QuotationTemplateService;
  let recurringPlanService: RecurringPlanService;
  let productService: ProductService;
  let userService: UserService;
  let subscriptionService: SubscriptionService;
  let orderLineService: OrderLineService;
  let testPlanId: string;
  let testProductId: string;
  let testUserId: string;

  beforeEach(async () => {
    quotationTemplateService = new QuotationTemplateService();
    recurringPlanService = new RecurringPlanService();
    productService = new ProductService();
    userService = new UserService();
    subscriptionService = new SubscriptionService();
    orderLineService = new OrderLineService();

    // Clean up tables
    db.exec('DELETE FROM order_line_taxes');
    db.exec('DELETE FROM order_lines');
    db.exec('DELETE FROM subscriptions');
    db.exec('DELETE FROM quotation_templates');
    db.exec('DELETE FROM recurring_plans');
    db.exec('DELETE FROM products');
    db.exec('DELETE FROM users');

    // Create test data
    const user = await userService.create('test@example.com', 'Password123!', 'Portal_User');
    testUserId = user.id;

    const plan = await recurringPlanService.create('Test Plan', 'Monthly');
    testPlanId = plan.id;

    const product = await productService.create('Test Product', 'Service', 100, 50, 0);
    testProductId = product.id;
  });

  afterAll(() => {
    db.exec('DELETE FROM order_line_taxes');
    db.exec('DELETE FROM order_lines');
    db.exec('DELETE FROM subscriptions');
    db.exec('DELETE FROM quotation_templates');
    db.exec('DELETE FROM recurring_plans');
    db.exec('DELETE FROM products');
    db.exec('DELETE FROM users');
  });

  describe('create', () => {
    it('should create a quotation template with valid data', async () => {
      const templateData: TemplateData = {
        recurring_plan_id: testPlanId,
        order_lines: [
          {
            product_id: testProductId,
            quantity: 2,
            unit_price: 100,
            amount: 200,
          },
        ],
      };

      const template = await quotationTemplateService.create(
        'Test Template',
        templateData,
        'Test description'
      );

      expect(template).toBeDefined();
      expect(template.id).toBeDefined();
      expect(template.name).toBe('Test Template');
      expect(template.description).toBe('Test description');
      expect(template.template_data).toBeDefined();

      const parsedData = JSON.parse(template.template_data);
      expect(parsedData.recurring_plan_id).toBe(testPlanId);
      expect(parsedData.order_lines).toHaveLength(1);
    });

    it('should create a template without description', async () => {
      const templateData: TemplateData = {
        order_lines: [
          {
            product_id: testProductId,
            quantity: 1,
            unit_price: 50,
            amount: 50,
          },
        ],
      };

      const template = await quotationTemplateService.create('Template', templateData);

      expect(template.description).toBeNull();
    });

    it('should create a template without recurring_plan_id', async () => {
      const templateData: TemplateData = {
        order_lines: [
          {
            product_id: testProductId,
            quantity: 1,
            unit_price: 50,
            amount: 50,
          },
        ],
      };

      const template = await quotationTemplateService.create('Template', templateData);

      const parsedData = JSON.parse(template.template_data);
      expect(parsedData.recurring_plan_id).toBeUndefined();
    });

    it('should throw error when name is missing', async () => {
      const templateData: TemplateData = {
        order_lines: [
          {
            product_id: testProductId,
            quantity: 1,
            unit_price: 50,
            amount: 50,
          },
        ],
      };

      await expect(quotationTemplateService.create('', templateData)).rejects.toThrow(
        'Template name is required'
      );
    });

    it('should throw error when template_data is missing', async () => {
      await expect(
        quotationTemplateService.create('Template', undefined as any)
      ).rejects.toThrow('Template data is required');
    });

    it('should throw error when order_lines is missing', async () => {
      const templateData = {} as TemplateData;

      await expect(quotationTemplateService.create('Template', templateData)).rejects.toThrow(
        'Template data must include order_lines array'
      );
    });

    it('should throw error when order_lines is empty', async () => {
      const templateData: TemplateData = {
        order_lines: [],
      };

      await expect(quotationTemplateService.create('Template', templateData)).rejects.toThrow(
        'Template must include at least one order line'
      );
    });

    it('should throw error when order line is missing product_id', async () => {
      const templateData: TemplateData = {
        order_lines: [
          {
            product_id: '',
            quantity: 1,
            unit_price: 50,
            amount: 50,
          },
        ],
      };

      await expect(quotationTemplateService.create('Template', templateData)).rejects.toThrow(
        'Each order line must have a product_id'
      );
    });

    it('should throw error when recurring_plan_id does not exist', async () => {
      const templateData: TemplateData = {
        recurring_plan_id: 'non-existent-plan',
        order_lines: [
          {
            product_id: testProductId,
            quantity: 1,
            unit_price: 50,
            amount: 50,
          },
        ],
      };

      await expect(quotationTemplateService.create('Template', templateData)).rejects.toThrow(
        'Recurring plan not found'
      );
    });

    it('should trim whitespace from name', async () => {
      const templateData: TemplateData = {
        order_lines: [
          {
            product_id: testProductId,
            quantity: 1,
            unit_price: 50,
            amount: 50,
          },
        ],
      };

      const template = await quotationTemplateService.create('  Test Template  ', templateData);
      expect(template.name).toBe('Test Template');
    });
  });

  describe('findAll', () => {
    it('should return empty array when no templates exist', () => {
      const templates = quotationTemplateService.findAll();
      expect(templates).toEqual([]);
    });

    it('should return all quotation templates', async () => {
      const templateData: TemplateData = {
        order_lines: [
          {
            product_id: testProductId,
            quantity: 1,
            unit_price: 50,
            amount: 50,
          },
        ],
      };

      await quotationTemplateService.create('Template 1', templateData);
      await quotationTemplateService.create('Template 2', templateData);

      const templates = quotationTemplateService.findAll();
      expect(templates).toHaveLength(2);
    });
  });

  describe('findOne', () => {
    it('should return template by ID', async () => {
      const templateData: TemplateData = {
        order_lines: [
          {
            product_id: testProductId,
            quantity: 1,
            unit_price: 50,
            amount: 50,
          },
        ],
      };

      const created = await quotationTemplateService.create('Template', templateData);
      const found = quotationTemplateService.findOne(created.id);

      expect(found).toBeDefined();
      expect(found?.id).toBe(created.id);
    });

    it('should return undefined for non-existent ID', () => {
      const found = quotationTemplateService.findOne('non-existent-id');
      expect(found).toBeUndefined();
    });

    it('should throw error when ID is empty', () => {
      expect(() => quotationTemplateService.findOne('')).toThrow('Template ID is required');
    });
  });

  describe('update', () => {
    it('should update template name', async () => {
      const templateData: TemplateData = {
        order_lines: [
          {
            product_id: testProductId,
            quantity: 1,
            unit_price: 50,
            amount: 50,
          },
        ],
      };

      const created = await quotationTemplateService.create('Original', templateData);
      const updated = await quotationTemplateService.update(created.id, { name: 'Updated' });

      expect(updated.name).toBe('Updated');
    });

    it('should update template_data', async () => {
      const templateData: TemplateData = {
        order_lines: [
          {
            product_id: testProductId,
            quantity: 1,
            unit_price: 50,
            amount: 50,
          },
        ],
      };

      const created = await quotationTemplateService.create('Template', templateData);

      const newTemplateData: TemplateData = {
        order_lines: [
          {
            product_id: testProductId,
            quantity: 2,
            unit_price: 100,
            amount: 200,
          },
        ],
      };

      const updated = await quotationTemplateService.update(created.id, {
        template_data: newTemplateData as any,
      });

      const parsedData = JSON.parse(updated.template_data);
      expect(parsedData.order_lines[0].quantity).toBe(2);
    });

    it('should throw error when template not found', async () => {
      await expect(
        quotationTemplateService.update('non-existent-id', { name: 'Updated' })
      ).rejects.toThrow('Quotation template not found');
    });

    it('should return existing template when no updates provided', async () => {
      const templateData: TemplateData = {
        order_lines: [
          {
            product_id: testProductId,
            quantity: 1,
            unit_price: 50,
            amount: 50,
          },
        ],
      };

      const created = await quotationTemplateService.create('Template', templateData);
      const updated = await quotationTemplateService.update(created.id, {});

      expect(updated).toEqual(created);
    });
  });

  describe('delete', () => {
    it('should delete template by ID', async () => {
      const templateData: TemplateData = {
        order_lines: [
          {
            product_id: testProductId,
            quantity: 1,
            unit_price: 50,
            amount: 50,
          },
        ],
      };

      const created = await quotationTemplateService.create('Template', templateData);
      await quotationTemplateService.delete(created.id);

      const found = quotationTemplateService.findOne(created.id);
      expect(found).toBeUndefined();
    });

    it('should throw error when template not found', async () => {
      await expect(quotationTemplateService.delete('non-existent-id')).rejects.toThrow(
        'Quotation template not found'
      );
    });
  });

  describe('createSubscriptionFromTemplate', () => {
    it('should create subscription from template', async () => {
      const templateData: TemplateData = {
        recurring_plan_id: testPlanId,
        order_lines: [
          {
            product_id: testProductId,
            quantity: 2,
            unit_price: 100,
            amount: 200,
          },
        ],
      };

      const template = await quotationTemplateService.create('Template', templateData);

      const subscription = await quotationTemplateService.createSubscriptionFromTemplate(
        template.id,
        testUserId
      );

      expect(subscription).toBeDefined();
      expect(subscription.user_id).toBe(testUserId);
      expect(subscription.recurring_plan_id).toBe(testPlanId);
      expect(subscription.status).toBe('Draft');

      // Verify order lines were created
      const orderLines = orderLineService.findBySubscription(subscription.id);
      expect(orderLines).toHaveLength(1);
      expect(orderLines[0].product_id).toBe(testProductId);
      expect(orderLines[0].quantity).toBe(2);
    });

    it('should create subscription with dates', async () => {
      const templateData: TemplateData = {
        order_lines: [
          {
            product_id: testProductId,
            quantity: 1,
            unit_price: 50,
            amount: 50,
          },
        ],
      };

      const template = await quotationTemplateService.create('Template', templateData);

      const startDate = '2024-01-01T00:00:00.000Z';
      const endDate = '2024-12-31T23:59:59.999Z';

      const subscription = await quotationTemplateService.createSubscriptionFromTemplate(
        template.id,
        testUserId,
        startDate,
        endDate
      );

      expect(subscription.start_date).toBe(startDate);
      expect(subscription.end_date).toBe(endDate);
    });

    it('should throw error when template not found', async () => {
      await expect(
        quotationTemplateService.createSubscriptionFromTemplate('non-existent-id', testUserId)
      ).rejects.toThrow('Quotation template not found');
    });
  });
});
