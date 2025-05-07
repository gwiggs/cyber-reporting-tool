import { Router } from 'express';
import { 
  getWorkRoles,
  getWorkRoleById,
  createWorkRole,
  updateWorkRole,
  deleteWorkRole,
  getWorkRolesByDepartment,
  getAllUserWorkRoles,
  getUserWorkRoles,
  getUserCurrentWorkRoles,
  getUserHistoricalWorkRoles,
  getUsersByWorkRole,
  assignWorkRoleToUser,
  updateUserWorkRole,
  endUserWorkRole,
  getUserMissingQualifications
} from '../controllers/workRoleController';
import { authenticate, checkPermission } from '../middleware/authMiddleware';

const router = Router();

// Get all work roles - requires 'work_roles:read' permission
router.get('/', authenticate, checkPermission('work_roles', 'read'), getWorkRoles);

// Get work role by ID - requires 'work_roles:read' permission
router.get('/:id', authenticate, checkPermission('work_roles', 'read'), getWorkRoleById);

// Create work role - requires 'work_roles:create' permission
router.post('/', authenticate, checkPermission('work_roles', 'create'), createWorkRole);

// Update work role - requires 'work_roles:update' permission
router.put('/:id', authenticate, checkPermission('work_roles', 'update'), updateWorkRole);

// Delete work role - requires 'work_roles:delete' permission
router.delete('/:id', authenticate, checkPermission('work_roles', 'delete'), deleteWorkRole);

// Get work roles by department - requires 'work_roles:read' permission
router.get('/department/:departmentId', authenticate, checkPermission('work_roles', 'read'), getWorkRolesByDepartment);

// Get all user work role assignments - requires 'work_roles:read' permission
router.get('/assignments/all', authenticate, checkPermission('work_roles', 'read'), getAllUserWorkRoles);

// Get users assigned to a work role - requires 'work_roles:read' permission
router.get('/:workRoleId/users', authenticate, checkPermission('work_roles', 'read'), getUsersByWorkRole);

// Get user's work roles - requires 'work_roles:read' permission
router.get('/user/:userId', authenticate, checkPermission('work_roles', 'read'), getUserWorkRoles);

// Get user's current work roles - requires 'work_roles:read' permission
router.get('/user/:userId/current', authenticate, checkPermission('work_roles', 'read'), getUserCurrentWorkRoles);

// Get user's historical work roles - requires 'work_roles:read' permission
router.get('/user/:userId/history', authenticate, checkPermission('work_roles', 'read'), getUserHistoricalWorkRoles);

// Get user's missing qualifications - requires 'work_roles:read' permission
router.get('/user/:userId/missing-qualifications', authenticate, checkPermission('work_roles', 'read'), getUserMissingQualifications);

// Assign work role to user - requires 'work_roles:create' permission
router.post('/assign', authenticate, checkPermission('work_roles', 'create'), assignWorkRoleToUser);

// Update user work role - requires 'work_roles:update' permission
router.put('/user/:userId/role/:workRoleId', authenticate, checkPermission('work_roles', 'update'), updateUserWorkRole);

// End user work role assignment - requires 'work_roles:update' permission
router.put('/user/:userId/role/:workRoleId/end', authenticate, checkPermission('work_roles', 'update'), endUserWorkRole);

export default router; 