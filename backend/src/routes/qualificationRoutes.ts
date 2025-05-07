import { Router } from 'express';
import { 
  getQualifications,
  getQualificationById,
  createQualification,
  updateQualification,
  deleteQualification,
  getQualificationsByCategory,
  getQualificationCategories,
  getActiveQualifications,
  getExpiringQualifications
} from '../controllers/qualificationController';
import { authenticate, checkPermission } from '../middleware/authMiddleware';

const router = Router();

// Get all qualifications - requires 'qualifications:read' permission
router.get('/', authenticate, checkPermission('qualifications', 'read'), getQualifications);

// Get active qualifications - requires 'qualifications:read' permission
router.get('/active', authenticate, checkPermission('qualifications', 'read'), getActiveQualifications);

// Get expiring qualifications - requires 'qualifications:read' permission
router.get('/expiring', authenticate, checkPermission('qualifications', 'read'), getExpiringQualifications);

// Get qualification categories - requires 'qualifications:read' permission
router.get('/categories', authenticate, checkPermission('qualifications', 'read'), getQualificationCategories);

// Get qualifications by category - requires 'qualifications:read' permission
router.get('/categories/:category', authenticate, checkPermission('qualifications', 'read'), getQualificationsByCategory);

// Get qualification by ID - requires 'qualifications:read' permission
router.get('/:id', authenticate, checkPermission('qualifications', 'read'), getQualificationById);

// Create qualification - requires 'qualifications:create' permission
router.post('/', authenticate, checkPermission('qualifications', 'create'), createQualification);

// Update qualification - requires 'qualifications:update' permission
router.put('/:id', authenticate, checkPermission('qualifications', 'update'), updateQualification);

// Delete qualification - requires 'qualifications:delete' permission
router.delete('/:id', authenticate, checkPermission('qualifications', 'delete'), deleteQualification);

export default router; 