"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const userQualificationController_1 = require("../controllers/userQualificationController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = (0, express_1.Router)();
// Get all user qualifications - requires 'user_qualifications:read' permission
router.get('/', authMiddleware_1.authenticate, (0, authMiddleware_1.checkPermission)('user_qualifications', 'read'), userQualificationController_1.getUserQualifications);
// Get expired qualifications - requires 'user_qualifications:read' permission
router.get('/expired', authMiddleware_1.authenticate, (0, authMiddleware_1.checkPermission)('user_qualifications', 'read'), userQualificationController_1.getExpiredQualifications);
// Update expired qualifications - requires 'user_qualifications:update' permission
router.post('/expired/update', authMiddleware_1.authenticate, (0, authMiddleware_1.checkPermission)('user_qualifications', 'update'), 
// Type assertion to handle AuthenticatedRequest
((req, res) => (0, userQualificationController_1.updateExpiredQualifications)(req, res)));
// Get user qualification by ID - requires 'user_qualifications:read' permission
router.get('/:id', authMiddleware_1.authenticate, (0, authMiddleware_1.checkPermission)('user_qualifications', 'read'), userQualificationController_1.getUserQualificationById);
// Get qualification update history - requires 'user_qualifications:read' permission
router.get('/:id/updates', authMiddleware_1.authenticate, (0, authMiddleware_1.checkPermission)('user_qualifications', 'read'), userQualificationController_1.getQualificationUpdates);
// Create user qualification - requires 'user_qualifications:create' permission
router.post('/', authMiddleware_1.authenticate, (0, authMiddleware_1.checkPermission)('user_qualifications', 'create'), userQualificationController_1.createUserQualification);
// Update user qualification - requires 'user_qualifications:update' permission
router.put('/:id', authMiddleware_1.authenticate, (0, authMiddleware_1.checkPermission)('user_qualifications', 'update'), 
// Type assertion to handle AuthenticatedRequest
((req, res) => (0, userQualificationController_1.updateUserQualification)(req, res)));
// Delete user qualification - requires 'user_qualifications:delete' permission
router.delete('/:id', authMiddleware_1.authenticate, (0, authMiddleware_1.checkPermission)('user_qualifications', 'delete'), userQualificationController_1.deleteUserQualification);
// Get qualifications by user ID - requires 'user_qualifications:read' permission
router.get('/user/:userId', authMiddleware_1.authenticate, (0, authMiddleware_1.checkPermission)('user_qualifications', 'read'), userQualificationController_1.getQualificationsByUserId);
// Get users with a specific qualification - requires 'user_qualifications:read' permission
router.get('/qualification/:qualificationId', authMiddleware_1.authenticate, (0, authMiddleware_1.checkPermission)('user_qualifications', 'read'), userQualificationController_1.getUsersByQualificationId);
exports.default = router;
//# sourceMappingURL=userQualificationRoutes.js.map