import { Request, Response, NextFunction } from 'express';
import passwordService from '../services/passwordService';

/**
 * Middleware to enforce password policy
 * This validates that passwords meet the system's security requirements
 */
export const validatePasswordStrength = (
  req: Request, 
  res: Response, 
  next: NextFunction
): void => {
  // Get password from request body
  const { password } = req.body;
  
  // If no password in request, skip validation
  if (!password) {
    return next();
  }
  
  // Validate password strength
  const validationResult = passwordService.validatePasswordStrength(password);
  
  if (!validationResult.isValid) {
    res.status(400).json({
      message: 'Password does not meet security requirements',
      errors: validationResult.feedback,
      score: validationResult.score
    });
    return;
  }
  
  // Password meets requirements, proceed
  next();
};

/**
 * Middleware to assign a random password if none provided
 * This is useful for admin-created accounts where users will reset their password later
 */
export const assignRandomPasswordIfNeeded = (
  req: Request, 
  res: Response, 
  next: NextFunction
): void => {
  // If password is not provided in the request
  if (!req.body.password) {
    // Generate a secure random password
    const randomPassword = passwordService.generateRandomPassword({
      length: 14,
      includeUppercase: true,
      includeLowercase: true, 
      includeNumbers: true,
      includeSpecials: true
    });
    
    // Assign to request body
    req.body.password = randomPassword;
    
    // Store the generated password so we can return it in the response
    // This will only be returned once during account creation
    req.generatedPassword = randomPassword;
  }
  
  next();
};

// Extend Express Request interface to include generatedPassword
declare global {
  namespace Express {
    interface Request {
      generatedPassword?: string;
    }
  }
}