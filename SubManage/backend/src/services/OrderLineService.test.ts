import { OrderLineService } from './OrderLineService';
import { SubscriptionService } from './SubscriptionService';
import { ProductService } from './ProductService';
import { UserService } from './UserService';
import db from '../config/database';

describe('OrderLineService', () => {
  let orderLineService: OrderLineService;
  let subscriptionService: SubscriptionService;
  let productService: ProductService;
  let userService: UserService;
  let testSubscriptionId: string;
  let testProductId: string;
  let testUserId: string;

  beforeEach(async () => {
    orderLineService = new OrderLineService();
    subscriptionService = new SubscriptionService();
    productService = new ProductService();
    userService = new UserService();

    // Clean up tables
    db.exec('DELETE FROM order_line_taxes');
    db.exec('DELETE FROM order_lines');
    db.exec('DELETE FROM subscriptions');
    db.exec('DELETE FROM products');
    db.exec('DELETE FROM users');

    // Create test user
    const user = await userService.create('test@example.com', 'Password123!', 'Portal_User');
    testUserId = user.id;

    // Create test subscription
    const subscription = await subscriptionService.create(testUserId);
    testSubscriptionId = subscription.id;

    // Create test product
    const product = await productService.create('Test Product', 'Service', 100, 50, 0);
    testProductId = product.id;
  });

  afterAll(() => {
    db.exec('DELETE FROM order_line_taxes');
    db.exec('DELETE FROM order_lines');
    db.exec('DELETE FROM subscriptions');
    db.exec('DELETE FROM products');
    db.exec('DELETE FROM users');
  });

  describe('create', () => {
    it('should create an order line with required fields', async () => {
      const orderLine = await orderLineService.create(
        testProductId,
        2,
        100,
        200,
        testSubscriptionId
      );

      expect(orderLine).toBeDefined();
      expect(orderLine.id).toBeDefined();
      expect(orderLine.product_id).toBe(testProductId);
      expect(orderLine.quantity).toBe(2);
      expect(orderLine.unit_price).toBe(100);
      expect(orderLine.amount).toBe(200);
      expect(orderLine.subscription_id).toBe(testSubscriptionId);
      expect(orderLine.invoice_id).toBeNull();
      expect(orderLine.product_variant_id).toBeNull();
      expect(orderLine.created_at).toBeDefined();
      expect(orderLine.updated_at).toBeDefined();
    });

    it('should create an order line without subscription or invoice', async () => {
      const orderLine = await orderLineService.create(testProductId, 1, 50, 50);

      expect(orderLine.subscription_id).toBeNull();
      expect(orderLine.invoice_id).toBeNull();
    });

    it('should throw error when product_id is missing', async () => {
      await expect(orderLineService.create('', 1, 50, 50)).rejects.toThrow(
        'Product ID is required'
      );
    });

    it('should throw error when quantity is missing', async () => {
      await expect(
        orderLineService.create(testProductId, undefined as any, 50, 50)
      ).rejects.toThrow('Quantity is required');
    });

    it('should throw error when quantity is zero or negative', async () => {
      await expect(orderLineService.create(testProductId, 0, 50, 50)).rejects.toThrow(
        'Quantity must be greater than 0'
      );

      await expect(orderLineService.create(testProductId, -1, 50, 50)).rejects.toThrow(
        'Quantity must be greater than 0'
      );
    });

    it('should throw error when unit_price is missing', async () => {
      await expect(
        orderLineService.create(testProductId, 1, undefined as any, 50)
      ).rejects.toThrow('Unit price is required');
    });

    it('should throw error when unit_price is negative', async () => {
      await expect(orderLineService.create(testProductId, 1, -10, 50)).rejects.toThrow(
        'Unit price cannot be negative'
      );
    });

    it('should throw error when amount is missing', async () => {
      await expect(
        orderLineService.create(testProductId, 1, 50, undefined as any)
      ).rejects.toThrow('Amount is required');
    });

    it('should throw error when amount is negative', async () => {
      await expect(orderLineService.create(testProductId, 1, 50, -100)).rejects.toThrow(
        'Amount cannot be negative'
      );
    });

    it('should throw error when product does not exist', async () => {
      await expect(
        orderLineService.create('non-existent-product', 1, 50, 50)
      ).rejects.toThrow('Product not found');
    });

    it('should throw error when subscription does not exist', async () => {
      await expect(
        orderLineService.create(testProductId, 1, 50, 50, 'non-existent-subscription')
      ).rejects.toThrow('Subscription not found');
    });
  });

  describe('findBySubscription', () => {
    it('should return order lines for a subscription', async () => {
      await orderLineService.create(testProductId, 1, 50, 50, testSubscriptionId);
      await orderLineService.create(testProductId, 2, 100, 200, testSubscriptionId);

      const orderLines = orderLineService.findBySubscription(testSubscriptionId);
      expect(orderLines).toHaveLength(2);
    });

    it('should return empty array when no order lines exist', () => {
      const orderLines = orderLineService.findBySubscription(testSubscriptionId);
      expect(orderLines).toEqual([]);
    });

    it('should throw error when subscription_id is empty', () => {
      expect(() => orderLineService.findBySubscription('')).toThrow(
        'Subscription ID is required'
      );
    });
  });

  describe('findOne', () => {
    it('should return order line by ID', async () => {
      const created = await orderLineService.create(testProductId, 1, 50, 50, testSubscriptionId);
      const found = orderLineService.findOne(created.id);

      expect(found).toBeDefined();
      expect(found?.id).toBe(created.id);
    });

    it('should return undefined for non-existent ID', () => {
      const found = orderLineService.findOne('non-existent-id');
      expect(found).toBeUndefined();
    });

    it('should throw error when ID is empty', () => {
      expect(() => orderLineService.findOne('')).toThrow('Order line ID is required');
    });
  });

  describe('update', () => {
    it('should update order line quantity', async () => {
      const created = await orderLineService.create(testProductId, 1, 50, 50, testSubscriptionId);
      const updated = await orderLineService.update(created.id, { quantity: 3 });

      expect(updated.quantity).toBe(3);
    });

    it('should update multiple fields', async () => {
      const created = await orderLineService.create(testProductId, 1, 50, 50, testSubscriptionId);
      const updated = await orderLineService.update(created.id, {
        quantity: 5,
        unit_price: 75,
        amount: 375,
      });

      expect(updated.quantity).toBe(5);
      expect(updated.unit_price).toBe(75);
      expect(updated.amount).toBe(375);
    });

    it('should throw error when order line not found', async () => {
      await expect(
        orderLineService.update('non-existent-id', { quantity: 2 })
      ).rejects.toThrow('Order line not found');
    });

    it('should throw error when updating quantity to zero or negative', async () => {
      const created = await orderLineService.create(testProductId, 1, 50, 50, testSubscriptionId);

      await expect(orderLineService.update(created.id, { quantity: 0 })).rejects.toThrow(
        'Quantity must be greater than 0'
      );
    });

    it('should throw error when updating unit_price to negative', async () => {
      const created = await orderLineService.create(testProductId, 1, 50, 50, testSubscriptionId);

      await expect(orderLineService.update(created.id, { unit_price: -10 })).rejects.toThrow(
        'Unit price cannot be negative'
      );
    });

    it('should return existing order line when no updates provided', async () => {
      const created = await orderLineService.create(testProductId, 1, 50, 50, testSubscriptionId);
      const updated = await orderLineService.update(created.id, {});

      expect(updated).toEqual(created);
    });
  });

  describe('delete', () => {
    it('should delete order line by ID', async () => {
      const created = await orderLineService.create(testProductId, 1, 50, 50, testSubscriptionId);
      await orderLineService.delete(created.id);

      const found = orderLineService.findOne(created.id);
      expect(found).toBeUndefined();
    });

    it('should throw error when order line not found', async () => {
      await expect(orderLineService.delete('non-existent-id')).rejects.toThrow(
        'Order line not found'
      );
    });

    it('should throw error when ID is empty', async () => {
      await expect(orderLineService.delete('')).rejects.toThrow('Order line ID is required');
    });
  });

  describe('associateTaxes', () => {
    it('should associate taxes with order line', async () => {
      const orderLine = await orderLineService.create(testProductId, 1, 50, 50, testSubscriptionId);

      // Create test taxes
      const tax1Stmt = db.prepare(
        'INSERT INTO taxes (id, name, percentage, created_at, updated_at) VALUES (?, ?, ?, ?, ?)'
      );
      const tax2Stmt = db.prepare(
        'INSERT INTO taxes (id, name, percentage, created_at, updated_at) VALUES (?, ?, ?, ?, ?)'
      );
      const timestamp = new Date().toISOString();
      tax1Stmt.run('tax1', 'VAT', 20, timestamp, timestamp);
      tax2Stmt.run('tax2', 'Sales Tax', 10, timestamp, timestamp);

      await orderLineService.associateTaxes(orderLine.id, ['tax1', 'tax2']);

      const taxes = orderLineService.getTaxes(orderLine.id);
      expect(taxes).toHaveLength(2);
      expect(taxes).toContain('tax1');
      expect(taxes).toContain('tax2');
    });

    it('should replace existing tax associations', async () => {
      const orderLine = await orderLineService.create(testProductId, 1, 50, 50, testSubscriptionId);

      // Create test taxes
      const timestamp = new Date().toISOString();
      db.prepare(
        'INSERT INTO taxes (id, name, percentage, created_at, updated_at) VALUES (?, ?, ?, ?, ?)'
      ).run('tax1', 'VAT', 20, timestamp, timestamp);
      db.prepare(
        'INSERT INTO taxes (id, name, percentage, created_at, updated_at) VALUES (?, ?, ?, ?, ?)'
      ).run('tax2', 'Sales Tax', 10, timestamp, timestamp);

      await orderLineService.associateTaxes(orderLine.id, ['tax1']);
      await orderLineService.associateTaxes(orderLine.id, ['tax2']);

      const taxes = orderLineService.getTaxes(orderLine.id);
      expect(taxes).toHaveLength(1);
      expect(taxes).toContain('tax2');
    });

    it('should throw error when order line not found', async () => {
      await expect(orderLineService.associateTaxes('non-existent-id', [])).rejects.toThrow(
        'Order line not found'
      );
    });
  });

  describe('getTaxes', () => {
    it('should return empty array when no taxes associated', async () => {
      const orderLine = await orderLineService.create(testProductId, 1, 50, 50, testSubscriptionId);

      const taxes = orderLineService.getTaxes(orderLine.id);
      expect(taxes).toEqual([]);
    });

    it('should throw error when order_line_id is empty', () => {
      expect(() => orderLineService.getTaxes('')).toThrow('Order line ID is required');
    });
  });
});
