import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { User } from 'lucide-react';
import { WorkspaceShell } from '../components/layout/WorkspaceShell';
import { PageModeBadge } from '../components/ui/PageModeBadge';
import { RoleBadge } from '../components/ui/RoleBadge';
import { StatusBadge } from '../components/ui/StatusBadge';
import { getMe } from '../api/auth';
import { dashboardProvider } from '../features/dashboard/dashboardProvider';
import { DemoStatePanel } from '../features/demo/DemoStatePanel';
import type { MyApplication, ViewerStatus } from '../features/dashboard/types';
import { DemoShortcutPanel } from '../features/demo/DemoShortcutPanel';
import {
  buildChainedReturnState,
  DASHBOARD_RETURN_CONTEXT,
  demoWalkthroughCopy,
  MY_APPLICATIONS_RETURN_CONTEXT,
} from '../features/demo/demoWalkthrough';
import { toReturnToState } from '../features/navigation/authReturn';
import { buildWorkspaceAccountMenu } from '../features/navigation/workspaceAccountMenu';
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
  const location = useLocation();
  const [userData, setUserData] = useState<DashboardData | null>(null);
  const [applications, setApplications] = useState<MyApplication[]>([]);
  const [applicationsError, setApplicationsError] = useState(false);
  const [loading, setLoading] = useState(true);
  const accountMenu = buildWorkspaceAccountMenu(() => {
    localStorage.removeItem('token');
    navigate('/portal');
  });

  useEffect(() => {
    const fetchMe = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login', { state: toReturnToState(location.pathname) });
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
        navigate('/login', { state: toReturnToState(location.pathname) });
      } finally {
        setLoading(false);
      }
    };
    fetchMe();
  }, [location.pathname, navigate]);

  const latestApplication = applications[0] ?? null;
  const applicationCountLabel =
    applications.length === 1
      ? '1 active application in your workspace.'
      : `${applications.length} active applications in your workspace.`;

  if (loading) {
    return (
      <WorkspaceShell
        eyebrow="Applicant workspace"
        title="Dashboard"
        description="A stable working surface for authenticated participation across the Asiamath network."
        badges={
          <>
            <RoleBadge role="applicant" />
            <PageModeBadge mode="real-aligned" />
            <StatusBadge tone="info">Loading</StatusBadge>
          </>
        }
        accountMenu={accountMenu}
      >
        <div className="dashboard-page">
          <DemoStatePanel
            className="dashboard-widget"
            badgeLabel="Loading"
            title="Loading dashboard"
            description="Preparing the authenticated applicant workspace used in the demo."
            tone="info"
          />
        </div>
      </WorkspaceShell>
    );
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
      accountMenu={accountMenu}
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
          {latestApplication ? (
            <div className="dashboard-widget">
              <h3>My Applications</h3>
              <p className="dashboard-widget__summary">{applicationCountLabel}</p>
              <div className="dashboard-widget__record">
                <p className="dashboard-widget__record-title">
                  {latestApplication.sourceTitle ?? 'Application record'}
                </p>
                <StatusBadge tone={VIEWER_STATUS_TONES[latestApplication.viewerStatus]}>
                  {VIEWER_STATUS_LABELS[latestApplication.viewerStatus]}
                </StatusBadge>
              </div>
              <Link
                to="/me/applications"
                state={buildChainedReturnState(MY_APPLICATIONS_RETURN_CONTEXT, DASHBOARD_RETURN_CONTEXT)}
                className="dashboard-widget__link"
              >
                Open my applications
              </Link>
            </div>
          ) : applicationsError ? (
            <DemoStatePanel
              className="dashboard-widget"
              headingLevel="h3"
              badgeLabel="Error"
              title="Application workspace unavailable"
              description="We could not load your current application records right now."
              tone="danger"
              actions={
                <Link
                  to="/me/applications"
                  state={buildChainedReturnState(MY_APPLICATIONS_RETURN_CONTEXT, DASHBOARD_RETURN_CONTEXT)}
                  className="dashboard-widget__link"
                >
                  Open my applications
                </Link>
              }
            />
          ) : (
            <DemoStatePanel
              className="dashboard-widget"
              headingLevel="h3"
              badgeLabel="Empty"
              title="No active applications yet"
              description="Open your application workspace to review records or start a submission."
              tone="neutral"
              actions={
                <Link
                  to="/me/applications"
                  state={buildChainedReturnState(MY_APPLICATIONS_RETURN_CONTEXT, DASHBOARD_RETURN_CONTEXT)}
                  className="dashboard-widget__link"
                >
                  Open my applications
                </Link>
              }
            />
          )}
          <DemoShortcutPanel
            className="dashboard-widget"
            headingLevel="h3"
            title={demoWalkthroughCopy.dashboard.title}
            intro={demoWalkthroughCopy.dashboard.intro}
            shortcuts={[
              {
                to: '/me/applications',
                state: buildChainedReturnState(MY_APPLICATIONS_RETURN_CONTEXT, DASHBOARD_RETURN_CONTEXT),
                label: 'Continue in My applications',
                description: 'Move into the seeded applicant record list without losing your dashboard return link.',
              },
              {
                to: '/portal',
                label: 'Restart from portal',
                description: 'Reset the demo story at the public entry if you need to replay the whole click path.',
              },
            ]}
          />
          <div className="dashboard-widget">
            <h3>Upcoming Conferences</h3>
            <p>Explore latest mathematical conferences in Asia.</p>
          </div>
        </div>
      </div>
    </WorkspaceShell>
  );
}
