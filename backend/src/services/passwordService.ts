import bcrypt from 'bcrypt';

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
    return require('crypto').randomBytes(32).toString('hex');
  },

  /**
   * Calculate expiration date for reset token (24 hours from now)
   * @returns Date when token expires
   */
  getResetTokenExpiration(): Date {
    const expirationDate = new Date();
    expirationDate.setHours(expirationDate.getHours() + 24);
    return expirationDate;
  }
};

export default passwordService;