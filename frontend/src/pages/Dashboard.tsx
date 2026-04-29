import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { User } from 'lucide-react';
import { WorkspaceShell } from '../components/layout/WorkspaceShell';
import { PageModeBadge } from '../components/ui/PageModeBadge';
import { RoleBadge } from '../components/ui/RoleBadge';
import { StatusBadge } from '../components/ui/StatusBadge';
import { getMe, type AuthUser } from '../api/auth';
import { dashboardProvider } from '../features/dashboard/dashboardProvider';
import { DemoStatePanel } from '../features/demo/DemoStatePanel';
import { clearAuthSession, readAuthToken, writeStoredAuthUser } from '../features/auth/authSession';
import {
  buildChainedReturnState,
  DASHBOARD_RETURN_CONTEXT,
  MY_APPLICATIONS_RETURN_CONTEXT,
  OPPORTUNITIES_RETURN_CONTEXT,
} from '../features/demo/demoWalkthrough';
import type { MyApplication, ViewerStatus } from '../features/dashboard/types';
import { toReturnToState } from '../features/navigation/authReturn';
import { WorkspaceSwitcher } from '../features/navigation/WorkspaceSwitcher';
import type { ReturnContextState } from '../features/navigation/returnContext';
import { buildWorkspaceAccountMenu } from '../features/navigation/workspaceAccountMenu';
import { toWorkspaceEntryState } from '../features/navigation/workspaceNavigation';
import {
  getApplicantReviewerWorkspaces,
  writeStoredWorkspace,
} from '../features/navigation/workspaces';
import './Dashboard.css';

type WorkspaceRole = 'applicant' | 'reviewer' | 'organizer' | 'admin';

