"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const workRoleController_1 = require("../controllers/workRoleController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = (0, express_1.Router)();
// Get all work roles - requires 'work_roles:read' permission
router.get('/', authMiddleware_1.authenticate, (0, authMiddleware_1.checkPermission)('work_roles', 'read'), workRoleController_1.getWorkRoles);
// Get work role by ID - requires 'work_roles:read' permission
router.get('/:id', authMiddleware_1.authenticate, (0, authMiddleware_1.checkPermission)('work_roles', 'read'), workRoleController_1.getWorkRoleById);
// Create work role - requires 'work_roles:create' permission
router.post('/', authMiddleware_1.authenticate, (0, authMiddleware_1.checkPermission)('work_roles', 'create'), workRoleController_1.createWorkRole);
// Update work role - requires 'work_roles:update' permission
router.put('/:id', authMiddleware_1.authenticate, (0, authMiddleware_1.checkPermission)('work_roles', 'update'), workRoleController_1.updateWorkRole);
// Delete work role - requires 'work_roles:delete' permission
router.delete('/:id', authMiddleware_1.authenticate, (0, authMiddleware_1.checkPermission)('work_roles', 'delete'), workRoleController_1.deleteWorkRole);
// Get work roles by department - requires 'work_roles:read' permission
router.get('/department/:departmentId', authMiddleware_1.authenticate, (0, authMiddleware_1.checkPermission)('work_roles', 'read'), workRoleController_1.getWorkRolesByDepartment);
// Get all user work role assignments - requires 'work_roles:read' permission
router.get('/assignments/all', authMiddleware_1.authenticate, (0, authMiddleware_1.checkPermission)('work_roles', 'read'), workRoleController_1.getAllUserWorkRoles);
// Get users assigned to a work role - requires 'work_roles:read' permission
router.get('/:workRoleId/users', authMiddleware_1.authenticate, (0, authMiddleware_1.checkPermission)('work_roles', 'read'), workRoleController_1.getUsersByWorkRole);
// Get user's work roles - requires 'work_roles:read' permission
router.get('/user/:userId', authMiddleware_1.authenticate, (0, authMiddleware_1.checkPermission)('work_roles', 'read'), workRoleController_1.getUserWorkRoles);
// Get user's current work roles - requires 'work_roles:read' permission
router.get('/user/:userId/current', authMiddleware_1.authenticate, (0, authMiddleware_1.checkPermission)('work_roles', 'read'), workRoleController_1.getUserCurrentWorkRoles);
// Get user's historical work roles - requires 'work_roles:read' permission
router.get('/user/:userId/history', authMiddleware_1.authenticate, (0, authMiddleware_1.checkPermission)('work_roles', 'read'), workRoleController_1.getUserHistoricalWorkRoles);
// Get user's missing qualifications - requires 'work_roles:read' permission
router.get('/user/:userId/missing-qualifications', authMiddleware_1.authenticate, (0, authMiddleware_1.checkPermission)('work_roles', 'read'), workRoleController_1.getUserMissingQualifications);
// Assign work role to user - requires 'work_roles:create' permission
router.post('/assign', authMiddleware_1.authenticate, (0, authMiddleware_1.checkPermission)('work_roles', 'create'), workRoleController_1.assignWorkRoleToUser);
// Update user work role - requires 'work_roles:update' permission
router.put('/user/:userId/role/:workRoleId', authMiddleware_1.authenticate, (0, authMiddleware_1.checkPermission)('work_roles', 'update'), workRoleController_1.updateUserWorkRole);
// End user work role assignment - requires 'work_roles:update' permission
router.put('/user/:userId/role/:workRoleId/end', authMiddleware_1.authenticate, (0, authMiddleware_1.checkPermission)('work_roles', 'update'), workRoleController_1.endUserWorkRole);
exports.default = router;
//# sourceMappingURL=workRoleRoutes.js.map