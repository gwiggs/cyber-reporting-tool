export interface LoginRequest {
  email: string;
  password: string;
}

export interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
}

export interface UserProfile extends User {
  role: string;
  permissions: string[];
}

export interface Permission {
  id: number;
  name: string;
  description: string;
} 