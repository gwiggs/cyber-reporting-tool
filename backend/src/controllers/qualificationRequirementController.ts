import { Request, Response } from 'express';
import qualificationRequirementModel from '../models/qualificationRequirementModel';
import workRoleModel from '../models/workRoleModel';
import qualificationModel from '../models/qualificationModel';
import userModel from '../models/userModel';
import { 
  CreateQualificationRequirementData, 
  UpdateQualificationRequirementData 
} from '../types';

/**
 * Get all qualification requirements
 */
export const getQualificationRequirements = async (req: Request, res: Response): Promise<void> => {
  try {
    const requirements = await qualificationRequirementModel.findAll();
    res.json(requirements);
  } catch (error) {
    console.error('Error fetching qualification requirements:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Get qualification requirement by ID
 */
export const getQualificationRequirementById = async (req: Request, res: Response): Promise<void> => {
  try {
    const requirementId = parseInt(req.params.id);
    
    if (isNaN(requirementId)) {
      res.status(400).json({ message: 'Invalid qualification requirement ID' });
      return;
    }
    
    const requirement = await qualificationRequirementModel.findById(requirementId);
    
    if (!requirement) {
      res.status(404).json({ message: 'Qualification requirement not found' });
      return;
    }
    
    res.json(requirement);
  } catch (error) {
    console.error('Error fetching qualification requirement:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Get qualification requirements for a specific work role
 */
export const getRequirementsByWorkRoleId = async (req: Request, res: Response): Promise<void> => {
  try {
    const workRoleId = parseInt(req.params.workRoleId);
    
    if (isNaN(workRoleId)) {
      res.status(400).json({ message: 'Invalid work role ID' });
      return;
    }
    
    // Check if work role exists
    const workRole = await workRoleModel.findById(workRoleId);
    if (!workRole) {
      res.status(404).json({ message: 'Work role not found' });
      return;
    }
    
    const requirements = await qualificationRequirementModel.findByWorkRoleId(workRoleId);
    res.json(requirements);
  } catch (error) {
    console.error('Error fetching qualification requirements by work role:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Get work roles that require a specific qualification
 */
export const getWorkRolesRequiringQualification = async (req: Request, res: Response): Promise<void> => {
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
    
    const workRoles = await qualificationRequirementModel.findWorkRolesRequiringQualification(qualificationId);
    res.json(workRoles);
  } catch (error) {
    console.error('Error fetching work roles requiring qualification:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Create a new qualification requirement
 */
export const createQualificationRequirement = async (req: Request, res: Response): Promise<void> => {
  try {
    const requirementData: CreateQualificationRequirementData = req.body;
    
    // Validate required fields
    if (!requirementData.work_role_id || !requirementData.qualification_id) {
      res.status(400).json({ message: 'Work role ID and qualification ID are required' });
      return;
    }
    
    // Check if work role exists
    const workRole = await workRoleModel.findById(requirementData.work_role_id);
    if (!workRole) {
      res.status(404).json({ message: 'Work role not found' });
      return;
    }
    
    // Check if qualification exists
    const qualification = await qualificationModel.findById(requirementData.qualification_id);
    if (!qualification) {
      res.status(404).json({ message: 'Qualification not found' });
      return;
    }
    
    // Create qualification requirement
    try {
      const newRequirement = await qualificationRequirementModel.create(requirementData);
      res.status(201).json(newRequirement);
    } catch (err) {
      if (err instanceof Error && err.message.includes('already exists')) {
        res.status(409).json({ message: 'This qualification requirement already exists for this work role' });
      } else {
        throw err;
      }
    }
  } catch (error) {
    console.error('Error creating qualification requirement:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Update an existing qualification requirement
 */
export const updateQualificationRequirement = async (req: Request, res: Response): Promise<void> => {
  try {
    const requirementId = parseInt(req.params.id);
    const requirementData: UpdateQualificationRequirementData = req.body;
    
    if (isNaN(requirementId)) {
      res.status(400).json({ message: 'Invalid qualification requirement ID' });
      return;
    }
    
    // Check if qualification requirement exists
    const existingRequirement = await qualificationRequirementModel.findById(requirementId);
    if (!existingRequirement) {
      res.status(404).json({ message: 'Qualification requirement not found' });
      return;
    }
    
    // Update qualification requirement
    const updatedRequirement = await qualificationRequirementModel.update(requirementId, requirementData);
    
    res.json(updatedRequirement);
  } catch (error) {
    console.error('Error updating qualification requirement:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Delete a qualification requirement
 */
export const deleteQualificationRequirement = async (req: Request, res: Response): Promise<void> => {
  try {
    const requirementId = parseInt(req.params.id);
    
    if (isNaN(requirementId)) {
      res.status(400).json({ message: 'Invalid qualification requirement ID' });
      return;
    }
    
    // Check if qualification requirement exists
    const existingRequirement = await qualificationRequirementModel.findById(requirementId);
    if (!existingRequirement) {
      res.status(404).json({ message: 'Qualification requirement not found' });
      return;
    }
    
    // Delete qualification requirement
    await qualificationRequirementModel.delete(requirementId);
    
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting qualification requirement:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Check if a user has the required qualifications for a work role
 */
export const checkUserQualificationsForWorkRole = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = parseInt(req.params.userId);
    const workRoleId = parseInt(req.params.workRoleId);
    
    if (isNaN(userId) || isNaN(workRoleId)) {
      res.status(400).json({ message: 'Invalid user ID or work role ID' });
      return;
    }
    
    // Check if user exists
    const user = await userModel.findById(userId);
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }
    
    // Check if work role exists
    const workRole = await workRoleModel.findById(workRoleId);
    if (!workRole) {
      res.status(404).json({ message: 'Work role not found' });
      return;
    }
    
    const checkResult = await qualificationRequirementModel.checkUserQualificationsForWorkRole(userId, workRoleId);
    
    res.json({
      user_id: userId,
      work_role_id: workRoleId,
      work_role_name: workRole.name,
      ...checkResult
    });
  } catch (error) {
    console.error('Error checking user qualifications for work role:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}; 