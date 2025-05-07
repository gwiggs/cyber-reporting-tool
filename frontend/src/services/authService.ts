import axios from 'axios';
import { User, LoginFormData, AuthResponse, Session } from '../types';

// Base URL for API
const API_URL = '/api/auth';
const USERS_URL = '/api/users';
const ROLES_URL = '/api/roles';

// Configure axios to include credentials (cookies)
axios.defaults.withCredentials = true;

/**
 * Login user with email and password
 */
export const login = async (data: LoginFormData): Promise<AuthResponse> => {
  try {
    console.log(`Attempting login for user: ${data.email}`);
    
    // Ensure data has the correct structure
    const loginData = {
      email: data.email,
      password: data.password
    };
    
    const response = await axios.post<AuthResponse>(`${API_URL}/login`, loginData);
    
    if (response.data.success && response.data.user) {
      // Store user in local storage
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    
    return response.data;
  } catch (error) {
    console.error('Login error:', error);
    
    if (axios.isAxiosError(error)) {
      if (error.response) {
        console.error('Error response:', error.response.data);
        return error.response.data as AuthResponse;
      } else if (error.request) {
        console.error('Error request:', error.request);
      } else {
        console.error('Error message:', error.message);
      }
    }
    
    return {
      success: false,
      message: 'Login failed. Please try again.'
    };
  }
};

/**
 * Register a new user
 */
export const register = async (data: any): Promise<User> => {
  try {
    const response = await axios.post<{ success: boolean; user: User; message?: string }>(
      `${USERS_URL}/register`, 
      data
    );

    if (!response.data.success || !response.data.user) {
      throw new Error(response.data.message || 'Registration failed');
    }

    return response.data.user;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      throw new Error(error.response.data.message || 'Registration failed');
    }
    throw error;
  }
};

/**
 * Get available roles
 */
export const getRoles = async (): Promise<any[]> => {
  try {
    console.log('Making request to:', `${ROLES_URL}/public`);
    
    const response = await axios.get<{ success: boolean; roles: any[] }>(`${ROLES_URL}/public`);
    
    console.log('Response received:', response.data);
    
    if (!response.data.success) {
      console.error('API returned unsuccessful response:', response.data);
      return [];
    }
    
    return response.data.roles || [];
  } catch (error) {
    console.error('Error fetching roles:');
    if (axios.isAxiosError(error)) {
      console.error('Axios error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        headers: error.response?.headers
      });
    } else {
      console.error('Unknown error:', error);
    }
    return [];
  }
};

/**
 * Logout current user
 */
export const logout = async (): Promise<void> => {
  try {
    await axios.post(`${API_URL}/logout`);
  } catch (error) {
    console.error('Logout error:', error);
    throw error;
  }
};

/**
 * Get current authenticated user
 */
export const getCurrentUser = async (): Promise<User | null> => {
  try {
    const response = await axios.get<AuthResponse>(`${API_URL}/me`);
    
    if (!response.data.success || !response.data.user) {
      return null;
    }
    
    return response.data.user;
  } catch (error) {
    // Not authenticated
    return null;
  }
};

/**
 * Get user sessions
 */
export const getUserSessions = async (): Promise<Session[]> => {
  try {
    const response = await axios.get<{success: boolean, data: Session[]}>(`${API_URL}/sessions`);
    
    if (!response.data.success) {
      console.warn('Session API returned unsuccessful response:', response.data);
      return [];
    }
    
    return response.data.data || [];
  } catch (error) {
    console.error('Get sessions error:', error);
    
    // Log detailed error information for debugging
    if (axios.isAxiosError(error)) {
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.error('Session API error response:', {
          data: error.response.data,
          status: error.response.status,
          headers: error.response.headers
        });
      } else if (error.request) {
        // The request was made but no response was received
        console.error('Session API no response received:', error.request);
      } else {
        // Something happened in setting up the request that triggered an Error
        console.error('Session API request setup error:', error.message);
      }
    }
    
    // Return empty array to prevent UI errors
    return [];
  }
};

/**
 * Invalidate a specific session
 */
export const invalidateSession = async (sessionId: string): Promise<boolean> => {
  try {
    const response = await axios.delete<{success: boolean}>(`${API_URL}/sessions/${sessionId}`);
    return response.data.success;
  } catch (error) {
    console.error('Invalidate session error:', error);
    return false;
  }
};

/**
 * Invalidate all sessions except current
 */
export const invalidateAllSessions = async (): Promise<boolean> => {
  try {
    const response = await axios.delete<{success: boolean}>(`${API_URL}/sessions`);
    return response.data.success;
  } catch (error) {
    console.error('Invalidate all sessions error:', error);
    return false;
  }
}; 