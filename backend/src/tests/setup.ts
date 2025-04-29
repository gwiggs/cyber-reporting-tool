import { Express, Request, Response, NextFunction } from 'express';
import * as authMiddleware from '../middleware/authMiddleware';
import * as userController from '../controllers/userController';
import { UserProfile } from '../types';

// Mock dependencies
jest.mock('../middleware/authMiddleware');
jest.mock('../controllers/userController');

export const setupTestApp = (app: Express, mockUserProfile: UserProfile) => {
  // Mock authenticate middleware
  (authMiddleware.authenticate as jest.Mock).mockImplementation((req: Request, res: Response, next: NextFunction) => {
    if (req.headers.cookie?.includes('sessionId=test-session-id')) {
      req.user = mockUserProfile;
      req.sessionId = 'test-session-id';
      next();
    } else {
      res.status(401).json({ message: 'Authentication required' });
    }
  });

  // Mock checkPermission middleware
  (authMiddleware.checkPermission as jest.Mock).mockImplementation(() => (req: Request, res: Response, next: NextFunction) => next());

  // Mock user controller functions
  (userController.getUsers as jest.Mock).mockImplementation(async (req: Request, res: Response) => {
    res.json([mockUserProfile]);
  });

  (userController.getUserById as jest.Mock).mockImplementation(async (req: Request, res: Response) => {
    const userId = parseInt(req.params.id);
    if (userId === mockUserProfile.id) {
      res.json(mockUserProfile);
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  });

  (userController.createUser as jest.Mock).mockImplementation(async (req: Request, res: Response) => {
    const userData = req.body;
    res.status(201).json({ ...mockUserProfile, ...userData });
  });

  return app;
}; 