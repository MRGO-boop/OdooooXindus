import { Router, Request, Response } from 'express';
import { QuotationTemplateService } from '../services/QuotationTemplateService';
import { validate } from '../middleware/validation.middleware';
import { jwtAuthGuard } from '../middleware/auth.middleware';
import { requireInternal } from '../middleware/roles.middleware';
import {
  CreateQuotationTemplateDtoSchema,
  UpdateQuotationTemplateDtoSchema,
  CreateSubscriptionFromTemplateDtoSchema,
} from '../dtos/subscription.dto';

/**
 * QuotationTemplateController handles quotation template management HTTP endpoints
 * 
 * Implements Requirements:
 * - 11.1: Quotation template CRUD operations
 * - 11.2: Store predefined products and pricing
 * - 11.3: Create subscriptions from templates
 * - 21.2: Clear and actionable error messages
 * - 4.2, 4.3: Admin and Internal_User access only
 */
export class QuotationTemplateController {
  public router: Router;
  private quotationTemplateService: QuotationTemplateService;

  constructor(quotationTemplateService?: QuotationTemplateService) {
    this.router = Router();
    this.quotationTemplateService = quotationTemplateService || new QuotationTemplateService();
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    // All quotation template routes require authentication and Admin/Internal_User role
    this.router.use(jwtAuthGuard());
    this.router.use(requireInternal());

    /**
     * POST /quotation-templates
     * Creates a new quotation template
     * Implements Requirement 11.1, 11.2
     */
    this.router.post('/', validate(CreateQuotationTemplateDtoSchema), this.create.bind(this));

    /**
     * POST /quotation-templates/create-subscription
     * Creates a subscription from a template
     * Implements Requirement 11.3
     */
    this.router.post(
      '/create-subscription',
      validate(CreateSubscriptionFromTemplateDtoSchema),
      this.createSubscriptionFromTemplate.bind(this)
    );

    /**
     * GET /quotation-templates
     * Retrieves all quotation templates
     * Implements Requirement 11.1
     */
    this.router.get('/', this.findAll.bind(this));

    /**
     * GET /quotation-templates/:id
     * Retrieves a quotation template by ID
     * Implements Requirement 11.1
     */
    this.router.get('/:id', this.findOne.bind(this));

    /**
     * PUT /quotation-templates/:id
     * Updates a quotation template
     * Implements Requirement 11.1
     */
    this.router.put('/:id', validate(UpdateQuotationTemplateDtoSchema), this.update.bind(this));

    /**
     * DELETE /quotation-templates/:id
     * Deletes a quotation template
     * Implements Requirement 11.1
     */
    this.router.delete('/:id', this.delete.bind(this));
  }

  /**
   * Create quotation template endpoint handler
   */
  private async create(req: Request, res: Response): Promise<void> {
    try {
      const { name, description, template_data } = req.body;

      const template = await this.quotationTemplateService.create(name, template_data, description);

      res.status(201).json({
        success: true,
        message: 'Quotation template created successfully',
        data: template,
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
   * Find all quotation templates endpoint handler
   */
  private async findAll(_req: Request, res: Response): Promise<void> {
    try {
      const templates = this.quotationTemplateService.findAll();

      res.status(200).json({
        success: true,
        data: templates,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'An unexpected error occurred',
      });
    }
  }

  /**
   * Find one quotation template endpoint handler
   */
  private async findOne(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const template = this.quotationTemplateService.findOne(id as string);

      if (!template) {
        res.status(404).json({
          success: false,
          message: 'Quotation template not found',
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: template,
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
   * Update quotation template endpoint handler
   */
  private async update(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const updates = req.body;

      const template = await this.quotationTemplateService.update(id as string, updates);

      res.status(200).json({
        success: true,
        message: 'Quotation template updated successfully',
        data: template,
      });
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('not found')) {
          res.status(404).json({
            success: false,
            message: 'Quotation template not found',
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
   * Delete quotation template endpoint handler
   */
  private async delete(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      await this.quotationTemplateService.delete(id as string);

      res.status(200).json({
        success: true,
        message: 'Quotation template deleted successfully',
      });
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('not found')) {
          res.status(404).json({
            success: false,
            message: 'Quotation template not found',
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
   * Create subscription from template endpoint handler
   */
  private async createSubscriptionFromTemplate(req: Request, res: Response): Promise<void> {
    try {
      const { template_id, user_id, start_date, end_date } = req.body;

      const subscription = await this.quotationTemplateService.createSubscriptionFromTemplate(
        template_id,
        user_id,
        start_date,
        end_date
      );

      res.status(201).json({
        success: true,
        message: 'Subscription created from template successfully',
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
}

// Export a singleton instance
export const quotationTemplateController = new QuotationTemplateController();
