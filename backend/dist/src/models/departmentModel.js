"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const postgres_1 = __importDefault(require("../db/postgres"));
const departmentModel = {
    /**
     * Find department by ID
     */
    async findById(id) {
        const result = await postgres_1.default.query('SELECT * FROM departments WHERE id = $1', [id]);
        return result.rows[0] || null;
    },
    /**
     * Find all departments
     */
    async findAll(limit = 50, offset = 0, orderBy = 'name', direction = 'ASC') {
        // Get total count first
        const countResult = await postgres_1.default.query('SELECT COUNT(*) as count FROM departments', []);
        const total = parseInt(countResult.rows[0].count, 10);
        // Validate order by field to prevent SQL injection
        const validOrderByFields = ['id', 'name', 'department_code', 'organization_id', 'created_at', 'updated_at'];
        if (!validOrderByFields.includes(orderBy)) {
            orderBy = 'name';
        }
        // Validate direction
        const validDirections = ['ASC', 'DESC'];
        const sqlDirection = validDirections.includes(direction.toUpperCase())
            ? direction.toUpperCase()
            : 'ASC';
        // Get departments with pagination
        const result = await postgres_1.default.query(`SELECT * FROM departments
       ORDER BY ${orderBy} ${sqlDirection}
       LIMIT $1 OFFSET $2`, [limit, offset]);
        return {
            departments: result.rows,
            total
        };
    },
    /**
     * Find departments by organization ID
     */
    async findByOrganizationId(organizationId, limit = 50, offset = 0, orderBy = 'name', direction = 'ASC') {
        // Get total count first
        const countResult = await postgres_1.default.query('SELECT COUNT(*) as count FROM departments WHERE organization_id = $1', [organizationId]);
        const total = parseInt(countResult.rows[0].count, 10);
        // Validate order by field to prevent SQL injection
        const validOrderByFields = ['id', 'name', 'department_code', 'created_at', 'updated_at'];
        if (!validOrderByFields.includes(orderBy)) {
            orderBy = 'name';
        }
        // Validate direction
        const validDirections = ['ASC', 'DESC'];
        const sqlDirection = validDirections.includes(direction.toUpperCase())
            ? direction.toUpperCase()
            : 'ASC';
        // Get departments with pagination
        const result = await postgres_1.default.query(`SELECT * FROM departments
       WHERE organization_id = $1
       ORDER BY ${orderBy} ${sqlDirection}
       LIMIT $2 OFFSET $3`, [organizationId, limit, offset]);
        return {
            departments: result.rows,
            total
        };
    },
    /**
     * Create a new department
     */
    async create(data) {
        const result = await postgres_1.default.query(`INSERT INTO departments (organization_id, name, department_code)
       VALUES ($1, $2, $3)
       RETURNING *`, [data.organization_id, data.name, data.department_code || null]);
        return result.rows[0];
    },
    /**
     * Update a department
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
        if (data.department_code !== undefined) {
            updateFields.push(`department_code = $${paramIndex}`);
            queryParams.push(data.department_code);
            paramIndex++;
        }
        // Always update the updated_at timestamp
        updateFields.push(`updated_at = $${paramIndex}`);
        queryParams.push(new Date());
        paramIndex++;
        // Add the ID as the last parameter
        queryParams.push(id);
        const result = await postgres_1.default.query(`UPDATE departments
       SET ${updateFields.join(', ')}
       WHERE id = $${paramIndex}
       RETURNING *`, queryParams);
        return result.rows[0] || null;
    },
    /**
     * Delete a department
     */
    async delete(id) {
        return postgres_1.default.transaction(async (client) => {
            // Check if there are users in this department
            const usersCheck = await client.query('SELECT COUNT(*) as count FROM users WHERE department_id = $1', [id]);
            if (parseInt(usersCheck.rows[0].count, 10) > 0) {
                // Cannot delete department with users
                return false;
            }
            // Safe to delete
            const result = await client.query('DELETE FROM departments WHERE id = $1', [id]);
            return result.rowCount ? result.rowCount > 0 : false;
        });
    },
    /**
     * Find department by code in an organization
     */
    async findByCode(organizationId, code) {
        const result = await postgres_1.default.query('SELECT * FROM departments WHERE organization_id = $1 AND department_code = $2', [organizationId, code]);
        return result.rows[0] || null;
    },
    /**
     * Get users count in a department
     */
    async getUsersCount(departmentId) {
        const result = await postgres_1.default.query('SELECT COUNT(*) as count FROM users WHERE department_id = $1', [departmentId]);
        return parseInt(result.rows[0].count, 10);
    }
};
exports.default = departmentModel;
//# sourceMappingURL=departmentModel.js.map