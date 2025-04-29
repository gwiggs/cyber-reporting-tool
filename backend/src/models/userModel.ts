import db from '../db/postgres';
import { User, Permission, UserCredentials } from '../types';
import { PoolClient } from 'pg';

// Type for user creation data
interface CreateUserData {
  employee_id: string;
  first_name: string;
  last_name: string;
  email: string;
  organization_id?: number;
  department_id?: number;
  rank?: string;
  primary_role_id: number;
  password: string; // Plain password, will be hashed
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
    return db.transaction(async (client: PoolClient) => {
      // Create user
      const userResult = await client.query<User>(
        `INSERT INTO users 
        (employee_id, first_name, last_name, email, organization_id, department_id, 
        rank, primary_role_id, is_active)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *`,
        [
          userData.employee_id,
          userData.first_name,
          userData.last_name,
          userData.email,
          userData.organization_id || null,
          userData.department_id || null,
          userData.rank || null,
          userData.primary_role_id,
          true
        ]
      );
      
      const user = userResult.rows[0];
      
      // Create user credentials
      const bcrypt = require('bcrypt');
      const saltRounds = 10;
      const passwordHash = await bcrypt.hash(userData.password, saltRounds);
      
      await client.query(
        `INSERT INTO user_credentials (user_id, password_hash)
        VALUES ($1, $2)`,
        [user.id, passwordHash]
      );
      
      return user;
    });
  },
  
  async getUserPermissions(userId: number): Promise<Permission[]> {
    const result = await db.query<Permission>(
      `SELECT DISTINCT p.id, p.name, p.resource, p.action, p.description, p.created_at, p.updated_at 
      FROM permissions p 
      INNER JOIN role_permissions rp ON p.id = rp.permission_id 
      INNER JOIN roles r ON rp.role_id = r.id
      INNER JOIN users u ON u.primary_role_id = r.id
      WHERE u.id = $1
      UNION
      SELECT DISTINCT p.id, p.name, p.resource, p.action, p.description, p.created_at, p.updated_at 
      FROM permissions p 
      INNER JOIN role_permissions rp ON p.id = rp.permission_id 
      INNER JOIN user_roles ur ON rp.role_id = ur.role_id 
      WHERE ur.user_id = $1`,
      [userId]
    );
    
    return result.rows;
  }
};

export default userModel;