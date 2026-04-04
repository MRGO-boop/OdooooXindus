import { ProductService } from './ProductService';
import db from '../config/database';

describe('ProductService', () => {
  let productService: ProductService;

  beforeEach(() => {
    productService = new ProductService();
    // Clean up products table before each test
    db.exec('DELETE FROM products');
  });

  afterAll(() => {
    // Clean up after all tests
    db.exec('DELETE FROM products');
  });

  describe('create', () => {
    it('should create a product with valid data', async () => {
      const product = await productService.create(
        'Test Product',
        'Service',
        100.00,
        50.00,
        0
      );

      expect(product).toBeDefined();
      expect(product.id).toBeDefined();
      expect(product.name).toBe('Test Product');
      expect(product.type).toBe('Service');
      expect(product.sales_price).toBe(100.00);
      expect(product.cost_price).toBe(50.00);
      expect(product.is_recurring).toBe(0);
      expect(product.created_at).toBeDefined();
      expect(product.updated_at).toBeDefined();
    });

    it('should create a recurring product', async () => {
      const product = await productService.create(
        'Recurring Product',
        'Subscription',
        200.00,
        100.00,
        1
      );

      expect(product.is_recurring).toBe(1);
    });

    it('should throw error when name is missing', async () => {
      await expect(
        productService.create('', 'Service', 100, 50, 0)
      ).rejects.toThrow('Product name is required');
    });

    it('should throw error when type is missing', async () => {
      await expect(
        productService.create('Test Product', '', 100, 50, 0)
      ).rejects.toThrow('Product type is required');
    });

    it('should throw error when sales_price is negative', async () => {
      await expect(
        productService.create('Test Product', 'Service', -10, 50, 0)
      ).rejects.toThrow('Sales price must be non-negative');
    });

    it('should throw error when cost_price is negative', async () => {
      await expect(
        productService.create('Test Product', 'Service', 100, -10, 0)
      ).rejects.toThrow('Cost price must be non-negative');
    });

    it('should throw error when is_recurring is invalid', async () => {
      await expect(
        productService.create('Test Product', 'Service', 100, 50, 2)
      ).rejects.toThrow('is_recurring must be 0 or 1');
    });

    it('should trim whitespace from name and type', async () => {
      const product = await productService.create(
        '  Test Product  ',
        '  Service  ',
        100,
        50,
        0
      );

      expect(product.name).toBe('Test Product');
      expect(product.type).toBe('Service');
    });
  });

  describe('findAll', () => {
    it('should return empty array when no products exist', () => {
      const products = productService.findAll();
      expect(products).toEqual([]);
    });

    it('should return all products', async () => {
      await productService.create('Product 1', 'Type A', 100, 50, 0);
      await productService.create('Product 2', 'Type B', 200, 100, 1);

      const products = productService.findAll();
      expect(products).toHaveLength(2);
      expect(products[0].name).toBe('Product 2'); // Most recent first
      expect(products[1].name).toBe('Product 1');
    });
  });

  describe('findOne', () => {
    it('should return product by ID', async () => {
      const created = await productService.create('Test Product', 'Service', 100, 50, 0);
      const found = productService.findOne(created.id);

      expect(found).toBeDefined();
      expect(found?.id).toBe(created.id);
      expect(found?.name).toBe('Test Product');
    });

    it('should return undefined for non-existent ID', () => {
      const found = productService.findOne('non-existent-id');
      expect(found).toBeUndefined();
    });

    it('should throw error when ID is empty', () => {
      expect(() => productService.findOne('')).toThrow('Product ID is required');
    });
  });

  describe('update', () => {
    it('should update product name', async () => {
      const created = await productService.create('Original Name', 'Service', 100, 50, 0);
      const updated = await productService.update(created.id, { name: 'Updated Name' });

      expect(updated.name).toBe('Updated Name');
      expect(updated.type).toBe('Service');
      expect(updated.updated_at).not.toBe(created.updated_at);
    });

    it('should update multiple fields', async () => {
      const created = await productService.create('Product', 'Type A', 100, 50, 0);
      const updated = await productService.update(created.id, {
        name: 'New Name',
        type: 'Type B',
        sales_price: 150,
        cost_price: 75,
        is_recurring: 1,
      });

      expect(updated.name).toBe('New Name');
      expect(updated.type).toBe('Type B');
      expect(updated.sales_price).toBe(150);
      expect(updated.cost_price).toBe(75);
      expect(updated.is_recurring).toBe(1);
    });

    it('should throw error when product not found', async () => {
      await expect(
        productService.update('non-existent-id', { name: 'New Name' })
      ).rejects.toThrow('Product not found');
    });

    it('should throw error when updating name to empty', async () => {
      const created = await productService.create('Product', 'Service', 100, 50, 0);
      await expect(
        productService.update(created.id, { name: '' })
      ).rejects.toThrow('Product name cannot be empty');
    });

    it('should throw error when updating sales_price to negative', async () => {
      const created = await productService.create('Product', 'Service', 100, 50, 0);
      await expect(
        productService.update(created.id, { sales_price: -10 })
      ).rejects.toThrow('Sales price must be non-negative');
    });

    it('should return existing product when no updates provided', async () => {
      const created = await productService.create('Product', 'Service', 100, 50, 0);
      const updated = await productService.update(created.id, {});

      expect(updated).toEqual(created);
    });
  });

  describe('delete', () => {
    it('should delete product by ID', async () => {
      const created = await productService.create('Product', 'Service', 100, 50, 0);
      await productService.delete(created.id);

      const found = productService.findOne(created.id);
      expect(found).toBeUndefined();
    });

    it('should throw error when product not found', async () => {
      await expect(
        productService.delete('non-existent-id')
      ).rejects.toThrow('Product not found');
    });

    it('should throw error when ID is empty', async () => {
      await expect(
        productService.delete('')
      ).rejects.toThrow('Product ID is required');
    });
  });
});
