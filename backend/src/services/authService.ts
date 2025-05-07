import userModel from '../models/userModel';
import { v4 as uuidv4 } from 'uuid';
import redisClient from '../config/redis';
import { User, UserProfile, Permission, Session, AuthResult, AuthService } from '../types';

interface SessionData {
  user_id: number;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}

// In-memory session store as fallback when Redis is unavailable
const memorySessionStore: Record<string, SessionData> = {};

// Check if Redis is connected
const isRedisConnected = (): boolean => {
  return redisClient.isReady;
};

/**
 * Authentication service with session management
 */
const authService: AuthService = {
  /**
   * Authenticate a user with email and password
   */
  async authenticate(email: string, password: string): Promise<AuthResult> {
    try {
      // Get user from database
      const user = await userModel.findByEmail(email);
      if (!user) {
        return { success: false, message: 'User not found' };
      }
      
      // Check if user is active
      if (!user.is_active) {
        return { success: false, message: 'User account is inactive' };
      }
      
      // Get user credentials
      const credentials = await userModel.getUserCredentials(user.id);
      if (!credentials) {
        return { success: false, message: 'Invalid credentials' };
      }
      
      // Verify password using password service
      const passwordService = (await import('./passwordService')).default;
      const isValid = await passwordService.verifyPassword(password, credentials.password_hash);
      if (!isValid) {
        return { success: false, message: 'Invalid credentials' };
      }
      
      // Get user permissions
      const permissions = await userModel.getUserPermissions(user.id);
      
      return {
        success: true,
        user: {
          id: user.id,
          employee_id: user.employee_id,
          first_name: user.first_name,
          last_name: user.last_name,
          email: user.email,
          role: (user as any).role_name,
          permissions: permissions,
          last_login: user.last_login
        }
      };
    } catch (error) {
      console.error('Authentication error:', error);
      return { success: false, message: 'Authentication failed' };
    }
  },
  
  /**
   * Create a new session for a user
   */
  async createSession(userId: number, ipAddress?: string, userAgent?: string): Promise<string> {
    const sessionId = uuidv4();
    const session: SessionData = {
      user_id: userId,
      ip_address: ipAddress,
      user_agent: userAgent,
      created_at: new Date().toISOString()
    };
    
    try {
      if (isRedisConnected()) {
        // Store in Redis with 24-hour expiration
        await redisClient.set(`session:${sessionId}`, JSON.stringify(session), {
          EX: 24 * 60 * 60 // 24 hours in seconds
        });
      } else {
        console.warn('Redis not connected, using memory session store');
        // Fallback to memory store
        memorySessionStore[sessionId] = session;
      }
    } catch (error) {
      console.error('Error creating session in Redis:', error);
      // Fallback to memory store
      memorySessionStore[sessionId] = session;
    }
    
    return sessionId;
  },
  
  /**
   * Validate a session by ID
   */
  async validateSession(sessionId: string): Promise<SessionData | null> {
    try {
      // Try Redis first
      if (isRedisConnected()) {
        const sessionData = await redisClient.get(`session:${sessionId}`);
        if (sessionData) {
          return JSON.parse(sessionData);
        }
      }
      
      // Fallback to memory store
      if (memorySessionStore[sessionId]) {
        return memorySessionStore[sessionId];
      }
      
      return null;
    } catch (error) {
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
  async destroySession(sessionId: string): Promise<boolean> {
    try {
      if (isRedisConnected()) {
        await redisClient.del(`session:${sessionId}`);
      }
      
      // Always remove from memory store as well
      delete memorySessionStore[sessionId];
      
      return true;
    } catch (error) {
      console.error('Error destroying session:', error);
      // Still try to remove from memory store
      delete memorySessionStore[sessionId];
      return true;
    }
  },

  /**
   * Get all active sessions for a user
   */
  async getUserSessions(userId: number): Promise<Session[]> {
    try {
      const sessions: Session[] = [];
      
      // Try Redis first if connected
      if (isRedisConnected()) {
        try {
          // Get all session keys for this user
          const sessionKeys = await redisClient.keys(`session:*`);
          
          // For each session key, get the session data
          for (const key of sessionKeys) {
            try {
              const sessionData = await redisClient.get(key);
              if (sessionData) {
                const session = JSON.parse(sessionData) as SessionData;
                
                // Only include sessions for this user
                if (session.user_id === userId) {
                  const sessionId = key.replace('session:', '');
                  
                  // Get expiry time safely
                  let expiryTime = 24 * 60 * 60; // Default 24 hours in seconds
                  try {
                    expiryTime = await redisClient.ttl(key);
                    // If TTL returns -1 (no expiry) or -2 (key doesn't exist), use default
                    if (expiryTime < 0) expiryTime = 24 * 60 * 60;
                  } catch (ttlError) {
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
            } catch (sessionError) {
              console.error(`Error processing session key ${key}:`, sessionError);
              // Continue with next session instead of failing completely
            }
          }
        } catch (redisError) {
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
    } catch (error) {
      console.error('Error getting user sessions:', error);
      
      // Return sessions from memory store as fallback
      const sessions: Session[] = [];
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
      } catch (fallbackError) {
        console.error('Error in memory store fallback:', fallbackError);
      }
      
      return sessions;
    }
  },

  /**
   * Check if a session belongs to a user
   */
  async isSessionOwnedByUser(userId: number, sessionId: string): Promise<boolean> {
    try {
      const sessionData = await this.validateSession(sessionId);
      return sessionData !== null && sessionData.user_id === userId;
    } catch (error) {
      console.error('Error checking session ownership:', error);
      return false;
    }
  },

  /**
   * Invalidate all sessions for a user except the current one
   */
  async invalidateAllUserSessionsExceptCurrent(userId: number, currentSessionId: string): Promise<boolean> {
    try {
      // Handle Redis sessions
      if (isRedisConnected()) {
        // Get all session keys for this user
        const sessionKeys = await redisClient.keys(`session:*`);
        
        // For each session key, check if it belongs to this user and is not the current session
        for (const key of sessionKeys) {
          const sessionId = key.replace('session:', '');
          
          // Skip the current session
          if (sessionId === currentSessionId) {
            continue;
          }
          
          const sessionData = await redisClient.get(key);
          if (sessionData) {
            const session = JSON.parse(sessionData) as SessionData;
            
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
    } catch (error) {
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

export default authService;