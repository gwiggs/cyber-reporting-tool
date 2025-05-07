import { Router } from 'express';
import { 
  getUserQualifications,
  getUserQualificationById,
  getQualificationsByUserId,
  getUsersByQualificationId,
  createUserQualification,
  updateUserQualification,
  deleteUserQualification,
  getQualificationUpdates,
  getExpiredQualifications,
  updateExpiredQualifications
} from '../controllers/userQualificationController';
import { authenticate, checkPermission } from '../middleware/authMiddleware';
import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../types';

const router = Router();

// Get all user qualifications - requires 'user_qualifications:read' permission
router.get('/', authenticate, checkPermission('user_qualifications', 'read'), getUserQualifications);

// Get expired qualifications - requires 'user_qualifications:read' permission
router.get('/expired', authenticate, checkPermission('user_qualifications', 'read'), getExpiredQualifications);

// Update expired qualifications - requires 'user_qualifications:update' permission
router.post('/expired/update', authenticate, checkPermission('user_qualifications', 'update'), 
  // Type assertion to handle AuthenticatedRequest
  ((req: Request, res: Response) => updateExpiredQualifications(req as AuthenticatedRequest, res)) as any
);

// Get user qualification by ID - requires 'user_qualifications:read' permission
router.get('/:id', authenticate, checkPermission('user_qualifications', 'read'), getUserQualificationById);

// Get qualification update history - requires 'user_qualifications:read' permission
router.get('/:id/updates', authenticate, checkPermission('user_qualifications', 'read'), getQualificationUpdates);

// Create user qualification - requires 'user_qualifications:create' permission
router.post('/', authenticate, checkPermission('user_qualifications', 'create'), createUserQualification);

// Update user qualification - requires 'user_qualifications:update' permission
router.put('/:id', authenticate, checkPermission('user_qualifications', 'update'), 
  // Type assertion to handle AuthenticatedRequest
  ((req: Request, res: Response) => updateUserQualification(req as AuthenticatedRequest, res)) as any
);

// Delete user qualification - requires 'user_qualifications:delete' permission
router.delete('/:id', authenticate, checkPermission('user_qualifications', 'delete'), deleteUserQualification);

// Get qualifications by user ID - requires 'user_qualifications:read' permission
router.get('/user/:userId', authenticate, checkPermission('user_qualifications', 'read'), getQualificationsByUserId);

// Get users with a specific qualification - requires 'user_qualifications:read' permission
router.get('/qualification/:qualificationId', authenticate, checkPermission('user_qualifications', 'read'), getUsersByQualificationId);

export default router; 