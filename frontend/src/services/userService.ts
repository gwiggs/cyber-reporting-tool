import axios from 'axios';

const API_URL = '/api/users';

// Type for detailed user information returned from admin endpoint
export interface DetailedUser {
  id: number;
  employee_id: string;
  first_name: string;
  last_name: string;
  email: string;
  rank?: string;
  is_active: boolean;
  last_login?: string;
  created_at: string;
  updated_at: string;
  role: {
    id: number;
    name: string;
    description?: string;
  };
  department: {
    id: number;
    name: string;
    code?: string;
  } | null;
  organisation: {
    id: number;
    name: string;
  } | null;
}

/**
 * Get all users with detailed information (admin only)
 */
export const getAllUsers = async (): Promise<DetailedUser[]> => {
  try {
    const response = await axios.get<{success: boolean, count: number, data: DetailedUser[]}>(`${API_URL}/admin/all`);
    
    if (!response.data.success) {
      throw new Error('Failed to fetch user data');
    }
    
    return response.data.data;
  } catch (error) {
    console.error('Error fetching all users:', error);
    throw error;
  }
};

/**
 * Get user by ID
 */
export const getUserById = async (id: number): Promise<DetailedUser> => {
  try {
    const response = await axios.get<DetailedUser>(`${API_URL}/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching user ${id}:`, error);
    throw error;
  }
};

/**
 * Update user
 */
export const updateUser = async (id: number, userData: Partial<DetailedUser>): Promise<DetailedUser> => {
  try {
    const response = await axios.put<DetailedUser>(`${API_URL}/${id}`, userData);
    return response.data;
  } catch (error) {
    console.error(`Error updating user ${id}:`, error);
    throw error;
  }
};

/**
 * Delete user
 */
export const deleteUser = async (id: number): Promise<void> => {
  try {
    await axios.delete(`${API_URL}/${id}`);
  } catch (error) {
    console.error(`Error deleting user ${id}:`, error);
    throw error;
  }
}; 