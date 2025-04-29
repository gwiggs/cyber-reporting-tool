import { Request, Response } from 'express';
import authService from '../services/authService';
import { LoginRequest } from '../types';

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body as LoginRequest;
    
    const result = await authService.authenticate(email, password);
    if (!result.success) {
      res.status(401).json({ message: result.message });
      return;
    }
    
    // Create session
    const sessionId = await authService.createSession(
      result.user!.id,
      req.ip,
      req.headers['user-agent']
    );
    
    // Set session cookie
    res.cookie('sessionId', sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    });
    
    res.json({ user: result.user });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const logout = async (req: Request, res: Response): Promise<void> => {
  try {
    const sessionId = req.sessionId;
    if (sessionId) {
      await authService.destroySession(sessionId);
    }
    
    res.clearCookie('sessionId');
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getCurrentUser = async (req: Request, res: Response): Promise<void> => {
  try {
    // User is already attached to request by auth middleware
    if (!req.user) {
      res.status(401).json({ message: 'Authentication required' });
      return;
    }
    
    res.json(req.user);
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};