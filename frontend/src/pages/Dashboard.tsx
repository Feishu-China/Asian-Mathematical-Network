import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMe } from '../api/auth';
import { LayoutDashboard, LogOut, User } from 'lucide-react';
import './Dashboard.css';

export default function Dashboard() {
  const navigate = useNavigate();
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMe = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }
      try {
        const data = await getMe(token);
        setUserData(data);
      } catch (err) {
        localStorage.removeItem('token');
        navigate('/login');
      } finally {
        setLoading(false);
      }
    };
    fetchMe();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  if (loading) {
    return <div className="loading">Loading dashboard...</div>;
  }

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div className="logo">
          <LayoutDashboard className="icon" />
          <span>Asiamath Portal</span>
        </div>
        <button className="logout-btn" onClick={handleLogout}>
          <LogOut size={18} />
          <span>Logout</span>
        </button>
      </header>

      <main className="dashboard-main">
        <div className="welcome-card">
          <div className="avatar">
            <User size={48} />
          </div>
          <div className="user-info">
            <h1>Welcome back!</h1>
            <p className="email">{userData?.user?.email || 'User'}</p>
            <div className="status-badge">{userData?.user?.status || 'active'}</div>
          </div>
        </div>

        <div className="dashboard-grid">
          <div className="dashboard-widget">
            <h3>My Applications</h3>
            <p>You have no pending applications.</p>
          </div>
          <div className="dashboard-widget">
            <h3>Upcoming Conferences</h3>
            <p>Explore latest mathematical conferences in Asia.</p>
          </div>
        </div>
      </main>
    </div>
  );
}