import { Routes, Route } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import AdminUsers from './pages/AdminUsers';
import ProtectedRoute from './components/ProtectedRoute';
import NavBar from './components/NavBar';
import { User } from './types';
import { getCurrentUser } from './services/authService';

const App = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const userData = await getCurrentUser();
        setUser(userData);
      } catch (error) {
        console.error('Authentication check failed:', error);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  // Check if user is an admin
  const isAdmin = user?.role === 'Admin' || user?.role === 'Administrator';

  return (
    <div className="app">
      {user && <NavBar user={user} setUser={setUser} />}
      <div className="content">
        <Routes>
          <Route path="/login" element={<Login setUser={setUser} />} />
          <Route path="/register" element={<Register />} />
          <Route path="/" element={
            <ProtectedRoute user={user}>
              <Dashboard user={user} />
            </ProtectedRoute>
          } />
          <Route path="/profile" element={
            <ProtectedRoute user={user}>
              <Profile user={user} />
            </ProtectedRoute>
          } />
          {/* Admin routes */}
          <Route path="/admin/users" element={
            <ProtectedRoute user={user} requiredRole="Admin">
              <AdminUsers user={user} />
            </ProtectedRoute>
          } />
        </Routes>
      </div>
    </div>
  );
};

export default App; 