import { Router } from 'express';
import { 
  getUsers, 
  getUserById, 
  createUser, 
  updateUser, 
  deleteUser,
  changePassword,
  requestPasswordReset,
  resetPassword,
  passwordResetLimiter,
  registerUser,
  getAllUsersAdmin
} from '../controllers/userController';
import { authenticate, checkPermission, checkRole } from '../middleware/authMiddleware';
import { validatePasswordStrength, assignRandomPasswordIfNeeded } from '../middleware/passwordMiddleware';

const router = Router();

// Public registration route
router.post('/register', validatePasswordStrength, registerUser);

// Admin route to get all users with detailed information
router.get('/admin/all', authenticate, checkRole(['Admin']), getAllUsersAdmin);

// Get all users - requires 'users:read' permission
router.get('/', authenticate, checkPermission('users', 'read'), getUsers);

// Get user by ID - requires 'users:read' permission
router.get('/:id', authenticate, checkPermission('users', 'read'), getUserById);

// Create new user - requires 'users:create' permission
router.post('/', 
  authenticate, 
  checkPermission('users', 'create'), 
  assignRandomPasswordIfNeeded,
  validatePasswordStrength,
  createUser
);

// Update user - requires 'users:update' permission
router.put('/:id', authenticate, checkPermission('users', 'update'), updateUser);

// Delete user - requires 'users:delete' permission
router.delete('/:id', authenticate, checkPermission('users', 'delete'), deleteUser);

// Change password - user can change their own, admin can change any
router.put('/:id/password', 
  authenticate, 
  (req, res, next) => {
    // Allow users to change their own password
    if (parseInt(req.params.id) === req.user?.id) {
      return next();
    }
    // Otherwise, check for admin permission
    checkPermission('users', 'update')(req, res, next);
  }, 
  validatePasswordStrength,
  changePassword
);

// Password reset request (public)
router.post('/password-reset/request', passwordResetLimiter, requestPasswordReset);

// Password reset with token (public)
router.post('/password-reset/reset', validatePasswordStrength, resetPassword);

export default router;
