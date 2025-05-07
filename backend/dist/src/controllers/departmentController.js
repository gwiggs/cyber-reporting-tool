"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const zod_1 = require("zod");
const departmentModel_1 = __importDefault(require("../models/departmentModel"));
// Validation schema for creating a department
const createDepartmentSchema = zod_1.z.object({
    organization_id: zod_1.z.number().int().positive(),
    name: zod_1.z.string().min(1).max(100).trim(),
    department_code: zod_1.z.string().max(50).trim().optional(),
});
// Validation schema for updating a department
const updateDepartmentSchema = zod_1.z.object({
    name: zod_1.z.string().min(1).max(100).trim().optional(),
    department_code: zod_1.z.string().max(50).trim().optional(),
});
// Validation schema for pagination and sorting
const listQuerySchema = zod_1.z.object({
    page: zod_1.z.coerce.number().int().min(1).default(1),
    limit: zod_1.z.coerce.number().int().min(1).max(100).default(50),
    orderBy: zod_1.z.enum(['id', 'name', 'department_code', 'organization_id', 'created_at', 'updated_at']).default('name'),
    direction: zod_1.z.enum(['asc', 'desc']).default('asc'),
});
// Validation schema for organization-specific queries
const orgQuerySchema = zod_1.z.object({
    organization_id: zod_1.z.coerce.number().int().positive(),
    page: zod_1.z.coerce.number().int().min(1).default(1),
    limit: zod_1.z.coerce.number().int().min(1).max(100).default(50),
    orderBy: zod_1.z.enum(['id', 'name', 'department_code', 'created_at', 'updated_at']).default('name'),
    direction: zod_1.z.enum(['asc', 'desc']).default('asc'),
});
const departmentController = {
    /**
     * Create a new department
     */
    async create(req, res) {
        try {
            // Validate request body
            const validatedData = createDepartmentSchema.parse(req.body);
            // Create department
            const department = await departmentModel_1.default.create(validatedData);
            // Return created department
            res.status(201).json({
                success: true,
                data: department,
            });
        }
        catch (error) {
            if (error instanceof zod_1.z.ZodError) {
                res.status(400).json({
                    success: false,
                    message: 'Validation error',
                    errors: error.errors,
                });
                return;
            }
            console.error('Error creating department:', error);
            res.status(500).json({
                success: false,
                message: 'An error occurred while creating the department',
            });
        }
    },
    /**
     * Get all departments
     */
    async getAll(req, res) {
        try {
            // Check if organization_id is provided
            if (req.query.organization_id) {
                // Get departments by organization
                return await departmentController.getByOrganization(req, res);
            }
            // Validate and extract query parameters
            const { page, limit, orderBy, direction } = listQuerySchema.parse(req.query);
            // Calculate offset
            const offset = (page - 1) * limit;
            // Get departments
            const { departments, total } = await departmentModel_1.default.findAll(limit, offset, orderBy, direction);
            // Calculate pagination info
            const totalPages = Math.ceil(total / limit);
            res.status(200).json({
                success: true,
                data: departments,
                meta: {
                    total,
                    page,
                    limit,
                    totalPages,
                    hasMore: page < totalPages,
                },
            });
        }
        catch (error) {
            if (error instanceof zod_1.z.ZodError) {
                res.status(400).json({
                    success: false,
                    message: 'Invalid query parameters',
                    errors: error.errors,
                });
                return;
            }
            console.error('Error fetching departments:', error);
            res.status(500).json({
                success: false,
                message: 'An error occurred while fetching departments',
            });
        }
    },
    /**
     * Get departments by organization ID
     */
    async getByOrganization(req, res) {
        try {
            // Validate and extract query parameters
            const { organization_id, page, limit, orderBy, direction } = orgQuerySchema.parse(req.query);
            // Calculate offset
            const offset = (page - 1) * limit;
            // Get departments for the organization
            const { departments, total } = await departmentModel_1.default.findByOrganizationId(organization_id, limit, offset, orderBy, direction);
            // Calculate pagination info
            const totalPages = Math.ceil(total / limit);
            res.status(200).json({
                success: true,
                data: departments,
                meta: {
                    total,
                    page,
                    limit,
                    totalPages,
                    hasMore: page < totalPages,
                    organization_id,
                },
            });
        }
        catch (error) {
            if (error instanceof zod_1.z.ZodError) {
                res.status(400).json({
                    success: false,
                    message: 'Invalid query parameters',
                    errors: error.errors,
                });
                return;
            }
            console.error('Error fetching departments by organization:', error);
            res.status(500).json({
                success: false,
                message: 'An error occurred while fetching departments',
            });
        }
    },
    /**
     * Get department by ID
     */
    async getById(req, res) {
        try {
            const id = parseInt(req.params.id);
            if (isNaN(id)) {
                res.status(400).json({
                    success: false,
                    message: 'Invalid department ID',
                });
                return;
            }
            // Get department
            const department = await departmentModel_1.default.findById(id);
            if (!department) {
                res.status(404).json({
                    success: false,
                    message: 'Department not found',
                });
                return;
            }
            // Get user count for this department
            const usersCount = await departmentModel_1.default.getUsersCount(id);
            res.status(200).json({
                success: true,
                data: {
                    ...department,
                    users_count: usersCount
                },
            });
        }
        catch (error) {
            console.error('Error fetching department:', error);
            res.status(500).json({
                success: false,
                message: 'An error occurred while fetching the department',
            });
        }
    },
    /**
     * Update department
     */
    async update(req, res) {
        try {
            const id = parseInt(req.params.id);
            if (isNaN(id)) {
                res.status(400).json({
                    success: false,
                    message: 'Invalid department ID',
                });
                return;
            }
            // Check if department exists
            const existingDept = await departmentModel_1.default.findById(id);
            if (!existingDept) {
                res.status(404).json({
                    success: false,
                    message: 'Department not found',
                });
                return;
            }
            // Validate request body
            const validatedData = updateDepartmentSchema.parse(req.body);
            // Update department
            const updatedDept = await departmentModel_1.default.update(id, validatedData);
            res.status(200).json({
                success: true,
                data: updatedDept,
            });
        }
        catch (error) {
            if (error instanceof zod_1.z.ZodError) {
                res.status(400).json({
                    success: false,
                    message: 'Validation error',
                    errors: error.errors,
                });
                return;
            }
            console.error('Error updating department:', error);
            res.status(500).json({
                success: false,
                message: 'An error occurred while updating the department',
            });
        }
    },
    /**
     * Delete department
     */
    async delete(req, res) {
        try {
            const id = parseInt(req.params.id);
            if (isNaN(id)) {
                res.status(400).json({
                    success: false,
                    message: 'Invalid department ID',
                });
                return;
            }
            // Check if department exists
            const existingDept = await departmentModel_1.default.findById(id);
            if (!existingDept) {
                res.status(404).json({
                    success: false,
                    message: 'Department not found',
                });
                return;
            }
            // Delete department
            const result = await departmentModel_1.default.delete(id);
            if (!result) {
                res.status(400).json({
                    success: false,
                    message: 'Cannot delete department with users',
                });
                return;
            }
            res.status(200).json({
                success: true,
                message: 'Department deleted successfully',
            });
        }
        catch (error) {
            console.error('Error deleting department:', error);
            res.status(500).json({
                success: false,
                message: 'An error occurred while deleting the department',
            });
        }
    },
};
exports.default = departmentController;
//# sourceMappingURL=departmentController.js.map