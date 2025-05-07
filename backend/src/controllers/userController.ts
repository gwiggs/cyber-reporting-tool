import { Request, Response } from 'express';
import userModel from '../models/userModel';
import passwordService from '../services/passwordService';
import { CreateUserData, UpdateUserData } from '../types';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';

// Rate limiter for password reset requests
export const passwordResetLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 3, // Limit each IP to 3 requests per windowMs
  message: 'Too many password reset requests, please try again later'
});

// Password validation schema
const passwordSchema = z.string()
  .min(8, 'Password must be at least 8 characters long')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[!@#$%^&*()_\-+=<>?]/, 'Password must contain at least one special character (!@#$%^&*()_-+=<>?)');

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

    // Validate new password complexity
    try {
      passwordSchema.parse(newPassword);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ 
          message: 'Password does not meet complexity requirements',
          errors: error.errors.map(err => err.message)
        });
        return;
      }
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

    // Check if new password matches any of the last 5 passwords
    const passwordHistory = await userModel.getPasswordHistory(userId, 5);
    for (const oldHash of passwordHistory) {
      if (await passwordService.verifyPassword(newPassword, oldHash)) {
        res.status(400).json({ message: 'New password cannot be the same as any of your last 5 passwords' });
        return;
      }
    }
    
    // Hash new password
    const newPasswordHash = await passwordService.hashPassword(newPassword);
    
    // Update password and add to history
    await userModel.updatePassword(userId, newPasswordHash);
    
    // Invalidate all sessions for this user
    await userModel.invalidateSessions(userId);
    
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

    // Check if there's a recent reset request
    const recentReset = await userModel.getRecentResetRequest(user.id);
    if (recentReset && new Date(recentReset.password_reset_expires) > new Date()) {
      res.status(429).json({ 
        message: 'A password reset request was recently sent. Please check your email or try again later.',
        expiresIn: Math.ceil((new Date(recentReset.password_reset_expires).getTime() - new Date().getTime()) / 1000)
      });
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

    // Validate new password complexity
    try {
      passwordSchema.parse(newPassword);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ 
          message: 'Password does not meet complexity requirements',
          errors: error.errors.map(err => err.message)
        });
        return;
      }
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

    // Check if new password matches any of the last 5 passwords
    const passwordHistory = await userModel.getPasswordHistory(user.id, 5);
    for (const oldHash of passwordHistory) {
      if (await passwordService.verifyPassword(newPassword, oldHash)) {
        res.status(400).json({ message: 'New password cannot be the same as any of your last 5 passwords' });
        return;
      }
    }
    
    // Hash new password
    const newPasswordHash = await passwordService.hashPassword(newPassword);
    
    // Update password, clear reset token, and invalidate sessions
    await userModel.resetPassword(user.id, newPasswordHash);
    await userModel.invalidateSessions(user.id);
    
    res.json({ message: 'Password has been reset successfully' });
  } catch (error) {
    console.error('Error resetting password:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Register a new user (public endpoint)
 */
export const registerUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const userData: CreateUserData = req.body;
    
    // Validate required fields
    if (!userData.employee_id || !userData.first_name || !userData.last_name || 
        !userData.email || !userData.primary_role_id || !userData.password) {
      res.status(400).json({ 
        success: false,
        message: 'Missing required fields' 
      });
      return;
    }
    
    // Check if user with same email or employee_id already exists
    const existingUserByEmail = await userModel.findByEmail(userData.email);
    if (existingUserByEmail) {
      res.status(409).json({ 
        success: false,
        message: 'User with this email already exists' 
      });
      return;
    }
    
    const existingUserByEmployeeId = await userModel.findByEmployeeId(userData.employee_id);
    if (existingUserByEmployeeId) {
      res.status(409).json({ 
        success: false,
        message: 'User with this employee ID already exists' 
      });
      return;
    }
    
    // Create user
    const newUser = await userModel.create(userData);
    
    // Remove sensitive data before returning
    const { password, ...userWithoutPassword } = userData;
    
    res.status(201).json({
      success: true,
      user: newUser,
      message: 'Registration successful'
    });
  } catch (error) {
    console.error('Error registering user:', error);
    res.status(500).json({ 
      success: false,
      message: 'Internal server error' 
    });
  }
};

/**
 * Get all users with extended information for administrators
 */
export const getAllUsersAdmin = async (req: Request, res: Response): Promise<void> => {
  try {
    // Get detailed user information including roles, departments, and organizations
    const users = await userModel.findAllWithDetails();
    
    // Return users with full details
    res.json({
      success: true,
      count: users.length,
      data: users
    });
  } catch (error) {
    console.error('Error fetching users for admin:', error);
    res.status(500).json({ 
      success: false,
      message: 'Internal server error while fetching user data'
    });
  }
};