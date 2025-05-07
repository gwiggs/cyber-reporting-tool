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
const userModel_1 = __importDefault(require("../models/userModel"));
const uuid_1 = require("uuid");
const redis_1 = __importDefault(require("../config/redis"));
// In-memory session store as fallback when Redis is unavailable
const memorySessionStore = {};
// Check if Redis is connected
const isRedisConnected = () => {
    return redis_1.default.isReady;
};
/**
 * Authentication service with session management
 */
const authService = {
    /**
     * Authenticate a user with email and password
     */
    async authenticate(email, password) {
        try {
            // Get user from database
            const user = await userModel_1.default.findByEmail(email);
            if (!user) {
                return { success: false, message: 'User not found' };
            }
            // Check if user is active
            if (!user.is_active) {
                return { success: false, message: 'User account is inactive' };
            }
            // Get user credentials
            const credentials = await userModel_1.default.getUserCredentials(user.id);
            if (!credentials) {
                return { success: false, message: 'Invalid credentials' };
            }
            // Verify password using password service
            const passwordService = (await Promise.resolve().then(() => __importStar(require('./passwordService')))).default;
            const isValid = await passwordService.verifyPassword(password, credentials.password_hash);
            if (!isValid) {
                return { success: false, message: 'Invalid credentials' };
            }
            // Get user permissions
            const permissions = await userModel_1.default.getUserPermissions(user.id);
            return {
                success: true,
                user: {
                    id: user.id,
                    employee_id: user.employee_id,
                    first_name: user.first_name,
                    last_name: user.last_name,
                    email: user.email,
                    role: user.role_name,
                    permissions: permissions,
                    last_login: user.last_login
                }
            };
        }
        catch (error) {
            console.error('Authentication error:', error);
            return { success: false, message: 'Authentication failed' };
        }
    },
    /**
     * Create a new session for a user
     */
    async createSession(userId, ipAddress, userAgent) {
        const sessionId = (0, uuid_1.v4)();
        const session = {
            user_id: userId,
            ip_address: ipAddress,
            user_agent: userAgent,
            created_at: new Date().toISOString()
        };
        try {
            if (isRedisConnected()) {
                // Store in Redis with 24-hour expiration
                await redis_1.default.set(`session:${sessionId}`, JSON.stringify(session), {
                    EX: 24 * 60 * 60 // 24 hours in seconds
                });
            }
            else {
                console.warn('Redis not connected, using memory session store');
                // Fallback to memory store
                memorySessionStore[sessionId] = session;
            }
        }
        catch (error) {
            console.error('Error creating session in Redis:', error);
            // Fallback to memory store
            memorySessionStore[sessionId] = session;
        }
        return sessionId;
    },
    /**
     * Validate a session by ID
     */
    async validateSession(sessionId) {
        try {
            // Try Redis first
            if (isRedisConnected()) {
                const sessionData = await redis_1.default.get(`session:${sessionId}`);
                if (sessionData) {
                    return JSON.parse(sessionData);
                }
            }
            // Fallback to memory store
            if (memorySessionStore[sessionId]) {
                return memorySessionStore[sessionId];
            }
            return null;
        }
        catch (error) {
            console.error('Error validating session:', error);
            // Fallback to memory store
            if (memorySessionStore[sessionId]) {
                return memorySessionStore[sessionId];
            }
            return null;
        }
    },
    /**
     * Destroy a session by ID
     */
    async destroySession(sessionId) {
        try {
            if (isRedisConnected()) {
                await redis_1.default.del(`session:${sessionId}`);
            }
            // Always remove from memory store as well
            delete memorySessionStore[sessionId];
            return true;
        }
        catch (error) {
            console.error('Error destroying session:', error);
            // Still try to remove from memory store
            delete memorySessionStore[sessionId];
            return true;
        }
    },
    /**
     * Get all active sessions for a user
     */
    async getUserSessions(userId) {
        try {
            const sessions = [];
            // Try Redis first if connected
            if (isRedisConnected()) {
                try {
                    // Get all session keys for this user
                    const sessionKeys = await redis_1.default.keys(`session:*`);
                    // For each session key, get the session data
                    for (const key of sessionKeys) {
                        try {
                            const sessionData = await redis_1.default.get(key);
                            if (sessionData) {
                                const session = JSON.parse(sessionData);
                                // Only include sessions for this user
                                if (session.user_id === userId) {
                                    const sessionId = key.replace('session:', '');
                                    // Get expiry time safely
                                    let expiryTime = 24 * 60 * 60; // Default 24 hours in seconds
                                    try {
                                        expiryTime = await redis_1.default.ttl(key);
                                        // If TTL returns -1 (no expiry) or -2 (key doesn't exist), use default
                                        if (expiryTime < 0)
                                            expiryTime = 24 * 60 * 60;
                                    }
                                    catch (ttlError) {
                                        console.error('Error getting TTL for session:', ttlError);
                                    }
                                    // Calculate expiry date
                                    const expiresAt = new Date();
                                    expiresAt.setSeconds(expiresAt.getSeconds() + expiryTime);
                                    sessions.push({
                                        id: sessionId,
                                        user_id: session.user_id,
                                        ip_address: session.ip_address || undefined,
                                        user_agent: session.user_agent || undefined,
                                        is_valid: true,
                                        expires_at: expiresAt,
                                        created_at: new Date(session.created_at),
                                        updated_at: new Date(session.created_at)
                                    });
                                }
                            }
                        }
                        catch (sessionError) {
                            console.error(`Error processing session key ${key}:`, sessionError);
                            // Continue with next session instead of failing completely
                        }
                    }
                }
                catch (redisError) {
                    console.error('Redis error in getUserSessions:', redisError);
                    // Continue with memory store fallback
                }
            }
            // Include sessions from memory store
            for (const [sessionId, sessionData] of Object.entries(memorySessionStore)) {
                if (sessionData.user_id === userId) {
                    // Don't duplicate sessions that might exist in both stores
                    if (!sessions.some(s => s.id === sessionId)) {
                        // Calculate an expiry date 24 hours from creation
                        const createdAt = new Date(sessionData.created_at);
                        const expiresAt = new Date(createdAt);
                        expiresAt.setHours(expiresAt.getHours() + 24);
                        sessions.push({
                            id: sessionId,
                            user_id: sessionData.user_id,
                            ip_address: sessionData.ip_address || undefined,
                            user_agent: sessionData.user_agent || undefined,
                            is_valid: true,
                            expires_at: expiresAt,
                            created_at: createdAt,
                            updated_at: createdAt
                        });
                    }
                }
            }
            return sessions;
        }
        catch (error) {
            console.error('Error getting user sessions:', error);
            // Return sessions from memory store as fallback
            const sessions = [];
            try {
                for (const [sessionId, sessionData] of Object.entries(memorySessionStore)) {
                    if (sessionData.user_id === userId) {
                        const createdAt = new Date(sessionData.created_at);
                        const expiresAt = new Date(createdAt);
                        expiresAt.setHours(expiresAt.getHours() + 24);
                        sessions.push({
                            id: sessionId,
                            user_id: sessionData.user_id,
                            ip_address: sessionData.ip_address || undefined,
                            user_agent: sessionData.user_agent || undefined,
                            is_valid: true,
                            expires_at: expiresAt,
                            created_at: createdAt,
                            updated_at: createdAt
                        });
                    }
                }
            }
            catch (fallbackError) {
                console.error('Error in memory store fallback:', fallbackError);
            }
            return sessions;
        }
    },
    /**
     * Check if a session belongs to a user
     */
    async isSessionOwnedByUser(userId, sessionId) {
        try {
            const sessionData = await this.validateSession(sessionId);
            return sessionData !== null && sessionData.user_id === userId;
        }
        catch (error) {
            console.error('Error checking session ownership:', error);
            return false;
        }
    },
    /**
     * Invalidate all sessions for a user except the current one
     */
    async invalidateAllUserSessionsExceptCurrent(userId, currentSessionId) {
        try {
            // Handle Redis sessions
            if (isRedisConnected()) {
                // Get all session keys for this user
                const sessionKeys = await redis_1.default.keys(`session:*`);
                // For each session key, check if it belongs to this user and is not the current session
                for (const key of sessionKeys) {
                    const sessionId = key.replace('session:', '');
                    // Skip the current session
                    if (sessionId === currentSessionId) {
                        continue;
                    }
                    const sessionData = await redis_1.default.get(key);
                    if (sessionData) {
                        const session = JSON.parse(sessionData);
                        // If this session belongs to the user, destroy it
                        if (session.user_id === userId) {
                            await this.destroySession(sessionId);
                        }
                    }
                }
            }
            // Handle memory sessions
            for (const [sessionId, sessionData] of Object.entries(memorySessionStore)) {
                if (sessionId !== currentSessionId && sessionData.user_id === userId) {
                    delete memorySessionStore[sessionId];
                }
            }
            return true;
        }
        catch (error) {
            console.error('Error invalidating all user sessions:', error);
            // Still try to clean up memory sessions
            for (const [sessionId, sessionData] of Object.entries(memorySessionStore)) {
                if (sessionId !== currentSessionId && sessionData.user_id === userId) {
                    delete memorySessionStore[sessionId];
                }
            }
            return true;
        }
    }
};
exports.default = authService;
//# sourceMappingURL=authService.js.map