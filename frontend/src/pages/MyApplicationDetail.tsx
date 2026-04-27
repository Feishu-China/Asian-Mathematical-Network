import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { WorkspaceShell } from '../components/layout/WorkspaceShell';
import { PageModeBadge } from '../components/ui/PageModeBadge';
import { RoleBadge } from '../components/ui/RoleBadge';
import { StatusBadge } from '../components/ui/StatusBadge';
import { DemoStatePanel } from '../features/demo/DemoStatePanel';
import { DemoShortcutPanel } from '../features/demo/DemoShortcutPanel';
import { isUnauthorizedSessionError } from '../features/auth/sessionErrors';
import {
  DASHBOARD_RETURN_CONTEXT,
  demoWalkthroughCopy,
  PORTAL_RETURN_CONTEXT,
} from '../features/demo/demoWalkthrough';
import { toReturnToState } from '../features/navigation/authReturn';
import { readReturnContext } from '../features/navigation/returnContext';
import { buildWorkspaceAccountMenu } from '../features/navigation/workspaceAccountMenu';
import { reviewProvider } from '../features/review/reviewProvider';
import type {
  ApplicantApplicationDetail,
  DecisionFinalStatus,
  ViewerStatus,
} from '../features/review/types';
import './MyApplicationDetail.css';
import './Review.css';

export const routePath = '/me/applications/:id';

const VIEWER_STATUS_LABELS: Record<ViewerStatus, string> = {
  draft: 'Draft',
  under_review: 'Under review',
  result_released: 'Result released',
};

const VIEWER_STATUS_TONES: Record<ViewerStatus, 'neutral' | 'warning' | 'info'> = {
  draft: 'neutral',
  under_review: 'warning',
  result_released: 'info',
};

const FINAL_STATUS_TONES: Record<DecisionFinalStatus, 'success' | 'warning' | 'danger'> = {
  accepted: 'success',
  waitlisted: 'warning',
  rejected: 'danger',
};

const APPLICATION_TYPE_LABELS: Record<
  ApplicantApplicationDetail['applicationType'],
  string
> = {
  conference_application: 'Conference application',
  grant_application: 'Travel grant application',
};

const readSourceTitle = (application: ApplicantApplicationDetail) => {
  if (application.applicationType === 'grant_application') {
    return application.grantTitle ?? application.conferenceTitle ?? 'Untitled grant';
  }

  return application.conferenceTitle ?? application.grantTitle ?? 'Untitled conference';
};

