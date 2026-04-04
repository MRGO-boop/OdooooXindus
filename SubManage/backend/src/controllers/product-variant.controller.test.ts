import request from 'supertest';
import express, { Express } from 'express';
import { ProductVariantController } from './product-variant.controller';
import { ProductVariantService } from '../services/ProductVariantService';
import { ProductService } from '../services/ProductService';
import { AuthService } from '../services/AuthService';
import { userService } from '../services/UserService';
import db from '../config/database';

describe('ProductVariantController', () => {
  let app: Express;
  let authToken: string;
  let productVariantService: ProductVariantService;
  let productService: ProductService;
  let testProductId: string;

  beforeAll(async () => {
    // Clean up and create test user
    db.exec('DELETE FROM users');
    db.exec('DELETE FROM product_variants');
    db.exec('DELETE FROM products');

    // Create admin user for testing using userService
    await userService.register('admin@test.com', 'Admin@1234', 'Admin');

    // Login to get token
    const authService = new AuthService();
    const loginResult = await authService.login('admin@test.com', 'Admin@1234');
    authToken = loginResult.token;
  });

  beforeEach(async () => {
    // Set up Express app with controller
    app = express();
    app.use(express.json());

    productVariantService = new ProductVariantService();
    productService = new ProductService();
    const controller = new ProductVariantController(productVariantService);
    app.use('/product-variants', controller.router);

    // Clean up
    db.exec('DELETE FROM product_variants');
    db.exec('DELETE FROM products');

    // Create test product
    const product = await productService.create('Test Product', 'Service', 100, 50, 0);
    testProductId = product.id;
  });

  afterAll(() => {
    db.exec('DELETE FROM users');
    db.exec('DELETE FROM product_variants');
    db.exec('DELETE FROM products');
  });

  describe('POST /product-variants', () => {
    it('should create a product variant with valid data', async () => {
      const response = await request(app)
        .post('/product-variants')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          product_id: testProductId,
          attributes: { color: 'red', size: 'large' },
          extra_price: 10,
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.product_id).toBe(testProductId);
      expect(response.body.data.extra_price).toBe(10);
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .post('/product-variants')
        .send({
          product_id: testProductId,
          attributes: { color: 'red' },
          extra_price: 10,
        });

      expect(response.status).toBe(401);
    });

    it('should return 404 for non-existent product', async () => {
      const response = await request(app)
        .post('/product-variants')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          product_id: 'non-existent-id',
          attributes: { color: 'red' },
          extra_price: 10,
        });

      expect(response.status).toBe(404);
    });
  });

  describe('GET /product-variants', () => {
    it('should return all product variants', async () => {
      await productVariantService.create(testProductId, { color: 'red' }, 10);
      await productVariantService.create(testProductId, { color: 'blue' }, 5);

      const response = await request(app)
        .get('/product-variants')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
    });
  });

  describe('GET /product-variants/product/:productId', () => {
    it('should return variants for specific product', async () => {
      const product2 = await productService.create('Product 2', 'Service', 200, 100, 0);

      await productVariantService.create(testProductId, { color: 'red' }, 10);
      await productVariantService.create(testProductId, { color: 'blue' }, 5);
      await productVariantService.create(product2.id, { color: 'green' }, 15);

      const response = await request(app)
        .get(`/product-variants/product/${testProductId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.data.every((v: any) => v.product_id === testProductId)).toBe(true);
    });
  });

  describe('GET /product-variants/:id', () => {
    it('should return variant by ID', async () => {
      const variant = await productVariantService.create(testProductId, { color: 'red' }, 10);

      const response = await request(app)
        .get(`/product-variants/${variant.id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(variant.id);
    });

    it('should return 404 for non-existent variant', async () => {
      const response = await request(app)
        .get('/product-variants/non-existent-id')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
    });
  });

  describe('GET /product-variants/:id/price', () => {
    it('should calculate final price', async () => {
      const variant = await productVariantService.create(testProductId, { color: 'red' }, 10);

      const response = await request(app)
        .get(`/product-variants/${variant.id}/price`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.finalPrice).toBe(110); // 100 + 10
    });
  });

  describe('PUT /product-variants/:id', () => {
    it('should update variant', async () => {
      const variant = await productVariantService.create(testProductId, { color: 'red' }, 10);

      const response = await request(app)
        .put(`/product-variants/${variant.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ extra_price: 15 });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.extra_price).toBe(15);
    });

    it('should return 404 for non-existent variant', async () => {
      const response = await request(app)
        .put('/product-variants/non-existent-id')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ extra_price: 15 });

      expect(response.status).toBe(404);
    });
  });

  describe('DELETE /product-variants/:id', () => {
    it('should delete variant', async () => {
      const variant = await productVariantService.create(testProductId, { color: 'red' }, 10);

      const response = await request(app)
        .delete(`/product-variants/${variant.id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      // Verify deletion
      const found = productVariantService.findOne(variant.id);
      expect(found).toBeUndefined();
    });

    it('should return 404 for non-existent variant', async () => {
      const response = await request(app)
        .delete('/product-variants/non-existent-id')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
    });
  });
});
