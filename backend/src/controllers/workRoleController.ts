import { Request, Response } from 'express';
import workRoleModel from '../models/workRoleModel';
import qualificationRequirementModel from '../models/qualificationRequirementModel';
import departmentModel from '../models/departmentModel';
import userModel from '../models/userModel';
import { 
  CreateWorkRoleData, 
  UpdateWorkRoleData,
  CreateUserWorkRoleData,
  UpdateUserWorkRoleData
} from '../types';

/**
 * Get all work roles
 */
export const getWorkRoles = async (req: Request, res: Response): Promise<void> => {
  try {
    const workRoles = await workRoleModel.findAll();
    res.json(workRoles);
  } catch (error) {
    console.error('Error fetching work roles:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Get work role by ID
 */
export const getWorkRoleById = async (req: Request, res: Response): Promise<void> => {
  try {
    const workRoleId = parseInt(req.params.id);
    
    if (isNaN(workRoleId)) {
      res.status(400).json({ message: 'Invalid work role ID' });
      return;
    }
    
    const workRole = await workRoleModel.findById(workRoleId);
    
    if (!workRole) {
      res.status(404).json({ message: 'Work role not found' });
      return;
    }
    
    res.json(workRole);
  } catch (error) {
    console.error('Error fetching work role:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Create a new work role
 */
export const createWorkRole = async (req: Request, res: Response): Promise<void> => {
  try {
    const workRoleData: CreateWorkRoleData = req.body;
    
    // Validate required fields
    if (!workRoleData.name) {
      res.status(400).json({ message: 'Name is required' });
      return;
    }
    
    // Check if work role with same code already exists
    if (workRoleData.code) {
      const existingWorkRole = await workRoleModel.findByCode(workRoleData.code);
      if (existingWorkRole) {
        res.status(409).json({ message: 'Work role with this code already exists' });
        return;
      }
    }
    
    // Validate department if provided
    if (workRoleData.department_id) {
      const department = await departmentModel.findById(workRoleData.department_id);
      if (!department) {
        res.status(404).json({ message: 'Department not found' });
        return;
      }
    }
    
    // Create work role
    const newWorkRole = await workRoleModel.create(workRoleData);
    
    res.status(201).json(newWorkRole);
  } catch (error) {
    console.error('Error creating work role:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Update an existing work role
 */
export const updateWorkRole = async (req: Request, res: Response): Promise<void> => {
  try {
    const workRoleId = parseInt(req.params.id);
    const workRoleData: UpdateWorkRoleData = req.body;
    
    if (isNaN(workRoleId)) {
      res.status(400).json({ message: 'Invalid work role ID' });
      return;
    }
    
    // Check if work role exists
    const existingWorkRole = await workRoleModel.findById(workRoleId);
    if (!existingWorkRole) {
      res.status(404).json({ message: 'Work role not found' });
      return;
    }
    
    // If code is being updated, check if it's already in use
    if (workRoleData.code && workRoleData.code !== existingWorkRole.code) {
      const workRoleWithCode = await workRoleModel.findByCode(workRoleData.code);
      if (workRoleWithCode && workRoleWithCode.id !== workRoleId) {
        res.status(409).json({ message: 'Code already in use by another work role' });
        return;
      }
    }
    
    // Validate department if provided
    if (workRoleData.department_id) {
      const department = await departmentModel.findById(workRoleData.department_id);
      if (!department) {
        res.status(404).json({ message: 'Department not found' });
        return;
      }
    }
    
    // Update work role
    const updatedWorkRole = await workRoleModel.update(workRoleId, workRoleData);
    
    res.json(updatedWorkRole);
  } catch (error) {
    console.error('Error updating work role:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Delete a work role
 */
export const deleteWorkRole = async (req: Request, res: Response): Promise<void> => {
  try {
    const workRoleId = parseInt(req.params.id);
    
    if (isNaN(workRoleId)) {
      res.status(400).json({ message: 'Invalid work role ID' });
      return;
    }
    
    // Check if work role exists
    const existingWorkRole = await workRoleModel.findById(workRoleId);
    if (!existingWorkRole) {
      res.status(404).json({ message: 'Work role not found' });
      return;
    }
    
    // Delete work role
    await workRoleModel.delete(workRoleId);
    
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting work role:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Get work roles by department
 */
export const getWorkRolesByDepartment = async (req: Request, res: Response): Promise<void> => {
  try {
    const departmentId = parseInt(req.params.departmentId);
    
    if (isNaN(departmentId)) {
      res.status(400).json({ message: 'Invalid department ID' });
      return;
    }
    
    // Check if department exists
    const department = await departmentModel.findById(departmentId);
    if (!department) {
      res.status(404).json({ message: 'Department not found' });
      return;
    }
    
    const workRoles = await workRoleModel.findByDepartment(departmentId);
    res.json(workRoles);
  } catch (error) {
    console.error('Error fetching work roles by department:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Get all user work role assignments
 */
export const getAllUserWorkRoles = async (req: Request, res: Response): Promise<void> => {
  try {
    const userWorkRoles = await workRoleModel.findAllUserWorkRoles();
    res.json(userWorkRoles);
  } catch (error) {
    console.error('Error fetching user work roles:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Get work roles for a specific user
 */
export const getUserWorkRoles = async (req: Request, res: Response): Promise<void> => {
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
    
    const userWorkRoles = await workRoleModel.findUserWorkRolesByUserId(userId);
    res.json(userWorkRoles);
  } catch (error) {
    console.error('Error fetching user work roles:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Get current work roles for a user
 */
export const getUserCurrentWorkRoles = async (req: Request, res: Response): Promise<void> => {
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
    
    const userWorkRoles = await workRoleModel.getUserCurrentWorkRoles(userId);
    res.json(userWorkRoles);
  } catch (error) {
    console.error('Error fetching user current work roles:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Get historical work roles for a user
 */
export const getUserHistoricalWorkRoles = async (req: Request, res: Response): Promise<void> => {
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
    
    const userWorkRoles = await workRoleModel.getUserHistoricalWorkRoles(userId);
    res.json(userWorkRoles);
  } catch (error) {
    console.error('Error fetching user historical work roles:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Get users assigned to a work role
 */
export const getUsersByWorkRole = async (req: Request, res: Response): Promise<void> => {
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
    
    const userWorkRoles = await workRoleModel.findUsersByWorkRole(workRoleId);
    res.json(userWorkRoles);
  } catch (error) {
    console.error('Error fetching users by work role:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Assign work role to user
 */
export const assignWorkRoleToUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const workRoleData: CreateUserWorkRoleData = req.body;
    
    // Validate required fields
    if (!workRoleData.user_id || !workRoleData.work_role_id || !workRoleData.start_date) {
      res.status(400).json({ message: 'User ID, work role ID, and start date are required' });
      return;
    }
    
    // Check if user exists
    const user = await userModel.findById(workRoleData.user_id);
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }
    
    // Check if work role exists
    const workRole = await workRoleModel.findById(workRoleData.work_role_id);
    if (!workRole) {
      res.status(404).json({ message: 'Work role not found' });
      return;
    }
    
    // Check user qualifications if the work role has requirements
    if (req.query.checkQualifications === 'true') {
      const qualificationCheck = await qualificationRequirementModel.checkUserQualificationsForWorkRole(
        workRoleData.user_id,
        workRoleData.work_role_id
      );
      
      if (!qualificationCheck.qualified) {
        res.status(409).json({ 
          message: `User is missing ${qualificationCheck.missingRequired} required qualifications for this work role`,
          qualification_check: qualificationCheck
        });
        return;
      }
    }
    
    // Assign work role to user
    try {
      const assignment = await workRoleModel.assignWorkRoleToUser(workRoleData);
      res.status(201).json(assignment);
    } catch (err) {
      if (err instanceof Error && err.message.includes('User is already assigned')) {
        res.status(409).json({ message: 'User is already assigned to this work role' });
      } else {
        throw err;
      }
    }
  } catch (error) {
    console.error('Error assigning work role to user:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Update user work role
 */
export const updateUserWorkRole = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = parseInt(req.params.userId);
    const workRoleId = parseInt(req.params.workRoleId);
    const workRoleData: UpdateUserWorkRoleData = req.body;
    
    if (isNaN(userId) || isNaN(workRoleId)) {
      res.status(400).json({ message: 'Invalid user ID or work role ID' });
      return;
    }
    
    // Update user work role
    try {
      const updatedUserWorkRole = await workRoleModel.updateUserWorkRole(userId, workRoleId, workRoleData);
      
      if (!updatedUserWorkRole) {
        res.status(404).json({ message: 'User work role assignment not found' });
        return;
      }
      
      res.json(updatedUserWorkRole);
    } catch (error) {
      throw error;
    }
  } catch (error) {
    console.error('Error updating user work role:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * End user work role assignment
 */
export const endUserWorkRole = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = parseInt(req.params.userId);
    const workRoleId = parseInt(req.params.workRoleId);
    const { end_date } = req.body;
    
    if (isNaN(userId) || isNaN(workRoleId)) {
      res.status(400).json({ message: 'Invalid user ID or work role ID' });
      return;
    }
    
    if (!end_date) {
      res.status(400).json({ message: 'End date is required' });
      return;
    }
    
    // End user work role assignment
    const endedWorkRole = await workRoleModel.endWorkRoleAssignment(userId, workRoleId, new Date(end_date));
    
    if (!endedWorkRole) {
      res.status(404).json({ message: 'User work role assignment not found' });
      return;
    }
    
    res.json(endedWorkRole);
  } catch (error) {
    console.error('Error ending user work role:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Get user missing qualifications
 */
export const getUserMissingQualifications = async (req: Request, res: Response): Promise<void> => {
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
    
    const missingQualifications = await qualificationRequirementModel.findMissingQualificationsForUser(userId);
    res.json(missingQualifications);
  } catch (error) {
    console.error('Error fetching user missing qualifications:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}; 