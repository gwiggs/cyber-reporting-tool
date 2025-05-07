import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { register, getRoles } from '../services/authService';

interface RegisterFormData {
  employee_id: string;
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  confirmPassword: string;
  primary_role_id: number;
  organisation_id: number;
  department_id?: number;
}

interface Role {
  id: number;
  name: string;
  description?: string;
}

const Register = () => {
  const [formData, setFormData] = useState<RegisterFormData>({
    employee_id: '',
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    confirmPassword: '',
    primary_role_id: 0,
    organisation_id: 1 // Default organisation
  });
  
  const [roles, setRoles] = useState<Role[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiDebug, setApiDebug] = useState<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchRoles = async () => {
      try {
        setLoading(true);
        console.log('Fetching roles...');
        const rolesData = await getRoles();
        console.log('Roles data:', rolesData);
        setRoles(rolesData);
        // For debugging
        setApiDebug({ success: true, data: rolesData });
      } catch (error) {
        console.error('Error fetching roles:', error);
        setError('Failed to load roles');
        // For debugging
        setApiDebug({ success: false, error: error instanceof Error ? error.message : String(error) });
      } finally {
        setLoading(false);
      }
    };

    fetchRoles();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // Convert numeric fields to numbers
    if (name === 'primary_role_id' || name === 'organisation_id' || name === 'department_id') {
      setFormData(prev => ({ 
        ...prev, 
        [name]: value ? parseInt(value, 10) : 0
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const validate = () => {
    // Check if passwords match
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }

    // Check if role is selected
    if (!formData.primary_role_id) {
      setError('Please select a role');
      return false;
    }

    // Validate password
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_\-+=<>?])[A-Za-z\d!@#$%^&*()_\-+=<>?]{8,}$/;
    if (!passwordRegex.test(formData.password)) {
      setError('Password must be at least 8 characters long and include at least one uppercase letter, one lowercase letter, one number, and one special character (!@#$%^&*()_-+=<>?)');
      return false;
    }

    return true;
  };

  const testEndpoint = async () => {
    try {
      setError(null);
      setLoading(true);
      
      // Try to directly fetch the roles endpoint
      const response = await fetch('http://localhost:5000/api/roles/public');
      const data = await response.json();
      
      console.log('Direct fetch result:', data);
      setApiDebug({
        directFetch: true,
        endpoint: 'http://localhost:5000/api/roles/public',
        status: response.status,
        data: data
      });
      
      // If successful, set the roles
      if (data.success && data.roles) {
        setRoles(data.roles);
      }
    } catch (error) {
      console.error('Direct fetch error:', error);
      setError('Direct API fetch failed: ' + (error instanceof Error ? error.message : String(error)));
      setApiDebug({
        directFetch: true,
        endpoint: 'http://localhost:5000/api/roles/public',
        error: error instanceof Error ? error.message : String(error)
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Reset error
    setError(null);
    
    // Validate form
    if (!validate()) {
      return;
    }

    try {
      setIsSubmitting(true);
      
      // Remove confirmPassword before submitting
      const { confirmPassword, ...registerData } = formData;
      
      await register(registerData);
      navigate('/login', { state: { message: 'Registration successful. Please log in.' } });
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('Registration failed');
      }
      console.error('Registration error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading roles...</div>;
  }

  return (
    <div className="register-container">
      <div className="register-form-container">
        <h1 className="register-title">Create Account</h1>
        
        {error && (
          <div className="error-message">
            {error}
          </div>
        )}
        
        {/* Debug info */}
        {apiDebug && (
          <div className="debug-info" style={{ background: '#f8f9fa', padding: '10px', marginBottom: '15px', border: '1px solid #ddd' }}>
            <h4>API Debug Info:</h4>
            <pre>{JSON.stringify(apiDebug, null, 2)}</pre>
            <button 
              type="button" 
              onClick={testEndpoint} 
              style={{ marginTop: '10px', background: '#6c757d', color: 'white' }}
            >
              Test Direct API
            </button>
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="register-form">
          <div className="form-group">
            <label htmlFor="employee_id">Employee ID</label>
            <input
              type="text"
              id="employee_id"
              name="employee_id"
              value={formData.employee_id}
              onChange={handleChange}
              required
              autoFocus
            />
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="first_name">First Name</label>
              <input
                type="text"
                id="first_name"
                name="first_name"
                value={formData.first_name}
                onChange={handleChange}
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="last_name">Last Name</label>
              <input
                type="text"
                id="last_name"
                name="last_name"
                value={formData.last_name}
                onChange={handleChange}
                required
              />
            </div>
          </div>
          
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="primary_role_id">Role</label>
            <select
              id="primary_role_id"
              name="primary_role_id"
              value={formData.primary_role_id || ''}
              onChange={handleChange}
              required
            >
              <option value="">Select a role</option>
              {roles.map(role => (
                <option key={role.id} value={role.id}>
                  {role.name} {role.description ? `- ${role.description}` : ''}
                </option>
              ))}
            </select>
          </div>
          
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              placeholder="Min 8 chars, with uppercase, lowercase, number & special char"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
            />
          </div>
          
          <button 
            type="submit" 
            className="register-button"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Creating Account...' : 'Register'}
          </button>
          
          <div className="register-footer">
            Already have an account? <Link to="/login">Login</Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Register; 