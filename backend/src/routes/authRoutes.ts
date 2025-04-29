import { Router } from 'express';
import * as authController from '../controllers/authController';
import { authenticate } from '../middleware/authMiddleware';

const router = Router();

// Login route
router.post('/login', authController.login);

// Logout route
router.post('/logout', authenticate, authController.logout);

// Get current user route
router.get('/me', authenticate, authController.getCurrentUser);

export default router;