import express from 'express';
import permissionController from '../controllers/permissionController';
import { authenticate } from '../middleware/authMiddleware';
import { authorize } from '../middleware/rbacMiddleware';

const router = express.Router();

/**
 * @route   POST /api/permissions
 * @desc    Create a new permission
 * @access  Private (requires 'permission:create' permission)
 */
router.post(
  '/',
  authenticate,
  authorize('permission:create'),
  permissionController.create
);

/**
 * @route   GET /api/permissions
 * @desc    Get all permissions
 * @access  Private (requires 'permission:read' permission)
 */
router.get(
  '/',
  authenticate,
  authorize('permission:read'),
  permissionController.getAll
);

/**
 * @route   GET /api/permissions/:id
 * @desc    Get permission by ID
 * @access  Private (requires 'permission:read' permission)
 */
router.get(
  '/:id',
  authenticate,
  authorize('permission:read'),
  permissionController.getById
);

/**
 * @route   PUT /api/permissions/:id
 * @desc    Update permission
 * @access  Private (requires 'permission:update' permission)
 */
router.put(
  '/:id',
  authenticate,
  authorize('permission:update'),
  permissionController.update
);

/**
 * @route   DELETE /api/permissions/:id
 * @desc    Delete permission
 * @access  Private (requires 'permission:delete' permission)
 */
router.delete(
  '/:id',
  authenticate,
  authorize('permission:delete'),
  permissionController.delete
);

export default router; 