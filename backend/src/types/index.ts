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
  organization_id?: number;
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
  organization_id?: number;
  department_id?: number;
  rank?: string;
  primary_role_id?: number;
  is_active?: boolean;
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
  }