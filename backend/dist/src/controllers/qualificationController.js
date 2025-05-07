"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getExpiringQualifications = exports.getActiveQualifications = exports.getQualificationCategories = exports.getQualificationsByCategory = exports.deleteQualification = exports.updateQualification = exports.createQualification = exports.getQualificationById = exports.getQualifications = void 0;
const qualificationModel_1 = __importDefault(require("../models/qualificationModel"));
/**
 * Get all qualifications
 */
const getQualifications = async (req, res) => {
    try {
        const qualifications = await qualificationModel_1.default.findAll();
        res.json(qualifications);
    }
    catch (error) {
        console.error('Error fetching qualifications:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.getQualifications = getQualifications;
/**
 * Get qualification by ID
 */
const getQualificationById = async (req, res) => {
    try {
        const qualificationId = parseInt(req.params.id);
        if (isNaN(qualificationId)) {
            res.status(400).json({ message: 'Invalid qualification ID' });
            return;
        }
        const qualification = await qualificationModel_1.default.findById(qualificationId);
        if (!qualification) {
            res.status(404).json({ message: 'Qualification not found' });
            return;
        }
        res.json(qualification);
    }
    catch (error) {
        console.error('Error fetching qualification:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.getQualificationById = getQualificationById;
/**
 * Create a new qualification
 */
const createQualification = async (req, res) => {
    try {
        const qualificationData = req.body;
        // Validate required fields
        if (!qualificationData.name) {
            res.status(400).json({ message: 'Name is required' });
            return;
        }
        // Check if qualification with same code already exists
        if (qualificationData.code) {
            const existingQualification = await qualificationModel_1.default.findByCode(qualificationData.code);
            if (existingQualification) {
                res.status(409).json({ message: 'Qualification with this code already exists' });
                return;
            }
        }
        // Create qualification
        const newQualification = await qualificationModel_1.default.create(qualificationData);
        res.status(201).json(newQualification);
    }
    catch (error) {
        console.error('Error creating qualification:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.createQualification = createQualification;
/**
 * Update an existing qualification
 */
const updateQualification = async (req, res) => {
    try {
        const qualificationId = parseInt(req.params.id);
        const qualificationData = req.body;
        if (isNaN(qualificationId)) {
            res.status(400).json({ message: 'Invalid qualification ID' });
            return;
        }
        // Check if qualification exists
        const existingQualification = await qualificationModel_1.default.findById(qualificationId);
        if (!existingQualification) {
            res.status(404).json({ message: 'Qualification not found' });
            return;
        }
        // If code is being updated, check if it's already in use
        if (qualificationData.code && qualificationData.code !== existingQualification.code) {
            const qualificationWithCode = await qualificationModel_1.default.findByCode(qualificationData.code);
            if (qualificationWithCode && qualificationWithCode.id !== qualificationId) {
                res.status(409).json({ message: 'Code already in use by another qualification' });
                return;
            }
        }
        // Update qualification
        const updatedQualification = await qualificationModel_1.default.update(qualificationId, qualificationData);
        res.json(updatedQualification);
    }
    catch (error) {
        console.error('Error updating qualification:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.updateQualification = updateQualification;
/**
 * Delete a qualification
 */
const deleteQualification = async (req, res) => {
    try {
        const qualificationId = parseInt(req.params.id);
        if (isNaN(qualificationId)) {
            res.status(400).json({ message: 'Invalid qualification ID' });
            return;
        }
        // Check if qualification exists
        const existingQualification = await qualificationModel_1.default.findById(qualificationId);
        if (!existingQualification) {
            res.status(404).json({ message: 'Qualification not found' });
            return;
        }
        // Delete qualification
        await qualificationModel_1.default.delete(qualificationId);
        res.status(204).send();
    }
    catch (error) {
        console.error('Error deleting qualification:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.deleteQualification = deleteQualification;
/**
 * Get qualifications by category
 */
const getQualificationsByCategory = async (req, res) => {
    try {
        const category = req.params.category;
        if (!category) {
            res.status(400).json({ message: 'Category is required' });
            return;
        }
        const qualifications = await qualificationModel_1.default.findByCategory(category);
        res.json(qualifications);
    }
    catch (error) {
        console.error('Error fetching qualifications by category:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.getQualificationsByCategory = getQualificationsByCategory;
/**
 * Get all qualification categories
 */
const getQualificationCategories = async (req, res) => {
    try {
        const categories = await qualificationModel_1.default.getCategories();
        res.json(categories);
    }
    catch (error) {
        console.error('Error fetching qualification categories:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.getQualificationCategories = getQualificationCategories;
/**
 * Get active qualifications
 */
const getActiveQualifications = async (req, res) => {
    try {
        const qualifications = await qualificationModel_1.default.findActive();
        res.json(qualifications);
    }
    catch (error) {
        console.error('Error fetching active qualifications:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.getActiveQualifications = getActiveQualifications;
/**
 * Get qualifications that are expiring soon
 */
const getExpiringQualifications = async (req, res) => {
    try {
        const days = parseInt(req.query.days) || 30;
        if (isNaN(days) || days <= 0) {
            res.status(400).json({ message: 'Days must be a positive number' });
            return;
        }
        const expiringQualifications = await qualificationModel_1.default.findExpiringQualifications(days);
        res.json(expiringQualifications);
    }
    catch (error) {
        console.error('Error fetching expiring qualifications:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.getExpiringQualifications = getExpiringQualifications;
//# sourceMappingURL=qualificationController.js.map