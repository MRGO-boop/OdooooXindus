import { ProductVariantService } from './ProductVariantService';
import { ProductService } from './ProductService';
import db from '../config/database';

describe('ProductVariantService', () => {
  let productVariantService: ProductVariantService;
  let productService: ProductService;
  let testProductId: string;

  beforeEach(async () => {
    productVariantService = new ProductVariantService();
    productService = new ProductService();

    // Clean up tables
    db.exec('DELETE FROM product_variants');
    db.exec('DELETE FROM products');

    // Create a test product
    const product = await productService.create('Test Product', 'Service', 100.00, 50.00, 0);
    testProductId = product.id;
  });

  afterAll(() => {
    db.exec('DELETE FROM product_variants');
    db.exec('DELETE FROM products');
  });

  describe('create', () => {
    it('should create a product variant with JSON string attributes', async () => {
      const attributes = JSON.stringify({ color: 'red', size: 'large' });
      const variant = await productVariantService.create(testProductId, attributes, 10.00);

      expect(variant).toBeDefined();
      expect(variant.id).toBeDefined();
      expect(variant.product_id).toBe(testProductId);
      expect(variant.attributes).toBe(attributes);
      expect(variant.extra_price).toBe(10.00);
      expect(variant.created_at).toBeDefined();
      expect(variant.updated_at).toBeDefined();
    });

    it('should create a product variant with object attributes', async () => {
      const attributes = { color: 'blue', size: 'medium' };
      const variant = await productVariantService.create(testProductId, attributes, 5.00);

      expect(variant.product_id).toBe(testProductId);
      expect(JSON.parse(variant.attributes)).toEqual(attributes);
      expect(variant.extra_price).toBe(5.00);
    });

    it('should allow negative extra price', async () => {
      const variant = await productVariantService.create(
        testProductId,
        { discount: true },
        -10.00
      );

      expect(variant.extra_price).toBe(-10.00);
    });

    it('should throw error when product_id is missing', async () => {
      await expect(
        productVariantService.create('', { color: 'red' }, 10)
      ).rejects.toThrow('Product ID is required');
    });

    it('should throw error when parent product does not exist', async () => {
      await expect(
        productVariantService.create('non-existent-id', { color: 'red' }, 10)
      ).rejects.toThrow('Parent product not found');
    });

    it('should throw error when attributes is invalid JSON string', async () => {
      await expect(
        productVariantService.create(testProductId, 'invalid json', 10)
      ).rejects.toThrow('Attributes must be valid JSON string');
    });

    it('should throw error when extra_price is missing', async () => {
      await expect(
        productVariantService.create(testProductId, { color: 'red' }, undefined as any)
      ).rejects.toThrow('Extra price is required');
    });

    it('should throw error when extra_price is not a number', async () => {
      await expect(
        productVariantService.create(testProductId, { color: 'red' }, 'not a number' as any)
      ).rejects.toThrow('Extra price must be a number');
    });
  });

  describe('findAll', () => {
    it('should return empty array when no variants exist', () => {
      const variants = productVariantService.findAll();
      expect(variants).toEqual([]);
    });

    it('should return all product variants', async () => {
      await productVariantService.create(testProductId, { color: 'red' }, 10);
      await productVariantService.create(testProductId, { color: 'blue' }, 5);

      const variants = productVariantService.findAll();
      expect(variants).toHaveLength(2);
    });
  });

  describe('findByProductId', () => {
    it('should return variants for specific product', async () => {
      const product2 = await productService.create('Product 2', 'Service', 200, 100, 0);

      await productVariantService.create(testProductId, { color: 'red' }, 10);
      await productVariantService.create(testProductId, { color: 'blue' }, 5);
      await productVariantService.create(product2.id, { color: 'green' }, 15);

      const variants = productVariantService.findByProductId(testProductId);
      expect(variants).toHaveLength(2);
      expect(variants.every(v => v.product_id === testProductId)).toBe(true);
    });

    it('should return empty array when product has no variants', () => {
      const variants = productVariantService.findByProductId(testProductId);
      expect(variants).toEqual([]);
    });

    it('should throw error when product_id is empty', () => {
      expect(() => productVariantService.findByProductId('')).toThrow('Product ID is required');
    });
  });

  describe('findOne', () => {
    it('should return variant by ID', async () => {
      const created = await productVariantService.create(testProductId, { color: 'red' }, 10);
      const found = productVariantService.findOne(created.id);

      expect(found).toBeDefined();
      expect(found?.id).toBe(created.id);
      expect(found?.product_id).toBe(testProductId);
    });

    it('should return undefined for non-existent ID', () => {
      const found = productVariantService.findOne('non-existent-id');
      expect(found).toBeUndefined();
    });

    it('should throw error when ID is empty', () => {
      expect(() => productVariantService.findOne('')).toThrow('Product variant ID is required');
    });
  });

  describe('calculatePrice', () => {
    it('should calculate final price as base price + extra price', async () => {
      const variant = await productVariantService.create(testProductId, { color: 'red' }, 10);
      const finalPrice = productVariantService.calculatePrice(variant.id);

      expect(finalPrice).toBe(110.00); // 100 (base) + 10 (extra)
    });

    it('should handle negative extra price', async () => {
      const variant = await productVariantService.create(testProductId, { discount: true }, -20);
      const finalPrice = productVariantService.calculatePrice(variant.id);

      expect(finalPrice).toBe(80.00); // 100 (base) - 20 (discount)
    });

    it('should throw error when variant not found', () => {
      expect(() => productVariantService.calculatePrice('non-existent-id')).toThrow(
        'Product variant not found'
      );
    });
  });

  describe('update', () => {
    it('should update variant attributes', async () => {
      const created = await productVariantService.create(
        testProductId,
        { color: 'red' },
        10
      );

      const newAttributes = JSON.stringify({ color: 'blue', size: 'large' });
      const updated = await productVariantService.update(created.id, {
        attributes: newAttributes,
      });

      expect(updated.attributes).toBe(newAttributes);
      expect(updated.extra_price).toBe(10); // Unchanged
    });

    it('should update extra price', async () => {
      const created = await productVariantService.create(testProductId, { color: 'red' }, 10);
      const updated = await productVariantService.update(created.id, { extra_price: 15 });

      expect(updated.extra_price).toBe(15);
      expect(updated.updated_at).not.toBe(created.updated_at);
    });

    it('should throw error when variant not found', async () => {
      await expect(
        productVariantService.update('non-existent-id', { extra_price: 10 })
      ).rejects.toThrow('Product variant not found');
    });

    it('should throw error when attributes is invalid JSON', async () => {
      const created = await productVariantService.create(testProductId, { color: 'red' }, 10);
      await expect(
        productVariantService.update(created.id, { attributes: 'invalid json' })
      ).rejects.toThrow('Attributes must be valid JSON string');
    });

    it('should return existing variant when no updates provided', async () => {
      const created = await productVariantService.create(testProductId, { color: 'red' }, 10);
      const updated = await productVariantService.update(created.id, {});

      expect(updated).toEqual(created);
    });
  });

  describe('delete', () => {
    it('should delete variant by ID', async () => {
      const created = await productVariantService.create(testProductId, { color: 'red' }, 10);
      await productVariantService.delete(created.id);

      const found = productVariantService.findOne(created.id);
      expect(found).toBeUndefined();
    });

    it('should throw error when variant not found', async () => {
      await expect(
        productVariantService.delete('non-existent-id')
      ).rejects.toThrow('Product variant not found');
    });

    it('should throw error when ID is empty', async () => {
      await expect(
        productVariantService.delete('')
      ).rejects.toThrow('Product variant ID is required');
    });
  });
});
