// src/__tests__/controllers/roleController.test.ts
import { Request, Response } from 'express';
import * as roleController from '../../src/controllers/roleController';
import db from '../../src/db/postgres';
import permissionService from '../../src/services/permissionService';

// Mock dependencies
jest.mock('../../src/db/postgres');
jest.mock('../../src/services/permissionService');

describe('Role Controller', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let responseObject = {};

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Setup mock request and response
    mockRequest = {};
    responseObject = {};
    
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockImplementation(result => {
        responseObject = result;
        return mockResponse;
      }),
      send: jest.fn().mockReturnThis()
    };
  });

  describe('getRoles', () => {
    it('should return all roles', async () => {
      // Mock data
      const mockRoles = [
        { id: 1, name: 'Admin', description: 'Administrator role' },
        { id: 2, name: 'User', description: 'Standard user role' }
      ];

      // Setup mock
      (db.query as jest.Mock).mockResolvedValue({
        rows: mockRoles
      });

      // Execute
      await roleController.getRoles(
        mockRequest as Request,
        mockResponse as Response
      );

      // Assert
      expect(db.query).toHaveBeenCalledWith('SELECT * FROM roles ORDER BY name', []);
      expect(mockResponse.json).toHaveBeenCalledWith(mockRoles);
    });

    it('should handle errors correctly', async () => {
      // Setup mock to throw error
      const error = new Error('Database error');
      (db.query as jest.Mock).mockRejectedValue(error);

      // Execute
      await roleController.getRoles(
        mockRequest as Request,
        mockResponse as Response
      );

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Internal server error' });
    });
  });

  describe('getRoleById', () => {
    it('should return a role when found', async () => {
      // Mock data
      const mockRole = { id: 1, name: 'Admin', description: 'Administrator role' };
      
      // Setup request
      mockRequest = {
        params: { id: '1' }
      };

      // Setup mock
      (db.query as jest.Mock).mockResolvedValue({
        rows: [mockRole]
      });

      // Execute
      await roleController.getRoleById(
        mockRequest as Request,
        mockResponse as Response
      );

      // Assert
      expect(db.query).toHaveBeenCalledWith('SELECT * FROM roles WHERE id = $1', [1]);
      expect(mockResponse.json).toHaveBeenCalledWith(mockRole);
    });

    it('should return 404 when role is not found', async () => {
      // Setup request
      mockRequest = {
        params: { id: '999' }
      };

      // Setup mock for no results
      (db.query as jest.Mock).mockResolvedValue({
        rows: []
      });

      // Execute
      await roleController.getRoleById(
        mockRequest as Request,
        mockResponse as Response
      );

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Role not found' });
    });

    it('should handle invalid ID', async () => {
      // Setup request with invalid ID
      mockRequest = {
        params: { id: 'invalid' }
      };

      // Execute
      await roleController.getRoleById(
        mockRequest as Request,
        mockResponse as Response
      );

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Invalid role ID' });
      expect(db.query).not.toHaveBeenCalled();
    });
  });

  describe('createRole', () => {
    it('should create a new role successfully', async () => {
      // Mock data
      const newRole = { id: 1, name: 'Editor', description: 'Can edit content' };
      
      // Setup request
      mockRequest = {
        body: { name: 'Editor', description: 'Can edit content' }
      };

      // Setup mocks
      (db.query as jest.Mock)
        .mockResolvedValueOnce({ rows: [] }) // Check for existing role
        .mockResolvedValueOnce({ rows: [newRole] }); // Create role

      // Execute
      await roleController.createRole(
        mockRequest as Request,
        mockResponse as Response
      );

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith(newRole);
      expect(db.query).toHaveBeenCalledTimes(2);
    });

    it('should reject creation when role name already exists', async () => {
      // Mock existing role
      const existingRole = { id: 1, name: 'Admin' };
      
      // Setup request
      mockRequest = {
        body: { name: 'Admin', description: 'Administrator role' }
      };

      // Setup mock to return existing role
      (db.query as jest.Mock).mockResolvedValue({
        rows: [existingRole]
      });

      // Execute
      await roleController.createRole(
        mockRequest as Request,
        mockResponse as Response
      );

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(409);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Role with this name already exists' });
    });

    it('should reject creation when role name is missing', async () => {
      // Setup request with missing name
      mockRequest = {
        body: { description: 'Some description' }
      };

      // Execute
      await roleController.createRole(
        mockRequest as Request,
        mockResponse as Response
      );

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Role name is required' });
      expect(db.query).not.toHaveBeenCalled();
    });
  });

  describe('updateRole', () => {
    it('should update a role successfully', async () => {
      // Mock data
      const existingRole = { id: 1, name: 'Admin', description: 'Old description' };
      const updatedRole = { id: 1, name: 'Admin', description: 'Updated description' };
      
      // Setup request
      mockRequest = {
        params: { id: '1' },
        body: { name: 'Admin', description: 'Updated description' }
      };

      // Setup mocks
      (db.query as jest.Mock)
        .mockResolvedValueOnce({ rows: [existingRole] }) // Find role by ID
        .mockResolvedValueOnce({ rows: [] })            // Check name collision (none)
        .mockResolvedValueOnce({ rows: [updatedRole] }); // Update role

      // Execute
      await roleController.updateRole(
        mockRequest as Request,
        mockResponse as Response
      );

      // Assert
      expect(mockResponse.json).toHaveBeenCalledWith(updatedRole);
      expect(db.query).toHaveBeenCalledTimes(3);
    });

    it('should reject update when role name already exists for different role', async () => {
      // Mock data
      const existingRole = { id: 1, name: 'Admin', description: 'Administrator' };
      const anotherRole = { id: 2, name: 'User', description: 'User role' };
      
      // Setup request (trying to rename Admin to User)
      mockRequest = {
        params: { id: '1' },
        body: { name: 'User', description: 'Updated description' }
      };

      // Setup mocks
      (db.query as jest.Mock)
        .mockResolvedValueOnce({ rows: [existingRole] }) // Find role by ID
        .mockResolvedValueOnce({ rows: [anotherRole] }); // Check name collision (found)

      // Execute
      await roleController.updateRole(
        mockRequest as Request,
        mockResponse as Response
      );

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(409);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Role with this name already exists' });
    });
  });

  describe('deleteRole', () => {
    it('should delete a role successfully', async () => {
      // Mock data
      const existingRole = { id: 1, name: 'TestRole' };
      
      // Setup request
      mockRequest = {
        params: { id: '1' }
      };

      // Setup mocks
      (db.query as jest.Mock)
        .mockResolvedValueOnce({ rows: [existingRole] }) // Find role by ID
        .mockResolvedValueOnce({ rows: [{ count: '0' }] }) // Check if any users have this role
        .mockResolvedValueOnce({ rows: [] }); // Delete role

      // Execute
      await roleController.deleteRole(
        mockRequest as Request,
        mockResponse as Response
      );

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(204);
      expect(mockResponse.send).toHaveBeenCalled();
      expect(db.query).toHaveBeenCalledTimes(3);
    });

    it('should reject deletion when role is assigned to users', async () => {
      // Mock data
      const existingRole = { id: 1, name: 'Admin' };
      
      // Setup request
      mockRequest = {
        params: { id: '1' }
      };

      // Setup mocks
      (db.query as jest.Mock)
        .mockResolvedValueOnce({ rows: [existingRole] }) // Find role by ID
        .mockResolvedValueOnce({ rows: [{ count: '2' }] }); // Check if users have this role (found 2)

      // Execute
      await roleController.deleteRole(
        mockRequest as Request,
        mockResponse as Response
      );

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(409);
      expect(mockResponse.json).toHaveBeenCalledWith({ 
        message: 'Cannot delete role while it is assigned as primary role to users' 
      });
    });
  });

  describe('getRolePermissions', () => {
    it('should return permissions for a role', async () => {
      // Mock data
      const existingRole = { id: 1, name: 'Admin' };
      const mockPermissions = [
        { id: 1, name: 'user:read', resource: 'users', action: 'read' },
        { id: 2, name: 'user:write', resource: 'users', action: 'write' }
      ];
      
      // Setup request
      mockRequest = {
        params: { id: '1' }
      };

      // Setup mocks
      (db.query as jest.Mock).mockResolvedValue({ rows: [existingRole] }); // Find role by ID
      (permissionService.getRolePermissions as jest.Mock).mockResolvedValue(mockPermissions);

      // Execute
      await roleController.getRolePermissions(
        mockRequest as Request,
        mockResponse as Response
      );

      // Assert
      expect(mockResponse.json).toHaveBeenCalledWith(mockPermissions);
      expect(permissionService.getRolePermissions).toHaveBeenCalledWith(1);
    });
  });

  describe('updateRolePermissions', () => {
    it('should update role permissions successfully', async () => {
      // Mock data
      const existingRole = { id: 1, name: 'Admin' };
      const allPermissions = [
        { id: 1, name: 'user:read' },
        { id: 2, name: 'user:write' }
      ];
      const updatedPermissions = [
        { id: 1, name: 'user:read', resource: 'users', action: 'read' },
        { id: 2, name: 'user:write', resource: 'users', action: 'write' }
      ];
      
      // Setup request
      mockRequest = {
        params: { id: '1' },
        body: { permissionIds: [1, 2] }
      };

      // Setup mocks
      (db.query as jest.Mock)
        .mockResolvedValueOnce({ rows: [existingRole] }) // Find role by ID
        .mockResolvedValueOnce({ rows: allPermissions }); // Get all permissions
      (permissionService.getRolePermissions as jest.Mock).mockResolvedValue(updatedPermissions);
      (db.transaction as jest.Mock).mockImplementation(async (callback) => {
        const mockClient = {
          query: jest.fn()
            .mockResolvedValueOnce({ rows: [] }) // Delete existing permissions
            .mockResolvedValueOnce({ rows: [] }) // Insert new permissions
        };
        return callback(mockClient);
      });

      // Execute
      await roleController.updateRolePermissions(
        mockRequest as Request,
        mockResponse as Response
      );

      // Assert
      expect(mockResponse.json).toHaveBeenCalledWith(updatedPermissions);
      expect(db.transaction).toHaveBeenCalled();
      expect(permissionService.getRolePermissions).toHaveBeenCalledWith(1);
    });

    it('should reject update when permission IDs are invalid', async () => {
      // Mock data
      const existingRole = { id: 1, name: 'Admin' };
      const allPermissions = [
        { id: 1, name: 'user:read' },
        { id: 2, name: 'user:write' }
      ];
      
      // Setup request with invalid permission ID
      mockRequest = {
        params: { id: '1' },
        body: { permissionIds: [1, 999] }
      };

      // Setup mocks
      (db.query as jest.Mock)
        .mockResolvedValueOnce({ rows: [existingRole] }) // Find role by ID
        .mockResolvedValueOnce({ rows: allPermissions }); // Get all permissions

      // Execute
      await roleController.updateRolePermissions(
        mockRequest as Request,
        mockResponse as Response
      );

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({ 
        message: 'Invalid permission IDs', 
        invalidIds: [999] 
      });
    });
  });

  describe('getAllPermissions', () => {
    it('should return all permissions', async () => {
      // Mock data
      const mockPermissions = [
        { id: 1, name: 'user:read', resource: 'users', action: 'read' },
        { id: 2, name: 'user:write', resource: 'users', action: 'write' },
        { id: 3, name: 'task:read', resource: 'tasks', action: 'read' }
      ];

      // Setup mock
      (db.query as jest.Mock).mockResolvedValue({
        rows: mockPermissions
      });

      // Execute
      await roleController.getAllPermissions(
        mockRequest as Request,
        mockResponse as Response
      );

      // Assert
      expect(db.query).toHaveBeenCalledWith(
        'SELECT * FROM permissions ORDER BY resource, action',
        []
      );
      expect(mockResponse.json).toHaveBeenCalledWith(mockPermissions);
    });
  });
});