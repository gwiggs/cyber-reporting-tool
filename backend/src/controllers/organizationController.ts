import { Request, Response } from 'express';
import { z } from 'zod';
import organizationModel from '../models/organizationModel';

// Validation schema for creating an organization
const createOrganizationSchema = z.object({
  name: z.string().min(1).max(100).trim(),
});

// Validation schema for updating an organization
const updateOrganizationSchema = z.object({
  name: z.string().min(1).max(100).trim().optional(),
});

// Validation schema for pagination and sorting
const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  orderBy: z.enum(['id', 'name', 'created_at', 'updated_at']).default('name'),
  direction: z.enum(['asc', 'desc']).default('asc'),
});

const organizationController = {
  /**
   * Create a new organization
   */
  async create(req: Request, res: Response): Promise<void> {
    try {
      // Validate request body
      const validatedData = createOrganizationSchema.parse(req.body);
      
      // Create organization
      const organization = await organizationModel.create(validatedData);
      
      // Log action
      // Audit logging would go here
      
      // Return created organization
      res.status(201).json({
        success: true,
        data: organization,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: error.errors,
        });
        return;
      }
      
      console.error('Error creating organization:', error);
      res.status(500).json({
        success: false,
        message: 'An error occurred while creating the organization',
      });
    }
  },

  /**
   * Get all organizations
   */
  async getAll(req: Request, res: Response): Promise<void> {
    try {
      // Validate and extract query parameters
      const { page, limit, orderBy, direction } = listQuerySchema.parse(req.query);
      
      // Calculate offset
      const offset = (page - 1) * limit;
      
      // Get organizations
      const { organizations, total } = await organizationModel.findAll(
        limit,
        offset,
        orderBy,
        direction
      );
      
      // Calculate pagination info
      const totalPages = Math.ceil(total / limit);
      
      res.status(200).json({
        success: true,
        data: organizations,
        meta: {
          total,
          page,
          limit,
          totalPages,
          hasMore: page < totalPages,
        },
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          message: 'Invalid query parameters',
          errors: error.errors,
        });
        return;
      }
      
      console.error('Error fetching organizations:', error);
      res.status(500).json({
        success: false,
        message: 'An error occurred while fetching organizations',
      });
    }
  },

  /**
   * Get organization by ID
   */
  async getById(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        res.status(400).json({
          success: false,
          message: 'Invalid organization ID',
        });
        return;
      }
      
      // Get organization with departments count
      const organization = await organizationModel.getWithDepartmentsCount(id);
      
      if (!organization) {
        res.status(404).json({
          success: false,
          message: 'Organization not found',
        });
        return;
      }
      
      res.status(200).json({
        success: true,
        data: organization,
      });
    } catch (error) {
      console.error('Error fetching organization:', error);
      res.status(500).json({
        success: false,
        message: 'An error occurred while fetching the organization',
      });
    }
  },

  /**
   * Update organization
   */
  async update(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        res.status(400).json({
          success: false,
          message: 'Invalid organization ID',
        });
        return;
      }
      
      // Check if organization exists
      const existingOrg = await organizationModel.findById(id);
      
      if (!existingOrg) {
        res.status(404).json({
          success: false,
          message: 'Organization not found',
        });
        return;
      }
      
      // Validate request body
      const validatedData = updateOrganizationSchema.parse(req.body);
      
      // Update organization
      const updatedOrg = await organizationModel.update(id, validatedData);
      
      // Log action
      // Audit logging would go here
      
      res.status(200).json({
        success: true,
        data: updatedOrg,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: error.errors,
        });
        return;
      }
      
      console.error('Error updating organization:', error);
      res.status(500).json({
        success: false,
        message: 'An error occurred while updating the organization',
      });
    }
  },

  /**
   * Delete organization
   */
  async delete(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        res.status(400).json({
          success: false,
          message: 'Invalid organization ID',
        });
        return;
      }
      
      // Check if organization exists
      const existingOrg = await organizationModel.findById(id);
      
      if (!existingOrg) {
        res.status(404).json({
          success: false,
          message: 'Organization not found',
        });
        return;
      }
      
      // Delete organization
      const result = await organizationModel.delete(id);
      
      if (!result) {
        res.status(400).json({
          success: false,
          message: 'Cannot delete organization with departments or users',
        });
        return;
      }
      
      // Log action
      // Audit logging would go here
      
      res.status(200).json({
        success: true,
        message: 'Organization deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting organization:', error);
      res.status(500).json({
        success: false,
        message: 'An error occurred while deleting the organization',
      });
    }
  },
};

export default organizationController; 