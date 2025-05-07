import { Request, Response } from 'express';
import { z } from 'zod';
import departmentModel from '../models/departmentModel';

// Validation schema for creating a department
const createDepartmentSchema = z.object({
  organization_id: z.number().int().positive(),
  name: z.string().min(1).max(100).trim(),
  department_code: z.string().max(50).trim().optional(),
});

// Validation schema for updating a department
const updateDepartmentSchema = z.object({
  name: z.string().min(1).max(100).trim().optional(),
  department_code: z.string().max(50).trim().optional(),
});

// Validation schema for pagination and sorting
const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  orderBy: z.enum(['id', 'name', 'department_code', 'organization_id', 'created_at', 'updated_at']).default('name'),
  direction: z.enum(['asc', 'desc']).default('asc'),
});

// Validation schema for organization-specific queries
const orgQuerySchema = z.object({
  organization_id: z.coerce.number().int().positive(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  orderBy: z.enum(['id', 'name', 'department_code', 'created_at', 'updated_at']).default('name'),
  direction: z.enum(['asc', 'desc']).default('asc'),
});

const departmentController = {
  /**
   * Create a new department
   */
  async create(req: Request, res: Response): Promise<void> {
    try {
      // Validate request body
      const validatedData = createDepartmentSchema.parse(req.body);
      
      // Create department
      const department = await departmentModel.create(validatedData);
      
      // Return created department
      res.status(201).json({
        success: true,
        data: department,
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
      
      console.error('Error creating department:', error);
      res.status(500).json({
        success: false,
        message: 'An error occurred while creating the department',
      });
    }
  },

  /**
   * Get all departments
   */
  async getAll(req: Request, res: Response): Promise<void> {
    try {
      // Check if organization_id is provided
      if (req.query.organization_id) {
        // Get departments by organization
        return await departmentController.getByOrganization(req, res);
      }
      
      // Validate and extract query parameters
      const { page, limit, orderBy, direction } = listQuerySchema.parse(req.query);
      
      // Calculate offset
      const offset = (page - 1) * limit;
      
      // Get departments
      const { departments, total } = await departmentModel.findAll(
        limit,
        offset,
        orderBy,
        direction
      );
      
      // Calculate pagination info
      const totalPages = Math.ceil(total / limit);
      
      res.status(200).json({
        success: true,
        data: departments,
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
      
      console.error('Error fetching departments:', error);
      res.status(500).json({
        success: false,
        message: 'An error occurred while fetching departments',
      });
    }
  },

  /**
   * Get departments by organization ID
   */
  async getByOrganization(req: Request, res: Response): Promise<void> {
    try {
      // Validate and extract query parameters
      const { organization_id, page, limit, orderBy, direction } = orgQuerySchema.parse(req.query);
      
      // Calculate offset
      const offset = (page - 1) * limit;
      
      // Get departments for the organization
      const { departments, total } = await departmentModel.findByOrganizationId(
        organization_id,
        limit,
        offset,
        orderBy,
        direction
      );
      
      // Calculate pagination info
      const totalPages = Math.ceil(total / limit);
      
      res.status(200).json({
        success: true,
        data: departments,
        meta: {
          total,
          page,
          limit,
          totalPages,
          hasMore: page < totalPages,
          organization_id,
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
      
      console.error('Error fetching departments by organization:', error);
      res.status(500).json({
        success: false,
        message: 'An error occurred while fetching departments',
      });
    }
  },

  /**
   * Get department by ID
   */
  async getById(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        res.status(400).json({
          success: false,
          message: 'Invalid department ID',
        });
        return;
      }
      
      // Get department
      const department = await departmentModel.findById(id);
      
      if (!department) {
        res.status(404).json({
          success: false,
          message: 'Department not found',
        });
        return;
      }
      
      // Get user count for this department
      const usersCount = await departmentModel.getUsersCount(id);
      
      res.status(200).json({
        success: true,
        data: {
          ...department,
          users_count: usersCount
        },
      });
    } catch (error) {
      console.error('Error fetching department:', error);
      res.status(500).json({
        success: false,
        message: 'An error occurred while fetching the department',
      });
    }
  },

  /**
   * Update department
   */
  async update(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        res.status(400).json({
          success: false,
          message: 'Invalid department ID',
        });
        return;
      }
      
      // Check if department exists
      const existingDept = await departmentModel.findById(id);
      
      if (!existingDept) {
        res.status(404).json({
          success: false,
          message: 'Department not found',
        });
        return;
      }
      
      // Validate request body
      const validatedData = updateDepartmentSchema.parse(req.body);
      
      // Update department
      const updatedDept = await departmentModel.update(id, validatedData);
      
      res.status(200).json({
        success: true,
        data: updatedDept,
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
      
      console.error('Error updating department:', error);
      res.status(500).json({
        success: false,
        message: 'An error occurred while updating the department',
      });
    }
  },

  /**
   * Delete department
   */
  async delete(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        res.status(400).json({
          success: false,
          message: 'Invalid department ID',
        });
        return;
      }
      
      // Check if department exists
      const existingDept = await departmentModel.findById(id);
      
      if (!existingDept) {
        res.status(404).json({
          success: false,
          message: 'Department not found',
        });
        return;
      }
      
      // Delete department
      const result = await departmentModel.delete(id);
      
      if (!result) {
        res.status(400).json({
          success: false,
          message: 'Cannot delete department with users',
        });
        return;
      }
      
      res.status(200).json({
        success: true,
        message: 'Department deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting department:', error);
      res.status(500).json({
        success: false,
        message: 'An error occurred while deleting the department',
      });
    }
  },
};

export default departmentController; 