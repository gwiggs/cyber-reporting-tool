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
exports.checkPermission = exports.checkRole = void 0;
exports.authenticate = authenticate;
const authService_1 = __importDefault(require("../services/authService"));
const userModel_1 = __importDefault(require("../models/userModel"));
/**
 * Middleware to authenticate user based on session cookie
 */
async function authenticate(req, res, next) {
    try {
        // Get session ID from cookie
        const sessionId = req.cookies?.sessionId;
        if (!sessionId) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required',
            });
        }
        // Validate session
        const session = await authService_1.default.validateSession(sessionId);
        if (!session) {
            return res.status(401).json({
                success: false,
                message: 'Invalid or expired session',
            });
        }
        // Get user from database
        const user = await userModel_1.default.findById(session.user_id);
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'User not found',
            });
        }
        // Get user permissions
        const permissions = await userModel_1.default.getUserPermissions(user.id);
        // Attach user to request
        req.user = {
            id: user.id,
            employee_id: user.employee_id,
            first_name: user.first_name,
            last_name: user.last_name,
            email: user.email,
            role: user.role_name || 'User',
            permissions: permissions
        };
        // Attach session ID to request
        req.sessionId = sessionId;
        next();
    }
    catch (error) {
        console.error('Authentication error:', error);
        res.status(401).json({
            success: false,
            message: 'Authentication failed',
        });
    }
}
/**
 * Middleware to check if a user has a specific role
 * @param roles Array of role names that have access
 * @returns Express middleware function
 */
const checkRole = (roles) => {
    return async (req, res, next) => {
        if (!req.user) {
            res.status(401).json({ success: false, message: 'Authentication required' });
            return;
        }
        // Check if user's role is in the allowed roles array
        if (roles.includes(req.user.role)) {
            next();
            return;
        }
        res.status(403).json({
            success: false,
            message: 'Access denied',
            required: { roles }
        });
    };
};
exports.checkRole = checkRole;
const checkPermission = (resource, action) => {
    return async (req, res, next) => {
        if (!req.user) {
            res.status(401).json({ success: false, message: 'Authentication required' });
            return;
        }
        // Method 1: Check using cached permissions on the request object
        const hasPermissionInCache = req.user.permissions.some(p => p.resource === resource && p.action === action);
        if (hasPermissionInCache) {
            next();
            return;
        }
        // Method 2: Double-check with database (in case permissions changed after login)
        const permissionService = (await Promise.resolve().then(() => __importStar(require('../services/permissionService')))).default;
        const hasPermissionInDb = await permissionService.hasPermission(req.user.id, resource, action);
        if (hasPermissionInDb) {
            // Update cached permissions
            const updatedPermissions = await permissionService.getUserPermissions(req.user.id);
            req.user.permissions = updatedPermissions;
            next();
            return;
        }
        // If both methods fail, deny access
        res.status(403).json({
            success: false,
            message: 'Permission denied',
            required: { resource, action }
        });
    };
};
exports.checkPermission = checkPermission;
//# sourceMappingURL=authMiddleware.js.map