"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const permissionController_1 = __importDefault(require("../controllers/permissionController"));
const authMiddleware_1 = require("../middleware/authMiddleware");
const rbacMiddleware_1 = require("../middleware/rbacMiddleware");
const router = express_1.default.Router();
/**
 * @route   POST /api/permissions
 * @desc    Create a new permission
 * @access  Private (requires 'permission:create' permission)
 */
router.post('/', authMiddleware_1.authenticate, (0, rbacMiddleware_1.authorize)('permission:create'), permissionController_1.default.create);
/**
 * @route   GET /api/permissions
 * @desc    Get all permissions
 * @access  Private (requires 'permission:read' permission)
 */
router.get('/', authMiddleware_1.authenticate, (0, rbacMiddleware_1.authorize)('permission:read'), permissionController_1.default.getAll);
/**
 * @route   GET /api/permissions/:id
 * @desc    Get permission by ID
 * @access  Private (requires 'permission:read' permission)
 */
router.get('/:id', authMiddleware_1.authenticate, (0, rbacMiddleware_1.authorize)('permission:read'), permissionController_1.default.getById);
/**
 * @route   PUT /api/permissions/:id
 * @desc    Update permission
 * @access  Private (requires 'permission:update' permission)
 */
router.put('/:id', authMiddleware_1.authenticate, (0, rbacMiddleware_1.authorize)('permission:update'), permissionController_1.default.update);
/**
 * @route   DELETE /api/permissions/:id
 * @desc    Delete permission
 * @access  Private (requires 'permission:delete' permission)
 */
router.delete('/:id', authMiddleware_1.authenticate, (0, rbacMiddleware_1.authorize)('permission:delete'), permissionController_1.default.delete);
exports.default = router;
//# sourceMappingURL=permissionRoutes.js.map