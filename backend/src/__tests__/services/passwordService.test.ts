// src/__tests__/services/passwordService.test.ts
import passwordService from '../../src/services/passwordService';
import bcrypt from 'bcrypt';
import crypto from 'crypto';

// Mock dependencies
jest.mock('bcrypt');
jest.mock('crypto');

describe('Password Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('hashPassword', () => {
    it('should hash password using bcrypt', async () => {
      // Setup
      const plainPassword = 'test123';
      const hashedPassword = 'hashed_password_123';
      (bcrypt.hash as jest.Mock).mockResolvedValue(hashedPassword);

      // Execute
      const result = await passwordService.hashPassword(plainPassword);

      // Assert
      expect(bcrypt.hash).toHaveBeenCalledWith(plainPassword, 12); // 12 is the SALT_ROUNDS constant
      expect(result).toBe(hashedPassword);
    });
  });

  describe('verifyPassword', () => {
    it('should return true when password matches hash', async () => {
      // Setup
      const plainPassword = 'test123';
      const hashedPassword = 'hashed_password_123';
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      // Execute
      const result = await passwordService.verifyPassword(plainPassword, hashedPassword);

      // Assert
      expect(bcrypt.compare).toHaveBeenCalledWith(plainPassword, hashedPassword);
      expect(result).toBe(true);
    });

    it('should return false when password does not match hash', async () => {
      // Setup
      const plainPassword = 'wrong_password';
      const hashedPassword = 'hashed_password_123';
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      // Execute
      const result = await passwordService.verifyPassword(plainPassword, hashedPassword);

      // Assert
      expect(bcrypt.compare).toHaveBeenCalledWith(plainPassword, hashedPassword);
      expect(result).toBe(false);
    });
  });

  describe('generateResetToken', () => {
    it('should generate a 64-character hexadecimal token', () => {
      // Setup
      const mockBuffer = Buffer.from('0123456789abcdef'.repeat(4));
      (crypto.randomBytes as jest.Mock).mockReturnValue(mockBuffer);

      // Execute
      const token = passwordService.generateResetToken();

      // Assert
      expect(crypto.randomBytes).toHaveBeenCalledWith(32);
      expect(token).toBe('30313233343536373839616263646566'.repeat(2)); // hex encoding doubles length
      expect(token.length).toBe(64);
    });
  });

  describe('getResetTokenExpiration', () => {
    it('should return date 24 hours in the future', () => {
      // Setup
      const originalDate = new Date('2025-01-01T12:00:00Z');
      const expectedDate = new Date('2025-01-02T12:00:00Z');
      jest.spyOn(global, 'Date').mockImplementation(() => originalDate);

      // Execute
      const expirationDate = passwordService.getResetTokenExpiration();

      // Assert
      expect(expirationDate.getTime()).toBe(expectedDate.getTime());
    });
  });

  describe('generateRandomPassword', () => {
    it('should generate password with specified length and character types', () => {
      // Setup
      const mockRandomBytes = Buffer.from([
        65, 98, 48, 35, 66, 99, 49, 36, 67, 100, 50, 37, 68, 101, 51, 38
      ]); // This will generate a mix of character types
      (crypto.randomBytes as jest.Mock).mockReturnValue(mockRandomBytes);
      (crypto.randomInt as jest.Mock).mockImplementation((min, max) => min); // Always return min for predictable results

      // Execute
      const password = passwordService.generateRandomPassword({
        length: 8,
        includeUppercase: true,
        includeLowercase: true,
        includeNumbers: true,
        includeSpecials: true
      });

      // Assert
      expect(password.length).toBe(8);
      expect(crypto.randomBytes).toHaveBeenCalled();
      // Should have at least one of each character type
      expect(password).toMatch(/[A-Z]/); // Uppercase
      expect(password).toMatch(/[a-z]/); // Lowercase
      expect(password).toMatch(/[0-9]/); // Numbers
      expect(password).toMatch(/[!@#$%^&*_\-+=]/); // Specials
    });

    it('should use default options when none provided', () => {
      // Setup
      const mockRandomBytes = Buffer.from([
        65, 98, 48, 35, 66, 99, 49, 36, 67, 100, 50, 37, 68, 101, 51, 38,
        69, 102, 52, 39, 70, 103, 53, 40
      ]);
      (crypto.randomBytes as jest.Mock).mockReturnValue(mockRandomBytes);
      (crypto.randomInt as jest.Mock).mockImplementation((min, max) => min);

      // Execute
      const password = passwordService.generateRandomPassword();

      // Assert
      expect(password.length).toBe(12); // Default length
      expect(crypto.randomBytes).toHaveBeenCalled();
    });
  });

  describe('validatePasswordStrength', () => {
    it('should validate a strong password as valid', () => {
      // Setup
      const strongPassword = 'StrongP@ssw0rd';

      // Execute
      const result = passwordService.validatePasswordStrength(strongPassword);

      // Assert
      expect(result.isValid).toBe(true);
      expect(result.score).toBeGreaterThanOrEqual(4);
      expect(result.feedback).toHaveLength(0);
    });

    it('should validate a weak password as invalid', () => {
      // Setup
      const weakPassword = 'password';

      // Execute
      const result = passwordService.validatePasswordStrength(weakPassword);

      // Assert
      expect(result.isValid).toBe(false);
      expect(result.score).toBeLessThan(3);
      expect(result.feedback.length).toBeGreaterThan(0);
      expect(result.feedback).toContain('Password should contain at least one uppercase letter');
      expect(result.feedback).toContain('Password should contain at least one number');
      expect(result.feedback).toContain('Password should contain at least one special character');
    });

    it('should identify common patterns in passwords', () => {
      // Setup
      const commonPassword = 'Password123';

      // Execute
      const result = passwordService.validatePasswordStrength(commonPassword);

      // Assert
      expect(result.feedback).toContain('Password contains common patterns');
    });
  });
});