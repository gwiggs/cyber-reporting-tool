"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// src/__tests__/models/userModel.test.ts
const userModel_1 = __importDefault(require("../../src/models/userModel"));
const postgres_1 = __importDefault(require("../../src/db/postgres"));
const passwordService_1 = __importDefault(require("../../src/services/passwordService"));
// Mock dependencies
jest.mock('../../src/db/postgres');
jest.mock('../../src/services/passwordService');
describe('User Model', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });
    describe('findByEmail', () => {
        it('should return user when found by email', async () => {
            // Mock user data
            const mockUser = {
                id: 1,
                employee_id: 'EMP001',
                first_name: 'John',
                last_name: 'Doe',
                email: 'john@example.com',
                role_name: 'Admin'
            };
            // Mock query result
            postgres_1.default.query.mockResolvedValue({
                rows: [mockUser]
            });
            // Execute
            const result = await userModel_1.default.findByEmail('john@example.com');
            // Assert
            expect(result).toEqual(mockUser);
            expect(postgres_1.default.query).toHaveBeenCalledWith(expect.stringContaining('SELECT u.*, r.name as role_name'), ['john@example.com']);
        });
        it('should return null when user not found by email', async () => {
            // Mock empty result
            postgres_1.default.query.mockResolvedValue({
                rows: []
            });
            // Execute
            const result = await userModel_1.default.findByEmail('nonexistent@example.com');
            // Assert
            expect(result).toBeNull();
            expect(postgres_1.default.query).toHaveBeenCalledWith(expect.stringContaining('SELECT u.*, r.name as role_name'), ['nonexistent@example.com']);
        });
    });
    describe('findById', () => {
        it('should return user when found by ID', async () => {
            // Mock user data
            const mockUser = {
                id: 1,
                employee_id: 'EMP001',
                first_name: 'John',
                last_name: 'Doe',
                email: 'john@example.com',
                role_name: 'Admin'
            };
            // Mock query result
            postgres_1.default.query.mockResolvedValue({
                rows: [mockUser]
            });
            // Execute
            const result = await userModel_1.default.findById(1);
            // Assert
            expect(result).toEqual(mockUser);
            expect(postgres_1.default.query).toHaveBeenCalledWith(expect.stringContaining('SELECT u.*, r.name as role_name'), [1]);
        });
        it('should return null when user not found by ID', async () => {
            // Mock empty result
            postgres_1.default.query.mockResolvedValue({
                rows: []
            });
            // Execute
            const result = await userModel_1.default.findById(999);
            // Assert
            expect(result).toBeNull();
            expect(postgres_1.default.query).toHaveBeenCalledWith(expect.stringContaining('SELECT u.*, r.name as role_name'), [999]);
        });
    });
    describe('create', () => {
        it('should create a new user with hashed password', async () => {
            // Mock data
            const mockHashedPassword = 'hashed_password_123';
            const mockUser = {
                id: 1,
                employee_id: 'EMP001',
                first_name: 'John',
                last_name: 'Doe',
                email: 'john@example.com',
                primary_role_id: 1
            };
            const userData = {
                employee_id: 'EMP001',
                first_name: 'John',
                last_name: 'Doe',
                email: 'john@example.com',
                primary_role_id: 1,
                password: 'password123'
            };
            // Setup mocks
            passwordService_1.default.hashPassword.mockResolvedValue(mockHashedPassword);
            postgres_1.default.transaction.mockImplementation(async (callback) => {
                const mockClient = {
                    query: jest.fn()
                        .mockResolvedValueOnce({ rows: [mockUser] }) // First call for user insertion
                        .mockResolvedValueOnce({ rows: [] }) // Second call for credentials insertion
                };
                return callback(mockClient);
            });
            // Execute
            const result = await userModel_1.default.create(userData);
            // Assert
            expect(result).toEqual(mockUser);
            expect(passwordService_1.default.hashPassword).toHaveBeenCalledWith('password123');
            expect(postgres_1.default.transaction).toHaveBeenCalled();
        });
    });
    describe('update', () => {
        it('should update user properties', async () => {
            // Mock data
            const updatedUser = {
                id: 1,
                employee_id: 'EMP001',
                first_name: 'John',
                last_name: 'Smith', // Updated
                email: 'john@example.com'
            };
            const updateData = {
                last_name: 'Smith'
            };
            // Setup mocks
            postgres_1.default.query.mockResolvedValue({
                rows: [updatedUser]
            });
            // Execute
            const result = await userModel_1.default.update(1, updateData);
            // Assert
            expect(result).toEqual(updatedUser);
            expect(postgres_1.default.query).toHaveBeenCalledWith(expect.stringContaining('UPDATE users'), expect.arrayContaining(['Smith', expect.any(Date), 1]));
        });
    });
    describe('delete', () => {
        it('should delete a user and related records in transaction', async () => {
            // Setup mocks
            postgres_1.default.transaction.mockImplementation(async (callback) => {
                const mockClient = {
                    query: jest.fn()
                        .mockResolvedValueOnce({ rows: [] }) // First call for user_credentials
                        .mockResolvedValueOnce({ rows: [] }) // Second call for user_roles
                        .mockResolvedValueOnce({ rows: [] }) // Third call for users
                };
                return callback(mockClient);
            });
            // Execute
            await userModel_1.default.delete(1);
            // Assert
            expect(postgres_1.default.transaction).toHaveBeenCalled();
        });
    });
    describe('getUserPermissions', () => {
        it('should return permissions for a user', async () => {
            // Mock data
            const mockPermissions = [
                { id: 1, name: 'user:read', resource: 'users', action: 'read' },
                { id: 2, name: 'user:update', resource: 'users', action: 'update' }
            ];
            // Setup mocks
            postgres_1.default.query.mockResolvedValue({
                rows: mockPermissions
            });
            // Execute
            const result = await userModel_1.default.getUserPermissions(1);
            // Assert
            expect(result).toEqual(mockPermissions);
            expect(postgres_1.default.query).toHaveBeenCalledWith(expect.stringContaining('SELECT p.* FROM permissions p'), [1]);
        });
    });
    describe('updatePassword', () => {
        it('should update user password and clear reset tokens', async () => {
            // Setup mocks
            postgres_1.default.query.mockResolvedValue({
                rows: []
            });
            // Execute
            await userModel_1.default.updatePassword(1, 'new_hashed_password');
            // Assert
            expect(postgres_1.default.query).toHaveBeenCalledWith(expect.stringContaining('UPDATE user_credentials'), ['new_hashed_password', expect.any(Date), 1]);
        });
    });
    describe('getPasswordHistory', () => {
        it('should return password history for a user', async () => {
            // Mock data
            const mockPasswordHistory = [
                { password_hash: 'old_hash_1' },
                { password_hash: 'old_hash_2' }
            ];
            // Setup mocks
            postgres_1.default.query.mockResolvedValue({
                rows: mockPasswordHistory
            });
            // Execute
            const result = await userModel_1.default.getPasswordHistory(1, 5);
            // Assert
            expect(result).toEqual(['old_hash_1', 'old_hash_2']);
            expect(postgres_1.default.query).toHaveBeenCalledWith(expect.stringContaining('SELECT password_hash FROM password_history'), [1, 5]);
        });
    });
    describe('invalidateSessions', () => {
        it('should invalidate all sessions for a user', async () => {
            // Setup mocks
            postgres_1.default.query.mockResolvedValue({
                rows: []
            });
            // Execute
            await userModel_1.default.invalidateSessions(1);
            // Assert
            expect(postgres_1.default.query).toHaveBeenCalledWith('UPDATE sessions SET is_valid = false WHERE user_id = $1', [1]);
        });
    });
});
//# sourceMappingURL=userModel.test.js.map