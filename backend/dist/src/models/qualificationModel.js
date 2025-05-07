"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const postgres_1 = __importDefault(require("../db/postgres"));
const qualificationModel = {
    /**
     * Find all qualifications
     */
    async findAll() {
        const result = await postgres_1.default.query('SELECT * FROM qualifications ORDER BY name', []);
        return result.rows;
    },
    /**
     * Find qualification by ID
     */
    async findById(id) {
        const result = await postgres_1.default.query('SELECT * FROM qualifications WHERE id = $1', [id]);
        return result.rows[0] || null;
    },
    /**
     * Find qualification by code
     */
    async findByCode(code) {
        const result = await postgres_1.default.query('SELECT * FROM qualifications WHERE code = $1', [code]);
        return result.rows[0] || null;
    },
    /**
     * Create qualification
     */
    async create(data) {
        const result = await postgres_1.default.query(`INSERT INTO qualifications 
      (name, code, description, category, level, expiration_period, is_active)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *`, [
            data.name,
            data.code || null,
            data.description || null,
            data.category || null,
            data.level || null,
            data.expiration_period || null,
            data.is_active !== undefined ? data.is_active : true
        ]);
        return result.rows[0];
    },
    /**
     * Update qualification
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
        if (data.category !== undefined) {
            updateFields.push(`category = $${paramCount++}`);
            queryParams.push(data.category);
        }
        if (data.level !== undefined) {
            updateFields.push(`level = $${paramCount++}`);
            queryParams.push(data.level);
        }
        if (data.expiration_period !== undefined) {
            updateFields.push(`expiration_period = $${paramCount++}`);
            queryParams.push(data.expiration_period);
        }
        if (data.is_active !== undefined) {
            updateFields.push(`is_active = $${paramCount++}`);
            queryParams.push(data.is_active);
        }
        // Always update the updated_at timestamp
        updateFields.push(`updated_at = $${paramCount++}`);
        queryParams.push(new Date());
        // Add the qualification ID as the last parameter
        queryParams.push(id);
        const result = await postgres_1.default.query(`UPDATE qualifications
       SET ${updateFields.join(', ')}
       WHERE id = $${paramCount}
       RETURNING *`, queryParams);
        return result.rows[0];
    },
    /**
     * Delete qualification
     */
    async delete(id) {
        await postgres_1.default.query('DELETE FROM qualifications WHERE id = $1', [id]);
    },
    /**
     * Find qualifications by category
     */
    async findByCategory(category) {
        const result = await postgres_1.default.query('SELECT * FROM qualifications WHERE category = $1 ORDER BY name', [category]);
        return result.rows;
    },
    /**
     * Get categories list
     */
    async getCategories() {
        const result = await postgres_1.default.query('SELECT DISTINCT category FROM qualifications WHERE category IS NOT NULL', []);
        return result.rows.map(row => row.category);
    },
    /**
     * Find active qualifications
     */
    async findActive() {
        const result = await postgres_1.default.query('SELECT * FROM qualifications WHERE is_active = true ORDER BY name', []);
        return result.rows;
    },
    /**
     * Find qualifications that are about to expire within a given number of days
     */
    async findExpiringQualifications(days) {
        const result = await postgres_1.default.query(`SELECT uq.*, q.name as qualification_name, 
              u.first_name || ' ' || u.last_name as user_name
       FROM user_qualifications uq
       JOIN qualifications q ON uq.qualification_id = q.id
       JOIN users u ON uq.user_id = u.id
       WHERE uq.status = 'active' 
       AND uq.expiration_date IS NOT NULL
       AND uq.expiration_date <= CURRENT_DATE + INTERVAL '${days} days'
       AND uq.expiration_date >= CURRENT_DATE
       ORDER BY uq.expiration_date ASC`, []);
        return result.rows;
    }
};
exports.default = qualificationModel;
//# sourceMappingURL=qualificationModel.js.map