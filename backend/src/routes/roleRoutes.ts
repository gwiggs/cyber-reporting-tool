import express from 'express';
import roleController from '../controllers/roleController';
import { authenticate } from '../middleware/authMiddleware';
import { authorize } from '../middleware/rbacMiddleware';

const router = express.Router();

/**
 * @route   GET /api/roles/public
 * @desc    Get all roles (public endpoint for registration)
 * @access  Public
 */
router.get('/public', roleController.getAllPublic);

/**
 * @route   GET /api/roles
 * @desc    Get all roles
 * @access  Private (requires authentication)
 */
router.get('/', authenticate, roleController.getAll);

/**
 * @route   GET /api/roles/:id
 * @desc    Get a role by ID
 * @access  Private (requires authentication)
 */
router.get('/:id', authenticate, roleController.getById);

/**
 * @route   POST /api/roles
 * @desc    Create a new role
 * @access  Private (requires 'role:create' permission)
 */
router.post(
  '/',
  authenticate,
  authorize('role:create'),
  roleController.create
);

/**
 * @route   PUT /api/roles/:id
 * @desc    Update a role
 * @access  Private (requires 'role:update' permission)
 */
router.put(
  '/:id',
  authenticate,
  authorize('role:update'),
  roleController.update
);

/**
 * @route   DELETE /api/roles/:id
 * @desc    Delete a role
 * @access  Private (requires 'role:delete' permission)
 */
router.delete(
  '/:id',
  authenticate,
  authorize('role:delete'),
  roleController.delete
);

/**
 * @route   GET /api/roles/:id/permissions
 * @desc    Get permissions for a role
 * @access  Private (requires authentication)
 */
router.get(
  '/:id/permissions',
  authenticate,
  roleController.getPermissions
);

/**
 * @route   POST /api/roles/:id/permissions
 * @desc    Add permission to a role
 * @access  Private (requires 'role:update' permission)
 */
router.post(
  '/:id/permissions',
  authenticate,
  authorize('role:update'),
  roleController.addPermission
);

/**
 * @route   DELETE /api/roles/:id/permissions/:permissionId
 * @desc    Remove permission from a role
 * @access  Private (requires 'role:update' permission)
 */
router.delete(
  '/:id/permissions/:permissionId',
  authenticate,
  authorize('role:update'),
  roleController.removePermission
);

export default router;