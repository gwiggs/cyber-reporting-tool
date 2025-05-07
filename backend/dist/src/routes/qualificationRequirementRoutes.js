"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const qualificationRequirementController_1 = require("../controllers/qualificationRequirementController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = (0, express_1.Router)();
// Get all qualification requirements - requires 'qualification_requirements:read' permission
router.get('/', authMiddleware_1.authenticate, (0, authMiddleware_1.checkPermission)('qualification_requirements', 'read'), qualificationRequirementController_1.getQualificationRequirements);
// Get qualification requirement by ID - requires 'qualification_requirements:read' permission
router.get('/:id', authMiddleware_1.authenticate, (0, authMiddleware_1.checkPermission)('qualification_requirements', 'read'), qualificationRequirementController_1.getQualificationRequirementById);
// Get requirements for a work role - requires 'qualification_requirements:read' permission
router.get('/work-role/:workRoleId', authMiddleware_1.authenticate, (0, authMiddleware_1.checkPermission)('qualification_requirements', 'read'), qualificationRequirementController_1.getRequirementsByWorkRoleId);
// Get work roles requiring a qualification - requires 'qualification_requirements:read' permission
router.get('/qualification/:qualificationId', authMiddleware_1.authenticate, (0, authMiddleware_1.checkPermission)('qualification_requirements', 'read'), qualificationRequirementController_1.getWorkRolesRequiringQualification);
// Create qualification requirement - requires 'qualification_requirements:create' permission
router.post('/', authMiddleware_1.authenticate, (0, authMiddleware_1.checkPermission)('qualification_requirements', 'create'), qualificationRequirementController_1.createQualificationRequirement);
// Update qualification requirement - requires 'qualification_requirements:update' permission
router.put('/:id', authMiddleware_1.authenticate, (0, authMiddleware_1.checkPermission)('qualification_requirements', 'update'), qualificationRequirementController_1.updateQualificationRequirement);
// Delete qualification requirement - requires 'qualification_requirements:delete' permission
router.delete('/:id', authMiddleware_1.authenticate, (0, authMiddleware_1.checkPermission)('qualification_requirements', 'delete'), qualificationRequirementController_1.deleteQualificationRequirement);
// Check if user has required qualifications for a work role - requires 'qualification_requirements:read' permission
router.get('/check/user/:userId/work-role/:workRoleId', authMiddleware_1.authenticate, (0, authMiddleware_1.checkPermission)('qualification_requirements', 'read'), qualificationRequirementController_1.checkUserQualificationsForWorkRole);
exports.default = router;
//# sourceMappingURL=qualificationRequirementRoutes.js.map