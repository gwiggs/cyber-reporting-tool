import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllUsers, DetailedUser } from '../services/userService';
import { User } from '../types';

interface AdminUsersProps {
  user: User | null;
}

const AdminUsers = ({ user }: AdminUsersProps) => {
  const navigate = useNavigate();
  const [users, setUsers] = useState<DetailedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Check if the current user is an admin
  useEffect(() => {
    if (!user || (user.role !== 'Admin' && user.role !== 'Administrator')) {
      navigate('/');
    }
  }, [user, navigate]);

  // Fetch all users when the component mounts
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const userData = await getAllUsers();
        setUsers(userData);
        setError(null);
      } catch (err) {
        console.error('Error fetching users:', err);
        setError('Failed to load users. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  // Filter users based on search term
  const filteredUsers = users.filter((user) => {
    const searchValue = searchTerm.toLowerCase();
    return (
      user.first_name.toLowerCase().includes(searchValue) ||
      user.last_name.toLowerCase().includes(searchValue) ||
      user.email.toLowerCase().includes(searchValue) ||
      user.employee_id.toLowerCase().includes(searchValue) ||
      (user.role?.name?.toLowerCase().includes(searchValue) || false) ||
      (user.department?.name?.toLowerCase().includes(searchValue) || false)
    );
  });

  // Format date for display
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString();
  };

  if (!user || (user.role !== 'Admin' && user.role !== 'Administrator')) {
    return null; // Will be redirected by the useEffect
  }

  return (
    <div className="admin-users-page">
      <h1>User Management</h1>
      
      <div className="admin-controls">
        <div className="search-container">
          <input
            type="text"
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
      </div>
      
      {error && <div className="error-message">{error}</div>}
      
      {loading ? (
        <div className="loading">Loading users...</div>
      ) : (
        <div className="users-table-container">
          <table className="users-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Employee ID</th>
                <th>Role</th>
                <th>Department</th>
                <th>Organization</th>
                <th>Status</th>
                <th>Last Login</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={9}>No users found</td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id} className={user.is_active ? 'active-user' : 'inactive-user'}>
                    <td>{user.first_name} {user.last_name}</td>
                    <td>{user.email}</td>
                    <td>{user.employee_id}</td>
                    <td>{user.role?.name || 'No Role'}</td>
                    <td>{user.department?.name || 'None'}</td>
                    <td>{user.organisation?.name || 'None'}</td>
                    <td>
                      <span className={`status-badge ${user.is_active ? 'active' : 'inactive'}`}>
                        {user.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>{formatDate(user.last_login)}</td>
                    <td>{formatDate(user.created_at)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminUsers; 