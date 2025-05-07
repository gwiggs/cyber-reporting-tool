"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.invalidateAllSessions = exports.invalidateSession = exports.getUserSessions = exports.getCurrentUser = exports.logout = exports.login = void 0;
const authService_1 = __importDefault(require("../services/authService"));
const userModel_1 = __importDefault(require("../models/userModel"));
const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const result = await authService_1.default.authenticate(email, password);
        if (!result.success) {
            res.status(401).json({ success: false, message: result.message });
            return;
        }
        // Create session
        const sessionId = await authService_1.default.createSession(result.user.id, req.ip, req.headers['user-agent']);
        // Update last login timestamp
        await userModel_1.default.updateLastLogin(result.user.id);
        // Set session cookie
        res.cookie('sessionId', sessionId, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 24 * 60 * 60 * 1000 // 24 hours
        });
        res.json({ success: true, user: result.user });
    }
    catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};
exports.login = login;
const logout = async (req, res) => {
    try {
        const sessionId = req.sessionId;
        if (sessionId) {
            await authService_1.default.destroySession(sessionId);
        }
        res.clearCookie('sessionId');
        res.json({ success: true, message: 'Logged out successfully' });
    }
    catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};
exports.logout = logout;
const getCurrentUser = async (req, res) => {
    try {
        // User is already attached to request by auth middleware
        if (!req.user) {
            res.status(401).json({ success: false, message: 'Authentication required' });
            return;
        }
        res.json({ success: true, user: req.user });
    }
    catch (error) {
        console.error('Get current user error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};
exports.getCurrentUser = getCurrentUser;
/**
 * Get user's active sessions
 */
const getUserSessions = async (req, res) => {
    try {
        if (!req.user) {
            res.status(401).json({ success: false, message: 'Authentication required' });
            return;
        }
        // Fetch sessions from database
        const sessions = await authService_1.default.getUserSessions(req.user.id);
        res.json({
            success: true,
            data: sessions
        });
    }
    catch (error) {
        console.error('Get user sessions error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve user sessions'
        });
    }
};
exports.getUserSessions = getUserSessions;
/**
 * Invalidate a specific session
 */
const invalidateSession = async (req, res) => {
    try {
        if (!req.user) {
            res.status(401).json({ success: false, message: 'Authentication required' });
            return;
        }
        const sessionId = req.params.id;
        // Validate that the session belongs to the current user
        const isUserSession = await authService_1.default.isSessionOwnedByUser(req.user.id, sessionId);
        if (!isUserSession) {
            res.status(403).json({
                success: false,
                message: 'You can only invalidate your own sessions'
            });
            return;
        }
        // Don't allow invalidating the current session through this endpoint
        if (sessionId === req.sessionId) {
            res.status(400).json({
                success: false,
                message: 'Cannot invalidate current session. Use logout instead.'
            });
            return;
        }
        await authService_1.default.destroySession(sessionId);
        res.json({ success: true, message: 'Session invalidated successfully' });
    }
    catch (error) {
        console.error('Invalidate session error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to invalidate session'
        });
    }
};
exports.invalidateSession = invalidateSession;
/**
 * Invalidate all user sessions except current
 */
const invalidateAllSessions = async (req, res) => {
    try {
        if (!req.user) {
            res.status(401).json({ success: false, message: 'Authentication required' });
            return;
        }
        // Get current session ID
        const currentSessionId = req.sessionId;
        // Invalidate all sessions except current
        await authService_1.default.invalidateAllUserSessionsExceptCurrent(req.user.id, currentSessionId || '');
        res.json({
            success: true,
            message: 'All other sessions invalidated successfully'
        });
    }
    catch (error) {
        console.error('Invalidate all sessions error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to invalidate sessions'
        });
    }
};
exports.invalidateAllSessions = invalidateAllSessions;
//# sourceMappingURL=authController.js.map