import { Request, Response } from 'express';
import qualificationModel from '../models/qualificationModel';
import { CreateQualificationData, UpdateQualificationData } from '../types';

/**
 * Get all qualifications
 */
export const getQualifications = async (req: Request, res: Response): Promise<void> => {
  try {
    const qualifications = await qualificationModel.findAll();
    res.json(qualifications);
  } catch (error) {
    console.error('Error fetching qualifications:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Get qualification by ID
 */
export const getQualificationById = async (req: Request, res: Response): Promise<void> => {
  try {
    const qualificationId = parseInt(req.params.id);
    
    if (isNaN(qualificationId)) {
      res.status(400).json({ message: 'Invalid qualification ID' });
      return;
    }
    
    const qualification = await qualificationModel.findById(qualificationId);
    
    if (!qualification) {
      res.status(404).json({ message: 'Qualification not found' });
      return;
    }
    
    res.json(qualification);
  } catch (error) {
    console.error('Error fetching qualification:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Create a new qualification
 */
export const createQualification = async (req: Request, res: Response): Promise<void> => {
  try {
    const qualificationData: CreateQualificationData = req.body;
    
    // Validate required fields
    if (!qualificationData.name) {
      res.status(400).json({ message: 'Name is required' });
      return;
    }
    
    // Check if qualification with same code already exists
    if (qualificationData.code) {
      const existingQualification = await qualificationModel.findByCode(qualificationData.code);
      if (existingQualification) {
        res.status(409).json({ message: 'Qualification with this code already exists' });
        return;
      }
    }
    
    // Create qualification
    const newQualification = await qualificationModel.create(qualificationData);
    
    res.status(201).json(newQualification);
  } catch (error) {
    console.error('Error creating qualification:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Update an existing qualification
 */
export const updateQualification = async (req: Request, res: Response): Promise<void> => {
  try {
    const qualificationId = parseInt(req.params.id);
    const qualificationData: UpdateQualificationData = req.body;
    
    if (isNaN(qualificationId)) {
      res.status(400).json({ message: 'Invalid qualification ID' });
      return;
    }
    
    // Check if qualification exists
    const existingQualification = await qualificationModel.findById(qualificationId);
    if (!existingQualification) {
      res.status(404).json({ message: 'Qualification not found' });
      return;
    }
    
    // If code is being updated, check if it's already in use
    if (qualificationData.code && qualificationData.code !== existingQualification.code) {
      const qualificationWithCode = await qualificationModel.findByCode(qualificationData.code);
      if (qualificationWithCode && qualificationWithCode.id !== qualificationId) {
        res.status(409).json({ message: 'Code already in use by another qualification' });
        return;
      }
    }
    
    // Update qualification
    const updatedQualification = await qualificationModel.update(qualificationId, qualificationData);
    
    res.json(updatedQualification);
  } catch (error) {
    console.error('Error updating qualification:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Delete a qualification
 */
export const deleteQualification = async (req: Request, res: Response): Promise<void> => {
  try {
    const qualificationId = parseInt(req.params.id);
    
    if (isNaN(qualificationId)) {
      res.status(400).json({ message: 'Invalid qualification ID' });
      return;
    }
    
    // Check if qualification exists
    const existingQualification = await qualificationModel.findById(qualificationId);
    if (!existingQualification) {
      res.status(404).json({ message: 'Qualification not found' });
      return;
    }
    
    // Delete qualification
    await qualificationModel.delete(qualificationId);
    
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting qualification:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Get qualifications by category
 */
export const getQualificationsByCategory = async (req: Request, res: Response): Promise<void> => {
  try {
    const category = req.params.category;
    
    if (!category) {
      res.status(400).json({ message: 'Category is required' });
      return;
    }
    
    const qualifications = await qualificationModel.findByCategory(category);
    res.json(qualifications);
  } catch (error) {
    console.error('Error fetching qualifications by category:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Get all qualification categories
 */
export const getQualificationCategories = async (req: Request, res: Response): Promise<void> => {
  try {
    const categories = await qualificationModel.getCategories();
    res.json(categories);
  } catch (error) {
    console.error('Error fetching qualification categories:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Get active qualifications
 */
export const getActiveQualifications = async (req: Request, res: Response): Promise<void> => {
  try {
    const qualifications = await qualificationModel.findActive();
    res.json(qualifications);
  } catch (error) {
    console.error('Error fetching active qualifications:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Get qualifications that are expiring soon
 */
export const getExpiringQualifications = async (req: Request, res: Response): Promise<void> => {
  try {
    const days = parseInt(req.query.days as string) || 30;
    
    if (isNaN(days) || days <= 0) {
      res.status(400).json({ message: 'Days must be a positive number' });
      return;
    }
    
    const expiringQualifications = await qualificationModel.findExpiringQualifications(days);
    res.json(expiringQualifications);
  } catch (error) {
    console.error('Error fetching expiring qualifications:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}; 