import express from 'express';
import departmentController from '../controllers/departmentController';
import { authenticate } from '../middleware/authMiddleware';
import { authorize, belongsToOrganization } from '../middleware/rbacMiddleware';

const router = express.Router();

/**
 * @route   POST /api/departments
 * @desc    Create a new department
 * @access  Private (requires 'department:create' permission)
 */
router.post(
  '/',
  authenticate,
  authorize('department:create'),
  belongsToOrganization(),
  departmentController.create
);

/**
 * @route   GET /api/departments
 * @desc    Get all departments, can filter by organization_id
 * @access  Private (requires 'department:read' permission)
 */
router.get(
  '/',
  authenticate,
  authorize('department:read'),
  departmentController.getAll
);

/**
 * @route   GET /api/departments/:id
 * @desc    Get department by ID
 * @access  Private (requires 'department:read' permission)
 */
router.get(
  '/:id',
  authenticate,
  authorize('department:read'),
  departmentController.getById
);

/**
 * @route   PUT /api/departments/:id
 * @desc    Update department
 * @access  Private (requires 'department:update' permission)
 */
router.put(
  '/:id',
  authenticate,
  authorize('department:update'),
  departmentController.update
);

/**
 * @route   DELETE /api/departments/:id
 * @desc    Delete department
 * @access  Private (requires 'department:delete' permission)
 */
router.delete(
  '/:id',
  authenticate,
  authorize('department:delete'),
  departmentController.delete
);

export default router; 