export default function MyApplicationDetail() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [application, setApplication] = useState<ApplicantApplicationDetail | null>(null);
  const [loadState, setLoadState] = useState<'loading' | 'ready' | 'not_found' | 'error'>(
    'loading'
  );
  const returnContext = readReturnContext(location.state);
  const accountMenu = buildWorkspaceAccountMenu(() => {
    localStorage.removeItem('token');
    navigate('/portal');
  });
  const backLink = returnContext ?? {
    to: '/me/applications',
    label: 'Back to my applications',
  };

  useEffect(() => {
    let active = true;

    if (!localStorage.getItem('token')) {
      navigate('/login', { state: toReturnToState(location.pathname) });
      return;
    }

    setApplication(null);
    setLoadState('loading');

    reviewProvider
      .getMyApplicationDetail(id)
      .then((value) => {
        if (active) {
          setApplication(value);
          setLoadState('ready');
        }
      })
      .catch((error) => {
        if (!active) {
          return;
        }

        if (isUnauthorizedSessionError(error)) {
          localStorage.removeItem('token');
          navigate('/login', { state: toReturnToState(location.pathname) });
          return;
        }

        setApplication(null);
        setLoadState(isNotFoundError(error) ? 'not_found' : 'error');
      });

    return () => {
      active = false;
    };
  }, [id, location.pathname, navigate]);

  return (
    <WorkspaceShell
      eyebrow="Applicant workspace"
      title={application ? readSourceTitle(application) : 'Application detail'}
      description={
        application
          ? 'Review your submitted materials and any released result without exposing organizer-only workflow state.'
          : 'Open one applicant-safe application record, result summary, and return path without exposing organizer-only workflow state.'
      }
      badges={
        <>
          <RoleBadge role="applicant" />
          <PageModeBadge mode="hybrid" />
          {application ? (
            <StatusBadge tone={VIEWER_STATUS_TONES[application.viewerStatus]}>
              {VIEWER_STATUS_LABELS[application.viewerStatus]}
            </StatusBadge>
          ) : (
            <StatusBadge tone={loadState === 'error' ? 'danger' : 'info'}>
              {loadState === 'not_found' ? 'Unavailable' : loadState === 'error' ? 'Load failed' : 'Loading detail'}
            </StatusBadge>
          )}
          {application?.releasedDecision ? (
            <StatusBadge tone={FINAL_STATUS_TONES[application.releasedDecision.finalStatus]}>
              {application.releasedDecision.displayLabel}
            </StatusBadge>
          ) : null}
        </>
      }
      actions={
        <Link to={backLink.to} state={backLink.state} className="application-detail__back-link">
          {backLink.label}
        </Link>
      }
      accountMenu={accountMenu}
      aside={
        application ? (
          <div className="application-detail__aside-stack">
            <div className="surface-card review-sidebar application-detail__aside">
              <h3>Application snapshot</h3>
              <div className="review-stack">
                <p>
                  <strong>Type:</strong> {APPLICATION_TYPE_LABELS[application.applicationType]}
                </p>
                <p>
                  <strong>Module:</strong> {application.sourceModule}
                </p>
                <p>
                  <strong>Submitted:</strong>{' '}
                  {application.submittedAt
                    ? new Date(application.submittedAt).toLocaleString()
                    : 'Not submitted'}
                </p>
                {application.linkedConferenceTitle ? (
                  <p>
                    <strong>Linked conference:</strong> {application.linkedConferenceTitle}
                  </p>
                ) : null}
                {application.applicantProfileSnapshot.fullName ? (
                  <p>
                    <strong>Profile snapshot:</strong> {application.applicantProfileSnapshot.fullName}
                  </p>
                ) : null}
                {application.applicantProfileSnapshot.institutionNameRaw ? (
                  <p>
                    <strong>Institution:</strong>{' '}
                    {application.applicantProfileSnapshot.institutionNameRaw}
                  </p>
                ) : null}
              </div>
            </div>

            <DemoShortcutPanel
              className="surface-card review-sidebar application-detail__aside"
              headingLevel="h3"
              title={demoWalkthroughCopy.detail.title}
              intro={demoWalkthroughCopy.detail.intro}
              shortcuts={[
                {
                  to: DASHBOARD_RETURN_CONTEXT.to,
                  label: DASHBOARD_RETURN_CONTEXT.label,
                  description: 'Return to the authenticated workspace summary after narrating this application detail.',
                },
                {
                  to: PORTAL_RETURN_CONTEXT.to,
                  label: 'Restart from portal',
                  description: 'Replay the story from the public entry when the rehearsal needs a clean reset.',
                },
              ]}
            />
          </div>
        ) : null
      }
    >
      <div className="review-page">
        {loadState === 'loading' ? (
          <DemoStatePanel
            badgeLabel="Loading"
            title="Loading application detail"
            description="Preparing the applicant-safe detail record used in the demo walkthrough."
            tone="info"
          />
        ) : loadState === 'error' ? (
          <DemoStatePanel
            badgeLabel="Error"
            title="Application detail unavailable"
            description="We could not load this application detail right now."
            tone="danger"
          />
        ) : loadState === 'not_found' || !application ? (
          <DemoStatePanel
            badgeLabel="Unavailable"
            title="Application not found"
            description="This applicant-facing record is unavailable in the current demo dataset."
            tone="neutral"
          />
        ) : null}

        {application?.releasedDecision ? (
          <section className="surface-card review-panel">
            <header className="review-panel__header">
              <div>
                <h2>Released result</h2>
                <p className="conference-muted-note">
                  This is the applicant-visible decision summary for the current application.
                </p>
              </div>
              <StatusBadge tone={FINAL_STATUS_TONES[application.releasedDecision.finalStatus]}>
                Decision: {application.releasedDecision.displayLabel}
              </StatusBadge>
            </header>

            <div className="review-stack">
              {application.releasedDecision.noteExternal ? (
                <p className="application-detail__result-note">
                  {application.releasedDecision.noteExternal}
                </p>
              ) : (
                <p className="review-note">
                  No external note has been published with this result.
                </p>
              )}
              {application.releasedDecision.releasedAt ? (
                <p className="review-note">
                  Released {new Date(application.releasedDecision.releasedAt).toLocaleString()}
                </p>
              ) : null}
            </div>
          </section>
        ) : null}

        {application ? <div className="review-grid review-grid--single">
          <section className="surface-card review-card">
            <header className="review-card__header">
              <div>
                <p className="conference-eyebrow">
                  {APPLICATION_TYPE_LABELS[application.applicationType]}
                </p>
                <h2>Application summary</h2>
              </div>
            </header>

            <div className="review-card__meta">
              {application.statement ? (
                <p>
                  <strong>Statement:</strong> {application.statement}
                </p>
              ) : null}
              {application.travelPlanSummary ? (
                <p>
                  <strong>Travel plan:</strong> {application.travelPlanSummary}
                </p>
              ) : null}
              {application.fundingNeedSummary ? (
                <p>
                  <strong>Funding need:</strong> {application.fundingNeedSummary}
                </p>
              ) : null}
              {Object.keys(application.extraAnswers).length > 0 ? (
                <p>
                  <strong>Additional answers:</strong> {Object.keys(application.extraAnswers).length}{' '}
                  item(s) recorded
                </p>
              ) : null}
              {application.files.length > 0 ? (
                <p>
                  <strong>Files:</strong> {application.files.length} attachment(s)
                </p>
              ) : null}
              {!application.statement &&
              !application.travelPlanSummary &&
              !application.fundingNeedSummary &&
              Object.keys(application.extraAnswers).length === 0 &&
              application.files.length === 0 ? (
                <p className="review-note">
                  No additional applicant-facing summary fields are available for this application
                  yet.
                </p>
              ) : null}
            </div>
          </section>
        </div> : null}
      </div>
    </WorkspaceShell>
  );
}

const isNotFoundError = (error: unknown) => {
  if (error && typeof error === 'object' && 'code' in error && error.code === 'NOT_FOUND') {
    return true;
  }

  return error instanceof Error && /not found/i.test(error.message);
};
