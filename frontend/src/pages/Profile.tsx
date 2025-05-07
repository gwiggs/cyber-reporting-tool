import { useState, useEffect } from 'react';
import { User, Session } from '../types';
import { getUserSessions, invalidateSession, invalidateAllSessions } from '../services/authService';

interface ProfileProps {
  user: User | null;
}

const Profile = ({ user }: ProfileProps) => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const fetchSessions = async () => {
    try {
      setLoading(true);
      setError(null);
      const sessionsData = await getUserSessions();
      setSessions(sessionsData);
    } catch (error) {
      setError('Failed to load sessions. Server may be unavailable.');
      console.error('Error fetching sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  // Attempt to retry loading if there was an error
  useEffect(() => {
    if (error && retryCount < 3) {
      const timer = setTimeout(() => {
        setRetryCount(prevCount => prevCount + 1);
        fetchSessions();
      }, 3000); // Retry after 3 seconds
      
      return () => clearTimeout(timer);
    }
  }, [error, retryCount]);

  const handleRetry = () => {
    setRetryCount(0);
    fetchSessions();
  };

  const handleInvalidateSession = async (sessionId: string) => {
    try {
      setError(null);
      const success = await invalidateSession(sessionId);
      if (success) {
        // Refresh sessions
        fetchSessions();
      } else {
        setError('Failed to invalidate session. Please try again.');
      }
    } catch (error) {
      setError('An error occurred while invalidating the session.');
      console.error('Error invalidating session:', error);
    }
  };

  const handleInvalidateAll = async () => {
    try {
      setError(null);
      const success = await invalidateAllSessions();
      if (success) {
        // Refresh sessions
        fetchSessions();
      } else {
        setError('Failed to invalidate all sessions. Please try again.');
      }
    } catch (error) {
      setError('An error occurred while invalidating all sessions.');
      console.error('Error invalidating all sessions:', error);
    }
  };

  if (!user) {
    return <div className="error">User not found</div>;
  }

  return (
    <div className="profile-page">
      <h1>Profile</h1>
      
      <div className="profile-section">
        <h2>User Information</h2>
        <div className="profile-info">
          <div className="info-item">
            <span className="label">Name:</span>
            <span className="value">{user.first_name} {user.last_name}</span>
          </div>
          <div className="info-item">
            <span className="label">Email:</span>
            <span className="value">{user.email}</span>
          </div>
          <div className="info-item">
            <span className="label">Employee ID:</span>
            <span className="value">{user.employee_id}</span>
          </div>
          <div className="info-item">
            <span className="label">Role:</span>
            <span className="value">{user.role}</span>
          </div>
        </div>
      </div>
      
      <div className="profile-section">
        <h2>Active Sessions</h2>
        
        {error && (
          <div className="error-message">
            {error}
            <button onClick={handleRetry} className="retry-button">
              Retry
            </button>
          </div>
        )}
        
        {loading ? (
          <div className="loading">Loading sessions...</div>
        ) : (
          <>
            <div className="session-actions">
              <button onClick={handleInvalidateAll} className="danger-button" disabled={sessions.length === 0}>
                Invalidate All Other Sessions
              </button>
            </div>
            
            {sessions.length === 0 ? (
              <p>{error ? 'Unable to load sessions.' : 'No active sessions found.'}</p>
            ) : (
              <div className="sessions-list">
                {sessions.map(session => (
                  <div key={session.id} className="session-item">
                    <div className="session-info">
                      <div>
                        <strong>IP Address:</strong> {session.ip_address || 'Unknown'}
                      </div>
                      <div>
                        <strong>User Agent:</strong> {session.user_agent || 'Unknown'}
                      </div>
                      <div>
                        <strong>Created:</strong> {new Date(session.created_at).toLocaleString()}
                      </div>
                      <div>
                        <strong>Expires:</strong> {new Date(session.expires_at).toLocaleString()}
                      </div>
                    </div>
                    <div className="session-actions">
                      <button 
                        onClick={() => handleInvalidateSession(session.id)}
                        className="small-button danger-button"
                      >
                        Invalidate
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Profile; 