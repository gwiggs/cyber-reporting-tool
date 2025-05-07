import { Request, Response } from 'express';
import { z } from 'zod';
import roleModel from '../models/roleModel';

// Validation schema for creating a role
const createRoleSchema = z.object({
  name: z.string().min(1).max(50).trim(),
  description: z.string().max(255).optional(),
});

// Validation schema for updating a role
const updateRoleSchema = z.object({
  name: z.string().min(1).max(50).trim().optional(),
  description: z.string().max(255).optional(),
});

// Validation schema for pagination and sorting
const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  orderBy: z.enum(['id', 'name', 'created_at', 'updated_at']).default('name'),
  direction: z.enum(['asc', 'desc']).default('asc'),
});

// Validation schema for permission assignments
const permissionAssignmentSchema = z.object({
  permission_id: z.number().int().positive(),
});

const roleController = {
  /**
   * Create a new role
   */
  async create(req: Request, res: Response): Promise<void> {
    try {
      // Validate request body
      const validatedData = createRoleSchema.parse(req.body);
      
      // Check if role with this name already exists
      const existingRole = await roleModel.findByName(validatedData.name);
      if (existingRole) {
        res.status(400).json({
          success: false,
          message: 'A role with this name already exists',
        });
        return;
      }
      
      // Create role
      const role = await roleModel.create(validatedData);
      
      // Return created role
      res.status(201).json({
        success: true,
        data: role,
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
      
      console.error('Error creating role:', error);
      res.status(500).json({
        success: false,
        message: 'An error occurred while creating the role',
      });
    }
  },

  /**
   * Get all roles (public endpoint for registration)
   */
  async getAllPublic(req: Request, res: Response): Promise<void> {
    try {
      // Get only basic role info without permissions
      const { roles } = await roleModel.findAll(100, 0, 'name', 'ASC');
      
      res.status(200).json({
        success: true,
        roles: roles.map(role => ({
          id: role.id,
          name: role.name,
          description: role.description
        }))
      });
    } catch (error) {
      console.error('Error fetching public roles:', error);
      res.status(500).json({
        success: false,
        message: 'An error occurred while fetching roles'
      });
    }
  },

  /**
   * Get role permissions
   */
  async getPermissions(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        res.status(400).json({
          success: false,
          message: 'Invalid role ID'
        });
        return;
      }
      
      // Check if role exists
      const role = await roleModel.findById(id);
      
      if (!role) {
        res.status(404).json({
          success: false,
          message: 'Role not found'
        });
        return;
      }
      
      // Get permissions
      const permissions = await roleModel.getRolePermissions(id);
      
      res.status(200).json({
        success: true,
        data: permissions
      });
    } catch (error) {
      console.error('Error fetching role permissions:', error);
      res.status(500).json({
        success: false,
        message: 'An error occurred while fetching permissions'
      });
    }
  },

  /**
   * Get all roles
   */
  async getAll(req: Request, res: Response): Promise<void> {
    try {
      // Validate and extract query parameters
      const { page, limit, orderBy, direction } = listQuerySchema.parse(req.query);
      
      // Calculate offset
      const offset = (page - 1) * limit;
      
      // Get roles
      const { roles, total } = await roleModel.findAll(
        limit,
        offset,
        orderBy,
        direction
      );
      
      // Calculate pagination info
      const totalPages = Math.ceil(total / limit);
      
      res.status(200).json({
        success: true,
        data: roles,
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
      
      console.error('Error fetching roles:', error);
      res.status(500).json({
        success: false,
        message: 'An error occurred while fetching roles',
      });
    }
  },

  /**
   * Get role by ID
   */
  async getById(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        res.status(400).json({
          success: false,
          message: 'Invalid role ID',
        });
        return;
      }
      
      // Get role
      const role = await roleModel.findById(id);
      
      if (!role) {
        res.status(404).json({
          success: false,
          message: 'Role not found',
        });
        return;
      }
      
      // Get role permissions
      const permissions = await roleModel.getRolePermissions(id);
      
      // Get users count with this role
      const usersCount = await roleModel.getUsersWithRole(id);
      
      res.status(200).json({
        success: true,
        data: {
          ...role,
          permissions,
          users_count: usersCount
        },
      });
    } catch (error) {
      console.error('Error fetching role:', error);
      res.status(500).json({
        success: false,
        message: 'An error occurred while fetching the role',
      });
    }
  },

  /**
   * Update role
   */
  async update(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        res.status(400).json({
          success: false,
          message: 'Invalid role ID',
        });
        return;
      }
      
      // Check if role exists
      const existingRole = await roleModel.findById(id);
      
      if (!existingRole) {
        res.status(404).json({
          success: false,
          message: 'Role not found',
        });
        return;
      }
      
      // Validate request body
      const validatedData = updateRoleSchema.parse(req.body);
      
      // If name is being updated, check it doesn't conflict
      if (validatedData.name && validatedData.name !== existingRole.name) {
        const nameExists = await roleModel.findByName(validatedData.name);
        if (nameExists) {
          res.status(400).json({
            success: false,
            message: 'A role with this name already exists',
          });
          return;
        }
      }
      
      // Update role
      const updatedRole = await roleModel.update(id, validatedData);
      
      res.status(200).json({
        success: true,
        data: updatedRole,
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
      
      console.error('Error updating role:', error);
      res.status(500).json({
        success: false,
        message: 'An error occurred while updating the role',
      });
    }
  },

  /**
   * Delete role
   */
  async delete(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        res.status(400).json({
          success: false,
          message: 'Invalid role ID',
        });
        return;
      }
      
      // Check if role exists
      const existingRole = await roleModel.findById(id);
      
      if (!existingRole) {
        res.status(404).json({
          success: false,
          message: 'Role not found',
        });
        return;
      }
      
      // Delete role
      const result = await roleModel.delete(id);
      
      if (!result) {
        res.status(400).json({
          success: false,
          message: 'Cannot delete role that is assigned to users',
        });
        return;
      }
      
      res.status(200).json({
        success: true,
        message: 'Role deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting role:', error);
      res.status(500).json({
        success: false,
        message: 'An error occurred while deleting the role',
      });
    }
  },

  /**
   * Add permission to role
   */
  async addPermission(req: Request, res: Response): Promise<void> {
    try {
      const roleId = parseInt(req.params.id);
      
      if (isNaN(roleId)) {
        res.status(400).json({
          success: false,
          message: 'Invalid role ID',
        });
        return;
      }
      
      // Check if role exists
      const existingRole = await roleModel.findById(roleId);
      
      if (!existingRole) {
        res.status(404).json({
          success: false,
          message: 'Role not found',
        });
        return;
      }
      
      // Validate request body
      const { permission_id } = permissionAssignmentSchema.parse(req.body);
      
      // Check if permission exists
      const permissionModel = (await import('../models/permissionModel')).default;
      const permission = await permissionModel.findById(permission_id);
      
      if (!permission) {
        res.status(404).json({
          success: false,
          message: 'Permission not found',
        });
        return;
      }
      
      // Add permission to role
      await roleModel.addPermission(roleId, permission_id);
      
      // Get updated permissions
      const permissions = await roleModel.getRolePermissions(roleId);
      
      res.status(200).json({
        success: true,
        message: 'Permission added to role',
        data: {
          role: existingRole,
          permissions
        }
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
      
      console.error('Error adding permission to role:', error);
      res.status(500).json({
        success: false,
        message: 'An error occurred while adding the permission',
      });
    }
  },

  /**
   * Remove permission from role
   */
  async removePermission(req: Request, res: Response): Promise<void> {
    try {
      const roleId = parseInt(req.params.id);
      const permissionId = parseInt(req.params.permissionId);
      
      if (isNaN(roleId) || isNaN(permissionId)) {
        res.status(400).json({
          success: false,
          message: 'Invalid role or permission ID',
        });
        return;
      }
      
      // Check if role exists
      const existingRole = await roleModel.findById(roleId);
      
      if (!existingRole) {
        res.status(404).json({
          success: false,
          message: 'Role not found',
        });
        return;
      }
      
      // Remove permission from role
      const result = await roleModel.removePermission(roleId, permissionId);
      
      if (!result) {
        res.status(404).json({
          success: false,
          message: 'Permission not found for this role',
        });
        return;
      }
      
      // Get updated permissions
      const permissions = await roleModel.getRolePermissions(roleId);
      
      res.status(200).json({
        success: true,
        message: 'Permission removed from role',
        data: {
          role: existingRole,
          permissions
        }
      });
    } catch (error) {
      console.error('Error removing permission from role:', error);
      res.status(500).json({
        success: false,
        message: 'An error occurred while removing the permission',
      });
    }
  }
};

export default roleController;