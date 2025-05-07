"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const postgres_1 = __importDefault(require("../db/postgres"));
const userQualificationModel = {
    /**
     * Find all user qualifications
     */
    async findAll() {
        const result = await postgres_1.default.query(`SELECT uq.*, q.name as qualification_name, 
              u.first_name || ' ' || u.last_name as user_name
       FROM user_qualifications uq
       JOIN qualifications q ON uq.qualification_id = q.id
       JOIN users u ON uq.user_id = u.id
       ORDER BY uq.date_acquired DESC`, []);
        return result.rows;
    },
    /**
     * Find user qualification by ID
     */
    async findById(id) {
        const result = await postgres_1.default.query(`SELECT uq.*, q.name as qualification_name, 
              u.first_name || ' ' || u.last_name as user_name
       FROM user_qualifications uq
       JOIN qualifications q ON uq.qualification_id = q.id
       JOIN users u ON uq.user_id = u.id
       WHERE uq.id = $1`, [id]);
        return result.rows[0] || null;
    },
    /**
     * Find user qualifications by user ID
     */
    async findByUserId(userId) {
        const result = await postgres_1.default.query(`SELECT uq.*, q.name as qualification_name
       FROM user_qualifications uq
       JOIN qualifications q ON uq.qualification_id = q.id
       WHERE uq.user_id = $1
       ORDER BY uq.date_acquired DESC`, [userId]);
        return result.rows;
    },
    /**
     * Find user qualifications by qualification ID
     */
    async findByQualificationId(qualificationId) {
        const result = await postgres_1.default.query(`SELECT uq.*, u.first_name || ' ' || u.last_name as user_name
       FROM user_qualifications uq
       JOIN users u ON uq.user_id = u.id
       WHERE uq.qualification_id = $1
       ORDER BY uq.date_acquired DESC`, [qualificationId]);
        return result.rows;
    },
    /**
     * Check if a user has a specific qualification
     */
    async checkUserHasQualification(userId, qualificationId) {
        const result = await postgres_1.default.query(`SELECT COUNT(*) as count
       FROM user_qualifications
       WHERE user_id = $1 AND qualification_id = $2 AND status = 'active'`, [userId, qualificationId]);
        return parseInt(result.rows[0].count) > 0;
    },
    /**
     * Create user qualification
     */
    async create(data) {
        return postgres_1.default.transaction(async (client) => {
            // Check if qualification already exists for this user
            const existingResult = await client.query(`SELECT id FROM user_qualifications 
         WHERE user_id = $1 AND qualification_id = $2`, [data.user_id, data.qualification_id]);
            if (existingResult.rows.length > 0) {
                throw new Error('User already has this qualification');
            }
            // Insert the new qualification
            const result = await client.query(`INSERT INTO user_qualifications 
         (user_id, qualification_id, date_acquired, expiration_date, status, 
          issuing_authority, certificate_number, verification_document, notes)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         RETURNING *`, [
                data.user_id,
                data.qualification_id,
                data.date_acquired,
                data.expiration_date || null,
                data.status || 'active',
                data.issuing_authority || null,
                data.certificate_number || null,
                data.verification_document || null,
                data.notes || null
            ]);
            return result.rows[0];
        });
    },
    /**
     * Update user qualification
     */
    async update(id, data, updatedByUserId) {
        return postgres_1.default.transaction(async (client) => {
            // Get current qualification data
            const currentQualification = await this.findById(id);
            if (!currentQualification) {
                throw new Error('User qualification not found');
            }
            // Create SET clause and parameters for dynamic updates
            const updateFields = [];
            const queryParams = [];
            let paramCount = 1;
            // Prepare update data
            if (data.date_acquired !== undefined) {
                updateFields.push(`date_acquired = $${paramCount++}`);
                queryParams.push(data.date_acquired);
            }
            if (data.expiration_date !== undefined) {
                updateFields.push(`expiration_date = $${paramCount++}`);
                queryParams.push(data.expiration_date);
            }
            if (data.status !== undefined) {
                updateFields.push(`status = $${paramCount++}`);
                queryParams.push(data.status);
            }
            if (data.issuing_authority !== undefined) {
                updateFields.push(`issuing_authority = $${paramCount++}`);
                queryParams.push(data.issuing_authority);
            }
            if (data.certificate_number !== undefined) {
                updateFields.push(`certificate_number = $${paramCount++}`);
                queryParams.push(data.certificate_number);
            }
            if (data.verification_document !== undefined) {
                updateFields.push(`verification_document = $${paramCount++}`);
                queryParams.push(data.verification_document);
            }
            if (data.notes !== undefined) {
                updateFields.push(`notes = $${paramCount++}`);
                queryParams.push(data.notes);
            }
            // Always update the updated_at timestamp
            updateFields.push(`updated_at = $${paramCount++}`);
            queryParams.push(new Date());
            // Add the qualification ID as the last parameter
            queryParams.push(id);
            // Update the qualification
            const result = await client.query(`UPDATE user_qualifications
         SET ${updateFields.join(', ')}
         WHERE id = $${paramCount}
         RETURNING *`, queryParams);
            // Record the update in qualification_updates if status or expiration date changed
            if (data.status !== undefined || data.expiration_date !== undefined) {
                const updateData = {
                    user_qualification_id: id,
                    updated_by_user_id: updatedByUserId,
                    previous_status: data.status !== undefined ? currentQualification.status : undefined,
                    new_status: data.status || currentQualification.status,
                    previous_expiration_date: data.expiration_date !== undefined ? currentQualification.expiration_date : undefined,
                    new_expiration_date: data.expiration_date || currentQualification.expiration_date,
                    update_reason: data.notes || 'Qualification updated'
                };
                await client.query(`INSERT INTO qualification_updates 
           (user_qualification_id, updated_by_user_id, previous_status, new_status, 
            previous_expiration_date, new_expiration_date, update_reason)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`, [
                    updateData.user_qualification_id,
                    updateData.updated_by_user_id,
                    updateData.previous_status || null,
                    updateData.new_status,
                    updateData.previous_expiration_date || null,
                    updateData.new_expiration_date || null,
                    updateData.update_reason
                ]);
            }
            return result.rows[0];
        });
    },
    /**
     * Delete user qualification
     */
    async delete(id) {
        await postgres_1.default.query('DELETE FROM user_qualifications WHERE id = $1', [id]);
    },
    /**
     * Get user qualification updates history
     */
    async getQualificationUpdates(userQualificationId) {
        const result = await postgres_1.default.query(`SELECT qu.*, u.first_name || ' ' || u.last_name as updated_by_name
       FROM qualification_updates qu
       JOIN users u ON qu.updated_by_user_id = u.id
       WHERE qu.user_qualification_id = $1
       ORDER BY qu.created_at DESC`, [userQualificationId]);
        return result.rows;
    },
    /**
     * Create qualification update record
     */
    async createQualificationUpdate(data) {
        const result = await postgres_1.default.query(`INSERT INTO qualification_updates 
       (user_qualification_id, updated_by_user_id, previous_status, new_status, 
        previous_expiration_date, new_expiration_date, update_reason)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`, [
            data.user_qualification_id,
            data.updated_by_user_id,
            data.previous_status || null,
            data.new_status,
            data.previous_expiration_date || null,
            data.new_expiration_date || null,
            data.update_reason
        ]);
        return result.rows[0];
    },
    /**
     * Find expired qualifications
     */
    async findExpiredQualifications() {
        const result = await postgres_1.default.query(`SELECT uq.*, q.name as qualification_name, 
              u.first_name || ' ' || u.last_name as user_name
       FROM user_qualifications uq
       JOIN qualifications q ON uq.qualification_id = q.id
       JOIN users u ON uq.user_id = u.id
       WHERE uq.status = 'active' 
       AND uq.expiration_date IS NOT NULL
       AND uq.expiration_date < CURRENT_DATE
       ORDER BY uq.expiration_date DESC`, []);
        return result.rows;
    },
    /**
     * Update expired qualifications status
     */
    async updateExpiredQualifications(systemUserId) {
        return postgres_1.default.transaction(async (client) => {
            // Get list of qualifications that have expired but still active
            const expiredResult = await client.query(`SELECT id, user_id, qualification_id, expiration_date
         FROM user_qualifications
         WHERE status = 'active' 
         AND expiration_date IS NOT NULL
         AND expiration_date < CURRENT_DATE`, []);
            const expiredQualifications = expiredResult.rows;
            // Update each expired qualification
            for (const qual of expiredQualifications) {
                // Update status to expired
                await client.query(`UPDATE user_qualifications
           SET status = 'expired', updated_at = CURRENT_TIMESTAMP
           WHERE id = $1`, [qual.id]);
                // Create update history record
                await client.query(`INSERT INTO qualification_updates 
           (user_qualification_id, updated_by_user_id, previous_status, new_status, 
            previous_expiration_date, new_expiration_date, update_reason)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`, [
                    qual.id,
                    systemUserId,
                    'active',
                    'expired',
                    qual.expiration_date,
                    qual.expiration_date,
                    'Automatically expired by system'
                ]);
            }
            return expiredQualifications.length;
        });
    }
};
exports.default = userQualificationModel;
//# sourceMappingURL=userQualificationModel.js.map