"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const postgres_1 = __importDefault(require("../db/postgres"));
const permissionModel = {
    /**
     * Find permission by ID
     */
    async findById(id) {
        const result = await postgres_1.default.query('SELECT * FROM permissions WHERE id = $1', [id]);
        return result.rows[0] || null;
    },
    /**
     * Find all permissions
     */
    async findAll(limit = 100, offset = 0, orderBy = 'resource', direction = 'ASC') {
        // Get total count first
        const countResult = await postgres_1.default.query('SELECT COUNT(*) as count FROM permissions', []);
        const total = parseInt(countResult.rows[0].count, 10);
        // Validate order by field to prevent SQL injection
        const validOrderByFields = ['id', 'name', 'resource', 'action', 'created_at', 'updated_at'];
        if (!validOrderByFields.includes(orderBy)) {
            orderBy = 'resource';
        }
        // Validate direction
        const validDirections = ['ASC', 'DESC'];
        const sqlDirection = validDirections.includes(direction.toUpperCase())
            ? direction.toUpperCase()
            : 'ASC';
        // Get permissions with pagination
        const result = await postgres_1.default.query(`SELECT * FROM permissions
       ORDER BY ${orderBy} ${sqlDirection}
       LIMIT $1 OFFSET $2`, [limit, offset]);
        return {
            permissions: result.rows,
            total
        };
    },
    /**
     * Create a new permission
     */
    async create(data) {
        const result = await postgres_1.default.query(`INSERT INTO permissions (name, description, resource, action)
       VALUES ($1, $2, $3, $4)
       RETURNING *`, [data.name, data.description || null, data.resource, data.action]);
        return result.rows[0];
    },
    /**
     * Update a permission
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
        if (data.resource !== undefined) {
            updateFields.push(`resource = $${paramIndex}`);
            queryParams.push(data.resource);
            paramIndex++;
        }
        if (data.action !== undefined) {
            updateFields.push(`action = $${paramIndex}`);
            queryParams.push(data.action);
            paramIndex++;
        }
        // Always update the updated_at timestamp
        updateFields.push(`updated_at = $${paramIndex}`);
        queryParams.push(new Date());
        paramIndex++;
        // Add the ID as the last parameter
        queryParams.push(id);
        const result = await postgres_1.default.query(`UPDATE permissions
       SET ${updateFields.join(', ')}
       WHERE id = $${paramIndex}
       RETURNING *`, queryParams);
        return result.rows[0] || null;
    },
    /**
     * Delete a permission
     */
    async delete(id) {
        try {
            // First delete from role_permissions
            await postgres_1.default.query('DELETE FROM role_permissions WHERE permission_id = $1', [id]);
            // Then delete the permission
            const result = await postgres_1.default.query('DELETE FROM permissions WHERE id = $1', [id]);
            return result.rowCount ? result.rowCount > 0 : false;
        }
        catch (error) {
            // Handle possible constraint errors
            console.error('Error deleting permission:', error);
            return false;
        }
    },
    /**
     * Find permission by resource and action
     */
    async findByResourceAction(resource, action) {
        const result = await postgres_1.default.query('SELECT * FROM permissions WHERE resource = $1 AND action = $2', [resource, action]);
        return result.rows[0] || null;
    },
    /**
     * Find permissions by resource
     */
    async findByResource(resource) {
        const result = await postgres_1.default.query('SELECT * FROM permissions WHERE resource = $1 ORDER BY action', [resource]);
        return result.rows;
    },
    /**
     * Get roles with specific permission
     */
    async getRolesWithPermission(permissionId) {
        const result = await postgres_1.default.query('SELECT role_id FROM role_permissions WHERE permission_id = $1', [permissionId]);
        return result.rows.map(row => row.role_id);
    },
    /**
     * Check if permission is in use
     */
    async isInUse(permissionId) {
        const result = await postgres_1.default.query('SELECT COUNT(*) as count FROM role_permissions WHERE permission_id = $1', [permissionId]);
        return parseInt(result.rows[0].count, 10) > 0;
    }
};
exports.default = permissionModel;
//# sourceMappingURL=permissionModel.js.map