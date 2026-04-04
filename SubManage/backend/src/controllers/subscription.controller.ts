import { Router, Request, Response } from 'express';
import { SubscriptionService } from '../services/SubscriptionService';
import { validate } from '../middleware/validation.middleware';
import { jwtAuthGuard } from '../middleware/auth.middleware';
import { requireInternal, UserRole } from '../middleware/roles.middleware';
import {
  CreateSubscriptionDtoSchema,
  UpdateSubscriptionDtoSchema,
} from '../dtos/subscription.dto';

/**
 * SubscriptionController handles subscription management HTTP endpoints
 * 
 * Implements Requirements:
 * - 10.1: Subscription CRUD operations
 * - 21.2: Clear and actionable error messages
 * - 4.2, 4.3, 4.4: Role-based access control
 */
export class SubscriptionController {
  public router: Router;
  private subscriptionService: SubscriptionService;

  constructor(subscriptionService?: SubscriptionService) {
    this.router = Router();
    this.subscriptionService = subscriptionService || new SubscriptionService();
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    // All subscription routes require authentication
    this.router.use(jwtAuthGuard());

    /**
     * POST /subscriptions
     * Creates a new subscription
     * Admin and Internal_User can create for any user
     * Portal_User can only create for themselves
     * Implements Requirement 10.1, 10.2
     */
    this.router.post('/', validate(CreateSubscriptionDtoSchema), this.create.bind(this));

    /**
     * GET /subscriptions
     * Retrieves all subscriptions
     * Admin and Internal_User see all subscriptions
     * Portal_User sees only their own subscriptions
     * Implements Requirement 10.1
     */
    this.router.get('/', this.findAll.bind(this));

    /**
     * GET /subscriptions/:id
     * Retrieves a subscription by ID
     * Admin and Internal_User can access any subscription
     * Portal_User can only access their own subscriptions
     * Implements Requirement 10.1
     */
    this.router.get('/:id', this.findOne.bind(this));

    /**
     * PUT /subscriptions/:id
     * Updates a subscription
     * Admin and Internal_User can update any subscription
     * Portal_User can only update their own subscriptions
     * Implements Requirement 10.1, 10.3, 10.4
     */
    this.router.put('/:id', validate(UpdateSubscriptionDtoSchema), this.update.bind(this));

    /**
     * DELETE /subscriptions/:id
     * Deletes a subscription
     * Admin and Internal_User only
     * Implements Requirement 10.1
     */
    this.router.delete('/:id', requireInternal(), this.delete.bind(this));
  }

  /**
   * Create subscription endpoint handler
   */
  private async create(req: Request, res: Response): Promise<void> {
    try {
      const { user_id, recurring_plan_id, start_date, end_date } = req.body;
      const currentUser = req.user!;

      // Portal_User can only create subscriptions for themselves
      if (currentUser.role === UserRole.Portal_User && user_id !== currentUser.userId) {
        res.status(403).json({
          success: false,
          message: 'Portal users can only create subscriptions for themselves',
        });
        return;
      }

      const subscription = await this.subscriptionService.create(
        user_id,
        recurring_plan_id,
        start_date,
        end_date
      );

      res.status(201).json({
        success: true,
        message: 'Subscription created successfully',
        data: subscription,
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
   * Find all subscriptions endpoint handler
   */
  private async findAll(req: Request, res: Response): Promise<void> {
    try {
      const currentUser = req.user!;

      // Portal_User can only see their own subscriptions
      const user_id = currentUser.role === UserRole.Portal_User ? currentUser.userId : undefined;

      const subscriptions = this.subscriptionService.findAll(user_id);

      res.status(200).json({
        success: true,
        data: subscriptions,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'An unexpected error occurred',
      });
    }
  }

  /**
   * Find one subscription endpoint handler
   */
  private async findOne(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const currentUser = req.user!;

      // Portal_User can only access their own subscriptions
      const user_id = currentUser.role === UserRole.Portal_User ? currentUser.userId : undefined;

      const subscription = this.subscriptionService.findOne(id as string, user_id);

      if (!subscription) {
        res.status(404).json({
          success: false,
          message: 'Subscription not found',
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: subscription,
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
   * Update subscription endpoint handler
   */
  private async update(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const updates = req.body;
      const currentUser = req.user!;

      // Portal_User can only update their own subscriptions
      const user_id = currentUser.role === UserRole.Portal_User ? currentUser.userId : undefined;

      const subscription = await this.subscriptionService.update(id as string, updates, user_id);

      res.status(200).json({
        success: true,
        message: 'Subscription updated successfully',
        data: subscription,
      });
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('not found')) {
          res.status(404).json({
            success: false,
            message: 'Subscription not found',
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
   * Delete subscription endpoint handler
   */
  private async delete(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      await this.subscriptionService.delete(id as string);

      res.status(200).json({
        success: true,
        message: 'Subscription deleted successfully',
      });
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('not found')) {
          res.status(404).json({
            success: false,
            message: 'Subscription not found',
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
export const subscriptionController = new SubscriptionController();
