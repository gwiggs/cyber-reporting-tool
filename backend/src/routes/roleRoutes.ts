
import { Router } from 'express';
import { 
  getRoles, 
  getRoleById, 
  createRole, 
  updateRole, 
  deleteRole,
  getRolePermissions,
  updateRolePermissions,
  getAllPermissions
} from '../controllers/roleController';
import { authenticate, checkPermission, checkRole } from '../middleware/authMiddleware';

const router = Router();

// All role routes should require authentication
router.use(authenticate);

// Only admin role can manage roles
router.use(checkRole(['Admin']));

// Role routes
router.get('/', getRoles);
router.get('/:id', getRoleById);
router.post('/', createRole);
router.put('/:id', updateRole);
router.delete('/:id', deleteRole);

// Role permissions
router.get('/:id/permissions', getRolePermissions);
router.put('/:id/permissions', updateRolePermissions);

// Get all permissions
router.get('/permissions/all', getAllPermissions);

export default router;