export interface PermissionObject {
  id: number;
  name: string;
  description?: string;
  resource: string;
  action: string;
  created_at: string | Date;
  updated_at: string | Date;
}

export interface User {
  id: number;
  employee_id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
  organisation_id: number;
  permissions: Array<string | PermissionObject>;
  last_login?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Session {
  id: string;
  user_id: number;
  ip_address: string | null;
  user_agent: string | null;
  is_valid: boolean;
  expires_at: string;
  created_at: string;
  updated_at: string;
}

export interface LoginFormData {
  email: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  message?: string;
  user?: User;
} 