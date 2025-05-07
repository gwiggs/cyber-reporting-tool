import { Request, Response } from 'express';
import { z } from 'zod';
import permissionModel from '../models/permissionModel';

// Validation schema for creating a permission
const createPermissionSchema = z.object({
  name: z.string().min(1).max(100).trim(),
  description: z.string().max(255).optional(),
  resource: z.string().min(1).max(100).trim(),
  action: z.string().min(1).max(50).trim(),
});

// Validation schema for updating a permission
const updatePermissionSchema = z.object({
  name: z.string().min(1).max(100).trim().optional(),
  description: z.string().max(255).optional(),
  resource: z.string().min(1).max(100).trim().optional(),
  action: z.string().min(1).max(50).trim().optional(),
});

// Validation schema for pagination and sorting
const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(100),
  orderBy: z.enum(['id', 'name', 'resource', 'action', 'created_at', 'updated_at']).default('resource'),
  direction: z.enum(['asc', 'desc']).default('asc'),
  resource: z.string().optional(),
});

const permissionController = {
  /**
   * Create a new permission
   */
  async create(req: Request, res: Response): Promise<void> {
    try {
      // Validate request body
      const validatedData = createPermissionSchema.parse(req.body);
      
      // Check if permission with this resource/action already exists
      const existingPerm = await permissionModel.findByResourceAction(
        validatedData.resource,
        validatedData.action
      );
      
      if (existingPerm) {
        res.status(400).json({
          success: false,
          message: 'A permission with this resource and action already exists',
        });
        return;
      }
      
      // Create permission
      const permission = await permissionModel.create(validatedData);
      
      // Return created permission
      res.status(201).json({
        success: true,
        data: permission,
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
      
      console.error('Error creating permission:', error);
      res.status(500).json({
        success: false,
        message: 'An error occurred while creating the permission',
      });
    }
  },

  /**
   * Get all permissions
   */
  async getAll(req: Request, res: Response): Promise<void> {
    try {
      // Validate and extract query parameters
      const parsed = listQuerySchema.parse(req.query);
      const { page, limit, orderBy, direction, resource } = parsed;
      
      // If resource is specified, filter by resource
      if (resource) {
        const permissions = await permissionModel.findByResource(resource);
        
        res.status(200).json({
          success: true,
          data: permissions,
          meta: {
            total: permissions.length,
            resource,
          },
        });
        return;
      }
      
      // Calculate offset
      const offset = (page - 1) * limit;
      
      // Get permissions
      const { permissions, total } = await permissionModel.findAll(
        limit,
        offset,
        orderBy,
        direction
      );
      
      // Calculate pagination info
      const totalPages = Math.ceil(total / limit);
      
      res.status(200).json({
        success: true,
        data: permissions,
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
      
      console.error('Error fetching permissions:', error);
      res.status(500).json({
        success: false,
        message: 'An error occurred while fetching permissions',
      });
    }
  },

  /**
   * Get permission by ID
   */
  async getById(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        res.status(400).json({
          success: false,
          message: 'Invalid permission ID',
        });
        return;
      }
      
      // Get permission
      const permission = await permissionModel.findById(id);
      
      if (!permission) {
        res.status(404).json({
          success: false,
          message: 'Permission not found',
        });
        return;
      }
      
      // Check if permission is in use
      const isInUse = await permissionModel.isInUse(id);
      
      // Get roles with this permission
      const roleIds = await permissionModel.getRolesWithPermission(id);
      
      res.status(200).json({
        success: true,
        data: {
          ...permission,
          is_in_use: isInUse,
          role_count: roleIds.length,
          role_ids: roleIds
        },
      });
    } catch (error) {
      console.error('Error fetching permission:', error);
      res.status(500).json({
        success: false,
        message: 'An error occurred while fetching the permission',
      });
    }
  },

  /**
   * Update permission
   */
  async update(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        res.status(400).json({
          success: false,
          message: 'Invalid permission ID',
        });
        return;
      }
      
      // Check if permission exists
      const existingPerm = await permissionModel.findById(id);
      
      if (!existingPerm) {
        res.status(404).json({
          success: false,
          message: 'Permission not found',
        });
        return;
      }
      
      // Validate request body
      const validatedData = updatePermissionSchema.parse(req.body);
      
      // If changing resource/action, check for conflicts
      if (
        (validatedData.resource && validatedData.resource !== existingPerm.resource) || 
        (validatedData.action && validatedData.action !== existingPerm.action)
      ) {
        // Get the new resource/action values
        const newResource = validatedData.resource || existingPerm.resource;
        const newAction = validatedData.action || existingPerm.action;
        
        // Check for conflicts
        const conflict = await permissionModel.findByResourceAction(newResource, newAction);
        
        if (conflict && conflict.id !== id) {
          res.status(400).json({
            success: false,
            message: 'A permission with this resource and action already exists',
          });
          return;
        }
      }
      
      // Update permission
      const updatedPerm = await permissionModel.update(id, validatedData);
      
      res.status(200).json({
        success: true,
        data: updatedPerm,
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
      
      console.error('Error updating permission:', error);
      res.status(500).json({
        success: false,
        message: 'An error occurred while updating the permission',
      });
    }
  },

  /**
   * Delete permission
   */
  async delete(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        res.status(400).json({
          success: false,
          message: 'Invalid permission ID',
        });
        return;
      }
      
      // Check if permission exists
      const existingPerm = await permissionModel.findById(id);
      
      if (!existingPerm) {
        res.status(404).json({
          success: false,
          message: 'Permission not found',
        });
        return;
      }
      
      // Check if permission is in use
      const isInUse = await permissionModel.isInUse(id);
      
      if (isInUse) {
        res.status(400).json({
          success: false,
          message: 'Cannot delete permission that is assigned to roles',
        });
        return;
      }
      
      // Delete permission
      const result = await permissionModel.delete(id);
      
      if (!result) {
        res.status(500).json({
          success: false,
          message: 'Failed to delete permission',
        });
        return;
      }
      
      res.status(200).json({
        success: true,
        message: 'Permission deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting permission:', error);
      res.status(500).json({
        success: false,
        message: 'An error occurred while deleting the permission',
      });
    }
  },
};

export default permissionController; 