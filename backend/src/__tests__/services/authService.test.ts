// src/__tests__/services/authService.test.ts
import authService from '../../src/services/authService';
import userModel from '../../src/models/userModel';
import redisClient from '../../src/config/redis';
import passwordService from '../../src/services/passwordService';

// Mock dependencies
jest.mock('../../src/models/userModel');
jest.mock('../../src/config/redis');
jest.mock('../../src/services/passwordService');
jest.mock('uuid', () => ({
  v4: jest.fn(() => 'test-session-id')
}));

describe('Auth Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('authenticate', () => {
    it('should successfully authenticate a valid user with correct credentials', async () => {
      // Mock user data
      const mockUser = {
        id: 1,
        employee_id: 'EMP001',
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
        is_active: true,
        role_name: 'Admin'
      };

      const mockCredentials = {
        user_id: 1,
        password_hash: 'hashed_password'
      };

      const mockPermissions = [
        { id: 1, name: 'user:read', resource: 'users', action: 'read' }
      ];

      // Setup mocks
      (userModel.findByEmail as jest.Mock).mockResolvedValue(mockUser);
      (userModel.getUserCredentials as jest.Mock).mockResolvedValue(mockCredentials);
      (passwordService.verifyPassword as jest.Mock).mockResolvedValue(true);
      (userModel.getUserPermissions as jest.Mock).mockResolvedValue(mockPermissions);

      // Execute
      const result = await authService.authenticate('john@example.com', 'password123');

      // Assert
      expect(result.success).toBe(true);
      expect(result.user).toBeDefined();
      expect(result.user?.id).toBe(1);
      expect(result.user?.email).toBe('john@example.com');
      expect(result.user?.role).toBe('Admin');
      expect(result.user?.permissions).toEqual(mockPermissions);
      expect(userModel.findByEmail).toHaveBeenCalledWith('john@example.com');
      expect(userModel.getUserCredentials).toHaveBeenCalledWith(1);
      expect(passwordService.verifyPassword).toHaveBeenCalledWith('password123', 'hashed_password');
    });

    it('should fail authentication when user does not exist', async () => {
      // Setup mocks
      (userModel.findByEmail as jest.Mock).mockResolvedValue(null);

      // Execute
      const result = await authService.authenticate('nonexistent@example.com', 'password123');

      // Assert
      expect(result.success).toBe(false);
      expect(result.message).toBe('User not found');
      expect(result.user).toBeUndefined();
      expect(userModel.findByEmail).toHaveBeenCalledWith('nonexistent@example.com');
      expect(userModel.getUserCredentials).not.toHaveBeenCalled();
      expect(passwordService.verifyPassword).not.toHaveBeenCalled();
    });

    it('should fail authentication when user account is inactive', async () => {
      // Mock inactive user
      const mockInactiveUser = {
        id: 2,
        employee_id: 'EMP002',
        first_name: 'Jane',
        last_name: 'Doe',
        email: 'jane@example.com',
        is_active: false
      };

      // Setup mocks
      (userModel.findByEmail as jest.Mock).mockResolvedValue(mockInactiveUser);

      // Execute
      const result = await authService.authenticate('jane@example.com', 'password123');

      // Assert
      expect(result.success).toBe(false);
      expect(result.message).toBe('User account is inactive');
      expect(result.user).toBeUndefined();
      expect(userModel.getUserCredentials).not.toHaveBeenCalled();
      expect(passwordService.verifyPassword).not.toHaveBeenCalled();
    });

    it('should fail authentication with incorrect password', async () => {
      // Mock user data
      const mockUser = {
        id: 1,
        employee_id: 'EMP001',
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
        is_active: true
      };

      const mockCredentials = {
        user_id: 1,
        password_hash: 'hashed_password'
      };

      // Setup mocks
      (userModel.findByEmail as jest.Mock).mockResolvedValue(mockUser);
      (userModel.getUserCredentials as jest.Mock).mockResolvedValue(mockCredentials);
      (passwordService.verifyPassword as jest.Mock).mockResolvedValue(false); // Wrong password

      // Execute
      const result = await authService.authenticate('john@example.com', 'wrong_password');

      // Assert
      expect(result.success).toBe(false);
      expect(result.message).toBe('Invalid credentials');
      expect(result.user).toBeUndefined();
      expect(passwordService.verifyPassword).toHaveBeenCalledWith('wrong_password', 'hashed_password');
    });
  });

  describe('createSession', () => {
    it('should create a new session in Redis', async () => {
      // Setup mocks
      (redisClient.set as jest.Mock).mockResolvedValue('OK');

      // Execute
      const sessionId = await authService.createSession(1, '127.0.0.1', 'Mozilla/5.0');

      // Assert
      expect(sessionId).toBe('test-session-id');
      expect(redisClient.set).toHaveBeenCalledWith(
        'session:test-session-id',
        expect.any(String),
        { EX: 86400 } // 24 hours
      );

      // Check session data was properly formatted
      const sessionDataArg = (redisClient.set as jest.Mock).mock.calls[0][1];
      const sessionData = JSON.parse(sessionDataArg);
      expect(sessionData.user_id).toBe(1);
      expect(sessionData.ip_address).toBe('127.0.0.1');
      expect(sessionData.user_agent).toBe('Mozilla/5.0');
      expect(sessionData.created_at).toBeDefined();
    });
  });

  describe('validateSession', () => {
    it('should return session data for a valid session', async () => {
      // Mock session data
      const mockSessionData = {
        user_id: 1,
        ip_address: '127.0.0.1',
        user_agent: 'Mozilla/5.0',
        created_at: new Date().toISOString()
      };

      // Setup mocks
      (redisClient.get as jest.Mock).mockResolvedValue(JSON.stringify(mockSessionData));

      // Execute
      const result = await authService.validateSession('valid-session-id');

      // Assert
      expect(result).toEqual(mockSessionData);
      expect(redisClient.get).toHaveBeenCalledWith('session:valid-session-id');
    });

    it('should return null for an invalid or expired session', async () => {
      // Setup mocks
      (redisClient.get as jest.Mock).mockResolvedValue(null);

      // Execute
      const result = await authService.validateSession('invalid-session-id');

      // Assert
      expect(result).toBeNull();
      expect(redisClient.get).toHaveBeenCalledWith('session:invalid-session-id');
    });
  });

  describe('destroySession', () => {
    it('should destroy a session in Redis', async () => {
      // Setup mocks
      (redisClient.del as jest.Mock).mockResolvedValue(1);

      // Execute
      const result = await authService.destroySession('session-to-destroy');

      // Assert
      expect(result).toBe(true);
      expect(redisClient.del).toHaveBeenCalledWith('session:session-to-destroy');
    });
  });
});