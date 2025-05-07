"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateExpiredQualifications = exports.getExpiredQualifications = exports.getQualificationUpdates = exports.deleteUserQualification = exports.updateUserQualification = exports.createUserQualification = exports.getUsersByQualificationId = exports.getQualificationsByUserId = exports.getUserQualificationById = exports.getUserQualifications = void 0;
const userQualificationModel_1 = __importDefault(require("../models/userQualificationModel"));
const userModel_1 = __importDefault(require("../models/userModel"));
const qualificationModel_1 = __importDefault(require("../models/qualificationModel"));
/**
 * Get all user qualifications
 */
const getUserQualifications = async (req, res) => {
    try {
        const userQualifications = await userQualificationModel_1.default.findAll();
        res.json(userQualifications);
    }
    catch (error) {
        console.error('Error fetching user qualifications:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.getUserQualifications = getUserQualifications;
/**
 * Get user qualification by ID
 */
const getUserQualificationById = async (req, res) => {
    try {
        const userQualificationId = parseInt(req.params.id);
        if (isNaN(userQualificationId)) {
            res.status(400).json({ message: 'Invalid user qualification ID' });
            return;
        }
        const userQualification = await userQualificationModel_1.default.findById(userQualificationId);
        if (!userQualification) {
            res.status(404).json({ message: 'User qualification not found' });
            return;
        }
        res.json(userQualification);
    }
    catch (error) {
        console.error('Error fetching user qualification:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.getUserQualificationById = getUserQualificationById;
/**
 * Get qualifications for a specific user
 */
const getQualificationsByUserId = async (req, res) => {
    try {
        const userId = parseInt(req.params.userId);
        if (isNaN(userId)) {
            res.status(400).json({ message: 'Invalid user ID' });
            return;
        }
        // Check if user exists
        const user = await userModel_1.default.findById(userId);
        if (!user) {
            res.status(404).json({ message: 'User not found' });
            return;
        }
        const userQualifications = await userQualificationModel_1.default.findByUserId(userId);
        res.json(userQualifications);
    }
    catch (error) {
        console.error('Error fetching user qualifications:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.getQualificationsByUserId = getQualificationsByUserId;
/**
 * Get users with a specific qualification
 */
const getUsersByQualificationId = async (req, res) => {
    try {
        const qualificationId = parseInt(req.params.qualificationId);
        if (isNaN(qualificationId)) {
            res.status(400).json({ message: 'Invalid qualification ID' });
            return;
        }
        // Check if qualification exists
        const qualification = await qualificationModel_1.default.findById(qualificationId);
        if (!qualification) {
            res.status(404).json({ message: 'Qualification not found' });
            return;
        }
        const userQualifications = await userQualificationModel_1.default.findByQualificationId(qualificationId);
        res.json(userQualifications);
    }
    catch (error) {
        console.error('Error fetching users with qualification:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.getUsersByQualificationId = getUsersByQualificationId;
/**
 * Create a new user qualification
 */
const createUserQualification = async (req, res) => {
    try {
        const userQualificationData = req.body;
        // Validate required fields
        if (!userQualificationData.user_id || !userQualificationData.qualification_id || !userQualificationData.date_acquired) {
            res.status(400).json({ message: 'User ID, qualification ID, and date acquired are required' });
            return;
        }
        // Check if user exists
        const user = await userModel_1.default.findById(userQualificationData.user_id);
        if (!user) {
            res.status(404).json({ message: 'User not found' });
            return;
        }
        // Check if qualification exists
        const qualification = await qualificationModel_1.default.findById(userQualificationData.qualification_id);
        if (!qualification) {
            res.status(404).json({ message: 'Qualification not found' });
            return;
        }
        // Calculate expiration date based on qualification settings if not provided
        if (!userQualificationData.expiration_date && qualification.expiration_period) {
            const dateAcquired = new Date(userQualificationData.date_acquired);
            const expirationDate = new Date(dateAcquired);
            expirationDate.setMonth(expirationDate.getMonth() + qualification.expiration_period);
            userQualificationData.expiration_date = expirationDate;
        }
        // Create user qualification
        try {
            const newUserQualification = await userQualificationModel_1.default.create(userQualificationData);
            res.status(201).json(newUserQualification);
        }
        catch (err) {
            if (err instanceof Error && err.message.includes('User already has this qualification')) {
                res.status(409).json({ message: 'User already has this qualification' });
            }
            else {
                throw err;
            }
        }
    }
    catch (error) {
        console.error('Error creating user qualification:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.createUserQualification = createUserQualification;
/**
 * Update an existing user qualification
 */
const updateUserQualification = async (req, res) => {
    try {
        const userQualificationId = parseInt(req.params.id);
        const userQualificationData = req.body;
        if (isNaN(userQualificationId)) {
            res.status(400).json({ message: 'Invalid user qualification ID' });
            return;
        }
        // Check if user qualification exists
        const existingUserQualification = await userQualificationModel_1.default.findById(userQualificationId);
        if (!existingUserQualification) {
            res.status(404).json({ message: 'User qualification not found' });
            return;
        }
        // Get the current user from the authenticated request
        const updatedByUserId = req.user.id;
        // Update user qualification
        const updatedUserQualification = await userQualificationModel_1.default.update(userQualificationId, userQualificationData, updatedByUserId);
        res.json(updatedUserQualification);
    }
    catch (error) {
        console.error('Error updating user qualification:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.updateUserQualification = updateUserQualification;
/**
 * Delete a user qualification
 */
const deleteUserQualification = async (req, res) => {
    try {
        const userQualificationId = parseInt(req.params.id);
        if (isNaN(userQualificationId)) {
            res.status(400).json({ message: 'Invalid user qualification ID' });
            return;
        }
        // Check if user qualification exists
        const existingUserQualification = await userQualificationModel_1.default.findById(userQualificationId);
        if (!existingUserQualification) {
            res.status(404).json({ message: 'User qualification not found' });
            return;
        }
        // Delete user qualification
        await userQualificationModel_1.default.delete(userQualificationId);
        res.status(204).send();
    }
    catch (error) {
        console.error('Error deleting user qualification:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.deleteUserQualification = deleteUserQualification;
/**
 * Get qualification update history
 */
const getQualificationUpdates = async (req, res) => {
    try {
        const userQualificationId = parseInt(req.params.id);
        if (isNaN(userQualificationId)) {
            res.status(400).json({ message: 'Invalid user qualification ID' });
            return;
        }
        // Check if user qualification exists
        const existingUserQualification = await userQualificationModel_1.default.findById(userQualificationId);
        if (!existingUserQualification) {
            res.status(404).json({ message: 'User qualification not found' });
            return;
        }
        const updates = await userQualificationModel_1.default.getQualificationUpdates(userQualificationId);
        res.json(updates);
    }
    catch (error) {
        console.error('Error fetching qualification updates:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.getQualificationUpdates = getQualificationUpdates;
/**
 * Get expired qualifications
 */
const getExpiredQualifications = async (req, res) => {
    try {
        const expiredQualifications = await userQualificationModel_1.default.findExpiredQualifications();
        res.json(expiredQualifications);
    }
    catch (error) {
        console.error('Error fetching expired qualifications:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.getExpiredQualifications = getExpiredQualifications;
/**
 * Update expired qualifications (admin/system function)
 */
const updateExpiredQualifications = async (req, res) => {
    try {
        // Use authenticated user's ID as the system user
        const systemUserId = req.user.id;
        const updatedCount = await userQualificationModel_1.default.updateExpiredQualifications(systemUserId);
        res.json({
            message: `${updatedCount} expired qualifications have been updated`,
            updated_count: updatedCount
        });
    }
    catch (error) {
        console.error('Error updating expired qualifications:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.updateExpiredQualifications = updateExpiredQualifications;
//# sourceMappingURL=userQualificationController.js.map