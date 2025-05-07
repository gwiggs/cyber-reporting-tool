"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const userController_1 = require("../controllers/userController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const passwordMiddleware_1 = require("../middleware/passwordMiddleware");
const router = (0, express_1.Router)();
// Public registration route
router.post('/register', passwordMiddleware_1.validatePasswordStrength, userController_1.registerUser);
// Admin route to get all users with detailed information
router.get('/admin/all', authMiddleware_1.authenticate, (0, authMiddleware_1.checkRole)(['Admin']), userController_1.getAllUsersAdmin);
// Get all users - requires 'users:read' permission
router.get('/', authMiddleware_1.authenticate, (0, authMiddleware_1.checkPermission)('users', 'read'), userController_1.getUsers);
// Get user by ID - requires 'users:read' permission
router.get('/:id', authMiddleware_1.authenticate, (0, authMiddleware_1.checkPermission)('users', 'read'), userController_1.getUserById);
// Create new user - requires 'users:create' permission
router.post('/', authMiddleware_1.authenticate, (0, authMiddleware_1.checkPermission)('users', 'create'), passwordMiddleware_1.assignRandomPasswordIfNeeded, passwordMiddleware_1.validatePasswordStrength, userController_1.createUser);
// Update user - requires 'users:update' permission
router.put('/:id', authMiddleware_1.authenticate, (0, authMiddleware_1.checkPermission)('users', 'update'), userController_1.updateUser);
// Delete user - requires 'users:delete' permission
router.delete('/:id', authMiddleware_1.authenticate, (0, authMiddleware_1.checkPermission)('users', 'delete'), userController_1.deleteUser);
// Change password - user can change their own, admin can change any
router.put('/:id/password', authMiddleware_1.authenticate, (req, res, next) => {
    // Allow users to change their own password
    if (parseInt(req.params.id) === req.user?.id) {
        return next();
    }
    // Otherwise, check for admin permission
    (0, authMiddleware_1.checkPermission)('users', 'update')(req, res, next);
}, passwordMiddleware_1.validatePasswordStrength, userController_1.changePassword);
// Password reset request (public)
router.post('/password-reset/request', userController_1.passwordResetLimiter, userController_1.requestPasswordReset);
// Password reset with token (public)
router.post('/password-reset/reset', passwordMiddleware_1.validatePasswordStrength, userController_1.resetPassword);
exports.default = router;
//# sourceMappingURL=userRoutes.js.map