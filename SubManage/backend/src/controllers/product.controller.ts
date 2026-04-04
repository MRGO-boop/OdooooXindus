import { Router, Request, Response } from 'express';
import { ProductService } from '../services/ProductService';
import { validate } from '../middleware/validation.middleware';
import { jwtAuthGuard } from '../middleware/auth.middleware';
import { requireInternal } from '../middleware/roles.middleware';
import {
  CreateProductDtoSchema,
  UpdateProductDtoSchema,
} from '../dtos/product.dto';

/**
 * ProductController handles product management HTTP endpoints
 * 
 * Implements Requirements:
 * - 7.1: Product CRUD operations
 * - 21.2: Clear and actionable error messages
 * - 4.2, 4.3: Admin and Internal_User access only
 */
export class ProductController {
  public router: Router;
  private productService: ProductService;

  constructor(productService?: ProductService) {
    this.router = Router();
    this.productService = productService || new ProductService();
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    // All product routes require authentication and Admin/Internal_User role
    this.router.use(jwtAuthGuard());
    this.router.use(requireInternal());

    /**
     * POST /products
     * Creates a new product
     * Implements Requirement 7.1
     */
    this.router.post('/', validate(CreateProductDtoSchema), this.create.bind(this));

    /**
     * GET /products
     * Retrieves all products
     * Implements Requirement 7.1
     */
    this.router.get('/', this.findAll.bind(this));

    /**
     * GET /products/:id
     * Retrieves a product by ID
     * Implements Requirement 7.1
     */
    this.router.get('/:id', this.findOne.bind(this));

    /**
     * PUT /products/:id
     * Updates a product
     * Implements Requirement 7.1
     */
    this.router.put('/:id', validate(UpdateProductDtoSchema), this.update.bind(this));

    /**
     * DELETE /products/:id
     * Deletes a product
     * Implements Requirement 7.1
     */
    this.router.delete('/:id', this.delete.bind(this));
  }

  /**
   * Create product endpoint handler
   */
  private async create(req: Request, res: Response): Promise<void> {
    try {
      const { name, type, sales_price, cost_price, is_recurring } = req.body;

      const product = await this.productService.create(
        name,
        type,
        sales_price,
        cost_price,
        is_recurring
      );

      res.status(201).json({
        success: true,
        message: 'Product created successfully',
        data: product,
      });
    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json({
          success: false,
          message: error.message,
        });
        return;
      }

      res.status(500).json({
        success: false,
        message: 'An unexpected error occurred',
      });
    }
  }

  /**
   * Find all products endpoint handler
   */
  private async findAll(req: Request, res: Response): Promise<void> {
    try {
      const products = this.productService.findAll();

      res.status(200).json({
        success: true,
        data: products,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'An unexpected error occurred',
      });
    }
  }

  /**
   * Find one product endpoint handler
   */
  private async findOne(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const product = this.productService.findOne(id);

      if (!product) {
        res.status(404).json({
          success: false,
          message: 'Product not found',
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: product,
      });
    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json({
          success: false,
          message: error.message,
        });
        return;
      }

      res.status(500).json({
        success: false,
        message: 'An unexpected error occurred',
      });
    }
  }

  /**
   * Update product endpoint handler
   */
  private async update(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const updates = req.body;

      const product = await this.productService.update(id, updates);

      res.status(200).json({
        success: true,
        message: 'Product updated successfully',
        data: product,
      });
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('not found')) {
          res.status(404).json({
            success: false,
            message: 'Product not found',
          });
          return;
        }

        res.status(400).json({
          success: false,
          message: error.message,
        });
        return;
      }

      res.status(500).json({
        success: false,
        message: 'An unexpected error occurred',
      });
    }
  }

  /**
   * Delete product endpoint handler
   */
  private async delete(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      await this.productService.delete(id);

      res.status(200).json({
        success: true,
        message: 'Product deleted successfully',
      });
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('not found')) {
          res.status(404).json({
            success: false,
            message: 'Product not found',
          });
          return;
        }

        res.status(400).json({
          success: false,
          message: error.message,
        });
        return;
      }

      res.status(500).json({
        success: false,
        message: 'An unexpected error occurred',
      });
    }
  }
}

// Export a singleton instance
export const productController = new ProductController();
