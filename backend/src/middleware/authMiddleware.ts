import { Request, Response, NextFunction } from 'express';
import authService from '../services/authService';
import userModel from '../models/userModel';
import { User, UserProfile, AuthenticatedRequest } from '../types';

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: UserProfile;
      sessionId?: string;
    }
  }
}

/**
 * Middleware to authenticate user based on session cookie
 */
export async function authenticate(req: Request, res: Response, next: NextFunction) {
  try {
    // Get session ID from cookie
    const sessionId = req.cookies?.sessionId;
    
    if (!sessionId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }
    
    // Validate session
    const session = await authService.validateSession(sessionId);
    if (!session) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired session',
      });
    }
    
    // Get user from database
    const user = await userModel.findById(session.user_id);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found',
      });
    }
    
    // Get user permissions
    const permissions = await userModel.getUserPermissions(user.id);
    
    // Attach user to request
    req.user = {
      id: user.id,
      employee_id: user.employee_id,
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
      role: (user as any).role_name || 'User',
      permissions: permissions
    };
    
    // Attach session ID to request
    req.sessionId = sessionId;
    
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(401).json({
      success: false,
      message: 'Authentication failed',
    });
  }
}

/**
 * Middleware to check if a user has a specific role
 * @param roles Array of role names that have access
 * @returns Express middleware function
 */
export const checkRole = (roles: string[]) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }
    
    // Check if user's role is in the allowed roles array
    if (roles.includes(req.user.role)) {
      next();
      return;
    }
    
    res.status(403).json({
      success: false,
      message: 'Access denied',
      required: { roles }
    });
  };
};

export const checkPermission = (resource: string, action: string) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }
    
    // Method 1: Check using cached permissions on the request object
    const hasPermissionInCache = req.user.permissions.some(p => 
      p.resource === resource && p.action === action
    );
    
    if (hasPermissionInCache) {
      next();
      return;
    }
    
    // Method 2: Double-check with database (in case permissions changed after login)
    const permissionService = (await import('../services/permissionService')).default;
    const hasPermissionInDb = await permissionService.hasPermission(req.user.id, resource, action);
    
    if (hasPermissionInDb) {
      // Update cached permissions
      const updatedPermissions = await permissionService.getUserPermissions(req.user.id);
      req.user.permissions = updatedPermissions;
      next();
      return;
    }
    
    // If both methods fail, deny access
    res.status(403).json({ 
      success: false,
      message: 'Permission denied',
      required: { resource, action } 
    });
  };
};