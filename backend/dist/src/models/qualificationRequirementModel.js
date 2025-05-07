"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const postgres_1 = __importDefault(require("../db/postgres"));
const qualificationRequirementModel = {
    /**
     * Find all qualification requirements
     */
    async findAll() {
        const result = await postgres_1.default.query(`SELECT qr.*, q.name as qualification_name, wr.name as work_role_name
       FROM qualification_requirements qr
       JOIN qualifications q ON qr.qualification_id = q.id
       JOIN work_roles wr ON qr.work_role_id = wr.id
       ORDER BY qr.work_role_id, qr.priority DESC`, []);
        return result.rows;
    },
    /**
     * Find qualification requirement by ID
     */
    async findById(id) {
        const result = await postgres_1.default.query(`SELECT qr.*, q.name as qualification_name, wr.name as work_role_name
       FROM qualification_requirements qr
       JOIN qualifications q ON qr.qualification_id = q.id
       JOIN work_roles wr ON qr.work_role_id = wr.id
       WHERE qr.id = $1`, [id]);
        return result.rows[0] || null;
    },
    /**
     * Find qualification requirements by work role ID
     */
    async findByWorkRoleId(workRoleId) {
        const result = await postgres_1.default.query(`SELECT qr.*, q.name as qualification_name
       FROM qualification_requirements qr
       JOIN qualifications q ON qr.qualification_id = q.id
       WHERE qr.work_role_id = $1
       ORDER BY qr.priority DESC, q.name`, [workRoleId]);
        return result.rows;
    },
    /**
     * Find work roles that require a specific qualification
     */
    async findWorkRolesRequiringQualification(qualificationId) {
        const result = await postgres_1.default.query(`SELECT qr.*, wr.name as work_role_name
       FROM qualification_requirements qr
       JOIN work_roles wr ON qr.work_role_id = wr.id
       WHERE qr.qualification_id = $1
       ORDER BY qr.is_required DESC, qr.priority DESC`, [qualificationId]);
        return result.rows;
    },
    /**
     * Check if a specific qualification is required for a work role
     */
    async checkIsQualificationRequired(workRoleId, qualificationId) {
        const result = await postgres_1.default.query(`SELECT is_required FROM qualification_requirements
       WHERE work_role_id = $1 AND qualification_id = $2`, [workRoleId, qualificationId]);
        if (result.rows.length === 0) {
            return false;
        }
        return result.rows[0].is_required;
    },
    /**
     * Create qualification requirement
     */
    async create(data) {
        return postgres_1.default.transaction(async (client) => {
            // Check if the requirement already exists
            const existingResult = await client.query(`SELECT id FROM qualification_requirements 
         WHERE work_role_id = $1 AND qualification_id = $2`, [data.work_role_id, data.qualification_id]);
            if (existingResult.rows.length > 0) {
                throw new Error('This qualification requirement already exists for this work role');
            }
            // Create the new requirement
            const result = await client.query(`INSERT INTO qualification_requirements 
         (work_role_id, qualification_id, is_required, priority)
         VALUES ($1, $2, $3, $4)
         RETURNING *`, [
                data.work_role_id,
                data.qualification_id,
                data.is_required !== undefined ? data.is_required : true,
                data.priority !== undefined ? data.priority : 0
            ]);
            return result.rows[0];
        });
    },
    /**
     * Update qualification requirement
     */
    async update(id, data) {
        // Create SET clause and parameters for dynamic updates
        const updateFields = [];
        const queryParams = [];
        let paramCount = 1;
        // Add each field that is present to the update
        if (data.is_required !== undefined) {
            updateFields.push(`is_required = $${paramCount++}`);
            queryParams.push(data.is_required);
        }
        if (data.priority !== undefined) {
            updateFields.push(`priority = $${paramCount++}`);
            queryParams.push(data.priority);
        }
        // Always update the updated_at timestamp
        updateFields.push(`updated_at = $${paramCount++}`);
        queryParams.push(new Date());
        // Add the qualification requirement ID as the last parameter
        queryParams.push(id);
        const result = await postgres_1.default.query(`UPDATE qualification_requirements
       SET ${updateFields.join(', ')}
       WHERE id = $${paramCount}
       RETURNING *`, queryParams);
        return result.rows[0];
    },
    /**
     * Delete qualification requirement
     */
    async delete(id) {
        await postgres_1.default.query('DELETE FROM qualification_requirements WHERE id = $1', [id]);
    },
    /**
     * Find missing qualifications for a user based on their work roles
     */
    async findMissingQualificationsForUser(userId) {
        const result = await postgres_1.default.query(`WITH user_current_roles AS (
         SELECT work_role_id 
         FROM user_work_roles 
         WHERE user_id = $1 
         AND (end_date IS NULL OR end_date > CURRENT_DATE)
       ),
       role_required_quals AS (
         SELECT qr.qualification_id, qr.work_role_id, qr.is_required, qr.priority,
                q.name AS qualification_name, wr.name AS work_role_name
         FROM qualification_requirements qr
         JOIN qualifications q ON qr.qualification_id = q.id
         JOIN work_roles wr ON qr.work_role_id = wr.id
         WHERE qr.work_role_id IN (SELECT work_role_id FROM user_current_roles)
         AND qr.is_required = true
       ),
       user_active_quals AS (
         SELECT qualification_id
         FROM user_qualifications
         WHERE user_id = $1 AND status = 'active'
       )
       SELECT rq.*
       FROM role_required_quals rq
       WHERE rq.qualification_id NOT IN (SELECT qualification_id FROM user_active_quals)
       ORDER BY rq.priority DESC, rq.qualification_name`, [userId]);
        return result.rows;
    },
    /**
     * Check if a user has all required qualifications for a work role
     */
    async checkUserQualificationsForWorkRole(userId, workRoleId) {
        const result = await postgres_1.default.query(`WITH required_quals AS (
         SELECT qr.qualification_id, qr.is_required
         FROM qualification_requirements qr
         WHERE qr.work_role_id = $1
       ),
       user_active_quals AS (
         SELECT qualification_id
         FROM user_qualifications
         WHERE user_id = $2 AND status = 'active'
       ),
       missing_quals AS (
         SELECT rq.qualification_id, rq.is_required
         FROM required_quals rq
         WHERE rq.qualification_id NOT IN (SELECT qualification_id FROM user_active_quals)
       )
       SELECT 
         COUNT(*) FILTER (WHERE is_required = true) AS missing_required,
         COUNT(*) FILTER (WHERE is_required = false) AS missing_recommended
       FROM missing_quals`, [workRoleId, userId]);
        const missingRequired = parseInt(result.rows[0].missing_required);
        const missingRecommended = parseInt(result.rows[0].missing_recommended);
        return {
            qualified: missingRequired === 0,
            missingRequired,
            missingRecommended
        };
    }
};
exports.default = qualificationRequirementModel;
//# sourceMappingURL=qualificationRequirementModel.js.map