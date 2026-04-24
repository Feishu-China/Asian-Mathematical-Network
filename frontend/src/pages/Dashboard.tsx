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

type BadgeTone = 'neutral' | 'info' | 'success' | 'warning' | 'danger';

const VIEWER_STATUS_TONES: Record<ViewerStatus, BadgeTone> = {
  draft: 'neutral',
  under_review: 'warning',
  result_released: 'info',
};

const VIEWER_STATUS_LABELS: Record<ViewerStatus, string> = {
  draft: 'Draft',
  under_review: 'Under review',
  result_released: 'Result released',
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
  const [applications, setApplications] = useState<MyApplication[]>([]);
  const [applicationsError, setApplicationsError] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMe = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }
      try {
        const [meResult, applicationsResult] = await Promise.allSettled([
          getMe(token),
          dashboardProvider.listMyApplications(),
        ]);

        if (meResult.status === 'rejected') {
          throw meResult.reason;
        }

        setUserData(meResult.value);

        if (applicationsResult.status === 'fulfilled') {
          setApplications(applicationsResult.value);
          setApplicationsError(false);
        } else {
          setApplications([]);
          setApplicationsError(true);
        }
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

  const latestApplication = applications[0] ?? null;
  const applicationCountLabel =
    applications.length === 1
      ? '1 active application in your workspace.'
      : `${applications.length} active applications in your workspace.`;

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
            {latestApplication ? (
              <>
                <p className="dashboard-widget__summary">{applicationCountLabel}</p>
                <div className="dashboard-widget__record">
                  <p className="dashboard-widget__record-title">
                    {latestApplication.sourceTitle ?? 'Application record'}
                  </p>
                  <StatusBadge tone={VIEWER_STATUS_TONES[latestApplication.viewerStatus]}>
                    {VIEWER_STATUS_LABELS[latestApplication.viewerStatus]}
                  </StatusBadge>
                </div>
              </>
            ) : applicationsError ? (
              <p>Open your application workspace to reload your current records.</p>
            ) : (
              <p>Open your application workspace to review records or start a submission.</p>
            )}
            <Link to="/me/applications" className="dashboard-widget__link">
              Open my applications
            </Link>
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
