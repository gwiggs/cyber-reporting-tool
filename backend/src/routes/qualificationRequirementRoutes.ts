import { Router } from 'express';
import { 
  getQualificationRequirements,
  getQualificationRequirementById,
  getRequirementsByWorkRoleId,
  getWorkRolesRequiringQualification,
  createQualificationRequirement,
  updateQualificationRequirement,
  deleteQualificationRequirement,
  checkUserQualificationsForWorkRole
} from '../controllers/qualificationRequirementController';
import { authenticate, checkPermission } from '../middleware/authMiddleware';

const router = Router();

// Get all qualification requirements - requires 'qualification_requirements:read' permission
router.get('/', authenticate, checkPermission('qualification_requirements', 'read'), getQualificationRequirements);

// Get qualification requirement by ID - requires 'qualification_requirements:read' permission
router.get('/:id', authenticate, checkPermission('qualification_requirements', 'read'), getQualificationRequirementById);

// Get requirements for a work role - requires 'qualification_requirements:read' permission
router.get('/work-role/:workRoleId', authenticate, checkPermission('qualification_requirements', 'read'), getRequirementsByWorkRoleId);

// Get work roles requiring a qualification - requires 'qualification_requirements:read' permission
router.get('/qualification/:qualificationId', authenticate, checkPermission('qualification_requirements', 'read'), getWorkRolesRequiringQualification);

// Create qualification requirement - requires 'qualification_requirements:create' permission
router.post('/', authenticate, checkPermission('qualification_requirements', 'create'), createQualificationRequirement);

// Update qualification requirement - requires 'qualification_requirements:update' permission
router.put('/:id', authenticate, checkPermission('qualification_requirements', 'update'), updateQualificationRequirement);

// Delete qualification requirement - requires 'qualification_requirements:delete' permission
router.delete('/:id', authenticate, checkPermission('qualification_requirements', 'delete'), deleteQualificationRequirement);

// Check if user has required qualifications for a work role - requires 'qualification_requirements:read' permission
router.get('/check/user/:userId/work-role/:workRoleId', authenticate, checkPermission('qualification_requirements', 'read'), checkUserQualificationsForWorkRole);

export default router; 