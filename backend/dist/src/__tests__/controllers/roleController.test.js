"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const roleController = __importStar(require("../../src/controllers/roleController"));
const postgres_1 = __importDefault(require("../../src/db/postgres"));
const permissionService_1 = __importDefault(require("../../src/services/permissionService"));
// Mock dependencies
jest.mock('../../src/db/postgres');
jest.mock('../../src/services/permissionService');
describe('Role Controller', () => {
    let mockRequest;
    let mockResponse;
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
            postgres_1.default.query.mockResolvedValue({
                rows: mockRoles
            });
            // Execute
            await roleController.getRoles(mockRequest, mockResponse);
            // Assert
            expect(postgres_1.default.query).toHaveBeenCalledWith('SELECT * FROM roles ORDER BY name', []);
            expect(mockResponse.json).toHaveBeenCalledWith(mockRoles);
        });
        it('should handle errors correctly', async () => {
            // Setup mock to throw error
            const error = new Error('Database error');
            postgres_1.default.query.mockRejectedValue(error);
            // Execute
            await roleController.getRoles(mockRequest, mockResponse);
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
            postgres_1.default.query.mockResolvedValue({
                rows: [mockRole]
            });
            // Execute
            await roleController.getRoleById(mockRequest, mockResponse);
            // Assert
            expect(postgres_1.default.query).toHaveBeenCalledWith('SELECT * FROM roles WHERE id = $1', [1]);
            expect(mockResponse.json).toHaveBeenCalledWith(mockRole);
        });
        it('should return 404 when role is not found', async () => {
            // Setup request
            mockRequest = {
                params: { id: '999' }
            };
            // Setup mock for no results
            postgres_1.default.query.mockResolvedValue({
                rows: []
            });
            // Execute
            await roleController.getRoleById(mockRequest, mockResponse);
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
            await roleController.getRoleById(mockRequest, mockResponse);
            // Assert
            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Invalid role ID' });
            expect(postgres_1.default.query).not.toHaveBeenCalled();
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
            postgres_1.default.query
                .mockResolvedValueOnce({ rows: [] }) // Check for existing role
                .mockResolvedValueOnce({ rows: [newRole] }); // Create role
            // Execute
            await roleController.createRole(mockRequest, mockResponse);
            // Assert
            expect(mockResponse.status).toHaveBeenCalledWith(201);
            expect(mockResponse.json).toHaveBeenCalledWith(newRole);
            expect(postgres_1.default.query).toHaveBeenCalledTimes(2);
        });
        it('should reject creation when role name already exists', async () => {
            // Mock existing role
            const existingRole = { id: 1, name: 'Admin' };
            // Setup request
            mockRequest = {
                body: { name: 'Admin', description: 'Administrator role' }
            };
            // Setup mock to return existing role
            postgres_1.default.query.mockResolvedValue({
                rows: [existingRole]
            });
            // Execute
            await roleController.createRole(mockRequest, mockResponse);
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
            await roleController.createRole(mockRequest, mockResponse);
            // Assert
            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Role name is required' });
            expect(postgres_1.default.query).not.toHaveBeenCalled();
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
            postgres_1.default.query
                .mockResolvedValueOnce({ rows: [existingRole] }) // Find role by ID
                .mockResolvedValueOnce({ rows: [] }) // Check name collision (none)
                .mockResolvedValueOnce({ rows: [updatedRole] }); // Update role
            // Execute
            await roleController.updateRole(mockRequest, mockResponse);
            // Assert
            expect(mockResponse.json).toHaveBeenCalledWith(updatedRole);
            expect(postgres_1.default.query).toHaveBeenCalledTimes(3);
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
            postgres_1.default.query
                .mockResolvedValueOnce({ rows: [existingRole] }) // Find role by ID
                .mockResolvedValueOnce({ rows: [anotherRole] }); // Check name collision (found)
            // Execute
            await roleController.updateRole(mockRequest, mockResponse);
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
            postgres_1.default.query
                .mockResolvedValueOnce({ rows: [existingRole] }) // Find role by ID
                .mockResolvedValueOnce({ rows: [{ count: '0' }] }) // Check if any users have this role
                .mockResolvedValueOnce({ rows: [] }); // Delete role
            // Execute
            await roleController.deleteRole(mockRequest, mockResponse);
            // Assert
            expect(mockResponse.status).toHaveBeenCalledWith(204);
            expect(mockResponse.send).toHaveBeenCalled();
            expect(postgres_1.default.query).toHaveBeenCalledTimes(3);
        });
        it('should reject deletion when role is assigned to users', async () => {
            // Mock data
            const existingRole = { id: 1, name: 'Admin' };
            // Setup request
            mockRequest = {
                params: { id: '1' }
            };
            // Setup mocks
            postgres_1.default.query
                .mockResolvedValueOnce({ rows: [existingRole] }) // Find role by ID
                .mockResolvedValueOnce({ rows: [{ count: '2' }] }); // Check if users have this role (found 2)
            // Execute
            await roleController.deleteRole(mockRequest, mockResponse);
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
            postgres_1.default.query.mockResolvedValue({ rows: [existingRole] }); // Find role by ID
            permissionService_1.default.getRolePermissions.mockResolvedValue(mockPermissions);
            // Execute
            await roleController.getRolePermissions(mockRequest, mockResponse);
            // Assert
            expect(mockResponse.json).toHaveBeenCalledWith(mockPermissions);
            expect(permissionService_1.default.getRolePermissions).toHaveBeenCalledWith(1);
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
            postgres_1.default.query
                .mockResolvedValueOnce({ rows: [existingRole] }) // Find role by ID
                .mockResolvedValueOnce({ rows: allPermissions }); // Get all permissions
            permissionService_1.default.getRolePermissions.mockResolvedValue(updatedPermissions);
            postgres_1.default.transaction.mockImplementation(async (callback) => {
                const mockClient = {
                    query: jest.fn()
                        .mockResolvedValueOnce({ rows: [] }) // Delete existing permissions
                        .mockResolvedValueOnce({ rows: [] }) // Insert new permissions
                };
                return callback(mockClient);
            });
            // Execute
            await roleController.updateRolePermissions(mockRequest, mockResponse);
            // Assert
            expect(mockResponse.json).toHaveBeenCalledWith(updatedPermissions);
            expect(postgres_1.default.transaction).toHaveBeenCalled();
            expect(permissionService_1.default.getRolePermissions).toHaveBeenCalledWith(1);
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
            postgres_1.default.query
                .mockResolvedValueOnce({ rows: [existingRole] }) // Find role by ID
                .mockResolvedValueOnce({ rows: allPermissions }); // Get all permissions
            // Execute
            await roleController.updateRolePermissions(mockRequest, mockResponse);
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
            postgres_1.default.query.mockResolvedValue({
                rows: mockPermissions
            });
            // Execute
            await roleController.getAllPermissions(mockRequest, mockResponse);
            // Assert
            expect(postgres_1.default.query).toHaveBeenCalledWith('SELECT * FROM permissions ORDER BY resource, action', []);
            expect(mockResponse.json).toHaveBeenCalledWith(mockPermissions);
        });
    });
});
//# sourceMappingURL=roleController.test.js.map