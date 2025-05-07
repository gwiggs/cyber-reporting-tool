"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const departmentController_1 = __importDefault(require("../controllers/departmentController"));
const authMiddleware_1 = require("../middleware/authMiddleware");
const rbacMiddleware_1 = require("../middleware/rbacMiddleware");
const router = express_1.default.Router();
/**
 * @route   POST /api/departments
 * @desc    Create a new department
 * @access  Private (requires 'department:create' permission)
 */
router.post('/', authMiddleware_1.authenticate, (0, rbacMiddleware_1.authorize)('department:create'), (0, rbacMiddleware_1.belongsToOrganization)(), departmentController_1.default.create);
/**
 * @route   GET /api/departments
 * @desc    Get all departments, can filter by organization_id
 * @access  Private (requires 'department:read' permission)
 */
router.get('/', authMiddleware_1.authenticate, (0, rbacMiddleware_1.authorize)('department:read'), departmentController_1.default.getAll);
/**
 * @route   GET /api/departments/:id
 * @desc    Get department by ID
 * @access  Private (requires 'department:read' permission)
 */
router.get('/:id', authMiddleware_1.authenticate, (0, rbacMiddleware_1.authorize)('department:read'), departmentController_1.default.getById);
/**
 * @route   PUT /api/departments/:id
 * @desc    Update department
 * @access  Private (requires 'department:update' permission)
 */
router.put('/:id', authMiddleware_1.authenticate, (0, rbacMiddleware_1.authorize)('department:update'), departmentController_1.default.update);
/**
 * @route   DELETE /api/departments/:id
 * @desc    Delete department
 * @access  Private (requires 'department:delete' permission)
 */
router.delete('/:id', authMiddleware_1.authenticate, (0, rbacMiddleware_1.authorize)('department:delete'), departmentController_1.default.delete);
exports.default = router;
//# sourceMappingURL=departmentRoutes.js.map