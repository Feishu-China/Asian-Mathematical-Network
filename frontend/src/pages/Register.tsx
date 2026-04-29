import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { register } from '../api/auth';
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
import { UserPlus, Mail, Lock, User } from 'lucide-react';
import './Auth.css';

export default function Register() {
  const navigate = useNavigate();
  const location = useLocation();
  const returnTo = readReturnTo(location.state);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await register({ email, password, fullName });
      writeAuthToken(data.accessToken);
      writeStoredAuthUser(data.user);

      if (!hasExplicitReturnTo(location.state)) {
        writeStoredWorkspace(resolvePostAuthWorkspace(data.user.available_workspaces, 'applicant'));
      }

      navigate(
        resolvePostAuthDestination(location.state, data.user.available_workspaces, 'applicant')
      );
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <UserPlus size={40} className="auth-icon" />
          <h2>Create Account</h2>
          <p>Join the Asiamath Network</p>
        </div>
        
        {error && <div className="auth-error">{error}</div>}
        
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="input-group">
            <User className="input-icon" size={18} />
            <input 
              type="text" 
              placeholder="Full Name" 
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
          </div>

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
            {loading ? 'Creating account...' : 'Sign Up'}
          </button>
        </form>
        
        <div className="auth-footer">
          Already have an account? <Link to="/login" state={toReturnToState(returnTo)}>Sign in</Link>
        </div>
      </div>
    </div>
  );
}
