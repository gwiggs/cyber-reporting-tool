import { Navigate } from 'react-router-dom';
import { User } from '../types';

interface ProtectedRouteProps {
  user: User | null;
  children: React.ReactNode;
  requiredRole?: string;
}

const ProtectedRoute = ({ user, children, requiredRole }: ProtectedRouteProps) => {
  // Check if user is authenticated
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Check if user has the required role, if specified
  if (requiredRole && user.role !== requiredRole && user.role !== 'Administrator') {
    // Redirect to dashboard if user doesn't have the required role
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute; 