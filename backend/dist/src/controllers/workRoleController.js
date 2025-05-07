"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserMissingQualifications = exports.endUserWorkRole = exports.updateUserWorkRole = exports.assignWorkRoleToUser = exports.getUsersByWorkRole = exports.getUserHistoricalWorkRoles = exports.getUserCurrentWorkRoles = exports.getUserWorkRoles = exports.getAllUserWorkRoles = exports.getWorkRolesByDepartment = exports.deleteWorkRole = exports.updateWorkRole = exports.createWorkRole = exports.getWorkRoleById = exports.getWorkRoles = void 0;
const workRoleModel_1 = __importDefault(require("../models/workRoleModel"));
const qualificationRequirementModel_1 = __importDefault(require("../models/qualificationRequirementModel"));
const departmentModel_1 = __importDefault(require("../models/departmentModel"));
const userModel_1 = __importDefault(require("../models/userModel"));
/**
 * Get all work roles
 */
const getWorkRoles = async (req, res) => {
    try {
        const workRoles = await workRoleModel_1.default.findAll();
        res.json(workRoles);
    }
    catch (error) {
        console.error('Error fetching work roles:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.getWorkRoles = getWorkRoles;
/**
 * Get work role by ID
 */
const getWorkRoleById = async (req, res) => {
    try {
        const workRoleId = parseInt(req.params.id);
        if (isNaN(workRoleId)) {
            res.status(400).json({ message: 'Invalid work role ID' });
            return;
        }
        const workRole = await workRoleModel_1.default.findById(workRoleId);
        if (!workRole) {
            res.status(404).json({ message: 'Work role not found' });
            return;
        }
        res.json(workRole);
    }
    catch (error) {
        console.error('Error fetching work role:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.getWorkRoleById = getWorkRoleById;
/**
 * Create a new work role
 */
const createWorkRole = async (req, res) => {
    try {
        const workRoleData = req.body;
        // Validate required fields
        if (!workRoleData.name) {
            res.status(400).json({ message: 'Name is required' });
            return;
        }
        // Check if work role with same code already exists
        if (workRoleData.code) {
            const existingWorkRole = await workRoleModel_1.default.findByCode(workRoleData.code);
            if (existingWorkRole) {
                res.status(409).json({ message: 'Work role with this code already exists' });
                return;
            }
        }
        // Validate department if provided
        if (workRoleData.department_id) {
            const department = await departmentModel_1.default.findById(workRoleData.department_id);
            if (!department) {
                res.status(404).json({ message: 'Department not found' });
                return;
            }
        }
        // Create work role
        const newWorkRole = await workRoleModel_1.default.create(workRoleData);
        res.status(201).json(newWorkRole);
    }
    catch (error) {
        console.error('Error creating work role:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.createWorkRole = createWorkRole;
/**
 * Update an existing work role
 */
const updateWorkRole = async (req, res) => {
    try {
        const workRoleId = parseInt(req.params.id);
        const workRoleData = req.body;
        if (isNaN(workRoleId)) {
            res.status(400).json({ message: 'Invalid work role ID' });
            return;
        }
        // Check if work role exists
        const existingWorkRole = await workRoleModel_1.default.findById(workRoleId);
        if (!existingWorkRole) {
            res.status(404).json({ message: 'Work role not found' });
            return;
        }
        // If code is being updated, check if it's already in use
        if (workRoleData.code && workRoleData.code !== existingWorkRole.code) {
            const workRoleWithCode = await workRoleModel_1.default.findByCode(workRoleData.code);
            if (workRoleWithCode && workRoleWithCode.id !== workRoleId) {
                res.status(409).json({ message: 'Code already in use by another work role' });
                return;
            }
        }
        // Validate department if provided
        if (workRoleData.department_id) {
            const department = await departmentModel_1.default.findById(workRoleData.department_id);
            if (!department) {
                res.status(404).json({ message: 'Department not found' });
                return;
            }
        }
        // Update work role
        const updatedWorkRole = await workRoleModel_1.default.update(workRoleId, workRoleData);
        res.json(updatedWorkRole);
    }
    catch (error) {
        console.error('Error updating work role:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.updateWorkRole = updateWorkRole;
/**
 * Delete a work role
 */
const deleteWorkRole = async (req, res) => {
    try {
        const workRoleId = parseInt(req.params.id);
        if (isNaN(workRoleId)) {
            res.status(400).json({ message: 'Invalid work role ID' });
            return;
        }
        // Check if work role exists
        const existingWorkRole = await workRoleModel_1.default.findById(workRoleId);
        if (!existingWorkRole) {
            res.status(404).json({ message: 'Work role not found' });
            return;
        }
        // Delete work role
        await workRoleModel_1.default.delete(workRoleId);
        res.status(204).send();
    }
    catch (error) {
        console.error('Error deleting work role:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.deleteWorkRole = deleteWorkRole;
/**
 * Get work roles by department
 */
const getWorkRolesByDepartment = async (req, res) => {
    try {
        const departmentId = parseInt(req.params.departmentId);
        if (isNaN(departmentId)) {
            res.status(400).json({ message: 'Invalid department ID' });
            return;
        }
        // Check if department exists
        const department = await departmentModel_1.default.findById(departmentId);
        if (!department) {
            res.status(404).json({ message: 'Department not found' });
            return;
        }
        const workRoles = await workRoleModel_1.default.findByDepartment(departmentId);
        res.json(workRoles);
    }
    catch (error) {
        console.error('Error fetching work roles by department:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.getWorkRolesByDepartment = getWorkRolesByDepartment;
/**
 * Get all user work role assignments
 */
const getAllUserWorkRoles = async (req, res) => {
    try {
        const userWorkRoles = await workRoleModel_1.default.findAllUserWorkRoles();
        res.json(userWorkRoles);
    }
    catch (error) {
        console.error('Error fetching user work roles:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.getAllUserWorkRoles = getAllUserWorkRoles;
/**
 * Get work roles for a specific user
 */
const getUserWorkRoles = async (req, res) => {
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
        const userWorkRoles = await workRoleModel_1.default.findUserWorkRolesByUserId(userId);
        res.json(userWorkRoles);
    }
    catch (error) {
        console.error('Error fetching user work roles:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.getUserWorkRoles = getUserWorkRoles;
/**
 * Get current work roles for a user
 */
const getUserCurrentWorkRoles = async (req, res) => {
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
        const userWorkRoles = await workRoleModel_1.default.getUserCurrentWorkRoles(userId);
        res.json(userWorkRoles);
    }
    catch (error) {
        console.error('Error fetching user current work roles:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.getUserCurrentWorkRoles = getUserCurrentWorkRoles;
/**
 * Get historical work roles for a user
 */
const getUserHistoricalWorkRoles = async (req, res) => {
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
        const userWorkRoles = await workRoleModel_1.default.getUserHistoricalWorkRoles(userId);
        res.json(userWorkRoles);
    }
    catch (error) {
        console.error('Error fetching user historical work roles:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.getUserHistoricalWorkRoles = getUserHistoricalWorkRoles;
/**
 * Get users assigned to a work role
 */
const getUsersByWorkRole = async (req, res) => {
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
        const userWorkRoles = await workRoleModel_1.default.findUsersByWorkRole(workRoleId);
        res.json(userWorkRoles);
    }
    catch (error) {
        console.error('Error fetching users by work role:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.getUsersByWorkRole = getUsersByWorkRole;
/**
 * Assign work role to user
 */
const assignWorkRoleToUser = async (req, res) => {
    try {
        const workRoleData = req.body;
        // Validate required fields
        if (!workRoleData.user_id || !workRoleData.work_role_id || !workRoleData.start_date) {
            res.status(400).json({ message: 'User ID, work role ID, and start date are required' });
            return;
        }
        // Check if user exists
        const user = await userModel_1.default.findById(workRoleData.user_id);
        if (!user) {
            res.status(404).json({ message: 'User not found' });
            return;
        }
        // Check if work role exists
        const workRole = await workRoleModel_1.default.findById(workRoleData.work_role_id);
        if (!workRole) {
            res.status(404).json({ message: 'Work role not found' });
            return;
        }
        // Check user qualifications if the work role has requirements
        if (req.query.checkQualifications === 'true') {
            const qualificationCheck = await qualificationRequirementModel_1.default.checkUserQualificationsForWorkRole(workRoleData.user_id, workRoleData.work_role_id);
            if (!qualificationCheck.qualified) {
                res.status(409).json({
                    message: `User is missing ${qualificationCheck.missingRequired} required qualifications for this work role`,
                    qualification_check: qualificationCheck
                });
                return;
            }
        }
        // Assign work role to user
        try {
            const assignment = await workRoleModel_1.default.assignWorkRoleToUser(workRoleData);
            res.status(201).json(assignment);
        }
        catch (err) {
            if (err instanceof Error && err.message.includes('User is already assigned')) {
                res.status(409).json({ message: 'User is already assigned to this work role' });
            }
            else {
                throw err;
            }
        }
    }
    catch (error) {
        console.error('Error assigning work role to user:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.assignWorkRoleToUser = assignWorkRoleToUser;
/**
 * Update user work role
 */
const updateUserWorkRole = async (req, res) => {
    try {
        const userId = parseInt(req.params.userId);
        const workRoleId = parseInt(req.params.workRoleId);
        const workRoleData = req.body;
        if (isNaN(userId) || isNaN(workRoleId)) {
            res.status(400).json({ message: 'Invalid user ID or work role ID' });
            return;
        }
        // Update user work role
        try {
            const updatedUserWorkRole = await workRoleModel_1.default.updateUserWorkRole(userId, workRoleId, workRoleData);
            if (!updatedUserWorkRole) {
                res.status(404).json({ message: 'User work role assignment not found' });
                return;
            }
            res.json(updatedUserWorkRole);
        }
        catch (error) {
            throw error;
        }
    }
    catch (error) {
        console.error('Error updating user work role:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.updateUserWorkRole = updateUserWorkRole;
/**
 * End user work role assignment
 */
const endUserWorkRole = async (req, res) => {
    try {
        const userId = parseInt(req.params.userId);
        const workRoleId = parseInt(req.params.workRoleId);
        const { end_date } = req.body;
        if (isNaN(userId) || isNaN(workRoleId)) {
            res.status(400).json({ message: 'Invalid user ID or work role ID' });
            return;
        }
        if (!end_date) {
            res.status(400).json({ message: 'End date is required' });
            return;
        }
        // End user work role assignment
        const endedWorkRole = await workRoleModel_1.default.endWorkRoleAssignment(userId, workRoleId, new Date(end_date));
        if (!endedWorkRole) {
            res.status(404).json({ message: 'User work role assignment not found' });
            return;
        }
        res.json(endedWorkRole);
    }
    catch (error) {
        console.error('Error ending user work role:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.endUserWorkRole = endUserWorkRole;
/**
 * Get user missing qualifications
 */
const getUserMissingQualifications = async (req, res) => {
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
        const missingQualifications = await qualificationRequirementModel_1.default.findMissingQualificationsForUser(userId);
        res.json(missingQualifications);
    }
    catch (error) {
        console.error('Error fetching user missing qualifications:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.getUserMissingQualifications = getUserMissingQualifications;
//# sourceMappingURL=workRoleController.js.map