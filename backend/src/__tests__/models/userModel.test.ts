// src/__tests__/models/userModel.test.ts
import userModel from '../../src/models/userModel';
import db from '../../src/db/postgres';
import passwordService from '../../src/services/passwordService';

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
      (db.query as jest.Mock).mockResolvedValue({
        rows: [mockUser]
      });

      // Execute
      const result = await userModel.findByEmail('john@example.com');

      // Assert
      expect(result).toEqual(mockUser);
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT u.*, r.name as role_name'),
        ['john@example.com']
      );
    });

    it('should return null when user not found by email', async () => {
      // Mock empty result
      (db.query as jest.Mock).mockResolvedValue({
        rows: []
      });

      // Execute
      const result = await userModel.findByEmail('nonexistent@example.com');

      // Assert
      expect(result).toBeNull();
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT u.*, r.name as role_name'),
        ['nonexistent@example.com']
      );
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
      (db.query as jest.Mock).mockResolvedValue({
        rows: [mockUser]
      });

      // Execute
      const result = await userModel.findById(1);

      // Assert
      expect(result).toEqual(mockUser);
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT u.*, r.name as role_name'),
        [1]
      );
    });

    it('should return null when user not found by ID', async () => {
      // Mock empty result
      (db.query as jest.Mock).mockResolvedValue({
        rows: []
      });

      // Execute
      const result = await userModel.findById(999);

      // Assert
      expect(result).toBeNull();
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT u.*, r.name as role_name'),
        [999]
      );
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
      (passwordService.hashPassword as jest.Mock).mockResolvedValue(mockHashedPassword);
      (db.transaction as jest.Mock).mockImplementation(async (callback) => {
        const mockClient = {
          query: jest.fn()
            .mockResolvedValueOnce({ rows: [mockUser] }) // First call for user insertion
            .mockResolvedValueOnce({ rows: [] })         // Second call for credentials insertion
        };
        return callback(mockClient);
      });

      // Execute
      const result = await userModel.create(userData);

      // Assert
      expect(result).toEqual(mockUser);
      expect(passwordService.hashPassword).toHaveBeenCalledWith('password123');
      expect(db.transaction).toHaveBeenCalled();
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
      (db.query as jest.Mock).mockResolvedValue({
        rows: [updatedUser]
      });

      // Execute
      const result = await userModel.update(1, updateData);

      // Assert
      expect(result).toEqual(updatedUser);
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE users'),
        expect.arrayContaining(['Smith', expect.any(Date), 1])
      );
    });
  });

  describe('delete', () => {
    it('should delete a user and related records in transaction', async () => {
      // Setup mocks
      (db.transaction as jest.Mock).mockImplementation(async (callback) => {
        const mockClient = {
          query: jest.fn()
            .mockResolvedValueOnce({ rows: [] }) // First call for user_credentials
            .mockResolvedValueOnce({ rows: [] }) // Second call for user_roles
            .mockResolvedValueOnce({ rows: [] }) // Third call for users
        };
        return callback(mockClient);
      });

      // Execute
      await userModel.delete(1);

      // Assert
      expect(db.transaction).toHaveBeenCalled();
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
      (db.query as jest.Mock).mockResolvedValue({
        rows: mockPermissions
      });

      // Execute
      const result = await userModel.getUserPermissions(1);

      // Assert
      expect(result).toEqual(mockPermissions);
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT p.* FROM permissions p'),
        [1]
      );
    });
  });

  describe('updatePassword', () => {
    it('should update user password and clear reset tokens', async () => {
      // Setup mocks
      (db.query as jest.Mock).mockResolvedValue({
        rows: []
      });

      // Execute
      await userModel.updatePassword(1, 'new_hashed_password');

      // Assert
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE user_credentials'),
        ['new_hashed_password', expect.any(Date), 1]
      );
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
      (db.query as jest.Mock).mockResolvedValue({
        rows: mockPasswordHistory
      });

      // Execute
      const result = await userModel.getPasswordHistory(1, 5);

      // Assert
      expect(result).toEqual(['old_hash_1', 'old_hash_2']);
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT password_hash FROM password_history'),
        [1, 5]
      );
    });
  });

  describe('invalidateSessions', () => {
    it('should invalidate all sessions for a user', async () => {
      // Setup mocks
      (db.query as jest.Mock).mockResolvedValue({
        rows: []
      });

      // Execute
      await userModel.invalidateSessions(1);

      // Assert
      expect(db.query).toHaveBeenCalledWith(
        'UPDATE sessions SET is_valid = false WHERE user_id = $1',
        [1]
      );
    });
  });
});