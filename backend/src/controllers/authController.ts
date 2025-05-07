import { Request, Response } from 'express';
import authService from '../services/authService';
import userModel from '../models/userModel';
import { LoginRequest } from '../types';

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body as LoginRequest;
    
    const result = await authService.authenticate(email, password);
    if (!result.success) {
      res.status(401).json({ success: false, message: result.message });
      return;
    }
    
    // Create session
    const sessionId = await authService.createSession(
      result.user!.id,
      req.ip,
      req.headers['user-agent']
    );
    
    // Update last login timestamp
    await userModel.updateLastLogin(result.user!.id);
    
    // Set session cookie
    res.cookie('sessionId', sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    });
    
    res.json({ success: true, user: result.user });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const logout = async (req: Request, res: Response): Promise<void> => {
  try {
    const sessionId = req.sessionId;
    if (sessionId) {
      await authService.destroySession(sessionId);
    }
    
    res.clearCookie('sessionId');
    res.json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const getCurrentUser = async (req: Request, res: Response): Promise<void> => {
  try {
    // User is already attached to request by auth middleware
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }
    
    res.json({ success: true, user: req.user });
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

/**
 * Get user's active sessions
 */
export const getUserSessions = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }
    
    // Fetch sessions from database
    const sessions = await authService.getUserSessions(req.user.id);
    
    res.json({ 
      success: true, 
      data: sessions
    });
  } catch (error) {
    console.error('Get user sessions error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to retrieve user sessions' 
    });
  }
};

/**
 * Invalidate a specific session
 */
export const invalidateSession = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }
    
    const sessionId = req.params.id;
    
    // Validate that the session belongs to the current user
    const isUserSession = await authService.isSessionOwnedByUser(req.user.id, sessionId);
    if (!isUserSession) {
      res.status(403).json({ 
        success: false, 
        message: 'You can only invalidate your own sessions' 
      });
      return;
    }
    
    // Don't allow invalidating the current session through this endpoint
    if (sessionId === req.sessionId) {
      res.status(400).json({ 
        success: false, 
        message: 'Cannot invalidate current session. Use logout instead.' 
      });
      return;
    }
    
    await authService.destroySession(sessionId);
    
    res.json({ success: true, message: 'Session invalidated successfully' });
  } catch (error) {
    console.error('Invalidate session error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to invalidate session' 
    });
  }
};

/**
 * Invalidate all user sessions except current
 */
export const invalidateAllSessions = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }
    
    // Get current session ID
    const currentSessionId = req.sessionId;
    
    // Invalidate all sessions except current
    await authService.invalidateAllUserSessionsExceptCurrent(req.user.id, currentSessionId || '');
    
    res.json({ 
      success: true, 
      message: 'All other sessions invalidated successfully' 
    });
  } catch (error) {
    console.error('Invalidate all sessions error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to invalidate sessions' 
    });
  }
};