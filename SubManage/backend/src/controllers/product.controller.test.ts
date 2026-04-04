import request from 'supertest';
import express, { Express } from 'express';
import { ProductController } from './product.controller';
import { ProductService } from '../services/ProductService';
import { AuthService } from '../services/AuthService';
import { userService } from '../services/UserService';
import db from '../config/database';

describe('ProductController', () => {
  let app: Express;
  let authToken: string;
  let productService: ProductService;

  beforeAll(async () => {
    // Clean up and create test user
    db.exec('DELETE FROM users');
    db.exec('DELETE FROM products');

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

    productService = new ProductService();
    const controller = new ProductController(productService);
    app.use('/products', controller.router);

    // Clean up products
    db.exec('DELETE FROM products');
  });

  afterAll(() => {
    db.exec('DELETE FROM users');
    db.exec('DELETE FROM products');
  });

  describe('POST /products', () => {
    it('should create a product with valid data', async () => {
      const response = await request(app)
        .post('/products')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Test Product',
          type: 'Service',
          sales_price: 100,
          cost_price: 50,
          is_recurring: 0,
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('Test Product');
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .post('/products')
        .send({
          name: 'Test Product',
          type: 'Service',
          sales_price: 100,
          cost_price: 50,
        });

      expect(response.status).toBe(401);
    });

    it('should return 400 for invalid data', async () => {
      const response = await request(app)
        .post('/products')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: '',
          type: 'Service',
          sales_price: 100,
          cost_price: 50,
        });

      expect(response.status).toBe(400);
    });
  });

  describe('GET /products', () => {
    it('should return all products', async () => {
      await productService.create('Product 1', 'Type A', 100, 50, 0);
      await productService.create('Product 2', 'Type B', 200, 100, 1);

      const response = await request(app)
        .get('/products')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
    });

    it('should return empty array when no products exist', async () => {
      const response = await request(app)
        .get('/products')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toEqual([]);
    });
  });

  describe('GET /products/:id', () => {
    it('should return product by ID', async () => {
      const product = await productService.create('Test Product', 'Service', 100, 50, 0);

      const response = await request(app)
        .get(`/products/${product.id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(product.id);
    });

    it('should return 404 for non-existent product', async () => {
      const response = await request(app)
        .get('/products/non-existent-id')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
    });
  });

  describe('PUT /products/:id', () => {
    it('should update product', async () => {
      const product = await productService.create('Original Name', 'Service', 100, 50, 0);

      const response = await request(app)
        .put(`/products/${product.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Updated Name' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('Updated Name');
    });

    it('should return 404 for non-existent product', async () => {
      const response = await request(app)
        .put('/products/non-existent-id')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Updated Name' });

      expect(response.status).toBe(404);
    });
  });

  describe('DELETE /products/:id', () => {
    it('should delete product', async () => {
      const product = await productService.create('Test Product', 'Service', 100, 50, 0);

      const response = await request(app)
        .delete(`/products/${product.id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      // Verify deletion
      const found = productService.findOne(product.id);
      expect(found).toBeUndefined();
    });

    it('should return 404 for non-existent product', async () => {
      const response = await request(app)
        .delete('/products/non-existent-id')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
    });
  });
});
