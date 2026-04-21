import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, User } from 'lucide-react';
import { WorkspaceShell } from '../components/layout/WorkspaceShell';
import { PageModeBadge } from '../components/ui/PageModeBadge';
import { RoleBadge } from '../components/ui/RoleBadge';
import { StatusBadge } from '../components/ui/StatusBadge';
import { getMe } from '../api/auth';
import './Dashboard.css';

type DashboardRole = 'visitor' | 'applicant' | 'reviewer' | 'organizer' | 'admin';

type DashboardData = {
  user?: {
    email?: string | null;
    status?: string | null;
    role?: string | null;
  };
};

const toRole = (role?: string | null): DashboardRole =>
  role === 'visitor' ||
  role === 'applicant' ||
  role === 'reviewer' ||
  role === 'organizer' ||
  role === 'admin'
    ? role
    : 'applicant';

export default function Dashboard() {
  const navigate = useNavigate();
  const [userData, setUserData] = useState<DashboardData | null>(null);
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
      } catch {
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
    <WorkspaceShell
      eyebrow="Applicant workspace"
      title="Dashboard"
      description="A stable working surface for authenticated participation across the Asiamath network."
      badges={
        <>
          <RoleBadge role={toRole(userData?.user?.role)} />
          <PageModeBadge mode="real-aligned" />
          <StatusBadge tone="success">{userData?.user?.status || 'active'}</StatusBadge>
        </>
      }
      actions={
        <button className="logout-btn" onClick={handleLogout}>
          <LogOut size={18} />
          <span>Logout</span>
        </button>
      }
    >
      <div className="dashboard-page">
        <div className="welcome-card">
          <div className="avatar">
            <User size={48} />
          </div>
          <div className="user-info">
            <h2>Welcome back</h2>
            <p className="email">{userData?.user?.email || 'User'}</p>
            <p className="dashboard-note">Your authenticated session is active on the current MVP path.</p>
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
      </div>
    </WorkspaceShell>
  );
}
