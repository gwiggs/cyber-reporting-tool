"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// src/__tests__/services/permissionService.test.ts
const permissionService_1 = __importDefault(require("../../src/services/permissionService"));
const postgres_1 = __importDefault(require("../../src/db/postgres"));
// Mock dependencies
jest.mock('../../src/db/postgres');
describe('Permission Service', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });
    describe('hasPermission', () => {
        it('should return true when user has permission', async () => {
            // Setup mock
            postgres_1.default.query.mockResolvedValue({
                rows: [{ count: '1' }]
            });
            // Execute
            const result = await permissionService_1.default.hasPermission(1, 'users', 'read');
            // Assert
            expect(result).toBe(true);
            expect(postgres_1.default.query).toHaveBeenCalledWith(expect.stringContaining('SELECT COUNT(*) FROM permissions p'), [1, 'users', 'read']);
        });
        it('should return false when user does not have permission', async () => {
            // Setup mock
            postgres_1.default.query.mockResolvedValue({
                rows: [{ count: '0' }]
            });
            // Execute
            const result = await permissionService_1.default.hasPermission(1, 'users', 'delete');
            // Assert
            expect(result).toBe(false);
            expect(postgres_1.default.query).toHaveBeenCalledWith(expect.stringContaining('SELECT COUNT(*) FROM permissions p'), [1, 'users', 'delete']);
        });
    });
    describe('getUserPermissions', () => {
        it('should return all permissions for a user', async () => {
            // Mock data
            const mockPermissions = [
                { id: 1, name: 'user:read', resource: 'users', action: 'read' },
                { id: 2, name: 'user:update', resource: 'users', action: 'update' }
            ];
            // Setup mock
            postgres_1.default.query.mockResolvedValue({
                rows: mockPermissions
            });
            // Execute
            const result = await permissionService_1.default.getUserPermissions(1);
            // Assert
            expect(result).toEqual(mockPermissions);
            expect(postgres_1.default.query).toHaveBeenCalledWith(expect.stringContaining('SELECT DISTINCT p.id, p.name, p.resource, p.action'), [1]);
        });
    });
    describe('getRolePermissions', () => {
        it('should return all permissions for a role', async () => {
            // Mock data
            const mockPermissions = [
                { id: 1, name: 'user:read', resource: 'users', action: 'read' },
                { id: 2, name: 'user:update', resource: 'users', action: 'update' }
            ];
            // Setup mock
            postgres_1.default.query.mockResolvedValue({
                rows: mockPermissions
            });
            // Execute
            const result = await permissionService_1.default.getRolePermissions(1);
            // Assert
            expect(result).toEqual(mockPermissions);
            expect(postgres_1.default.query).toHaveBeenCalledWith(expect.stringContaining('SELECT p.id, p.name, p.resource, p.action'), [1]);
        });
    });
    describe('addPermissionToRole', () => {
        it('should add a permission to a role', async () => {
            // Setup mock
            postgres_1.default.query.mockResolvedValue({
                rows: []
            });
            // Execute
            await permissionService_1.default.addPermissionToRole(1, 2);
            // Assert
            expect(postgres_1.default.query).toHaveBeenCalledWith(expect.stringContaining('INSERT INTO role_permissions'), [1, 2]);
        });
    });
    describe('removePermissionFromRole', () => {
        it('should remove a permission from a role', async () => {
            // Setup mock
            postgres_1.default.query.mockResolvedValue({
                rows: []
            });
            // Execute
            await permissionService_1.default.removePermissionFromRole(1, 2);
            // Assert
            expect(postgres_1.default.query).toHaveBeenCalledWith(expect.stringContaining('DELETE FROM role_permissions'), [1, 2]);
        });
    });
});
//# sourceMappingURL=permissionService.test.js.map