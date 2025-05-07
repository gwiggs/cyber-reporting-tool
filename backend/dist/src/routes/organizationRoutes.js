"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const organizationController_1 = __importDefault(require("../controllers/organizationController"));
const authMiddleware_1 = require("../middleware/authMiddleware");
const rbacMiddleware_1 = require("../middleware/rbacMiddleware");
const router = express_1.default.Router();
/**
 * @route   POST /api/organizations
 * @desc    Create a new organization
 * @access  Private (requires 'organization:create' permission)
 */
router.post('/', authMiddleware_1.authenticate, (0, rbacMiddleware_1.authorize)('organization:create'), organizationController_1.default.create);
/**
 * @route   GET /api/organizations
 * @desc    Get all organizations
 * @access  Private (requires 'organization:read' permission)
 */
router.get('/', authMiddleware_1.authenticate, (0, rbacMiddleware_1.authorize)('organization:read'), organizationController_1.default.getAll);
/**
 * @route   GET /api/organizations/:id
 * @desc    Get organization by ID
 * @access  Private (requires 'organization:read' permission)
 */
router.get('/:id', authMiddleware_1.authenticate, (0, rbacMiddleware_1.authorize)('organization:read'), organizationController_1.default.getById);
/**
 * @route   PUT /api/organizations/:id
 * @desc    Update organization
 * @access  Private (requires 'organization:update' permission)
 */
router.put('/:id', authMiddleware_1.authenticate, (0, rbacMiddleware_1.authorize)('organization:update'), organizationController_1.default.update);
/**
 * @route   DELETE /api/organizations/:id
 * @desc    Delete organization
 * @access  Private (requires 'organization:delete' permission)
 */
router.delete('/:id', authMiddleware_1.authenticate, (0, rbacMiddleware_1.authorize)('organization:delete'), organizationController_1.default.delete);
exports.default = router;
//# sourceMappingURL=organizationRoutes.js.map