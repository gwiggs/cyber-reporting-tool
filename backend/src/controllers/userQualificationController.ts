import { Request, Response } from 'express';
import userQualificationModel from '../models/userQualificationModel';
import userModel from '../models/userModel';
import qualificationModel from '../models/qualificationModel';
import { CreateUserQualificationData, UpdateUserQualificationData, AuthenticatedRequest } from '../types';

/**
 * Get all user qualifications
 */
export const getUserQualifications = async (req: Request, res: Response): Promise<void> => {
  try {
    const userQualifications = await userQualificationModel.findAll();
    res.json(userQualifications);
  } catch (error) {
    console.error('Error fetching user qualifications:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Get user qualification by ID
 */
export const getUserQualificationById = async (req: Request, res: Response): Promise<void> => {
  try {
    const userQualificationId = parseInt(req.params.id);
    
    if (isNaN(userQualificationId)) {
      res.status(400).json({ message: 'Invalid user qualification ID' });
      return;
    }
    
    const userQualification = await userQualificationModel.findById(userQualificationId);
    
    if (!userQualification) {
      res.status(404).json({ message: 'User qualification not found' });
      return;
    }
    
    res.json(userQualification);
  } catch (error) {
    console.error('Error fetching user qualification:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Get qualifications for a specific user
 */
export const getQualificationsByUserId = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = parseInt(req.params.userId);
    
    if (isNaN(userId)) {
      res.status(400).json({ message: 'Invalid user ID' });
      return;
    }
    
    // Check if user exists
    const user = await userModel.findById(userId);
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }
    
    const userQualifications = await userQualificationModel.findByUserId(userId);
    res.json(userQualifications);
  } catch (error) {
    console.error('Error fetching user qualifications:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Get users with a specific qualification
 */
export const getUsersByQualificationId = async (req: Request, res: Response): Promise<void> => {
  try {
    const qualificationId = parseInt(req.params.qualificationId);
    
    if (isNaN(qualificationId)) {
      res.status(400).json({ message: 'Invalid qualification ID' });
      return;
    }
    
    // Check if qualification exists
    const qualification = await qualificationModel.findById(qualificationId);
    if (!qualification) {
      res.status(404).json({ message: 'Qualification not found' });
      return;
    }
    
    const userQualifications = await userQualificationModel.findByQualificationId(qualificationId);
    res.json(userQualifications);
  } catch (error) {
    console.error('Error fetching users with qualification:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Create a new user qualification
 */
export const createUserQualification = async (req: Request, res: Response): Promise<void> => {
  try {
    const userQualificationData: CreateUserQualificationData = req.body;
    
    // Validate required fields
    if (!userQualificationData.user_id || !userQualificationData.qualification_id || !userQualificationData.date_acquired) {
      res.status(400).json({ message: 'User ID, qualification ID, and date acquired are required' });
      return;
    }
    
    // Check if user exists
    const user = await userModel.findById(userQualificationData.user_id);
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }
    
    // Check if qualification exists
    const qualification = await qualificationModel.findById(userQualificationData.qualification_id);
    if (!qualification) {
      res.status(404).json({ message: 'Qualification not found' });
      return;
    }
    
    // Calculate expiration date based on qualification settings if not provided
    if (!userQualificationData.expiration_date && qualification.expiration_period) {
      const dateAcquired = new Date(userQualificationData.date_acquired);
      const expirationDate = new Date(dateAcquired);
      expirationDate.setMonth(expirationDate.getMonth() + qualification.expiration_period);
      userQualificationData.expiration_date = expirationDate;
    }
    
    // Create user qualification
    try {
      const newUserQualification = await userQualificationModel.create(userQualificationData);
      res.status(201).json(newUserQualification);
    } catch (err) {
      if (err instanceof Error && err.message.includes('User already has this qualification')) {
        res.status(409).json({ message: 'User already has this qualification' });
      } else {
        throw err;
      }
    }
  } catch (error) {
    console.error('Error creating user qualification:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Update an existing user qualification
 */
export const updateUserQualification = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userQualificationId = parseInt(req.params.id);
    const userQualificationData: UpdateUserQualificationData = req.body;
    
    if (isNaN(userQualificationId)) {
      res.status(400).json({ message: 'Invalid user qualification ID' });
      return;
    }
    
    // Check if user qualification exists
    const existingUserQualification = await userQualificationModel.findById(userQualificationId);
    if (!existingUserQualification) {
      res.status(404).json({ message: 'User qualification not found' });
      return;
    }
    
    // Get the current user from the authenticated request
    const updatedByUserId = req.user.id;
    
    // Update user qualification
    const updatedUserQualification = await userQualificationModel.update(
      userQualificationId, 
      userQualificationData,
      updatedByUserId
    );
    
    res.json(updatedUserQualification);
  } catch (error) {
    console.error('Error updating user qualification:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Delete a user qualification
 */
export const deleteUserQualification = async (req: Request, res: Response): Promise<void> => {
  try {
    const userQualificationId = parseInt(req.params.id);
    
    if (isNaN(userQualificationId)) {
      res.status(400).json({ message: 'Invalid user qualification ID' });
      return;
    }
    
    // Check if user qualification exists
    const existingUserQualification = await userQualificationModel.findById(userQualificationId);
    if (!existingUserQualification) {
      res.status(404).json({ message: 'User qualification not found' });
      return;
    }
    
    // Delete user qualification
    await userQualificationModel.delete(userQualificationId);
    
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting user qualification:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Get qualification update history
 */
export const getQualificationUpdates = async (req: Request, res: Response): Promise<void> => {
  try {
    const userQualificationId = parseInt(req.params.id);
    
    if (isNaN(userQualificationId)) {
      res.status(400).json({ message: 'Invalid user qualification ID' });
      return;
    }
    
    // Check if user qualification exists
    const existingUserQualification = await userQualificationModel.findById(userQualificationId);
    if (!existingUserQualification) {
      res.status(404).json({ message: 'User qualification not found' });
      return;
    }
    
    const updates = await userQualificationModel.getQualificationUpdates(userQualificationId);
    res.json(updates);
  } catch (error) {
    console.error('Error fetching qualification updates:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Get expired qualifications
 */
export const getExpiredQualifications = async (req: Request, res: Response): Promise<void> => {
  try {
    const expiredQualifications = await userQualificationModel.findExpiredQualifications();
    res.json(expiredQualifications);
  } catch (error) {
    console.error('Error fetching expired qualifications:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Update expired qualifications (admin/system function)
 */
export const updateExpiredQualifications = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    // Use authenticated user's ID as the system user
    const systemUserId = req.user.id;
    
    const updatedCount = await userQualificationModel.updateExpiredQualifications(systemUserId);
    
    res.json({ 
      message: `${updatedCount} expired qualifications have been updated`,
      updated_count: updatedCount
    });
  } catch (error) {
    console.error('Error updating expired qualifications:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}; 