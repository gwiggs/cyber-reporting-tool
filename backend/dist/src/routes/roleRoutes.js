"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const roleController_1 = __importDefault(require("../controllers/roleController"));
const authMiddleware_1 = require("../middleware/authMiddleware");
const rbacMiddleware_1 = require("../middleware/rbacMiddleware");
const router = express_1.default.Router();
/**
 * @route   GET /api/roles/public
 * @desc    Get all roles (public endpoint for registration)
 * @access  Public
 */
router.get('/public', roleController_1.default.getAllPublic);
/**
 * @route   GET /api/roles
 * @desc    Get all roles
 * @access  Private (requires authentication)
 */
router.get('/', authMiddleware_1.authenticate, roleController_1.default.getAll);
/**
 * @route   GET /api/roles/:id
 * @desc    Get a role by ID
 * @access  Private (requires authentication)
 */
router.get('/:id', authMiddleware_1.authenticate, roleController_1.default.getById);
/**
 * @route   POST /api/roles
 * @desc    Create a new role
 * @access  Private (requires 'role:create' permission)
 */
router.post('/', authMiddleware_1.authenticate, (0, rbacMiddleware_1.authorize)('role:create'), roleController_1.default.create);
/**
 * @route   PUT /api/roles/:id
 * @desc    Update a role
 * @access  Private (requires 'role:update' permission)
 */
router.put('/:id', authMiddleware_1.authenticate, (0, rbacMiddleware_1.authorize)('role:update'), roleController_1.default.update);
/**
 * @route   DELETE /api/roles/:id
 * @desc    Delete a role
 * @access  Private (requires 'role:delete' permission)
 */
router.delete('/:id', authMiddleware_1.authenticate, (0, rbacMiddleware_1.authorize)('role:delete'), roleController_1.default.delete);
/**
 * @route   GET /api/roles/:id/permissions
 * @desc    Get permissions for a role
 * @access  Private (requires authentication)
 */
router.get('/:id/permissions', authMiddleware_1.authenticate, roleController_1.default.getPermissions);
/**
 * @route   POST /api/roles/:id/permissions
 * @desc    Add permission to a role
 * @access  Private (requires 'role:update' permission)
 */
router.post('/:id/permissions', authMiddleware_1.authenticate, (0, rbacMiddleware_1.authorize)('role:update'), roleController_1.default.addPermission);
/**
 * @route   DELETE /api/roles/:id/permissions/:permissionId
 * @desc    Remove permission from a role
 * @access  Private (requires 'role:update' permission)
 */
router.delete('/:id/permissions/:permissionId', authMiddleware_1.authenticate, (0, rbacMiddleware_1.authorize)('role:update'), roleController_1.default.removePermission);
exports.default = router;
//# sourceMappingURL=roleRoutes.js.map