import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { WorkspaceShell } from '../components/layout/WorkspaceShell';
import { PageModeBadge } from '../components/ui/PageModeBadge';
import { RoleBadge } from '../components/ui/RoleBadge';
import { StatusBadge } from '../components/ui/StatusBadge';
import { DASHBOARD_RETURN_CONTEXT } from '../features/demo/demoWalkthrough';
import {
  clearAuthSession,
  readStoredAuthUser,
} from '../features/auth/authSession';
import { WorkspaceSwitcher } from '../features/navigation/WorkspaceSwitcher';
import { buildWorkspaceAccountMenu } from '../features/navigation/workspaceAccountMenu';
import {
  buildWorkspaceChildState,
  resolveWorkspaceReturnContext,
  REVIEWER_QUEUE_RETURN_CONTEXT,
} from '../features/navigation/workspaceNavigation';
import {
  getApplicantReviewerWorkspaces,
  writeStoredWorkspace,
} from '../features/navigation/workspaces';
import { reviewProvider } from '../features/review/reviewProvider';
import type { ReviewerQueueItem } from '../features/review/types';
import './Review.css';

export const routePath = '/reviewer';

export default function ReviewerAssignmentsPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [items, setItems] = useState<ReviewerQueueItem[] | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const returnContext = resolveWorkspaceReturnContext(
    location.state,
    location.pathname,
    DASHBOARD_RETURN_CONTEXT
  );
  const detailState = buildWorkspaceChildState(REVIEWER_QUEUE_RETURN_CONTEXT, returnContext);
  const applicantReviewerWorkspaces = getApplicantReviewerWorkspaces(
    readStoredAuthUser()?.available_workspaces
  );
  const accountMenu = buildWorkspaceAccountMenu({
    role: 'reviewer',
    onLogout: () => {
      clearAuthSession();
      navigate('/portal');
    },
  });

  useEffect(() => {
    let active = true;
    writeStoredWorkspace('reviewer');

    reviewProvider
      .listReviewerAssignments()
      .then((value) => {
        if (active) {
          setItems(value);
        }
      })
      .catch((error) => {
        if (active) {
          setErrorMessage(error instanceof Error ? error.message : 'We could not load reviewer assignments.');
        }
      });

    return () => {
      active = false;
    };
  }, []);

  if (items === null) {
    return <div className="review-page">{errorMessage ?? 'Loading reviewer queue...'}</div>;
  }

  return (
    <WorkspaceShell
      eyebrow="Reviewer workspace"
      title="Reviewer queue"
      description="Assigned tasks only. Conflict-flagged tasks remain visible but blocked from submission."
      badges={
        <>
          <RoleBadge role="reviewer" />
          <PageModeBadge mode="real-aligned" />
          <StatusBadge tone="info">Task queue</StatusBadge>
        </>
      }
      actions={
        <>
          <Link
            to={returnContext.to}
            state={returnContext.state}
            className="my-applications__section-link"
          >
            {returnContext.label}
          </Link>
          <Link to="/portal" className="my-applications__section-link">
            Back to portal
          </Link>
        </>
      }
      accountMenu={accountMenu}
      workspaceSwitcher={
        applicantReviewerWorkspaces.length > 1 ? (
          <WorkspaceSwitcher
            currentWorkspace="reviewer"
            availableWorkspaces={applicantReviewerWorkspaces}
          />
        ) : undefined
      }
    >
      <div className="review-page">
        {items.length === 0 ? (
          <div className="review-inline-message">No reviewer assignments yet.</div>
        ) : (
          <div className="review-list">
            {items.map((item) => (
              <article key={item.assignmentId} className="surface-card review-card">
                <div className="review-card__header">
                  <div>
                    <p className="conference-eyebrow">Reviewer task</p>
                    <h2>{item.sourceTitle}</h2>
                  </div>
                  <StatusBadge tone={item.conflictState === 'flagged' ? 'danger' : 'info'}>
                    Assignment status: {item.status}
                  </StatusBadge>
                </div>

                <div className="review-card__meta">
                  <p>Applicant: {item.applicantName}</p>
                  <p>Conflict state: {item.conflictState}</p>
                  <p>Review due: {item.dueAt ?? 'not set'}</p>
                </div>

                <div className="conference-form-actions">
                  <Link
                    className="conference-primary-link"
                    to={`/reviewer/assignments/${item.assignmentId}`}
                    state={detailState}
                  >
                    Open assignment
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </WorkspaceShell>
  );
}
