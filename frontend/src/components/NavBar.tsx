import { Link, useNavigate } from 'react-router-dom';
import { User } from '../types';
import { logout } from '../services/authService';

interface NavBarProps {
  user: User;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
}

const NavBar = ({ user, setUser }: NavBarProps) => {
  const navigate = useNavigate();
  const isAdmin = user.role === 'Admin' || user.role === 'Administrator';

  const handleLogout = async () => {
    try {
      await logout();
      setUser(null);
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <Link to="/">Cyber Reporting Tool</Link>
      </div>
      <div className="navbar-menu">
        <div className="navbar-start">
          <Link to="/" className="navbar-item">Dashboard</Link>
          <Link to="/profile" className="navbar-item">Profile</Link>
          {isAdmin && (
            <Link to="/admin/users" className="navbar-item">Users</Link>
          )}
        </div>
        <div className="navbar-end">
          <div className="navbar-item">
            <span className="user-name">
              {user.first_name} {user.last_name} ({user.role})
            </span>
          </div>
          <div className="navbar-item">
            <button onClick={handleLogout} className="logout-button">
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default NavBar; 