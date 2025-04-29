import { Request, Response } from 'express';
import db from '../db/postgres';
import permissionService from '../services/permissionService';
import { Role, Permission } from '../types';

/**
 * Get all roles
 */
export const getRoles = async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await db.query<Role>('SELECT * FROM roles ORDER BY name');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching roles:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Get role by ID
 */
export const getRoleById = async (req: Request, res: Response): Promise<void> => {
  try {
    const roleId = parseInt(req.params.id);
    
    if (isNaN(roleId)) {
      res.status(400).json({ message: 'Invalid role ID' });
      return;
    }
    
    const result = await db.query<Role>('SELECT * FROM roles WHERE id = $1', [roleId]);
    
    if (result.rows.length === 0) {
      res.status(404).json({ message: 'Role not found' });
      return;
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching role:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Create a new role
 */
export const createRole = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, description } = req.body;
    
    if (!name) {
      res.status(400).json({ message: 'Role name is required' });
      return;
    }
    
    // Check if role with same name already exists
    const existingRole = await db.query<Role>('SELECT * FROM roles WHERE name = $1', [name]);
    if (existingRole.rows.length > 0) {
      res.status(409).json({ message: 'Role with this name already exists' });
      return;
    }
    
    // Create role
    const result = await db.query<Role>(
      'INSERT INTO roles (name, description) VALUES ($1, $2) RETURNING *',
      [name, description || null]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating role:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Update a role
 */
export const updateRole = async (req: Request, res: Response): Promise<void> => {
  try {
    const roleId = parseInt(req.params.id);
    const { name, description } = req.body;
    
    if (isNaN(roleId)) {
      res.status(400).json({ message: 'Invalid role ID' });
      return;
    }
    
    if (!name) {
      res.status(400).json({ message: 'Role name is required' });
      return;
    }
    
    // Check if role exists
    const existingRole = await db.query<Role>('SELECT * FROM roles WHERE id = $1', [roleId]);
    if (existingRole.rows.length === 0) {
      res.status(404).json({ message: 'Role not found' });
      return;
    }
    
    // Check if name already exists (for a different role)
    if (name !== existingRole.rows[0].name) {
      const nameCheck = await db.query<Role>('SELECT * FROM roles WHERE name = $1', [name]);
      if (nameCheck.rows.length > 0) {
        res.status(409).json({ message: 'Role with this name already exists' });
        return;
      }
    }
    
    // Update role
    const result = await db.query<Role>(
      'UPDATE roles SET name = $1, description = $2, updated_at = $3 WHERE id = $4 RETURNING *',
      [name, description || null, new Date(), roleId]
    );
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating role:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Delete a role
 */
export const deleteRole = async (req: Request, res: Response): Promise<void> => {
  try {
    const roleId = parseInt(req.params.id);
    
    if (isNaN(roleId)) {
      res.status(400).json({ message: 'Invalid role ID' });
      return;
    }
    
    // Check if role exists
    const existingRole = await db.query<Role>('SELECT * FROM roles WHERE id = $1', [roleId]);
    if (existingRole.rows.length === 0) {
      res.status(404).json({ message: 'Role not found' });
      return;
    }
    
    // Check if any users have this role as primary role
    const usersWithRole = await db.query<{ count: string }>(
      'SELECT COUNT(*) FROM users WHERE primary_role_id = $1',
      [roleId]
    );
    
    if (parseInt(usersWithRole.rows[0].count) > 0) {
      res.status(409).json({ 
        message: 'Cannot delete role while it is assigned as primary role to users' 
      });
      return;
    }
    
    // Delete role (this will cascade to delete role_permissions)
    await db.query('DELETE FROM roles WHERE id = $1', [roleId]);
    
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting role:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Get role permissions
 */
export const getRolePermissions = async (req: Request, res: Response): Promise<void> => {
  try {
    const roleId = parseInt(req.params.id);
    
    if (isNaN(roleId)) {
      res.status(400).json({ message: 'Invalid role ID' });
      return;
    }
    
    // Check if role exists
    const existingRole = await db.query<Role>('SELECT * FROM roles WHERE id = $1', [roleId]);
    if (existingRole.rows.length === 0) {
      res.status(404).json({ message: 'Role not found' });
      return;
    }
    
    // Get permissions
    const permissions = await permissionService.getRolePermissions(roleId);
    
    res.json(permissions);
  } catch (error) {
    console.error('Error fetching role permissions:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Update role permissions
 */
export const updateRolePermissions = async (req: Request, res: Response): Promise<void> => {
  try {
    const roleId = parseInt(req.params.id);
    const { permissionIds } = req.body;
    
    if (isNaN(roleId)) {
      res.status(400).json({ message: 'Invalid role ID' });
      return;
    }
    
    if (!Array.isArray(permissionIds)) {
      res.status(400).json({ message: 'Permission IDs must be an array' });
      return;
    }
    
    // Check if role exists
    const existingRole = await db.query<Role>('SELECT * FROM roles WHERE id = $1', [roleId]);
    if (existingRole.rows.length === 0) {
      res.status(404).json({ message: 'Role not found' });
      return;
    }
    
    // Check if all permission IDs exist
    const allPermissions = await db.query<Permission>('SELECT id FROM permissions');
    const validPermissionIds = new Set(allPermissions.rows.map(p => p.id));
    
    const invalidIds = permissionIds.filter(id => !validPermissionIds.has(id));
    if (invalidIds.length > 0) {
      res.status(400).json({ 
        message: 'Invalid permission IDs', 
        invalidIds 
      });
      return;
    }
    
    // Update permissions using a transaction
    await db.transaction(async (client) => {
      // Delete all existing role permissions
      await client.query('DELETE FROM role_permissions WHERE role_id = $1', [roleId]);
      
      // Insert new role permissions
      if (permissionIds.length > 0) {
        const values = permissionIds.map((permId, index) => 
          `($1, $${index + 2})`
        ).join(', ');
        
        const params = [roleId, ...permissionIds];
        
        await client.query(
          `INSERT INTO role_permissions (role_id, permission_id) VALUES ${values}`,
          params
        );
      }
    });
    
    // Get updated permissions
    const updatedPermissions = await permissionService.getRolePermissions(roleId);
    
    res.json(updatedPermissions);
  } catch (error) {
    console.error('Error updating role permissions:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Get all permissions
 */
export const getAllPermissions = async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await db.query<Permission>(
      'SELECT * FROM permissions ORDER BY resource, action'
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching permissions:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};