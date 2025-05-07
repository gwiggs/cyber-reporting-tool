"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const qualificationController_1 = require("../controllers/qualificationController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = (0, express_1.Router)();
// Get all qualifications - requires 'qualifications:read' permission
router.get('/', authMiddleware_1.authenticate, (0, authMiddleware_1.checkPermission)('qualifications', 'read'), qualificationController_1.getQualifications);
// Get active qualifications - requires 'qualifications:read' permission
router.get('/active', authMiddleware_1.authenticate, (0, authMiddleware_1.checkPermission)('qualifications', 'read'), qualificationController_1.getActiveQualifications);
// Get expiring qualifications - requires 'qualifications:read' permission
router.get('/expiring', authMiddleware_1.authenticate, (0, authMiddleware_1.checkPermission)('qualifications', 'read'), qualificationController_1.getExpiringQualifications);
// Get qualification categories - requires 'qualifications:read' permission
router.get('/categories', authMiddleware_1.authenticate, (0, authMiddleware_1.checkPermission)('qualifications', 'read'), qualificationController_1.getQualificationCategories);
// Get qualifications by category - requires 'qualifications:read' permission
router.get('/categories/:category', authMiddleware_1.authenticate, (0, authMiddleware_1.checkPermission)('qualifications', 'read'), qualificationController_1.getQualificationsByCategory);
// Get qualification by ID - requires 'qualifications:read' permission
router.get('/:id', authMiddleware_1.authenticate, (0, authMiddleware_1.checkPermission)('qualifications', 'read'), qualificationController_1.getQualificationById);
// Create qualification - requires 'qualifications:create' permission
router.post('/', authMiddleware_1.authenticate, (0, authMiddleware_1.checkPermission)('qualifications', 'create'), qualificationController_1.createQualification);
// Update qualification - requires 'qualifications:update' permission
router.put('/:id', authMiddleware_1.authenticate, (0, authMiddleware_1.checkPermission)('qualifications', 'update'), qualificationController_1.updateQualification);
// Delete qualification - requires 'qualifications:delete' permission
router.delete('/:id', authMiddleware_1.authenticate, (0, authMiddleware_1.checkPermission)('qualifications', 'delete'), qualificationController_1.deleteQualification);
exports.default = router;
//# sourceMappingURL=qualificationRoutes.js.map