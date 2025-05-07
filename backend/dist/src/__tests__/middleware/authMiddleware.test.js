"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const authMiddleware_1 = require("../../src/middleware/authMiddleware");
const authService_1 = __importDefault(require("../../src/services/authService"));
const userModel_1 = __importDefault(require("../../src/models/userModel"));
const permissionService_1 = __importDefault(require("../../src/services/permissionService"));
// Mock dependencies
jest.mock('../../src/services/authService');
jest.mock('../../src/models/userModel');
jest.mock('../../src/services/permissionService');
describe('Auth Middleware', () => {
    let mockRequest;
    let mockResponse;
    let nextFunction = jest.fn();
    beforeEach(() => {
        jest.clearAllMocks();
        // Setup mock request and response
        mockRequest = {
            cookies: {},
            ip: '127.0.0.1',
            headers: { 'user-agent': 'Jest Test Agent' }
        };
        mockResponse = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
            clearCookie: jest.fn()
        };
        nextFunction = jest.fn();
    });
    describe('authenticate', () => {
        it('should authenticate with valid session and attach user to request', async () => {
            // Mock data
            const sessionId = 'valid-session-id';
            const session = {
                user_id: 1,
                ip_address: '127.0.0.1',
                created_at: new Date().toISOString()
            };
            const user = {
                id: 1,
                employee_id: 'EMP001',
                first_name: 'John',
                last_name: 'Doe',
                email: 'john@example.com',
                role_name: 'Admin'
            };
            const permissions = [
                { id: 1, name: 'user:read', resource: 'users', action: 'read' }
            ];
            // Setup request with session cookie
            mockRequest.cookies = { sessionId };
            // Setup mocks
            authService_1.default.validateSession.mockResolvedValue(session);
            userModel_1.default.findById.mockResolvedValue(user);
            userModel_1.default.getUserPermissions.mockResolvedValue(permissions);
            // Execute
            await (0, authMiddleware_1.authenticate)(mockRequest, mockResponse, nextFunction);
            // Assert
            expect(authService_1.default.validateSession).toHaveBeenCalledWith(sessionId);
            expect(userModel_1.default.findById).toHaveBeenCalledWith(1);
            expect(userModel_1.default.getUserPermissions).toHaveBeenCalledWith(1);
            expect(mockRequest.user).toBeDefined();
            expect(mockRequest.user?.id).toBe(1);
            expect(mockRequest.user?.permissions).toEqual(permissions);
            expect(mockRequest.sessionId).toBe(sessionId);
            expect(nextFunction).toHaveBeenCalled();
            expect(mockResponse.status).not.toHaveBeenCalled();
        });
        it('should reject requests without session cookie', async () => {
            // Setup request without session cookie
            mockRequest.cookies = {};
            // Execute
            await (0, authMiddleware_1.authenticate)(mockRequest, mockResponse, nextFunction);
            // Assert
            expect(authService_1.default.validateSession).not.toHaveBeenCalled();
            expect(mockResponse.status).toHaveBeenCalledWith(401);
            expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Authentication required' });
            expect(nextFunction).not.toHaveBeenCalled();
        });
        it('should reject requests with invalid session', async () => {
            // Setup request with invalid session
            mockRequest.cookies = { sessionId: 'invalid-session-id' };
            authService_1.default.validateSession.mockResolvedValue(null);
            // Execute
            await (0, authMiddleware_1.authenticate)(mockRequest, mockResponse, nextFunction);
            // Assert
            expect(authService_1.default.validateSession).toHaveBeenCalledWith('invalid-session-id');
            expect(mockResponse.status).toHaveBeenCalledWith(401);
            expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Invalid or expired session' });
            expect(nextFunction).not.toHaveBeenCalled();
        });
        it('should reject if user not found', async () => {
            // Mock data
            const sessionId = 'valid-session-id';
            const session = {
                user_id: 999, // User that doesn't exist
                ip_address: '127.0.0.1',
                created_at: new Date().toISOString()
            };
            // Setup request
            mockRequest.cookies = { sessionId };
            authService_1.default.validateSession.mockResolvedValue(session);
            userModel_1.default.findById.mockResolvedValue(null);
            // Execute
            await (0, authMiddleware_1.authenticate)(mockRequest, mockResponse, nextFunction);
            // Assert
            expect(userModel_1.default.findById).toHaveBeenCalledWith(999);
            expect(mockResponse.status).toHaveBeenCalledWith(401);
            expect(mockResponse.json).toHaveBeenCalledWith({ message: 'User not found' });
            expect(nextFunction).not.toHaveBeenCalled();
        });
    });
    describe('checkRole', () => {
        it('should allow access when user has required role', async () => {
            // Mock user with Admin role
            mockRequest.user = {
                id: 1,
                employee_id: 'EMP001',
                first_name: 'John',
                last_name: 'Doe',
                email: 'john@example.com',
                role: 'Admin',
                permissions: []
            };
            // Create middleware for checking Admin role
            const middleware = (0, authMiddleware_1.checkRole)(['Admin']);
            // Execute
            await middleware(mockRequest, mockResponse, nextFunction);
            // Assert
            expect(nextFunction).toHaveBeenCalled();
            expect(mockResponse.status).not.toHaveBeenCalled();
        });
        it('should deny access when user does not have required role', async () => {
            // Mock user with User role
            mockRequest.user = {
                id: 1,
                employee_id: 'EMP001',
                first_name: 'John',
                last_name: 'Doe',
                email: 'john@example.com',
                role: 'User',
                permissions: []
            };
            // Create middleware for checking Admin role
            const middleware = (0, authMiddleware_1.checkRole)(['Admin']);
            // Execute
            await middleware(mockRequest, mockResponse, nextFunction);
            // Assert
            expect(mockResponse.status).toHaveBeenCalledWith(403);
            expect(mockResponse.json).toHaveBeenCalledWith({
                message: 'Access denied',
                required: { roles: ['Admin'] }
            });
            expect(nextFunction).not.toHaveBeenCalled();
        });
        it('should deny access when user is not authenticated', async () => {
            // Request with no user attached
            mockRequest.user = undefined;
            // Create middleware for checking Admin role
            const middleware = (0, authMiddleware_1.checkRole)(['Admin']);
            // Execute
            await middleware(mockRequest, mockResponse, nextFunction);
            // Assert
            expect(mockResponse.status).toHaveBeenCalledWith(401);
            expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Authentication required' });
            expect(nextFunction).not.toHaveBeenCalled();
        });
    });
    describe('checkPermission', () => {
        it('should allow access when user has required permission in cache', async () => {
            // Mock user with user:read permission
            mockRequest.user = {
                id: 1,
                employee_id: 'EMP001',
                first_name: 'John',
                last_name: 'Doe',
                email: 'john@example.com',
                role: 'User',
                permissions: [
                    { id: 1, name: 'user:read', resource: 'users', action: 'read' }
                ]
            };
            // Create middleware for checking users:read permission
            const middleware = (0, authMiddleware_1.checkPermission)('users', 'read');
            // Execute
            await middleware(mockRequest, mockResponse, nextFunction);
            // Assert
            expect(nextFunction).toHaveBeenCalled();
            expect(mockResponse.status).not.toHaveBeenCalled();
            expect(permissionService_1.default.hasPermission).not.toHaveBeenCalled(); // Should not check DB
        });
        it('should check database for permission if not in cache', async () => {
            // Mock user with no cached permissions
            mockRequest.user = {
                id: 1,
                employee_id: 'EMP001',
                first_name: 'John',
                last_name: 'Doe',
                email: 'john@example.com',
                role: 'User',
                permissions: [] // Empty permissions cache
            };
            // Mock permission service to return true
            permissionService_1.default.hasPermission.mockResolvedValue(true);
            permissionService_1.default.getUserPermissions.mockResolvedValue([
                { id: 1, name: 'user:read', resource: 'users', action: 'read' }
            ]);
            // Create middleware for checking users:read permission
            const middleware = (0, authMiddleware_1.checkPermission)('users', 'read');
            // Execute
            await middleware(mockRequest, mockResponse, nextFunction);
            // Assert
            expect(permissionService_1.default.hasPermission).toHaveBeenCalledWith(1, 'users', 'read');
            expect(permissionService_1.default.getUserPermissions).toHaveBeenCalledWith(1);
            expect(nextFunction).toHaveBeenCalled();
            // Check that permissions were updated in the user object
            expect(mockRequest.user?.permissions).toEqual([
                { id: 1, name: 'user:read', resource: 'users', action: 'read' }
            ]);
        });
        it('should deny access when user does not have required permission', async () => {
            // Mock user with different permission
            mockRequest.user = {
                id: 1,
                employee_id: 'EMP001',
                first_name: 'John',
                last_name: 'Doe',
                email: 'john@example.com',
                role: 'User',
                permissions: [
                    { id: 2, name: 'task:read', resource: 'tasks', action: 'read' }
                ]
            };
            // Mock permission service to return false
            permissionService_1.default.hasPermission.mockResolvedValue(false);
            // Create middleware for checking users:write permission
            const middleware = (0, authMiddleware_1.checkPermission)('users', 'write');
            // Execute
            await middleware(mockRequest, mockResponse, nextFunction);
            // Assert
            expect(permissionService_1.default.hasPermission).toHaveBeenCalledWith(1, 'users', 'write');
            expect(mockResponse.status).toHaveBeenCalledWith(403);
            expect(mockResponse.json).toHaveBeenCalledWith({
                message: 'Permission denied',
                required: { resource: 'users', action: 'write' }
            });
            expect(nextFunction).not.toHaveBeenCalled();
        });
    });
});
//# sourceMappingURL=authMiddleware.test.js.map