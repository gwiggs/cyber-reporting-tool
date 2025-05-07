"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const zod_1 = require("zod");
const organizationModel_1 = __importDefault(require("../models/organizationModel"));
// Validation schema for creating an organization
const createOrganizationSchema = zod_1.z.object({
    name: zod_1.z.string().min(1).max(100).trim(),
});
// Validation schema for updating an organization
const updateOrganizationSchema = zod_1.z.object({
    name: zod_1.z.string().min(1).max(100).trim().optional(),
});
// Validation schema for pagination and sorting
const listQuerySchema = zod_1.z.object({
    page: zod_1.z.coerce.number().int().min(1).default(1),
    limit: zod_1.z.coerce.number().int().min(1).max(100).default(50),
    orderBy: zod_1.z.enum(['id', 'name', 'created_at', 'updated_at']).default('name'),
    direction: zod_1.z.enum(['asc', 'desc']).default('asc'),
});
const organizationController = {
    /**
     * Create a new organization
     */
    async create(req, res) {
        try {
            // Validate request body
            const validatedData = createOrganizationSchema.parse(req.body);
            // Create organization
            const organization = await organizationModel_1.default.create(validatedData);
            // Log action
            // Audit logging would go here
            // Return created organization
            res.status(201).json({
                success: true,
                data: organization,
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
            console.error('Error creating organization:', error);
            res.status(500).json({
                success: false,
                message: 'An error occurred while creating the organization',
            });
        }
    },
    /**
     * Get all organizations
     */
    async getAll(req, res) {
        try {
            // Validate and extract query parameters
            const { page, limit, orderBy, direction } = listQuerySchema.parse(req.query);
            // Calculate offset
            const offset = (page - 1) * limit;
            // Get organizations
            const { organizations, total } = await organizationModel_1.default.findAll(limit, offset, orderBy, direction);
            // Calculate pagination info
            const totalPages = Math.ceil(total / limit);
            res.status(200).json({
                success: true,
                data: organizations,
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
            console.error('Error fetching organizations:', error);
            res.status(500).json({
                success: false,
                message: 'An error occurred while fetching organizations',
            });
        }
    },
    /**
     * Get organization by ID
     */
    async getById(req, res) {
        try {
            const id = parseInt(req.params.id);
            if (isNaN(id)) {
                res.status(400).json({
                    success: false,
                    message: 'Invalid organization ID',
                });
                return;
            }
            // Get organization with departments count
            const organization = await organizationModel_1.default.getWithDepartmentsCount(id);
            if (!organization) {
                res.status(404).json({
                    success: false,
                    message: 'Organization not found',
                });
                return;
            }
            res.status(200).json({
                success: true,
                data: organization,
            });
        }
        catch (error) {
            console.error('Error fetching organization:', error);
            res.status(500).json({
                success: false,
                message: 'An error occurred while fetching the organization',
            });
        }
    },
    /**
     * Update organization
     */
    async update(req, res) {
        try {
            const id = parseInt(req.params.id);
            if (isNaN(id)) {
                res.status(400).json({
                    success: false,
                    message: 'Invalid organization ID',
                });
                return;
            }
            // Check if organization exists
            const existingOrg = await organizationModel_1.default.findById(id);
            if (!existingOrg) {
                res.status(404).json({
                    success: false,
                    message: 'Organization not found',
                });
                return;
            }
            // Validate request body
            const validatedData = updateOrganizationSchema.parse(req.body);
            // Update organization
            const updatedOrg = await organizationModel_1.default.update(id, validatedData);
            // Log action
            // Audit logging would go here
            res.status(200).json({
                success: true,
                data: updatedOrg,
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
            console.error('Error updating organization:', error);
            res.status(500).json({
                success: false,
                message: 'An error occurred while updating the organization',
            });
        }
    },
    /**
     * Delete organization
     */
    async delete(req, res) {
        try {
            const id = parseInt(req.params.id);
            if (isNaN(id)) {
                res.status(400).json({
                    success: false,
                    message: 'Invalid organization ID',
                });
                return;
            }
            // Check if organization exists
            const existingOrg = await organizationModel_1.default.findById(id);
            if (!existingOrg) {
                res.status(404).json({
                    success: false,
                    message: 'Organization not found',
                });
                return;
            }
            // Delete organization
            const result = await organizationModel_1.default.delete(id);
            if (!result) {
                res.status(400).json({
                    success: false,
                    message: 'Cannot delete organization with departments or users',
                });
                return;
            }
            // Log action
            // Audit logging would go here
            res.status(200).json({
                success: true,
                message: 'Organization deleted successfully',
            });
        }
        catch (error) {
            console.error('Error deleting organization:', error);
            res.status(500).json({
                success: false,
                message: 'An error occurred while deleting the organization',
            });
        }
    },
};
exports.default = organizationController;
//# sourceMappingURL=organizationController.js.map