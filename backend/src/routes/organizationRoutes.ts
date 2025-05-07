import express from 'express';
import organizationController from '../controllers/organizationController';
import { authenticate } from '../middleware/authMiddleware';
import { authorize } from '../middleware/rbacMiddleware';

const router = express.Router();

/**
 * @route   POST /api/organizations
 * @desc    Create a new organization
 * @access  Private (requires 'organization:create' permission)
 */
router.post(
  '/',
  authenticate,
  authorize('organization:create'),
  organizationController.create
);

/**
 * @route   GET /api/organizations
 * @desc    Get all organizations
 * @access  Private (requires 'organization:read' permission)
 */
router.get(
  '/',
  authenticate,
  authorize('organization:read'),
  organizationController.getAll
);

/**
 * @route   GET /api/organizations/:id
 * @desc    Get organization by ID
 * @access  Private (requires 'organization:read' permission)
 */
router.get(
  '/:id',
  authenticate,
  authorize('organization:read'),
  organizationController.getById
);

/**
 * @route   PUT /api/organizations/:id
 * @desc    Update organization
 * @access  Private (requires 'organization:update' permission)
 */
router.put(
  '/:id',
  authenticate,
  authorize('organization:update'),
  organizationController.update
);

/**
 * @route   DELETE /api/organizations/:id
 * @desc    Delete organization
 * @access  Private (requires 'organization:delete' permission)
 */
router.delete(
  '/:id',
  authenticate,
  authorize('organization:delete'),
  organizationController.delete
);

export default router; 