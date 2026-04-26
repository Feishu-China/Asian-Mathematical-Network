import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LogOut, User } from 'lucide-react';
import { WorkspaceShell } from '../components/layout/WorkspaceShell';
import { PageModeBadge } from '../components/ui/PageModeBadge';
import { RoleBadge } from '../components/ui/RoleBadge';
import { StatusBadge } from '../components/ui/StatusBadge';
import { getMe } from '../api/auth';
import { dashboardProvider } from '../features/dashboard/dashboardProvider';
import type { MyApplication, ViewerStatus } from '../features/dashboard/types';
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

const VIEWER_STATUS_LABELS: Record<ViewerStatus, string> = {
  draft: 'in draft',
  under_review: 'under review',
  result_released: 'released',
};

const summarizeApplications = (apps: MyApplication[]): string[] => {
  const counts: Record<ViewerStatus, number> = {
    draft: 0,
    under_review: 0,
    result_released: 0,
  };

  for (const app of apps) {
    counts[app.viewerStatus] += 1;
  }

  return (Object.entries(counts) as Array<[ViewerStatus, number]>)
    .filter(([, count]) => count > 0)
    .map(([status, count]) => `${count} ${VIEWER_STATUS_LABELS[status]}`);
};

export default function Dashboard() {
  const navigate = useNavigate();
  const [userData, setUserData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [applications, setApplications] = useState<MyApplication[] | null>(null);
  const [applicationsError, setApplicationsError] = useState(false);

  useEffect(() => {
    let active = true;

    const fetchMe = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }
      try {
        const data = await getMe(token);
        if (active) {
          setUserData(data);
        }
      } catch {
        localStorage.removeItem('token');
        navigate('/login');
        return;
      } finally {
        if (active) {
          setLoading(false);
        }
      }

      try {
        const apps = await dashboardProvider.listMyApplications();
        if (active) {
          setApplications(apps);
        }
      } catch {
        if (active) {
          setApplicationsError(true);
          setApplications([]);
        }
      }
    };

    fetchMe();

    return () => {
      active = false;
    };
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  if (loading) {
    return <div className="loading">Loading dashboard...</div>;
  }

  const summary = applications ? summarizeApplications(applications) : null;

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
            <h3>My applications</h3>
            {applicationsError ? (
              <p>We could not load your applications right now.</p>
            ) : applications === null ? (
              <p>Loading your applications...</p>
            ) : applications.length === 0 ? (
              <p>You have not started any applications yet.</p>
            ) : (
              <>
                <p>
                  You have {applications.length}{' '}
                  {applications.length === 1 ? 'application' : 'applications'}
                  {summary && summary.length > 0 ? ` — ${summary.join(', ')}` : null}.
                </p>
              </>
            )}
            <p>
              <Link to="/me/applications" className="my-applications__section-link">
                View all
              </Link>
            </p>
          </div>
          <div className="dashboard-widget">
            <h3>Upcoming Conferences</h3>
            <p>Explore latest mathematical conferences in Asia.</p>
            <p>
              <Link to="/conferences" className="my-applications__section-link">
                Browse conferences
              </Link>
            </p>
          </div>
        </div>
      </div>
    </WorkspaceShell>
  );
}
