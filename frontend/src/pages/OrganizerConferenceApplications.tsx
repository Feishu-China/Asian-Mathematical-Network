import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { WorkspaceShell } from '../components/layout/WorkspaceShell';
import { PageModeBadge } from '../components/ui/PageModeBadge';
import { RoleBadge } from '../components/ui/RoleBadge';
import { StatusBadge } from '../components/ui/StatusBadge';
import { clearAuthSession } from '../features/auth/authSession';
import { DASHBOARD_RETURN_CONTEXT } from '../features/demo/demoWalkthrough';
import { buildWorkspaceAccountMenu } from '../features/navigation/workspaceAccountMenu';
import {
  buildOrganizerQueueReturnContext,
  buildWorkspaceChildState,
  resolveWorkspaceReturnContext,
} from '../features/navigation/workspaceNavigation';
import { reviewProvider } from '../features/review/reviewProvider';
import type { OrganizerApplicationListItem } from '../features/review/types';
import './Review.css';

export const routePath = '/organizer/conferences/:id/applications';

export default function OrganizerConferenceApplications() {
  const { id = '' } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [items, setItems] = useState<OrganizerApplicationListItem[] | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const returnContext = resolveWorkspaceReturnContext(
    location.state,
    location.pathname,
    DASHBOARD_RETURN_CONTEXT
  );
  const detailState = buildWorkspaceChildState(
    buildOrganizerQueueReturnContext(id),
    returnContext
  );
  const accountMenu = buildWorkspaceAccountMenu({
    role: 'organizer',
    primaryConferenceId: id,
    onLogout: () => {
      clearAuthSession();
      navigate('/portal');
    },
  });

  useEffect(() => {
    let active = true;

    setErrorMessage(null);
    setItems(null);

    reviewProvider
      .listOrganizerConferenceApplications(id)
      .then((value) => {
        if (active) {
          setItems(value);
        }
      })
      .catch((error) => {
        if (active) {
          setErrorMessage(error instanceof Error ? error.message : 'We could not load the organizer queue.');
        }
      });

    return () => {
      active = false;
    };
  }, [id]);

  if (items === null) {
    return <div className="review-page">{errorMessage ?? 'Loading organizer queue...'}</div>;
  }

  return (
    <WorkspaceShell
      eyebrow="Organizer workspace"
      title="Conference applications"
      description="Organizer queue for reviewer assignment, internal decisions, and release control."
      badges={
        <>
          <RoleBadge role="organizer" />
          <PageModeBadge mode="real-aligned" />
          <StatusBadge tone="info">Review queue</StatusBadge>
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
    >
      <div className="review-page">
        {items.length === 0 ? (
          <div className="review-inline-message">No submitted applications are waiting in this conference queue.</div>
        ) : (
          <div className="review-list">
            {items.map((item) => (
              <article key={item.id} className="surface-card review-card">
                <div className="review-card__header">
                  <div>
                    <p className="conference-eyebrow">Conference application</p>
                    <h2>{item.applicantName}</h2>
                  </div>
                  <StatusBadge tone={item.decisionReleaseStatus === 'released' ? 'success' : 'warning'}>
                    Status: {item.status}
                  </StatusBadge>
                </div>

                <div className="review-card__meta">
                  <p>Participation type: {item.participationType ?? 'not set'}</p>
                  <p>Submitted at: {item.submittedAt ?? 'not submitted'}</p>
                  <p>Review assignment count: {item.reviewAssignmentCount}</p>
                  <p>Completed review count: {item.completedReviewCount}</p>
                  <p>Decision release: {item.decisionReleaseStatus ?? 'not started'}</p>
                </div>

                <div className="conference-form-actions">
                  <Link
                    className="conference-primary-link"
                    to={`/organizer/applications/${item.id}`}
                    state={detailState}
                  >
                    Open application
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
