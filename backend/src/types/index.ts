// User related types
export interface User {
  id: number;
  employee_id: string;
  first_name: string;
  last_name: string;
  email: string;
  organisation_id: number;
  department_id: number;
  rank?: string;
  primary_role_id: number;
  is_active: boolean;
  last_login?: Date;
  created_at: Date;
  updated_at: Date;
}

export interface UserCredentials {
  user_id: number;
  password_hash: string;
  password_reset_token?: string;
  password_reset_expires?: Date;
  created_at: Date;
  updated_at: Date;
}

// Types for user operations
export interface CreateUserData {
  employee_id: string;
  first_name: string;
  last_name: string;
  email: string;
  organisation_id?: number;
  department_id?: number;
  rank?: string;
  primary_role_id: number;
  password: string;
}

export interface UpdateUserData {
  employee_id?: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  organisation_id?: number;
  department_id?: number;
  rank?: string;
  primary_role_id?: number;
  is_active?: boolean;
}

// Organization related types
export interface Organization {
  id: number;
  name: string;
  created_at: Date;
  updated_at: Date;
}

export interface Department {
  id: number;
  organisation_id: number;
  name: string;
  department_code?: string;
  created_at: Date;
  updated_at: Date;
}
  
export interface Role {
  id: number;
  name: string;
  description?: string;
  created_at: Date;
  updated_at: Date;
}
  
export interface Permission {
  id: number;
  name: string;
  description?: string;
  resource: string;
  action: string;
  created_at: Date;
  updated_at: Date;
}
  
export interface Session {
  id: string;
  user_id: number;
  ip_address?: string;
  user_agent?: string;
  is_valid: boolean;
  expires_at: Date;
  created_at: Date;
  updated_at: Date;
}
  
// Authentication types
export interface LoginRequest {
  email: string;
  password: string;
}
  
export interface LoginResponse {
  user: UserProfile;
  token?: string; // For JWT if used
}
  
export interface UserProfile {
  id: number;
  employee_id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
  permissions: Permission[];
  organisation_id?: number;
  last_login?: Date;
}

// Express related types
import { Request } from 'express';

export interface AuthenticatedRequest extends Request {
  user: UserProfile;
}

// Auth service types
export interface AuthService {
  authenticate(email: string, password: string): Promise<AuthResult>;
  createSession(userId: number, ipAddress?: string, userAgent?: string): Promise<string>;
  validateSession(sessionId: string): Promise<any>;
  destroySession(sessionId: string): Promise<boolean>;
  getUserSessions(userId: number): Promise<Session[]>;
  isSessionOwnedByUser(userId: number, sessionId: string): Promise<boolean>;
  invalidateAllUserSessionsExceptCurrent(userId: number, currentSessionId: string): Promise<boolean>;
}

export interface AuthResult {
  success: boolean;
  message?: string;
  user?: UserProfile;
}

// Qualification types
export interface Qualification {
  id: number;
  name: string;
  code?: string;
  description?: string;
  category?: string;
  level?: number;
  expiration_period?: number;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface UserQualification {
  id: number;
  user_id: number;
  qualification_id: number;
  date_acquired: Date;
  expiration_date?: Date;
  status: 'active' | 'expired' | 'revoked' | 'pending';
  issuing_authority?: string;
  certificate_number?: string;
  verification_document?: string;
  notes?: string;
  created_at: Date;
  updated_at: Date;
  
  // Joined data
  qualification_name?: string;
  user_name?: string;
}

export interface WorkRole {
  id: number;
  name: string;
  code?: string;
  description?: string;
  department_id?: number;
  created_at: Date;
  updated_at: Date;
}

export interface UserWorkRole {
  user_id: number;
  work_role_id: number;
  primary_role: boolean;
  start_date: Date;
  end_date?: Date;
  created_at: Date;
  updated_at: Date;
  
  // Joined data
  work_role_name?: string;
  user_name?: string;
}

export interface QualificationRequirement {
  id: number;
  work_role_id: number;
  qualification_id: number;
  is_required: boolean;
  priority: number;
  created_at: Date;
  updated_at: Date;
  
  // Joined data
  qualification_name?: string;
  work_role_name?: string;
}

export interface QualificationUpdate {
  id: number;
  user_qualification_id: number;
  updated_by_user_id: number;
  previous_status?: string;
  new_status: string;
  previous_expiration_date?: Date;
  new_expiration_date?: Date;
  update_reason: string;
  created_at: Date;
  
  // Joined data
  updated_by_name?: string;
}

// Types for qualification operations
export interface CreateQualificationData {
  name: string;
  code?: string;
  description?: string;
  category?: string;
  level?: number;
  expiration_period?: number;
  is_active?: boolean;
}

export interface UpdateQualificationData {
  name?: string;
  code?: string;
  description?: string;
  category?: string;
  level?: number;
  expiration_period?: number;
  is_active?: boolean;
}

export interface CreateUserQualificationData {
  user_id: number;
  qualification_id: number;
  date_acquired: Date;
  expiration_date?: Date;
  status?: string;
  issuing_authority?: string;
  certificate_number?: string;
  verification_document?: string;
  notes?: string;
}

export interface UpdateUserQualificationData {
  date_acquired?: Date;
  expiration_date?: Date;
  status?: string;
  issuing_authority?: string;
  certificate_number?: string;
  verification_document?: string;
  notes?: string;
}

export interface CreateWorkRoleData {
  name: string;
  code?: string;
  description?: string;
  department_id?: number;
}

export interface UpdateWorkRoleData {
  name?: string;
  code?: string;
  description?: string;
  department_id?: number;
}

export interface CreateUserWorkRoleData {
  user_id: number;
  work_role_id: number;
  primary_role?: boolean;
  start_date: Date;
  end_date?: Date;
}

export interface UpdateUserWorkRoleData {
  primary_role?: boolean;
  start_date?: Date;
  end_date?: Date;
}

export interface CreateQualificationRequirementData {
  work_role_id: number;
  qualification_id: number;
  is_required?: boolean;
  priority?: number;
}

export interface UpdateQualificationRequirementData {
  is_required?: boolean;
  priority?: number;
}

export interface CreateQualificationUpdateData {
  user_qualification_id: number;
  updated_by_user_id: number;
  previous_status?: string;
  new_status: string;
  previous_expiration_date?: Date;
  new_expiration_date?: Date;
  update_reason: string;
}