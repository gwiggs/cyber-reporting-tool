import { Request, Response, NextFunction } from 'express';
import authService from '../services/authService';
import userModel from '../models/userModel';
import { User, UserProfile } from '../types';

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: UserProfile;
      sessionId?: string;
    }
  }
}

export const authenticate = async (
  req: Request, 
  res: Response, 
  next: NextFunction
): Promise<void> => {
  const sessionId = req.cookies.sessionId;
  
  if (!sessionId) {
    res.status(401).json({ message: 'Authentication required' });
    return;
  }
  
  const session = await authService.validateSession(sessionId);
  if (!session) {
    res.status(401).json({ message: 'Invalid or expired session' });
    return;
  }
  
  // Get user data
  const user = await userModel.findById(session.user_id);
  if (!user) {
    res.status(401).json({ message: 'User not found' });
    return;
  }
  
  // Get permissions
  const permissions = await userModel.getUserPermissions(user.id);
  
  // Attach user to request object
  req.user = {
    id: user.id,
    employee_id: user.employee_id,
    first_name: user.first_name,
    last_name: user.last_name,
    email: user.email,
    role: (user as any).role_name,
    permissions
  };
  
  req.sessionId = sessionId;
  next();
};

export const checkPermission = (resource: string, action: string) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    if (!req.user) {
      res.status(401).json({ message: 'Authentication required' });
      return;
    }
    
    const hasPermission = req.user.permissions.some(p => 
      p.resource === resource && p.action === action
    );
    
    if (!hasPermission) {
      res.status(403).json({ message: 'Permission denied' });
      return;
    }
    
    next();
  };
};