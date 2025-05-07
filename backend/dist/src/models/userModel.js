"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const postgres_1 = __importDefault(require("../db/postgres"));
const userModel = {
    async findByEmail(email) {
        const result = await postgres_1.default.query('SELECT u.*, r.name as role_name FROM users u ' +
            'LEFT JOIN roles r ON u.primary_role_id = r.id ' +
            'WHERE u.email = $1', [email]);
        return result.rows[0] || null;
    },
    async findById(id) {
        const result = await postgres_1.default.query('SELECT u.*, r.name as role_name FROM users u ' +
            'LEFT JOIN roles r ON u.primary_role_id = r.id ' +
            'WHERE u.id = $1', [id]);
        return result.rows[0] || null;
    },
    async getUserCredentials(userId) {
        const result = await postgres_1.default.query('SELECT * FROM user_credentials WHERE user_id = $1', [userId]);
        return result.rows[0] || null;
    },
    async create(userData) {
        const passwordService = (await Promise.resolve().then(() => __importStar(require('../services/passwordService')))).default;
        return postgres_1.default.transaction(async (client) => {
            // Create user
            const userResult = await client.query(`INSERT INTO users 
        (employee_id, first_name, last_name, email, organisation_id, department_id, 
        rank, primary_role_id, is_active)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *`, [
                userData.employee_id,
                userData.first_name,
                userData.last_name,
                userData.email,
                userData.organisation_id || null,
                userData.department_id || null,
                userData.rank || null,
                userData.primary_role_id,
                true
            ]);
            const user = userResult.rows[0];
            // Create user credentials with secure password hashing
            const passwordHash = await passwordService.hashPassword(userData.password);
            await client.query(`INSERT INTO user_credentials (user_id, password_hash)
        VALUES ($1, $2)`, [user.id, passwordHash]);
            return user;
        });
    },
    /**
     * Find all users
     */
    async findAll() {
        const result = await postgres_1.default.query('SELECT u.*, r.name as role_name FROM users u ' +
            'LEFT JOIN roles r ON u.primary_role_id = r.id ' +
            'ORDER BY u.last_name, u.first_name', []);
        return result.rows;
    },
    /**
     * Find user by employee ID
     */
    async findByEmployeeId(employeeId) {
        const result = await postgres_1.default.query('SELECT u.*, r.name as role_name FROM users u ' +
            'LEFT JOIN roles r ON u.primary_role_id = r.id ' +
            'WHERE u.employee_id = $1', [employeeId]);
        return result.rows[0] || null;
    },
    /**
     * Update user
     */
    async update(userId, userData) {
        // Create SET clause and parameters for dynamic updates
        const updateFields = [];
        const queryParams = [];
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
        const result = await postgres_1.default.query(`UPDATE users
       SET ${updateFields.join(', ')}
       WHERE id = $${paramCount}
       RETURNING *`, queryParams);
        return result.rows[0];
    },
    /**
     * Delete user
     */
    async delete(userId) {
        // Using a transaction to ensure all related records are deleted
        await postgres_1.default.transaction(async (client) => {
            // Delete from user_credentials first (foreign key constraint)
            await client.query('DELETE FROM user_credentials WHERE user_id = $1', [userId]);
            // Delete from user_roles (foreign key constraint)
            await client.query('DELETE FROM user_roles WHERE user_id = $1', [userId]);
            // Finally delete the user
            await client.query('DELETE FROM users WHERE id = $1', [userId]);
        });
    },
    /**
     * Update user password
     */
    async updatePassword(userId, passwordHash) {
        await postgres_1.default.query(`UPDATE user_credentials
       SET password_hash = $1, 
           updated_at = $2,
           password_reset_token = NULL,
           password_reset_expires = NULL
       WHERE user_id = $3`, [passwordHash, new Date(), userId]);
    },
    /**
     * Save password reset token
     */
    async saveResetToken(userId, token, expires) {
        await postgres_1.default.query(`UPDATE user_credentials
       SET password_reset_token = $1,
           password_reset_expires = $2,
           updated_at = $3
       WHERE user_id = $4`, [token, expires, new Date(), userId]);
    },
    /**
     * Find user by reset token
     */
    async findByResetToken(token) {
        const result = await postgres_1.default.query(`SELECT u.*, uc.password_reset_token, uc.password_reset_expires
       FROM users u
       INNER JOIN user_credentials uc ON u.id = uc.user_id
       WHERE uc.password_reset_token = $1`, [token]);
        return result.rows[0] || null;
    },
    /**
     * Reset password and clear token
     */
    async resetPassword(userId, passwordHash) {
        await postgres_1.default.query(`UPDATE user_credentials
       SET password_hash = $1,
           password_reset_token = NULL,
           password_reset_expires = NULL,
           updated_at = $2
       WHERE user_id = $3`, [passwordHash, new Date(), userId]);
    },
    /**
     * Get password history for a user
     */
    async getPasswordHistory(userId, limit) {
        const result = await postgres_1.default.query(`SELECT password_hash 
       FROM password_history 
       WHERE user_id = $1 
       ORDER BY created_at DESC 
       LIMIT $2`, [userId, limit]);
        return result.rows.map(row => row.password_hash);
    },
    /**
     * Invalidate all sessions for a user
     */
    async invalidateSessions(userId) {
        await postgres_1.default.query('UPDATE sessions SET is_valid = false WHERE user_id = $1', [userId]);
    },
    /**
     * Get recent password reset request
     */
    async getRecentResetRequest(userId) {
        const result = await postgres_1.default.query(`SELECT password_reset_expires 
       FROM user_credentials 
       WHERE user_id = $1 
       AND password_reset_token IS NOT NULL 
       AND password_reset_expires > NOW()`, [userId]);
        return result.rows[0] || null;
    },
    /**
     * Get user permissions
     */
    async getUserPermissions(userId) {
        const result = await postgres_1.default.query(`SELECT p.* FROM permissions p
       INNER JOIN role_permissions rp ON p.id = rp.permission_id
       INNER JOIN users u ON rp.role_id = u.primary_role_id
       WHERE u.id = $1`, [userId]);
        return result.rows;
    },
    /**
     * Find all users with detailed information (for admin)
     */
    async findAllWithDetails() {
        const result = await postgres_1.default.query(`SELECT u.id, u.employee_id, u.first_name, u.last_name, u.email, 
              u.rank, u.is_active, u.last_login, u.created_at, u.updated_at,
              r.id as role_id, r.name as role_name, r.description as role_description,
              d.id as department_id, d.name as department_name, d.department_code,
              o.id as organisation_id, o.name as organisation_name
       FROM users u
       LEFT JOIN roles r ON u.primary_role_id = r.id
       LEFT JOIN departments d ON u.department_id = d.id
       LEFT JOIN organisations o ON u.organisation_id = o.id
       ORDER BY u.last_name, u.first_name`, []);
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
    async updateLastLogin(userId) {
        await postgres_1.default.query(`UPDATE users
       SET last_login = NOW(),
           updated_at = NOW()
       WHERE id = $1`, [userId]);
    }
};
exports.default = userModel;
//# sourceMappingURL=userModel.js.map