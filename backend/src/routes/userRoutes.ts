import { Router } from 'express';
import { authenticate, checkPermission } from '../middleware/authMiddleware';

const router = Router();

router.get('/', authenticate, (req, res) => {
    res.json({ message: 'User routes are set up but not yet implemented'});
});

// Uncomment these once you implement the controllers
// router.get('/', authenticate, checkPermission('users', 'read'), getUsers);
// router.get('/:id', authenticate, checkPermission('users', 'read'), getUserById);
// router.put('/:id', authenticate, checkPermission('users', 'update'), updateUser);
// router.delete('/:id', authenticate, checkPermission('users', 'delete'), deleteUser);

export default router; 
