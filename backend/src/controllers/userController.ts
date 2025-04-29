import { Request, Response } from 'express';
import userModel from '../models/userModel';
import passwordService from '../services/passwordService';
import { CreateUserData, UpdateUserData } from '../types';

/**
 * Get all users
 */
export const getUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    const users = await userModel.findAll();
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Get user by ID
 */
export const getUserById = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = parseInt(req.params.id);
    
    if (isNaN(userId)) {
      res.status(400).json({ message: 'Invalid user ID' });
      return;
    }
    
    const user = await userModel.findById(userId);
    
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }
    
    res.json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Create a new user
 */
export const createUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const userData: CreateUserData = req.body;
    
    // Validate required fields
    if (!userData.employee_id || !userData.first_name || !userData.last_name || 
        !userData.email || !userData.primary_role_id || !userData.password) {
      res.status(400).json({ message: 'Missing required fields' });
      return;
    }
    
    // Check if user with same email or employee_id already exists
    const existingUserByEmail = await userModel.findByEmail(userData.email);
    if (existingUserByEmail) {
      res.status(409).json({ message: 'User with this email already exists' });
      return;
    }
    
    const existingUserByEmployeeId = await userModel.findByEmployeeId(userData.employee_id);
    if (existingUserByEmployeeId) {
      res.status(409).json({ message: 'User with this employee ID already exists' });
      return;
    }
    
    // Create user
    const newUser = await userModel.create(userData);
    
    res.status(201).json(newUser);
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Update an existing user
 */
export const updateUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = parseInt(req.params.id);
    const userData: UpdateUserData = req.body;
    
    if (isNaN(userId)) {
      res.status(400).json({ message: 'Invalid user ID' });
      return;
    }
    
    // Check if user exists
    const existingUser = await userModel.findById(userId);
    if (!existingUser) {
      res.status(404).json({ message: 'User not found' });
      return;
    }
    
    // If email is being updated, check if it's already in use
    if (userData.email && userData.email !== existingUser.email) {
      const userWithEmail = await userModel.findByEmail(userData.email);
      if (userWithEmail && userWithEmail.id !== userId) {
        res.status(409).json({ message: 'Email already in use by another user' });
        return;
      }
    }
    
    // If employee_id is being updated, check if it's already in use
    if (userData.employee_id && userData.employee_id !== existingUser.employee_id) {
      const userWithEmployeeId = await userModel.findByEmployeeId(userData.employee_id);
      if (userWithEmployeeId && userWithEmployeeId.id !== userId) {
        res.status(409).json({ message: 'Employee ID already in use by another user' });
        return;
      }
    }
    
    // Update user
    const updatedUser = await userModel.update(userId, userData);
    
    res.json(updatedUser);
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Delete a user
 */
export const deleteUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = parseInt(req.params.id);
    
    if (isNaN(userId)) {
      res.status(400).json({ message: 'Invalid user ID' });
      return;
    }
    
    // Check if user exists
    const existingUser = await userModel.findById(userId);
    if (!existingUser) {
      res.status(404).json({ message: 'User not found' });
      return;
    }
    
    // Delete user
    await userModel.delete(userId);
    
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Change user password
 */
export const changePassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = parseInt(req.params.id);
    const { currentPassword, newPassword } = req.body;
    
    if (isNaN(userId)) {
      res.status(400).json({ message: 'Invalid user ID' });
      return;
    }
    
    if (!currentPassword || !newPassword) {
      res.status(400).json({ message: 'Current and new password are required' });
      return;
    }
    
    // Check if user exists
    const user = await userModel.findById(userId);
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }
    
    // Get user credentials
    const credentials = await userModel.getUserCredentials(userId);
    if (!credentials) {
      res.status(404).json({ message: 'User credentials not found' });
      return;
    }
    
    // Verify current password
    const isValid = await passwordService.verifyPassword(currentPassword, credentials.password_hash);
    if (!isValid) {
      res.status(401).json({ message: 'Current password is incorrect' });
      return;
    }
    
    // Hash new password
    const newPasswordHash = await passwordService.hashPassword(newPassword);
    
    // Update password
    await userModel.updatePassword(userId, newPasswordHash);
    
    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Error changing password:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Request password reset (generates token)
 */
export const requestPasswordReset = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body;
    
    if (!email) {
      res.status(400).json({ message: 'Email is required' });
      return;
    }
    
    // Check if user exists
    const user = await userModel.findByEmail(email);
    if (!user) {
      // Always return success for security reasons even if user doesn't exist
      res.json({ message: 'If your email is registered, you will receive password reset instructions' });
      return;
    }
    
    // Generate reset token
    const resetToken = passwordService.generateResetToken();
    const resetExpires = passwordService.getResetTokenExpiration();
    
    // Save token to database
    await userModel.saveResetToken(user.id, resetToken, resetExpires);
    
    // In a real app, send email with reset token
    // For now, just return it in response (only in development)
    if (process.env.NODE_ENV === 'development') {
      res.json({ 
        message: 'Password reset requested. In production, an email would be sent.',
        token: resetToken
      });
    } else {
      res.json({ 
        message: 'If your email is registered, you will receive password reset instructions' 
      });
    }
  } catch (error) {
    console.error('Error requesting password reset:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Reset password using token
 */
export const resetPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { token, newPassword } = req.body;
    
    if (!token || !newPassword) {
      res.status(400).json({ message: 'Token and new password are required' });
      return;
    }
    
    // Find user by reset token
    const user = await userModel.findByResetToken(token);
    if (!user) {
      res.status(400).json({ message: 'Invalid or expired token' });
      return;
    }
    
    // Check if token is expired
    if (user.password_reset_expires && new Date(user.password_reset_expires) < new Date()) {
      res.status(400).json({ message: 'Password reset token has expired' });
      return;
    }
    
    // Hash new password
    const newPasswordHash = await passwordService.hashPassword(newPassword);
    
    // Update password and clear reset token
    await userModel.resetPassword(user.id, newPasswordHash);
    
    res.json({ message: 'Password has been reset successfully' });
  } catch (error) {
    console.error('Error resetting password:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};