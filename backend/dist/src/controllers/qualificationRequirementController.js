"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkUserQualificationsForWorkRole = exports.deleteQualificationRequirement = exports.updateQualificationRequirement = exports.createQualificationRequirement = exports.getWorkRolesRequiringQualification = exports.getRequirementsByWorkRoleId = exports.getQualificationRequirementById = exports.getQualificationRequirements = void 0;
const qualificationRequirementModel_1 = __importDefault(require("../models/qualificationRequirementModel"));
const workRoleModel_1 = __importDefault(require("../models/workRoleModel"));
const qualificationModel_1 = __importDefault(require("../models/qualificationModel"));
const userModel_1 = __importDefault(require("../models/userModel"));
/**
 * Get all qualification requirements
 */
const getQualificationRequirements = async (req, res) => {
    try {
        const requirements = await qualificationRequirementModel_1.default.findAll();
        res.json(requirements);
    }
    catch (error) {
        console.error('Error fetching qualification requirements:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.getQualificationRequirements = getQualificationRequirements;
/**
 * Get qualification requirement by ID
 */
const getQualificationRequirementById = async (req, res) => {
    try {
        const requirementId = parseInt(req.params.id);
        if (isNaN(requirementId)) {
            res.status(400).json({ message: 'Invalid qualification requirement ID' });
            return;
        }
        const requirement = await qualificationRequirementModel_1.default.findById(requirementId);
        if (!requirement) {
            res.status(404).json({ message: 'Qualification requirement not found' });
            return;
        }
        res.json(requirement);
    }
    catch (error) {
        console.error('Error fetching qualification requirement:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.getQualificationRequirementById = getQualificationRequirementById;
/**
 * Get qualification requirements for a specific work role
 */
const getRequirementsByWorkRoleId = async (req, res) => {
    try {
        const workRoleId = parseInt(req.params.workRoleId);
        if (isNaN(workRoleId)) {
            res.status(400).json({ message: 'Invalid work role ID' });
            return;
        }
        // Check if work role exists
        const workRole = await workRoleModel_1.default.findById(workRoleId);
        if (!workRole) {
            res.status(404).json({ message: 'Work role not found' });
            return;
        }
        const requirements = await qualificationRequirementModel_1.default.findByWorkRoleId(workRoleId);
        res.json(requirements);
    }
    catch (error) {
        console.error('Error fetching qualification requirements by work role:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.getRequirementsByWorkRoleId = getRequirementsByWorkRoleId;
/**
 * Get work roles that require a specific qualification
 */
const getWorkRolesRequiringQualification = async (req, res) => {
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
        const workRoles = await qualificationRequirementModel_1.default.findWorkRolesRequiringQualification(qualificationId);
        res.json(workRoles);
    }
    catch (error) {
        console.error('Error fetching work roles requiring qualification:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.getWorkRolesRequiringQualification = getWorkRolesRequiringQualification;
/**
 * Create a new qualification requirement
 */
const createQualificationRequirement = async (req, res) => {
    try {
        const requirementData = req.body;
        // Validate required fields
        if (!requirementData.work_role_id || !requirementData.qualification_id) {
            res.status(400).json({ message: 'Work role ID and qualification ID are required' });
            return;
        }
        // Check if work role exists
        const workRole = await workRoleModel_1.default.findById(requirementData.work_role_id);
        if (!workRole) {
            res.status(404).json({ message: 'Work role not found' });
            return;
        }
        // Check if qualification exists
        const qualification = await qualificationModel_1.default.findById(requirementData.qualification_id);
        if (!qualification) {
            res.status(404).json({ message: 'Qualification not found' });
            return;
        }
        // Create qualification requirement
        try {
            const newRequirement = await qualificationRequirementModel_1.default.create(requirementData);
            res.status(201).json(newRequirement);
        }
        catch (err) {
            if (err instanceof Error && err.message.includes('already exists')) {
                res.status(409).json({ message: 'This qualification requirement already exists for this work role' });
            }
            else {
                throw err;
            }
        }
    }
    catch (error) {
        console.error('Error creating qualification requirement:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.createQualificationRequirement = createQualificationRequirement;
/**
 * Update an existing qualification requirement
 */
const updateQualificationRequirement = async (req, res) => {
    try {
        const requirementId = parseInt(req.params.id);
        const requirementData = req.body;
        if (isNaN(requirementId)) {
            res.status(400).json({ message: 'Invalid qualification requirement ID' });
            return;
        }
        // Check if qualification requirement exists
        const existingRequirement = await qualificationRequirementModel_1.default.findById(requirementId);
        if (!existingRequirement) {
            res.status(404).json({ message: 'Qualification requirement not found' });
            return;
        }
        // Update qualification requirement
        const updatedRequirement = await qualificationRequirementModel_1.default.update(requirementId, requirementData);
        res.json(updatedRequirement);
    }
    catch (error) {
        console.error('Error updating qualification requirement:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.updateQualificationRequirement = updateQualificationRequirement;
/**
 * Delete a qualification requirement
 */
const deleteQualificationRequirement = async (req, res) => {
    try {
        const requirementId = parseInt(req.params.id);
        if (isNaN(requirementId)) {
            res.status(400).json({ message: 'Invalid qualification requirement ID' });
            return;
        }
        // Check if qualification requirement exists
        const existingRequirement = await qualificationRequirementModel_1.default.findById(requirementId);
        if (!existingRequirement) {
            res.status(404).json({ message: 'Qualification requirement not found' });
            return;
        }
        // Delete qualification requirement
        await qualificationRequirementModel_1.default.delete(requirementId);
        res.status(204).send();
    }
    catch (error) {
        console.error('Error deleting qualification requirement:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.deleteQualificationRequirement = deleteQualificationRequirement;
/**
 * Check if a user has the required qualifications for a work role
 */
const checkUserQualificationsForWorkRole = async (req, res) => {
    try {
        const userId = parseInt(req.params.userId);
        const workRoleId = parseInt(req.params.workRoleId);
        if (isNaN(userId) || isNaN(workRoleId)) {
            res.status(400).json({ message: 'Invalid user ID or work role ID' });
            return;
        }
        // Check if user exists
        const user = await userModel_1.default.findById(userId);
        if (!user) {
            res.status(404).json({ message: 'User not found' });
            return;
        }
        // Check if work role exists
        const workRole = await workRoleModel_1.default.findById(workRoleId);
        if (!workRole) {
            res.status(404).json({ message: 'Work role not found' });
            return;
        }
        const checkResult = await qualificationRequirementModel_1.default.checkUserQualificationsForWorkRole(userId, workRoleId);
        res.json({
            user_id: userId,
            work_role_id: workRoleId,
            work_role_name: workRole.name,
            ...checkResult
        });
    }
    catch (error) {
        console.error('Error checking user qualifications for work role:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.checkUserQualificationsForWorkRole = checkUserQualificationsForWorkRole;
//# sourceMappingURL=qualificationRequirementController.js.map