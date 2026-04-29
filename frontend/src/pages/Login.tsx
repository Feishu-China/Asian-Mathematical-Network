import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { login } from '../api/auth';
import {
  hasExplicitReturnTo,
  readReturnTo,
  resolvePostAuthDestination,
  resolvePostAuthWorkspace,
  toReturnToState,
} from '../features/navigation/authReturn';
import {
  writeAuthToken,
  writeStoredAuthUser,
} from '../features/auth/authSession';
import { writeStoredWorkspace } from '../features/navigation/workspaces';
import { LogIn, Mail, Lock } from 'lucide-react';
import './Auth.css'; // Add basic styling

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const returnTo = readReturnTo(location.state);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await login({ email, password });
      const availableWorkspaces = data.user.available_workspaces ?? data.user.roles;
      writeAuthToken(data.accessToken);
      writeStoredAuthUser(data.user);

      if (!hasExplicitReturnTo(location.state)) {
        writeStoredWorkspace(resolvePostAuthWorkspace(availableWorkspaces));
      }

      navigate(resolvePostAuthDestination(location.state, availableWorkspaces));
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <LogIn size={40} className="auth-icon" />
          <h2>Welcome Back</h2>
          <p>Sign in to your Asiamath account</p>
        </div>
        
        {error && <div className="auth-error">{error}</div>}
        
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="input-group">
            <Mail className="input-icon" size={18} />
            <input 
              type="email" 
              placeholder="Email Address" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          
          <div className="input-group">
            <Lock className="input-icon" size={18} />
            <input 
              type="password" 
              placeholder="Password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          
          <button type="submit" className="auth-button" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
        
        <div className="auth-footer">
          Don't have an account? <Link to="/register" state={toReturnToState(returnTo)}>Sign up</Link>
        </div>
      </div>
    </div>
  );
}
