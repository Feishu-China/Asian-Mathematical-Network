import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { WorkspaceShell } from '../components/layout/WorkspaceShell';
import { PageModeBadge } from '../components/ui/PageModeBadge';
import { RoleBadge } from '../components/ui/RoleBadge';
import { StatusBadge } from '../components/ui/StatusBadge';
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
  const [application, setApplication] = useState<ApplicantApplicationDetail | null | undefined>(
    undefined
  );

  useEffect(() => {
    let active = true;

    if (!localStorage.getItem('token')) {
      navigate('/login');
      return;
    }

    setApplication(undefined);

    reviewProvider
      .getMyApplicationDetail(id)
      .then((value) => {
        if (active) {
          setApplication(value);
        }
      })
      .catch(() => {
        if (active) {
          setApplication(null);
        }
      });

    return () => {
      active = false;
    };
  }, [id, navigate]);

  if (application === undefined) {
    return <div className="review-page">Loading application detail...</div>;
  }

  if (application === null) {
    return <div className="review-page">Application not found.</div>;
  }

  const sourceTitle = readSourceTitle(application);

  return (
    <WorkspaceShell
      eyebrow="Applicant workspace"
      title={sourceTitle}
      description="Review your submitted materials and any released result without exposing organizer-only workflow state."
      badges={
        <>
          <RoleBadge role="applicant" />
          <PageModeBadge mode="hybrid" />
          <StatusBadge tone={VIEWER_STATUS_TONES[application.viewerStatus]}>
            {VIEWER_STATUS_LABELS[application.viewerStatus]}
          </StatusBadge>
          {application.releasedDecision ? (
            <StatusBadge tone={FINAL_STATUS_TONES[application.releasedDecision.finalStatus]}>
              {application.releasedDecision.displayLabel}
            </StatusBadge>
          ) : null}
        </>
      }
      actions={
        <Link to="/me/applications" className="application-detail__back-link">
          Back to my applications
        </Link>
      }
      aside={
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
      }
    >
      <div className="review-page">
        {application.releasedDecision ? (
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

        <div className="review-grid review-grid--single">
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
        </div>
      </div>
    </WorkspaceShell>
  );
}
