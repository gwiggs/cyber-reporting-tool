"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const postgres_1 = __importDefault(require("../db/postgres"));
const workRoleModel = {
    /**
     * Find all work roles
     */
    async findAll() {
        const result = await postgres_1.default.query(`SELECT wr.*, d.name as department_name
       FROM work_roles wr
       LEFT JOIN departments d ON wr.department_id = d.id
       ORDER BY wr.name`, []);
        return result.rows;
    },
    /**
     * Find work role by ID
     */
    async findById(id) {
        const result = await postgres_1.default.query(`SELECT wr.*, d.name as department_name
       FROM work_roles wr
       LEFT JOIN departments d ON wr.department_id = d.id
       WHERE wr.id = $1`, [id]);
        return result.rows[0] || null;
    },
    /**
     * Find work role by code
     */
    async findByCode(code) {
        const result = await postgres_1.default.query('SELECT * FROM work_roles WHERE code = $1', [code]);
        return result.rows[0] || null;
    },
    /**
     * Create work role
     */
    async create(data) {
        const result = await postgres_1.default.query(`INSERT INTO work_roles 
       (name, code, description, department_id)
       VALUES ($1, $2, $3, $4)
       RETURNING *`, [
            data.name,
            data.code || null,
            data.description || null,
            data.department_id || null
        ]);
        return result.rows[0];
    },
    /**
     * Update work role
     */
    async update(id, data) {
        // Create SET clause and parameters for dynamic updates
        const updateFields = [];
        const queryParams = [];
        let paramCount = 1;
        // Add each field that is present to the update
        if (data.name !== undefined) {
            updateFields.push(`name = $${paramCount++}`);
            queryParams.push(data.name);
        }
        if (data.code !== undefined) {
            updateFields.push(`code = $${paramCount++}`);
            queryParams.push(data.code);
        }
        if (data.description !== undefined) {
            updateFields.push(`description = $${paramCount++}`);
            queryParams.push(data.description);
        }
        if (data.department_id !== undefined) {
            updateFields.push(`department_id = $${paramCount++}`);
            queryParams.push(data.department_id);
        }
        // Always update the updated_at timestamp
        updateFields.push(`updated_at = $${paramCount++}`);
        queryParams.push(new Date());
        // Add the work role ID as the last parameter
        queryParams.push(id);
        const result = await postgres_1.default.query(`UPDATE work_roles
       SET ${updateFields.join(', ')}
       WHERE id = $${paramCount}
       RETURNING *`, queryParams);
        return result.rows[0];
    },
    /**
     * Delete work role
     */
    async delete(id) {
        await postgres_1.default.query('DELETE FROM work_roles WHERE id = $1', [id]);
    },
    /**
     * Find work roles by department
     */
    async findByDepartment(departmentId) {
        const result = await postgres_1.default.query('SELECT * FROM work_roles WHERE department_id = $1 ORDER BY name', [departmentId]);
        return result.rows;
    },
    /**
     * Find all user work role assignments
     */
    async findAllUserWorkRoles() {
        const result = await postgres_1.default.query(`SELECT uwr.*, wr.name as work_role_name, 
              u.first_name || ' ' || u.last_name as user_name
       FROM user_work_roles uwr
       JOIN work_roles wr ON uwr.work_role_id = wr.id
       JOIN users u ON uwr.user_id = u.id
       ORDER BY uwr.start_date DESC`, []);
        return result.rows;
    },
    /**
     * Find user work roles by user ID
     */
    async findUserWorkRolesByUserId(userId) {
        const result = await postgres_1.default.query(`SELECT uwr.*, wr.name as work_role_name
       FROM user_work_roles uwr
       JOIN work_roles wr ON uwr.work_role_id = wr.id
       WHERE uwr.user_id = $1
       ORDER BY uwr.primary_role DESC, uwr.start_date DESC`, [userId]);
        return result.rows;
    },
    /**
     * Find users assigned to a work role
     */
    async findUsersByWorkRole(workRoleId) {
        const result = await postgres_1.default.query(`SELECT uwr.*, u.first_name || ' ' || u.last_name as user_name
       FROM user_work_roles uwr
       JOIN users u ON uwr.user_id = u.id
       WHERE uwr.work_role_id = $1
       ORDER BY uwr.primary_role DESC, uwr.start_date DESC`, [workRoleId]);
        return result.rows;
    },
    /**
     * Assign work role to user
     */
    async assignWorkRoleToUser(data) {
        return postgres_1.default.transaction(async (client) => {
            // Check if the assignment already exists
            const existingResult = await client.query(`SELECT * FROM user_work_roles 
         WHERE user_id = $1 AND work_role_id = $2 AND 
         (end_date IS NULL OR end_date > CURRENT_DATE)`, [data.user_id, data.work_role_id]);
            if (existingResult.rows.length > 0) {
                throw new Error('User is already assigned to this work role');
            }
            // If this is marked as primary, ensure any existing primary role is updated
            if (data.primary_role) {
                await client.query(`UPDATE user_work_roles 
           SET primary_role = false, updated_at = CURRENT_TIMESTAMP
           WHERE user_id = $1 AND primary_role = true`, [data.user_id]);
            }
            // Insert the new work role assignment
            const result = await client.query(`INSERT INTO user_work_roles
         (user_id, work_role_id, primary_role, start_date, end_date)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`, [
                data.user_id,
                data.work_role_id,
                data.primary_role !== undefined ? data.primary_role : false,
                data.start_date,
                data.end_date || null
            ]);
            return result.rows[0];
        });
    },
    /**
     * Update user work role assignment
     */
    async updateUserWorkRole(userId, workRoleId, data) {
        return postgres_1.default.transaction(async (client) => {
            // If this is being made primary, ensure any existing primary role is updated
            if (data.primary_role) {
                await client.query(`UPDATE user_work_roles 
           SET primary_role = false, updated_at = CURRENT_TIMESTAMP
           WHERE user_id = $1 AND work_role_id != $2 AND primary_role = true`, [userId, workRoleId]);
            }
            // Create SET clause and parameters for dynamic updates
            const updateFields = [];
            const queryParams = [];
            let paramCount = 1;
            if (data.primary_role !== undefined) {
                updateFields.push(`primary_role = $${paramCount++}`);
                queryParams.push(data.primary_role);
            }
            if (data.start_date !== undefined) {
                updateFields.push(`start_date = $${paramCount++}`);
                queryParams.push(data.start_date);
            }
            if (data.end_date !== undefined) {
                updateFields.push(`end_date = $${paramCount++}`);
                queryParams.push(data.end_date);
            }
            // Always update the updated_at timestamp
            updateFields.push(`updated_at = $${paramCount++}`);
            queryParams.push(new Date());
            // Add the user ID and work role ID as parameters
            queryParams.push(userId);
            queryParams.push(workRoleId);
            const result = await client.query(`UPDATE user_work_roles
         SET ${updateFields.join(', ')}
         WHERE user_id = $${paramCount - 1} AND work_role_id = $${paramCount}
         RETURNING *`, queryParams);
            return result.rows[0];
        });
    },
    /**
     * End a work role assignment
     */
    async endWorkRoleAssignment(userId, workRoleId, endDate) {
        const result = await postgres_1.default.query(`UPDATE user_work_roles
       SET end_date = $1, updated_at = CURRENT_TIMESTAMP
       WHERE user_id = $2 AND work_role_id = $3
       RETURNING *`, [endDate, userId, workRoleId]);
        return result.rows[0];
    },
    /**
     * Get the primary work role for a user
     */
    async getUserPrimaryWorkRole(userId) {
        const result = await postgres_1.default.query(`SELECT uwr.*, wr.name as work_role_name
       FROM user_work_roles uwr
       JOIN work_roles wr ON uwr.work_role_id = wr.id
       WHERE uwr.user_id = $1 AND uwr.primary_role = true
       AND (uwr.end_date IS NULL OR uwr.end_date > CURRENT_DATE)`, [userId]);
        return result.rows[0] || null;
    },
    /**
     * Get current work roles for a user (not ended)
     */
    async getUserCurrentWorkRoles(userId) {
        const result = await postgres_1.default.query(`SELECT uwr.*, wr.name as work_role_name
       FROM user_work_roles uwr
       JOIN work_roles wr ON uwr.work_role_id = wr.id
       WHERE uwr.user_id = $1
       AND (uwr.end_date IS NULL OR uwr.end_date > CURRENT_DATE)
       ORDER BY uwr.primary_role DESC, wr.name`, [userId]);
        return result.rows;
    },
    /**
     * Get historical work roles for a user (ended)
     */
    async getUserHistoricalWorkRoles(userId) {
        const result = await postgres_1.default.query(`SELECT uwr.*, wr.name as work_role_name
       FROM user_work_roles uwr
       JOIN work_roles wr ON uwr.work_role_id = wr.id
       WHERE uwr.user_id = $1
       AND uwr.end_date IS NOT NULL
       AND uwr.end_date <= CURRENT_DATE
       ORDER BY uwr.end_date DESC`, [userId]);
        return result.rows;
    }
};
exports.default = workRoleModel;
//# sourceMappingURL=workRoleModel.js.map