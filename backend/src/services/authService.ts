import userModel from '../models/userModel';
import { v4 as uuidv4 } from 'uuid';
import redisClient from '../config/redis';
import { User, UserProfile, Permission } from '../types';

interface AuthResult {
  success: boolean;
  message?: string;
  user?: UserProfile;
}

interface SessionData {
  user_id: number;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}

const authService = {
  async authenticate(email: string, password: string): Promise<AuthResult> {
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
        permissions: permissions
      }
    };
  },
  
  async createSession(userId: number, ipAddress?: string, userAgent?: string): Promise<string> {
    const sessionId = uuidv4();
    const session: SessionData = {
      user_id: userId,
      ip_address: ipAddress,
      user_agent: userAgent,
      created_at: new Date().toISOString()
    };
    
    // Store in Redis with 24-hour expiration
    await redisClient.set(`session:${sessionId}`, JSON.stringify(session), {
      EX: 24 * 60 * 60 // 24 hours in seconds
    });
    
    return sessionId;
  },
  
  async validateSession(sessionId: string): Promise<SessionData | null> {
    const sessionData = await redisClient.get(`session:${sessionId}`);
    if (!sessionData) {
      return null;
    }
    
    return JSON.parse(sessionData);
  },
  
  async destroySession(sessionId: string): Promise<boolean> {
    await redisClient.del(`session:${sessionId}`);
    return true;
  }
};

export default authService;