import db from '../db/postgres';
import { User, Permission, UserCredentials } from '../types';
import { PoolClient } from 'pg';

// Type for user creation data
interface CreateUserData {
  employee_id: string;
  first_name: string;
  last_name: string;
  email: string;
  organisation_id?: number;
  department_id?: number;
  rank?: string;
  primary_role_id: number;
  password: string; // Plain password, will be hashed
}

// Type for user update data
interface UpdateUserData {
  employee_id?: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  organisation_id?: number;
  department_id?: number;
  rank?: string;
  primary_role_id?: number;
  is_active?: boolean;
}

// Type for user with reset token data
interface UserWithResetToken extends User {
  password_reset_token: string;
  password_reset_expires: Date;
}

const userModel = {
  async findByEmail(email: string): Promise<User | null> {
    const result = await db.query<User & { role_name: string }>(
      'SELECT u.*, r.name as role_name FROM users u ' +
      'LEFT JOIN roles r ON u.primary_role_id = r.id ' +
      'WHERE u.email = $1',
      [email]
    );
    return result.rows[0] || null;
  },
  
  async findById(id: number): Promise<User | null> {
    const result = await db.query<User & { role_name: string }>(
      'SELECT u.*, r.name as role_name FROM users u ' +
      'LEFT JOIN roles r ON u.primary_role_id = r.id ' +
      'WHERE u.id = $1',
      [id]
    );
    return result.rows[0] || null;
  },
  
  async getUserCredentials(userId: number): Promise<UserCredentials | null> {
    const result = await db.query<UserCredentials>(
      'SELECT * FROM user_credentials WHERE user_id = $1',
      [userId]
    );
    return result.rows[0] || null;
  },
  
  async create(userData: CreateUserData): Promise<User> {
    const passwordService = (await import('../services/passwordService')).default;
    
    return db.transaction(async (client: PoolClient) => {
      // Create user
      const userResult = await client.query<User>(
        `INSERT INTO users 
        (employee_id, first_name, last_name, email, organisation_id, department_id, 
        rank, primary_role_id, is_active)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *`,
        [
          userData.employee_id,
          userData.first_name,
          userData.last_name,
          userData.email,
          userData.organisation_id || null,
          userData.department_id || null,
          userData.rank || null,
          userData.primary_role_id,
          true
        ]
      );
      
      const user = userResult.rows[0];
      
      // Create user credentials with secure password hashing
      const passwordHash = await passwordService.hashPassword(userData.password);
      
      await client.query(
        `INSERT INTO user_credentials (user_id, password_hash)
        VALUES ($1, $2)`,
        [user.id, passwordHash]
      );
      
      return user;
    });
  },
  

  /**
   * Find all users
   */
  async findAll(): Promise<User[]> {
    const result = await db.query<User & { role_name: string }>(
      'SELECT u.*, r.name as role_name FROM users u ' +
      'LEFT JOIN roles r ON u.primary_role_id = r.id ' +
      'ORDER BY u.last_name, u.first_name',
      []
    );
    return result.rows;
  },

  /**
   * Find user by employee ID
   */
  async findByEmployeeId(employeeId: string): Promise<User | null> {
    const result = await db.query<User & { role_name: string }>(
      'SELECT u.*, r.name as role_name FROM users u ' +
      'LEFT JOIN roles r ON u.primary_role_id = r.id ' +
      'WHERE u.employee_id = $1',
      [employeeId]
    );
    return result.rows[0] || null;
  },

  /**
   * Update user
   */
  async update(userId: number, userData: UpdateUserData): Promise<User> {
    // Create SET clause and parameters for dynamic updates
    const updateFields: string[] = [];
    const queryParams: any[] = [];
    let paramCount = 1;

    // Add each field that is present to the update
    if (userData.employee_id !== undefined) {
      updateFields.push(`employee_id = $${paramCount++}`);
      queryParams.push(userData.employee_id);
    }
    if (userData.first_name !== undefined) {
      updateFields.push(`first_name = $${paramCount++}`);
      queryParams.push(userData.first_name);
    }
    if (userData.last_name !== undefined) {
      updateFields.push(`last_name = $${paramCount++}`);
      queryParams.push(userData.last_name);
    }
    if (userData.email !== undefined) {
      updateFields.push(`email = $${paramCount++}`);
      queryParams.push(userData.email);
    }
    if (userData.organisation_id !== undefined) {
      updateFields.push(`organisation_id = $${paramCount++}`);
      queryParams.push(userData.organisation_id);
    }
    if (userData.department_id !== undefined) {
      updateFields.push(`department_id = $${paramCount++}`);
      queryParams.push(userData.department_id);
    }
    if (userData.rank !== undefined) {
      updateFields.push(`rank = $${paramCount++}`);
      queryParams.push(userData.rank);
    }
    if (userData.primary_role_id !== undefined) {
      updateFields.push(`primary_role_id = $${paramCount++}`);
      queryParams.push(userData.primary_role_id);
    }
    if (userData.is_active !== undefined) {
      updateFields.push(`is_active = $${paramCount++}`);
      queryParams.push(userData.is_active);
    }

    // Always update the updated_at timestamp
    updateFields.push(`updated_at = $${paramCount++}`);
    queryParams.push(new Date());

    // Add the user ID as the last parameter
    queryParams.push(userId);

    const result = await db.query<User>(
      `UPDATE users
       SET ${updateFields.join(', ')}
       WHERE id = $${paramCount}
       RETURNING *`,
      queryParams
    );

    return result.rows[0];
  },

  /**
   * Delete user
   */
  async delete(userId: number): Promise<void> {
    // Using a transaction to ensure all related records are deleted
    await db.transaction(async (client: PoolClient) => {
      // Delete from user_credentials first (foreign key constraint)
      await client.query(
        'DELETE FROM user_credentials WHERE user_id = $1',
        [userId]
      );

      // Delete from user_roles (foreign key constraint)
      await client.query(
        'DELETE FROM user_roles WHERE user_id = $1',
        [userId]
      );

      // Finally delete the user
      await client.query(
        'DELETE FROM users WHERE id = $1',
        [userId]
      );
    });
  },

  /**
   * Update user password
   */
  async updatePassword(userId: number, passwordHash: string): Promise<void> {
    await db.query(
      `UPDATE user_credentials
       SET password_hash = $1, 
           updated_at = $2,
           password_reset_token = NULL,
           password_reset_expires = NULL
       WHERE user_id = $3`,
      [passwordHash, new Date(), userId]
    );
  },

  /**
   * Save password reset token
   */
  async saveResetToken(userId: number, token: string, expires: Date): Promise<void> {
    await db.query(
      `UPDATE user_credentials
       SET password_reset_token = $1,
           password_reset_expires = $2,
           updated_at = $3
       WHERE user_id = $4`,
      [token, expires, new Date(), userId]
    );
  },

  /**
   * Find user by reset token
   */
  async findByResetToken(token: string): Promise<UserWithResetToken | null> {
    const result = await db.query<UserWithResetToken>(
      `SELECT u.*, uc.password_reset_token, uc.password_reset_expires
       FROM users u
       INNER JOIN user_credentials uc ON u.id = uc.user_id
       WHERE uc.password_reset_token = $1`,
      [token]
    );
    return result.rows[0] || null;
  },

  /**
   * Reset password and clear token
   */
  async resetPassword(userId: number, passwordHash: string): Promise<void> {
    await db.query(
      `UPDATE user_credentials
       SET password_hash = $1,
           password_reset_token = NULL,
           password_reset_expires = NULL,
           updated_at = $2
       WHERE user_id = $3`,
      [passwordHash, new Date(), userId]
    );
  },

  /**
   * Get password history for a user
   */
  async getPasswordHistory(userId: number, limit: number): Promise<string[]> {
    const result = await db.query<{ password_hash: string }>(
      `SELECT password_hash 
       FROM password_history 
       WHERE user_id = $1 
       ORDER BY created_at DESC 
       LIMIT $2`,
      [userId, limit]
    );
    return result.rows.map(row => row.password_hash);
  },

  /**
   * Invalidate all sessions for a user
   */
  async invalidateSessions(userId: number): Promise<void> {
    await db.query(
      'UPDATE sessions SET is_valid = false WHERE user_id = $1',
      [userId]
    );
  },

  /**
   * Get recent password reset request
   */
  async getRecentResetRequest(userId: number): Promise<{ password_reset_expires: Date } | null> {
    const result = await db.query<{ password_reset_expires: Date }>(
      `SELECT password_reset_expires 
       FROM user_credentials 
       WHERE user_id = $1 
       AND password_reset_token IS NOT NULL 
       AND password_reset_expires > NOW()`,
      [userId]
    );
    return result.rows[0] || null;
  },

  /**
   * Get user permissions
   */
  async getUserPermissions(userId: number): Promise<Permission[]> {
    const result = await db.query<Permission>(
      `SELECT p.* FROM permissions p
       INNER JOIN role_permissions rp ON p.id = rp.permission_id
       INNER JOIN users u ON rp.role_id = u.primary_role_id
       WHERE u.id = $1`,
      [userId]
    );
    return result.rows;
  },

  /**
   * Find all users with detailed information (for admin)
   */
  async findAllWithDetails(): Promise<any[]> {
    const result = await db.query(
      `SELECT u.id, u.employee_id, u.first_name, u.last_name, u.email, 
              u.rank, u.is_active, u.last_login, u.created_at, u.updated_at,
              r.id as role_id, r.name as role_name, r.description as role_description,
              d.id as department_id, d.name as department_name, d.department_code,
              o.id as organisation_id, o.name as organisation_name
       FROM users u
       LEFT JOIN roles r ON u.primary_role_id = r.id
       LEFT JOIN departments d ON u.department_id = d.id
       LEFT JOIN organisations o ON u.organisation_id = o.id
       ORDER BY u.last_name, u.first_name`,
      []
    );
    
    return result.rows.map(row => {
      // Format the user data for a cleaner response
      return {
        id: row.id,
        employee_id: row.employee_id,
        first_name: row.first_name,
        last_name: row.last_name,
        email: row.email,
        rank: row.rank,
        is_active: row.is_active,
        last_login: row.last_login,
        created_at: row.created_at,
        updated_at: row.updated_at,
        role: {
          id: row.role_id,
          name: row.role_name,
          description: row.role_description
        },
        department: row.department_id ? {
          id: row.department_id,
          name: row.department_name,
          code: row.department_code
        } : null,
        organisation: row.organisation_id ? {
          id: row.organisation_id,
          name: row.organisation_name
        } : null
      };
    });
  },

  /**
   * Update user's last login timestamp
   */
  async updateLastLogin(userId: number): Promise<void> {
    await db.query(
      `UPDATE users
       SET last_login = NOW(),
           updated_at = NOW()
       WHERE id = $1`,
      [userId]
    );
  }
};
export default userModel;