type DashboardData = {
  user?: AuthUser;
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

const WORKSPACE_COPY: Record<
  WorkspaceRole,
  {
    eyebrow: string;
    description: string;
    note: string;
  }
> = {
  applicant: {
    eyebrow: 'Applicant workspace',
    description:
      'A stable working surface for authenticated participation across the Asiamath network.',
    note: 'Your authenticated session is active on the current MVP path.',
  },
  reviewer: {
    eyebrow: 'Reviewer workspace',
    description:
      'A role-scoped landing surface for assigned reviews, conflict checks, and submission-only reviewer actions.',
    note: 'Your reviewer session is active. Assigned review work stays inside the reviewer queue.',
  },
  organizer: {
    eyebrow: 'Organizer workspace',
    description:
      'A role-scoped landing surface for conference queues, reviewer assignment, internal decisions, and release control.',
    note: 'Your organizer session is active. Queue and decision controls stay inside organizer workspace surfaces.',
  },
  admin: {
    eyebrow: 'Admin workspace',
    description:
      'A role-scoped landing surface for administrative oversight across the current Asiamath demo workflows.',
    note: 'Your administrative session is active on the current MVP path.',
  },
};

const isWorkspaceRole = (value: unknown): value is WorkspaceRole =>
  value === 'applicant' || value === 'reviewer' || value === 'organizer' || value === 'admin';

const readWorkspaceRole = (user: DashboardData['user'] | undefined): WorkspaceRole => {
  const role = user?.primary_role ?? user?.role;
  return isWorkspaceRole(role) ? role : 'applicant';
};

const readDashboardWorkspaceRole = (user: DashboardData['user'] | undefined): WorkspaceRole => {
  const applicantReviewerWorkspaces = getApplicantReviewerWorkspaces(
    user?.available_workspaces ?? user?.roles
  );

  if (applicantReviewerWorkspaces.length > 1) {
    return 'applicant';
  }

  return readWorkspaceRole(user);
};

const readPrimaryConferenceId = (user: DashboardData['user'] | undefined): string | null => {
  const conferenceId = user?.conference_staff_memberships?.find(
    (membership) => typeof membership?.conference_id === 'string' && membership.conference_id.length > 0
  )?.conference_id;

  return conferenceId ?? null;
};

const renderApplicantPanels = (
  latestApplication: MyApplication | null,
  applications: MyApplication[],
  hasApplicationHistory: boolean,
  applicationsError: boolean
) => {
  const applicationCountLabel =
    applications.length === 1
      ? '1 active application in your workspace.'
      : `${applications.length} active applications in your workspace.`;

  return (
    <>
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
          title={hasApplicationHistory ? 'No active applications right now' : 'No active applications yet'}
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
      <div className="dashboard-widget">
        <h3>Upcoming Conferences</h3>
        <p>Explore latest mathematical conferences in Asia.</p>
      </div>
    </>
  );
};

const renderReviewerPanels = (workspaceState: ReturnContextState | undefined) => (
  <>
    <Link
      to="/reviewer"
      state={workspaceState}
      className="dashboard-widget dashboard-widget--link-card"
      aria-label="Open reviewer queue"
    >
      <h3>Reviewer queue</h3>
      <p className="dashboard-widget__summary">
        Open only your assigned review tasks and keep conflict-flagged work blocked from submission.
      </p>
      <span className="dashboard-widget__card-cta">Open reviewer queue</span>
    </Link>
    <div className="dashboard-widget">
      <h3>Review scope</h3>
      <p>
        Reviewer workspace surfaces stay limited to assigned materials, conflict state, due dates,
        and the review submission action.
      </p>
    </div>
  </>
);

const renderOrganizerPanels = (
  primaryConferenceId: string | null,
  workspaceState: ReturnContextState | undefined
) => {
  const workspaceHref = primaryConferenceId
    ? `/organizer/conferences/${primaryConferenceId}/applications`
    : '/organizer/conferences/new';
  const workspaceLabel = primaryConferenceId
    ? 'Open conference workspace'
    : 'Create organizer conference';

  return (
    <>
      <Link
        to={workspaceHref}
        state={workspaceState}
        className="dashboard-widget dashboard-widget--link-card"
        aria-label={workspaceLabel}
      >
        <h3>Conference workspace</h3>
        <p className="dashboard-widget__summary">
          Enter reviewer assignment, internal decision, and release-control surfaces without falling
          back to applicant-only content.
        </p>
        <span className="dashboard-widget__card-cta">{workspaceLabel}</span>
      </Link>
      <div className="dashboard-widget">
        <h3>Decision controls</h3>
        <p>
          Organizer surfaces keep reviewer assignment, internal recommendation review, and
          applicant-visible release as separate steps.
        </p>
      </div>
    </>
  );
};

const renderAdminPanels = () => (
  <>
    <div className="dashboard-widget">
      <h3>Administrative overview</h3>
      <p className="dashboard-widget__summary">
        This account can move across current MVP surfaces without being forced into applicant-only
        workspace assumptions.
      </p>
      <Link to="/portal" className="dashboard-widget__link">
        Return to portal
      </Link>
    </div>
    <div className="dashboard-widget">
      <h3>Current scope</h3>
      <p>Admin-specific workflow surfaces are not part of the current demo slice.</p>
    </div>
  </>
);

const renderRolePanels = (
  role: WorkspaceRole,
  latestApplication: MyApplication | null,
  applications: MyApplication[],
  hasApplicationHistory: boolean,
  applicationsError: boolean,
  primaryConferenceId: string | null,
  workspaceState: ReturnContextState | undefined
) => {
  if (role === 'reviewer') {
    return renderReviewerPanels(workspaceState);
  }

  if (role === 'organizer') {
    return renderOrganizerPanels(primaryConferenceId, workspaceState);
  }

  if (role === 'admin') {
    return renderAdminPanels();
  }

  return renderApplicantPanels(
    latestApplication,
    applications,
    hasApplicationHistory,
    applicationsError
  );
};

const isActiveApplication = (application: MyApplication): boolean =>
  application.viewerStatus === 'draft' || application.viewerStatus === 'under_review';

export default function Dashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const [userData, setUserData] = useState<DashboardData | null>(null);
  const [applications, setApplications] = useState<MyApplication[]>([]);
  const [applicationsError, setApplicationsError] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const fetchMe = async () => {
      const token = readAuthToken();
      if (!token) {
        navigate('/login', { state: toReturnToState(location.pathname) });
        return;
      }

      try {
        const meResult = await getMe(token);

        if (!active) {
          return;
        }

        writeStoredAuthUser(meResult.user);
        setUserData(meResult);
        const role = readDashboardWorkspaceRole(meResult.user);

        if (role === 'applicant') {
          try {
            const nextApplications = await dashboardProvider.listMyApplications();

            if (active) {
              setApplications(nextApplications);
              setApplicationsError(false);
            }
          } catch {
            if (active) {
              setApplications([]);
              setApplicationsError(true);
            }
          }
        } else if (active) {
          setApplications([]);
          setApplicationsError(false);
        }
      } catch {
        if (active) {
          clearAuthSession();
          navigate('/login', { state: toReturnToState(location.pathname) });
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    void fetchMe();

    return () => {
      active = false;
    };
  }, [location.pathname, navigate]);

  const workspaceRole = readDashboardWorkspaceRole(userData?.user);
  const workspaceCopy = WORKSPACE_COPY[workspaceRole];
  const activeApplications = applications.filter(isActiveApplication);
  const latestApplication = activeApplications[0] ?? null;
  const hasApplicationHistory = applications.length > 0;
  const primaryConferenceId = readPrimaryConferenceId(userData?.user);
  const workspaceEntryState = toWorkspaceEntryState(DASHBOARD_RETURN_CONTEXT);
  const applicantReviewerWorkspaces = getApplicantReviewerWorkspaces(
    userData?.user?.available_workspaces ?? userData?.user?.roles
  );
  const accountMenu = buildWorkspaceAccountMenu({
    role: workspaceRole,
    primaryConferenceId,
    onLogout: () => {
      clearAuthSession();
      navigate('/portal');
    },
  });

  useEffect(() => {
    if (!loading) {
      writeStoredWorkspace(workspaceRole);
    }
  }, [loading, workspaceRole]);

  if (loading) {
    return (
      <WorkspaceShell
        eyebrow="Authenticated workspace"
        title="Dashboard"
        description="Preparing the authenticated workspace for the current account role."
        badges={
          <>
            <PageModeBadge mode="real-aligned" />
            <StatusBadge tone="info">Loading</StatusBadge>
          </>
        }
        accountMenu={accountMenu}
        workspaceSwitcher={
          applicantReviewerWorkspaces.length > 1 ? (
            <WorkspaceSwitcher
              currentWorkspace="applicant"
              availableWorkspaces={applicantReviewerWorkspaces}
            />
          ) : undefined
        }
      >
        <div className="dashboard-page">
          <DemoStatePanel
            className="dashboard-widget"
            badgeLabel="Loading"
            title="Loading dashboard"
            description="Preparing the authenticated workspace used in the demo."
            tone="info"
          />
        </div>
      </WorkspaceShell>
    );
  }

  return (
    <WorkspaceShell
      eyebrow={workspaceCopy.eyebrow}
      title="Dashboard"
      description={workspaceCopy.description}
      badges={
        <>
          <RoleBadge role={workspaceRole} />
          <PageModeBadge mode="real-aligned" />
          <StatusBadge tone="success">{userData?.user?.status || 'active'}</StatusBadge>
        </>
      }
      actions={
        <>
          <Link to="/portal" className="dashboard-shell-link dashboard-shell-link--secondary">
            Back to portal
          </Link>
          {workspaceRole === 'applicant' ? (
            <Link
              to="/opportunities"
              state={buildChainedReturnState(OPPORTUNITIES_RETURN_CONTEXT, DASHBOARD_RETURN_CONTEXT)}
              className="dashboard-shell-link"
            >
              Browse opportunities
            </Link>
          ) : null}
        </>
      }
      workspaceSwitcher={
        applicantReviewerWorkspaces.length > 1 ? (
          <WorkspaceSwitcher
            currentWorkspace="applicant"
            availableWorkspaces={applicantReviewerWorkspaces}
          />
        ) : undefined
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
            <p className="dashboard-note">{workspaceCopy.note}</p>
          </div>
        </div>

        <div className="dashboard-grid">
          {renderRolePanels(
            workspaceRole,
            latestApplication,
            activeApplications,
            hasApplicationHistory,
            applicationsError,
            primaryConferenceId,
            workspaceEntryState
          )}
        </div>
      </div>
    </WorkspaceShell>
  );
}
