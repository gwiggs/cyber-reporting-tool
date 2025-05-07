"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const postgres_1 = __importDefault(require("../db/postgres"));
const organizationModel = {
    /**
     * Find organization by ID
     */
    async findById(id) {
        const result = await postgres_1.default.query('SELECT * FROM organizations WHERE id = $1', [id]);
        return result.rows[0] || null;
    },
    /**
     * Find all organizations
     */
    async findAll(limit = 50, offset = 0, orderBy = 'name', direction = 'ASC') {
        // Get total count first
        const countResult = await postgres_1.default.query('SELECT COUNT(*) as count FROM organizations', []);
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
        // Get organizations with pagination
        const result = await postgres_1.default.query(`SELECT * FROM organizations
       ORDER BY ${orderBy} ${sqlDirection}
       LIMIT $1 OFFSET $2`, [limit, offset]);
        return {
            organizations: result.rows,
            total
        };
    },
    /**
     * Create a new organization
     */
    async create(data) {
        const result = await postgres_1.default.query(`INSERT INTO organizations (name)
       VALUES ($1)
       RETURNING *`, [data.name]);
        return result.rows[0];
    },
    /**
     * Update an organization
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
        // Always update the updated_at timestamp
        updateFields.push(`updated_at = $${paramIndex}`);
        queryParams.push(new Date());
        paramIndex++;
        // Add the ID as the last parameter
        queryParams.push(id);
        const result = await postgres_1.default.query(`UPDATE organizations
       SET ${updateFields.join(', ')}
       WHERE id = $${paramIndex}
       RETURNING *`, queryParams);
        return result.rows[0] || null;
    },
    /**
     * Delete an organization
     */
    async delete(id) {
        return postgres_1.default.transaction(async (client) => {
            // First check if there are departments in this organization
            const deptsCheck = await client.query('SELECT COUNT(*) as count FROM departments WHERE organization_id = $1', [id]);
            if (parseInt(deptsCheck.rows[0].count, 10) > 0) {
                // Cannot delete organization with departments
                return false;
            }
            // Check if there are users in this organization
            const usersCheck = await client.query('SELECT COUNT(*) as count FROM users WHERE organisation_id = $1', [id]);
            if (parseInt(usersCheck.rows[0].count, 10) > 0) {
                // Cannot delete organization with users
                return false;
            }
            // Safe to delete
            const result = await client.query('DELETE FROM organizations WHERE id = $1', [id]);
            return result.rowCount ? result.rowCount > 0 : false;
        });
    },
    /**
     * Get organization with departments count
     */
    async getWithDepartmentsCount(id) {
        const result = await postgres_1.default.query(`SELECT o.*, COUNT(d.id) as departments_count
       FROM organizations o
       LEFT JOIN departments d ON o.id = d.organization_id
       WHERE o.id = $1
       GROUP BY o.id`, [id]);
        return result.rows[0] || null;
    }
};
exports.default = organizationModel;
//# sourceMappingURL=organizationModel.js.map