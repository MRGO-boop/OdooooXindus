import { Router, Request, Response } from 'express';
import { ProductVariantService } from '../services/ProductVariantService';
import { validate } from '../middleware/validation.middleware';
import { jwtAuthGuard } from '../middleware/auth.middleware';
import { requireInternal } from '../middleware/roles.middleware';
import {
  CreateProductVariantDtoSchema,
  UpdateProductVariantDtoSchema,
} from '../dtos/product.dto';

/**
 * ProductVariantController handles product variant management HTTP endpoints
 * 
 * Implements Requirements:
 * - 8.1-8.4: Product variant CRUD operations
 * - 21.2: Clear and actionable error messages
 * - 4.2, 4.3: Admin and Internal_User access only
 */
export class ProductVariantController {
  public router: Router;
  private productVariantService: ProductVariantService;

  constructor(productVariantService?: ProductVariantService) {
    this.router = Router();
    this.productVariantService = productVariantService || new ProductVariantService();
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    // All product variant routes require authentication and Admin/Internal_User role
    this.router.use(jwtAuthGuard());
    this.router.use(requireInternal());

    /**
     * POST /product-variants
     * Creates a new product variant
     * Implements Requirement 8.1
     */
    this.router.post('/', validate(CreateProductVariantDtoSchema), this.create.bind(this));

    /**
     * GET /product-variants
     * Retrieves all product variants
     * Implements Requirement 8.1
     */
    this.router.get('/', this.findAll.bind(this));

    /**
     * GET /product-variants/product/:productId
     * Retrieves all variants for a specific product
     * Implements Requirement 8.1
     */
    this.router.get('/product/:productId', this.findByProductId.bind(this));

    /**
     * GET /product-variants/:id
     * Retrieves a product variant by ID
     * Implements Requirement 8.1
     */
    this.router.get('/:id', this.findOne.bind(this));

    /**
     * GET /product-variants/:id/price
     * Calculates the final price of a product variant
     * Implements Requirement 8.4
     */
    this.router.get('/:id/price', this.calculatePrice.bind(this));

    /**
     * PUT /product-variants/:id
     * Updates a product variant
     * Implements Requirement 8.1
     */
    this.router.put('/:id', validate(UpdateProductVariantDtoSchema), this.update.bind(this));

    /**
     * DELETE /product-variants/:id
     * Deletes a product variant
     * Implements Requirement 8.1
     */
    this.router.delete('/:id', this.delete.bind(this));
  }

  /**
   * Create product variant endpoint handler
   */
  private async create(req: Request, res: Response): Promise<void> {
    try {
      const { product_id, attributes, extra_price } = req.body;

      const variant = await this.productVariantService.create(
        product_id,
        attributes,
        extra_price
      );

      res.status(201).json({
        success: true,
        message: 'Product variant created successfully',
        data: variant,
      });
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('not found')) {
          res.status(404).json({
            success: false,
            message: error.message,
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
   * Find all product variants endpoint handler
   */
  private async findAll(req: Request, res: Response): Promise<void> {
    try {
      const variants = this.productVariantService.findAll();

      res.status(200).json({
        success: true,
        data: variants,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'An unexpected error occurred',
      });
    }
  }

  /**
   * Find variants by product ID endpoint handler
   */
  private async findByProductId(req: Request, res: Response): Promise<void> {
    try {
      const { productId } = req.params;
      const variants = this.productVariantService.findByProductId(productId);

      res.status(200).json({
        success: true,
        data: variants,
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
   * Find one product variant endpoint handler
   */
  private async findOne(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const variant = this.productVariantService.findOne(id);

      if (!variant) {
        res.status(404).json({
          success: false,
          message: 'Product variant not found',
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: variant,
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
   * Calculate variant price endpoint handler
   */
  private async calculatePrice(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const finalPrice = this.productVariantService.calculatePrice(id);

      res.status(200).json({
        success: true,
        data: { finalPrice },
      });
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('not found')) {
          res.status(404).json({
            success: false,
            message: error.message,
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
   * Update product variant endpoint handler
   */
  private async update(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const updates = req.body;

      const variant = await this.productVariantService.update(id, updates);

      res.status(200).json({
        success: true,
        message: 'Product variant updated successfully',
        data: variant,
      });
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('not found')) {
          res.status(404).json({
            success: false,
            message: 'Product variant not found',
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
   * Delete product variant endpoint handler
   */
  private async delete(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      await this.productVariantService.delete(id);

      res.status(200).json({
        success: true,
        message: 'Product variant deleted successfully',
      });
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('not found')) {
          res.status(404).json({
            success: false,
            message: 'Product variant not found',
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
export const productVariantController = new ProductVariantController();
