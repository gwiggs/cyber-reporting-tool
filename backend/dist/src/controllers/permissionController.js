"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const zod_1 = require("zod");
const permissionModel_1 = __importDefault(require("../models/permissionModel"));
// Validation schema for creating a permission
const createPermissionSchema = zod_1.z.object({
    name: zod_1.z.string().min(1).max(100).trim(),
    description: zod_1.z.string().max(255).optional(),
    resource: zod_1.z.string().min(1).max(100).trim(),
    action: zod_1.z.string().min(1).max(50).trim(),
});
// Validation schema for updating a permission
const updatePermissionSchema = zod_1.z.object({
    name: zod_1.z.string().min(1).max(100).trim().optional(),
    description: zod_1.z.string().max(255).optional(),
    resource: zod_1.z.string().min(1).max(100).trim().optional(),
    action: zod_1.z.string().min(1).max(50).trim().optional(),
});
// Validation schema for pagination and sorting
const listQuerySchema = zod_1.z.object({
    page: zod_1.z.coerce.number().int().min(1).default(1),
    limit: zod_1.z.coerce.number().int().min(1).max(100).default(100),
    orderBy: zod_1.z.enum(['id', 'name', 'resource', 'action', 'created_at', 'updated_at']).default('resource'),
    direction: zod_1.z.enum(['asc', 'desc']).default('asc'),
    resource: zod_1.z.string().optional(),
});
const permissionController = {
    /**
     * Create a new permission
     */
    async create(req, res) {
        try {
            // Validate request body
            const validatedData = createPermissionSchema.parse(req.body);
            // Check if permission with this resource/action already exists
            const existingPerm = await permissionModel_1.default.findByResourceAction(validatedData.resource, validatedData.action);
            if (existingPerm) {
                res.status(400).json({
                    success: false,
                    message: 'A permission with this resource and action already exists',
                });
                return;
            }
            // Create permission
            const permission = await permissionModel_1.default.create(validatedData);
            // Return created permission
            res.status(201).json({
                success: true,
                data: permission,
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
            console.error('Error creating permission:', error);
            res.status(500).json({
                success: false,
                message: 'An error occurred while creating the permission',
            });
        }
    },
    /**
     * Get all permissions
     */
    async getAll(req, res) {
        try {
            // Validate and extract query parameters
            const parsed = listQuerySchema.parse(req.query);
            const { page, limit, orderBy, direction, resource } = parsed;
            // If resource is specified, filter by resource
            if (resource) {
                const permissions = await permissionModel_1.default.findByResource(resource);
                res.status(200).json({
                    success: true,
                    data: permissions,
                    meta: {
                        total: permissions.length,
                        resource,
                    },
                });
                return;
            }
            // Calculate offset
            const offset = (page - 1) * limit;
            // Get permissions
            const { permissions, total } = await permissionModel_1.default.findAll(limit, offset, orderBy, direction);
            // Calculate pagination info
            const totalPages = Math.ceil(total / limit);
            res.status(200).json({
                success: true,
                data: permissions,
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
            console.error('Error fetching permissions:', error);
            res.status(500).json({
                success: false,
                message: 'An error occurred while fetching permissions',
            });
        }
    },
    /**
     * Get permission by ID
     */
    async getById(req, res) {
        try {
            const id = parseInt(req.params.id);
            if (isNaN(id)) {
                res.status(400).json({
                    success: false,
                    message: 'Invalid permission ID',
                });
                return;
            }
            // Get permission
            const permission = await permissionModel_1.default.findById(id);
            if (!permission) {
                res.status(404).json({
                    success: false,
                    message: 'Permission not found',
                });
                return;
            }
            // Check if permission is in use
            const isInUse = await permissionModel_1.default.isInUse(id);
            // Get roles with this permission
            const roleIds = await permissionModel_1.default.getRolesWithPermission(id);
            res.status(200).json({
                success: true,
                data: {
                    ...permission,
                    is_in_use: isInUse,
                    role_count: roleIds.length,
                    role_ids: roleIds
                },
            });
        }
        catch (error) {
            console.error('Error fetching permission:', error);
            res.status(500).json({
                success: false,
                message: 'An error occurred while fetching the permission',
            });
        }
    },
    /**
     * Update permission
     */
    async update(req, res) {
        try {
            const id = parseInt(req.params.id);
            if (isNaN(id)) {
                res.status(400).json({
                    success: false,
                    message: 'Invalid permission ID',
                });
                return;
            }
            // Check if permission exists
            const existingPerm = await permissionModel_1.default.findById(id);
            if (!existingPerm) {
                res.status(404).json({
                    success: false,
                    message: 'Permission not found',
                });
                return;
            }
            // Validate request body
            const validatedData = updatePermissionSchema.parse(req.body);
            // If changing resource/action, check for conflicts
            if ((validatedData.resource && validatedData.resource !== existingPerm.resource) ||
                (validatedData.action && validatedData.action !== existingPerm.action)) {
                // Get the new resource/action values
                const newResource = validatedData.resource || existingPerm.resource;
                const newAction = validatedData.action || existingPerm.action;
                // Check for conflicts
                const conflict = await permissionModel_1.default.findByResourceAction(newResource, newAction);
                if (conflict && conflict.id !== id) {
                    res.status(400).json({
                        success: false,
                        message: 'A permission with this resource and action already exists',
                    });
                    return;
                }
            }
            // Update permission
            const updatedPerm = await permissionModel_1.default.update(id, validatedData);
            res.status(200).json({
                success: true,
                data: updatedPerm,
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
            console.error('Error updating permission:', error);
            res.status(500).json({
                success: false,
                message: 'An error occurred while updating the permission',
            });
        }
    },
    /**
     * Delete permission
     */
    async delete(req, res) {
        try {
            const id = parseInt(req.params.id);
            if (isNaN(id)) {
                res.status(400).json({
                    success: false,
                    message: 'Invalid permission ID',
                });
                return;
            }
            // Check if permission exists
            const existingPerm = await permissionModel_1.default.findById(id);
            if (!existingPerm) {
                res.status(404).json({
                    success: false,
                    message: 'Permission not found',
                });
                return;
            }
            // Check if permission is in use
            const isInUse = await permissionModel_1.default.isInUse(id);
            if (isInUse) {
                res.status(400).json({
                    success: false,
                    message: 'Cannot delete permission that is assigned to roles',
                });
                return;
            }
            // Delete permission
            const result = await permissionModel_1.default.delete(id);
            if (!result) {
                res.status(500).json({
                    success: false,
                    message: 'Failed to delete permission',
                });
                return;
            }
            res.status(200).json({
                success: true,
                message: 'Permission deleted successfully',
            });
        }
        catch (error) {
            console.error('Error deleting permission:', error);
            res.status(500).json({
                success: false,
                message: 'An error occurred while deleting the permission',
            });
        }
    },
};
exports.default = permissionController;
//# sourceMappingURL=permissionController.js.map