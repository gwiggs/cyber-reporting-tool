"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const postgres_1 = __importDefault(require("../db/postgres"));
const roleModel = {
    /**
     * Find role by ID
     */
    async findById(id) {
        const result = await postgres_1.default.query('SELECT * FROM roles WHERE id = $1', [id]);
        return result.rows[0] || null;
    },
    /**
     * Find all roles
     */
    async findAll(limit = 50, offset = 0, orderBy = 'name', direction = 'ASC') {
        // Get total count first
        const countResult = await postgres_1.default.query('SELECT COUNT(*) as count FROM roles', []);
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
        const result = await postgres_1.default.query(`SELECT * FROM roles
       ORDER BY ${orderBy} ${sqlDirection}
       LIMIT $1 OFFSET $2`, [limit, offset]);
        return {
            roles: result.rows,
            total
        };
    },
    /**
     * Create a new role
     */
    async create(data) {
        const result = await postgres_1.default.query(`INSERT INTO roles (name, description)
       VALUES ($1, $2)
       RETURNING *`, [data.name, data.description || null]);
        return result.rows[0];
    },
    /**
     * Update a role
     */
    async update(id, data) {
        // Only update if there's something to update
        if (Object.keys(data).length === 0) {
            return this.findById(id);
        }
        // Build the query dynamically
        const updateFields = [];
        const queryParams = [];
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
        const result = await postgres_1.default.query(`UPDATE roles
       SET ${updateFields.join(', ')}
       WHERE id = $${paramIndex}
       RETURNING *`, queryParams);
        return result.rows[0] || null;
    },
    /**
     * Delete a role
     */
    async delete(id) {
        return postgres_1.default.transaction(async (client) => {
            // Check if there are users with this role as primary
            const usersCheck = await client.query('SELECT COUNT(*) as count FROM users WHERE primary_role_id = $1', [id]);
            if (parseInt(usersCheck.rows[0].count, 10) > 0) {
                // Cannot delete role used as primary by users
                return false;
            }
            // Delete role-permission associations
            await client.query('DELETE FROM role_permissions WHERE role_id = $1', [id]);
            // Delete user-role associations (for additional roles)
            await client.query('DELETE FROM user_roles WHERE role_id = $1', [id]);
            // Delete the role
            const result = await client.query('DELETE FROM roles WHERE id = $1', [id]);
            return result.rowCount ? result.rowCount > 0 : false;
        });
    },
    /**
     * Get role permissions
     */
    async getRolePermissions(roleId) {
        const result = await postgres_1.default.query(`SELECT p.* FROM permissions p
       JOIN role_permissions rp ON p.id = rp.permission_id
       WHERE rp.role_id = $1
       ORDER BY p.resource, p.action`, [roleId]);
        return result.rows;
    },
    /**
     * Add permission to role
     */
    async addPermission(roleId, permissionId) {
        try {
            await postgres_1.default.query(`INSERT INTO role_permissions (role_id, permission_id)
         VALUES ($1, $2)
         ON CONFLICT (role_id, permission_id) DO NOTHING`, [roleId, permissionId]);
        }
        catch (error) {
            // Handle foreign key constraint errors
            throw error;
        }
    },
    /**
     * Remove permission from role
     */
    async removePermission(roleId, permissionId) {
        const result = await postgres_1.default.query(`DELETE FROM role_permissions
       WHERE role_id = $1 AND permission_id = $2`, [roleId, permissionId]);
        return result.rowCount ? result.rowCount > 0 : false;
    },
    /**
     * Get users with this role
     */
    async getUsersWithRole(roleId) {
        const result = await postgres_1.default.query(`SELECT COUNT(DISTINCT user_id) as count FROM
       (SELECT id as user_id FROM users WHERE primary_role_id = $1
        UNION
        SELECT user_id FROM user_roles WHERE role_id = $1) as users_with_role`, [roleId]);
        return parseInt(result.rows[0].count, 10);
    },
    /**
     * Find role by name
     */
    async findByName(name) {
        const result = await postgres_1.default.query('SELECT * FROM roles WHERE name = $1', [name]);
        return result.rows[0] || null;
    }
};
exports.default = roleModel;
//# sourceMappingURL=roleModel.js.map