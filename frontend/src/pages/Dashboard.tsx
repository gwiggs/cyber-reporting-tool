import { User } from '../types';

interface DashboardProps {
  user: User | null;
}

const Dashboard = ({ user }: DashboardProps) => {
  if (!user) {
    return <div className="error">User data not available</div>;
  }

  return (
    <div className="dashboard">
      <h1>Dashboard</h1>
      <div className="welcome-message">
        <h2>Welcome, {user.first_name} {user.last_name}!</h2>
        <p>You are logged in as: <strong>{user.role}</strong></p>
      </div>
      
      <div className="dashboard-content">
        <div className="user-info-card">
          <h3>Your Information</h3>
          <ul>
            <li><strong>Employee ID:</strong> {user.employee_id}</li>
            <li><strong>Email:</strong> {user.email}</li>
            <li><strong>Organisation ID:</strong> {user.organisation_id}</li>
          </ul>
        </div>
        
        <div className="permissions-card">
          <h3>Your Permissions</h3>
          {user.permissions && user.permissions.length > 0 ? (
            <ul>
              {user.permissions.map((permission, index) => (
                <li key={index}>
                  {typeof permission === 'string' 
                    ? permission 
                    // Handle permission object (with name, resource, action properties)
                    : `${permission.name || `${permission.resource}:${permission.action}`}`}
                </li>
              ))}
            </ul>
          ) : (
            <p>No permissions assigned.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 