import { Router, Request, Response } from 'express';
import { RecurringPlanService } from '../services/RecurringPlanService';
import { validate } from '../middleware/validation.middleware';
import { jwtAuthGuard } from '../middleware/auth.middleware';
import { requireInternal } from '../middleware/roles.middleware';
import {
  CreateRecurringPlanDtoSchema,
  UpdateRecurringPlanDtoSchema,
} from '../dtos/recurring-plan.dto';

/**
 * RecurringPlanController handles recurring plan management HTTP endpoints
 * 
 * Implements Requirements:
 * - 9.1: Recurring plan CRUD operations
 * - 21.2: Clear and actionable error messages
 * - 4.2, 4.3: Admin and Internal_User access only
 */
export class RecurringPlanController {
  public router: Router;
  private recurringPlanService: RecurringPlanService;

  constructor(recurringPlanService?: RecurringPlanService) {
    this.router = Router();
    this.recurringPlanService = recurringPlanService || new RecurringPlanService();
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    // All recurring plan routes require authentication and Admin/Internal_User role
    this.router.use(jwtAuthGuard());
    this.router.use(requireInternal());

    /**
     * POST /recurring-plans
     * Creates a new recurring plan
     * Implements Requirement 9.1
     */
    this.router.post('/', validate(CreateRecurringPlanDtoSchema), this.create.bind(this));

    /**
     * GET /recurring-plans
     * Retrieves all recurring plans
     * Implements Requirement 9.1
     */
    this.router.get('/', this.findAll.bind(this));

    /**
     * GET /recurring-plans/:id
     * Retrieves a recurring plan by ID
     * Implements Requirement 9.1
     */
    this.router.get('/:id', this.findOne.bind(this));

    /**
     * PUT /recurring-plans/:id
     * Updates a recurring plan
     * Implements Requirement 9.1
     */
    this.router.put('/:id', validate(UpdateRecurringPlanDtoSchema), this.update.bind(this));

    /**
     * DELETE /recurring-plans/:id
     * Deletes a recurring plan
     * Implements Requirement 9.1
     */
    this.router.delete('/:id', this.delete.bind(this));
  }

  /**
   * Create recurring plan endpoint handler
   */
  private async create(req: Request, res: Response): Promise<void> {
    try {
      const { name, billing_period, auto_close, closable, pausable, renewable } = req.body;

      const plan = await this.recurringPlanService.create(
        name,
        billing_period,
        auto_close,
        closable,
        pausable,
        renewable
      );

      res.status(201).json({
        success: true,
        message: 'Recurring plan created successfully',
        data: plan,
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
   * Find all recurring plans endpoint handler
   */
  private async findAll(_req: Request, res: Response): Promise<void> {
    try {
      const plans = this.recurringPlanService.findAll();

      res.status(200).json({
        success: true,
        data: plans,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'An unexpected error occurred',
      });
    }
  }

  /**
   * Find one recurring plan endpoint handler
   */
  private async findOne(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const plan = this.recurringPlanService.findOne(id as string);

      if (!plan) {
        res.status(404).json({
          success: false,
          message: 'Recurring plan not found',
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: plan,
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
   * Update recurring plan endpoint handler
   */
  private async update(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const updates = req.body;

      const plan = await this.recurringPlanService.update(id as string, updates);

      res.status(200).json({
        success: true,
        message: 'Recurring plan updated successfully',
        data: plan,
      });
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('not found')) {
          res.status(404).json({
            success: false,
            message: 'Recurring plan not found',
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
   * Delete recurring plan endpoint handler
   */
  private async delete(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      await this.recurringPlanService.delete(id as string);

      res.status(200).json({
        success: true,
        message: 'Recurring plan deleted successfully',
      });
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('not found')) {
          res.status(404).json({
            success: false,
            message: 'Recurring plan not found',
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
export const recurringPlanController = new RecurringPlanController();
