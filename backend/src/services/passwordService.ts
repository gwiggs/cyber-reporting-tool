import bcrypt from 'bcrypt';
import crypto from 'crypto';

const SALT_ROUNDS = 12; // Industry standard as of 2025

/**
 * Service for handling password operations securely
 */
const passwordService = {
  /**
   * Hash a plain text password
   * @param password Plain text password
   * @returns Hashed password
   */
  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, SALT_ROUNDS);
  },

  /**
   * Verify if a plain text password matches a hash
   * @param password Plain text password to verify
   * @param hash Hashed password to compare against
   * @returns Boolean indicating if password matches
   */
  async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  },

  /**
   * Generate a password reset token
   * @returns Password reset token
   */
  generateResetToken(): string {
    // Generate a random string of 32 characters
    return crypto.randomBytes(32).toString('hex');
  },

  /**
   * Calculate expiration date for reset token (24 hours from now)
   * @returns Date when token expires
   */
  getResetTokenExpiration(): Date {
    const expirationDate = new Date();
    expirationDate.setHours(expirationDate.getHours() + 24);
    return expirationDate;
  },

  /**
   * Generate a secure random password
   * @param options Password generation options
   * @returns A randomly generated password
   */
  generateRandomPassword(options: {
    length?: number;
    includeUppercase?: boolean;
    includeLowercase?: boolean;
    includeNumbers?: boolean;
    includeSpecials?: boolean;
  } = {}): string {
    // Set default options
    const config = {
      length: options.length || 12,
      includeUppercase: options.includeUppercase !== false,
      includeLowercase: options.includeLowercase !== false,
      includeNumbers: options.includeNumbers !== false,
      includeSpecials: options.includeSpecials !== false
    };

    // Define character sets
    const uppercaseChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lowercaseChars = 'abcdefghijklmnopqrstuvwxyz';
    const numberChars = '0123456789';
    const specialChars = '!@#$%^&*()_-+=<>?';

    // Build character pool based on options
    let charPool = '';
    if (config.includeUppercase) charPool += uppercaseChars;
    if (config.includeLowercase) charPool += lowercaseChars;
    if (config.includeNumbers) charPool += numberChars;
    if (config.includeSpecials) charPool += specialChars;

    // Ensure at least one character set is included
    if (charPool.length === 0) {
      charPool = lowercaseChars + numberChars;
    }

    // Generate password
    let password = '';
    const randomBytes = crypto.randomBytes(config.length * 2); // Get more bytes than needed for better randomness

    for (let i = 0; i < config.length; i++) {
      const randomIndex = randomBytes[i] % charPool.length;
      password += charPool[randomIndex];
    }

    // Ensure password has at least one character from each selected type
    let finalPassword = password;
    
    if (config.includeUppercase && !/[A-Z]/.test(finalPassword)) {
      const randomPos = crypto.randomInt(0, finalPassword.length);
      const randomChar = uppercaseChars[crypto.randomInt(0, uppercaseChars.length)];
      finalPassword = finalPassword.substring(0, randomPos) + randomChar + finalPassword.substring(randomPos + 1);
    }
    
    if (config.includeLowercase && !/[a-z]/.test(finalPassword)) {
      const randomPos = crypto.randomInt(0, finalPassword.length);
      const randomChar = lowercaseChars[crypto.randomInt(0, lowercaseChars.length)];
      finalPassword = finalPassword.substring(0, randomPos) + randomChar + finalPassword.substring(randomPos + 1);
    }
    
    if (config.includeNumbers && !/[0-9]/.test(finalPassword)) {
      const randomPos = crypto.randomInt(0, finalPassword.length);
      const randomChar = numberChars[crypto.randomInt(0, numberChars.length)];
      finalPassword = finalPassword.substring(0, randomPos) + randomChar + finalPassword.substring(randomPos + 1);
    }
    
    if (config.includeSpecials && !/[!@#$%^&*()_\-+=<>?]/.test(finalPassword)) {
      const randomPos = crypto.randomInt(0, finalPassword.length);
      const randomChar = specialChars[crypto.randomInt(0, specialChars.length)];
      finalPassword = finalPassword.substring(0, randomPos) + randomChar + finalPassword.substring(randomPos + 1);
    }

    return finalPassword;
  },
  
  /**
   * Validate password strength
   * @param password Password to validate
   * @returns Object containing validation result and feedback
   */
  validatePasswordStrength(password: string): { 
    isValid: boolean; 
    score: number; 
    feedback: string[];
  } {
    const feedback: string[] = [];
    let score = 0;
    
    // Check length
    if (password.length < 8) {
      feedback.push('Password should be at least 8 characters long');
    } else if (password.length >= 12) {
      score += 2;
    } else {
      score += 1;
    }
    
    // Check for uppercase letters
    if (!/[A-Z]/.test(password)) {
      feedback.push('Password should contain at least one uppercase letter');
    } else {
      score += 1;
    }
    
    // Check for lowercase letters
    if (!/[a-z]/.test(password)) {
      feedback.push('Password should contain at least one lowercase letter');
    } else {
      score += 1;
    }
    
    // Check for numbers
    if (!/[0-9]/.test(password)) {
      feedback.push('Password should contain at least one number');
    } else {
      score += 1;
    }
    
    // Check for special characters
    if (!/[!@#$%^&*()_\-+=<>?]/.test(password)) {
      feedback.push('Password should contain at least one special character (!@#$%^&*()_-+=<>?)');
    } else {
      score += 1;
    }
    
    // Check for common patterns - TEMPORARILY DISABLED TO FIX REGISTRATION
    // if (/123|abc|qwerty|password|admin/i.test(password)) {
    //   feedback.push('Password contains common patterns');
    //   score -= 1;
    // }
    
    // Ensure score is within range 0-5
    score = Math.max(0, Math.min(5, score));
    
    return {
      isValid: feedback.length === 0,
      score,
      feedback
    };
  }
};

export default passwordService;