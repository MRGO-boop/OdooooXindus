import { Router, Request, Response } from 'express';
import { OrderLineService } from '../services/OrderLineService';
import { SubscriptionService } from '../services/SubscriptionService';
import { validate } from '../middleware/validation.middleware';
import { jwtAuthGuard } from '../middleware/auth.middleware';
import { requireInternal, UserRole } from '../middleware/roles.middleware';
import {
  CreateOrderLineDtoSchema,
  UpdateOrderLineDtoSchema,
} from '../dtos/subscription.dto';

/**
 * OrderLineController handles order line management HTTP endpoints
 * 
 * Implements Requirements:
 * - 10.5: Order line CRUD operations
 * - 10.6: Validate required fields
 * - 21.2: Clear and actionable error messages
 * - 4.2, 4.3, 4.4: Role-based access control
 */
export class OrderLineController {
  public router: Router;
  private orderLineService: OrderLineService;
  private subscriptionService: SubscriptionService;

  constructor(orderLineService?: OrderLineService, subscriptionService?: SubscriptionService) {
    this.router = Router();
    this.orderLineService = orderLineService || new OrderLineService();
    this.subscriptionService = subscriptionService || new SubscriptionService();
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    // All order line routes require authentication
    this.router.use(jwtAuthGuard());

    /**
     * POST /order-lines
     * Creates a new order line
     * Admin and Internal_User can create for any subscription
     * Portal_User can only create for their own subscriptions
     * Implements Requirement 10.5, 10.6
     */
    this.router.post('/', validate(CreateOrderLineDtoSchema), this.create.bind(this));

    /**
     * GET /order-lines/subscription/:subscription_id
     * Retrieves order lines by subscription ID
     * Admin and Internal_User can access any subscription's order lines
     * Portal_User can only access their own subscription's order lines
     * Implements Requirement 10.5
     */
    this.router.get('/subscription/:subscription_id', this.findBySubscription.bind(this));

    /**
     * GET /order-lines/:id
     * Retrieves an order line by ID
     * Admin and Internal_User can access any order line
     * Portal_User can only access order lines from their own subscriptions
     * Implements Requirement 10.5
     */
    this.router.get('/:id', this.findOne.bind(this));

    /**
     * PUT /order-lines/:id
     * Updates an order line
     * Admin and Internal_User can update any order line
     * Portal_User can only update order lines from their own subscriptions
     * Implements Requirement 10.5
     */
    this.router.put('/:id', validate(UpdateOrderLineDtoSchema), this.update.bind(this));

    /**
     * DELETE /order-lines/:id
     * Deletes an order line
     * Admin and Internal_User only
     * Implements Requirement 10.5
     */
    this.router.delete('/:id', requireInternal(), this.delete.bind(this));
  }

  /**
   * Checks if a Portal_User owns the subscription associated with an order line
   */
  private async checkOrderLineOwnership(orderLineId: string, userId: string): Promise<boolean> {
    const orderLine = this.orderLineService.findOne(orderLineId);
    if (!orderLine || !orderLine.subscription_id) {
      return false;
    }

    const subscription = this.subscriptionService.findOne(orderLine.subscription_id);
    return subscription?.user_id === userId;
  }

  /**
   * Create order line endpoint handler
   */
  private async create(req: Request, res: Response): Promise<void> {
    try {
      const {
        product_id,
        product_variant_id,
        quantity,
        unit_price,
        amount,
        subscription_id,
        invoice_id,
        tax_ids,
      } = req.body;
      const currentUser = req.user!;

      // Portal_User can only create order lines for their own subscriptions
      if (currentUser.role === UserRole.Portal_User && subscription_id) {
        const subscription = this.subscriptionService.findOne(subscription_id);
        if (!subscription || subscription.user_id !== currentUser.userId) {
          res.status(403).json({
            success: false,
            message: 'Portal users can only create order lines for their own subscriptions',
          });
          return;
        }
      }

      const orderLine = await this.orderLineService.create(
        product_id,
        quantity,
        unit_price,
        amount,
        subscription_id,
        invoice_id,
        product_variant_id
      );

      // Associate taxes if provided
      if (tax_ids && tax_ids.length > 0) {
        await this.orderLineService.associateTaxes(orderLine.id, tax_ids);
      }

      res.status(201).json({
        success: true,
        message: 'Order line created successfully',
        data: orderLine,
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
   * Find order lines by subscription endpoint handler
   */
  private async findBySubscription(req: Request, res: Response): Promise<void> {
    try {
      const { subscription_id } = req.params;
      const currentUser = req.user!;

      // Portal_User can only access their own subscription's order lines
      if (currentUser.role === UserRole.Portal_User) {
        const subscription = this.subscriptionService.findOne(subscription_id as string);
        if (!subscription || subscription.user_id !== currentUser.userId) {
          res.status(403).json({
            success: false,
            message: 'Access denied',
          });
          return;
        }
      }

      const orderLines = this.orderLineService.findBySubscription(subscription_id as string);

      res.status(200).json({
        success: true,
        data: orderLines,
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
   * Find one order line endpoint handler
   */
  private async findOne(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const currentUser = req.user!;

      const orderLine = this.orderLineService.findOne(id as string);

      if (!orderLine) {
        res.status(404).json({
          success: false,
          message: 'Order line not found',
        });
        return;
      }

      // Portal_User can only access order lines from their own subscriptions
      if (currentUser.role === UserRole.Portal_User) {
        const hasAccess = await this.checkOrderLineOwnership(id as string, currentUser.userId);
        if (!hasAccess) {
          res.status(403).json({
            success: false,
            message: 'Access denied',
          });
          return;
        }
      }

      res.status(200).json({
        success: true,
        data: orderLine,
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
   * Update order line endpoint handler
   */
  private async update(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const updates = req.body;
      const currentUser = req.user!;

      // Portal_User can only update order lines from their own subscriptions
      if (currentUser.role === UserRole.Portal_User) {
        const hasAccess = await this.checkOrderLineOwnership(id as string, currentUser.userId);
        if (!hasAccess) {
          res.status(403).json({
            success: false,
            message: 'Access denied',
          });
          return;
        }
      }

      const orderLine = await this.orderLineService.update(id as string, updates);

      // Update taxes if provided
      if (updates.tax_ids !== undefined) {
        await this.orderLineService.associateTaxes(orderLine.id, updates.tax_ids);
      }

      res.status(200).json({
        success: true,
        message: 'Order line updated successfully',
        data: orderLine,
      });
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('not found')) {
          res.status(404).json({
            success: false,
            message: 'Order line not found',
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
   * Delete order line endpoint handler
   */
  private async delete(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      await this.orderLineService.delete(id as string);

      res.status(200).json({
        success: true,
        message: 'Order line deleted successfully',
      });
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('not found')) {
          res.status(404).json({
            success: false,
            message: 'Order line not found',
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
export const orderLineController = new OrderLineController();
