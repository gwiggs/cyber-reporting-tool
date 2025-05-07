"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// src/__tests__/services/passwordService.test.ts
const passwordService_1 = __importDefault(require("../../src/services/passwordService"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const crypto_1 = __importDefault(require("crypto"));
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
            bcrypt_1.default.hash.mockResolvedValue(hashedPassword);
            // Execute
            const result = await passwordService_1.default.hashPassword(plainPassword);
            // Assert
            expect(bcrypt_1.default.hash).toHaveBeenCalledWith(plainPassword, 12); // 12 is the SALT_ROUNDS constant
            expect(result).toBe(hashedPassword);
        });
    });
    describe('verifyPassword', () => {
        it('should return true when password matches hash', async () => {
            // Setup
            const plainPassword = 'test123';
            const hashedPassword = 'hashed_password_123';
            bcrypt_1.default.compare.mockResolvedValue(true);
            // Execute
            const result = await passwordService_1.default.verifyPassword(plainPassword, hashedPassword);
            // Assert
            expect(bcrypt_1.default.compare).toHaveBeenCalledWith(plainPassword, hashedPassword);
            expect(result).toBe(true);
        });
        it('should return false when password does not match hash', async () => {
            // Setup
            const plainPassword = 'wrong_password';
            const hashedPassword = 'hashed_password_123';
            bcrypt_1.default.compare.mockResolvedValue(false);
            // Execute
            const result = await passwordService_1.default.verifyPassword(plainPassword, hashedPassword);
            // Assert
            expect(bcrypt_1.default.compare).toHaveBeenCalledWith(plainPassword, hashedPassword);
            expect(result).toBe(false);
        });
    });
    describe('generateResetToken', () => {
        it('should generate a 64-character hexadecimal token', () => {
            // Setup
            const mockBuffer = Buffer.from('0123456789abcdef'.repeat(4));
            crypto_1.default.randomBytes.mockReturnValue(mockBuffer);
            // Execute
            const token = passwordService_1.default.generateResetToken();
            // Assert
            expect(crypto_1.default.randomBytes).toHaveBeenCalledWith(32);
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
            const expirationDate = passwordService_1.default.getResetTokenExpiration();
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
            crypto_1.default.randomBytes.mockReturnValue(mockRandomBytes);
            crypto_1.default.randomInt.mockImplementation((min, max) => min); // Always return min for predictable results
            // Execute
            const password = passwordService_1.default.generateRandomPassword({
                length: 8,
                includeUppercase: true,
                includeLowercase: true,
                includeNumbers: true,
                includeSpecials: true
            });
            // Assert
            expect(password.length).toBe(8);
            expect(crypto_1.default.randomBytes).toHaveBeenCalled();
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
            crypto_1.default.randomBytes.mockReturnValue(mockRandomBytes);
            crypto_1.default.randomInt.mockImplementation((min, max) => min);
            // Execute
            const password = passwordService_1.default.generateRandomPassword();
            // Assert
            expect(password.length).toBe(12); // Default length
            expect(crypto_1.default.randomBytes).toHaveBeenCalled();
        });
    });
    describe('validatePasswordStrength', () => {
        it('should validate a strong password as valid', () => {
            // Setup
            const strongPassword = 'StrongP@ssw0rd';
            // Execute
            const result = passwordService_1.default.validatePasswordStrength(strongPassword);
            // Assert
            expect(result.isValid).toBe(true);
            expect(result.score).toBeGreaterThanOrEqual(4);
            expect(result.feedback).toHaveLength(0);
        });
        it('should validate a weak password as invalid', () => {
            // Setup
            const weakPassword = 'password';
            // Execute
            const result = passwordService_1.default.validatePasswordStrength(weakPassword);
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
            const result = passwordService_1.default.validatePasswordStrength(commonPassword);
            // Assert
            expect(result.feedback).toContain('Password contains common patterns');
        });
    });
});
//# sourceMappingURL=passwordService.test.js.map