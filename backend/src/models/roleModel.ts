import db from '../db/postgres';
import { PoolClient } from 'pg';
import { Role, Permission } from '../types';

// Type for role creation data
interface CreateRoleData {
  name: string;
  description?: string;
}

// Type for role update data
interface UpdateRoleData {
  name?: string;
  description?: string;
}

const roleModel = {
  /**
   * Find role by ID
   */
  async findById(id: number): Promise<Role | null> {
    const result = await db.query<Role>(
      'SELECT * FROM roles WHERE id = $1',
      [id]
    );
    return result.rows[0] || null;
  },

  /**
   * Find all roles
   */
  async findAll(
    limit = 50,
    offset = 0,
    orderBy = 'name',
    direction = 'ASC'
  ): Promise<{ roles: Role[]; total: number }> {
    // Get total count first
    const countResult = await db.query<{ count: string }>(
      'SELECT COUNT(*) as count FROM roles',
      []
    );
    
    const total = parseInt(countResult.rows[0].count, 10);
    
    // Validate order by field to prevent SQL injection
    const validOrderByFields = ['id', 'name', 'created_at', 'updated_at'];
    if (!validOrderByFields.includes(orderBy)) {
      orderBy = 'name';
    }
    
    // Validate direction
    const validDirections = ['ASC', 'DESC'];
    const sqlDirection = validDirections.includes(direction.toUpperCase()) 
      ? direction.toUpperCase() 
      : 'ASC';
    
    // Get roles with pagination
    const result = await db.query<Role>(
      `SELECT * FROM roles
       ORDER BY ${orderBy} ${sqlDirection}
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );
    
    return {
      roles: result.rows,
      total
    };
  },

  /**
   * Create a new role
   */
  async create(data: CreateRoleData): Promise<Role> {
    const result = await db.query<Role>(
      `INSERT INTO roles (name, description)
       VALUES ($1, $2)
       RETURNING *`,
      [data.name, data.description || null]
    );
    
    return result.rows[0];
  },

  /**
   * Update a role
   */
  async update(id: number, data: UpdateRoleData): Promise<Role | null> {
    // Only update if there's something to update
    if (Object.keys(data).length === 0) {
      return this.findById(id);
    }
    
    // Build the query dynamically
    const updateFields: string[] = [];
    const queryParams: any[] = [];
    let paramIndex = 1;
    
    if (data.name !== undefined) {
      updateFields.push(`name = $${paramIndex}`);
      queryParams.push(data.name);
      paramIndex++;
    }
    
    if (data.description !== undefined) {
      updateFields.push(`description = $${paramIndex}`);
      queryParams.push(data.description);
      paramIndex++;
    }
    
    // Always update the updated_at timestamp
    updateFields.push(`updated_at = $${paramIndex}`);
    queryParams.push(new Date());
    paramIndex++;
    
    // Add the ID as the last parameter
    queryParams.push(id);
    
    const result = await db.query<Role>(
      `UPDATE roles
       SET ${updateFields.join(', ')}
       WHERE id = $${paramIndex}
       RETURNING *`,
      queryParams
    );
    
    return result.rows[0] || null;
  },

  /**
   * Delete a role
   */
  async delete(id: number): Promise<boolean> {
    return db.transaction(async (client: PoolClient) => {
      // Check if there are users with this role as primary
      const usersCheck = await client.query(
        'SELECT COUNT(*) as count FROM users WHERE primary_role_id = $1',
        [id]
      );
      
      if (parseInt(usersCheck.rows[0].count, 10) > 0) {
        // Cannot delete role used as primary by users
        return false;
      }
      
      // Delete role-permission associations
      await client.query(
        'DELETE FROM role_permissions WHERE role_id = $1',
        [id]
      );
      
      // Delete user-role associations (for additional roles)
      await client.query(
        'DELETE FROM user_roles WHERE role_id = $1',
        [id]
      );
      
      // Delete the role
      const result = await client.query(
        'DELETE FROM roles WHERE id = $1',
        [id]
      );
      
      return result.rowCount ? result.rowCount > 0 : false;
    });
  },

  /**
   * Get role permissions
   */
  async getRolePermissions(roleId: number): Promise<Permission[]> {
    const result = await db.query<Permission>(
      `SELECT p.* FROM permissions p
       JOIN role_permissions rp ON p.id = rp.permission_id
       WHERE rp.role_id = $1
       ORDER BY p.resource, p.action`,
      [roleId]
    );
    
    return result.rows;
  },

  /**
   * Add permission to role
   */
  async addPermission(roleId: number, permissionId: number): Promise<void> {
    try {
      await db.query(
        `INSERT INTO role_permissions (role_id, permission_id)
         VALUES ($1, $2)
         ON CONFLICT (role_id, permission_id) DO NOTHING`,
        [roleId, permissionId]
      );
    } catch (error) {
      // Handle foreign key constraint errors
      throw error;
    }
  },

  /**
   * Remove permission from role
   */
  async removePermission(roleId: number, permissionId: number): Promise<boolean> {
    const result = await db.query(
      `DELETE FROM role_permissions
       WHERE role_id = $1 AND permission_id = $2`,
      [roleId, permissionId]
    );
    
    return result.rowCount ? result.rowCount > 0 : false;
  },

  /**
   * Get users with this role
   */
  async getUsersWithRole(roleId: number): Promise<number> {
    const result = await db.query<{ count: string }>(
      `SELECT COUNT(DISTINCT user_id) as count FROM
       (SELECT id as user_id FROM users WHERE primary_role_id = $1
        UNION
        SELECT user_id FROM user_roles WHERE role_id = $1) as users_with_role`,
      [roleId]
    );
    
    return parseInt(result.rows[0].count, 10);
  },

  /**
   * Find role by name
   */
  async findByName(name: string): Promise<Role | null> {
    const result = await db.query<Role>(
      'SELECT * FROM roles WHERE name = $1',
      [name]
    );
    return result.rows[0] || null;
  }
};

export default roleModel; 