import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { WorkspaceShell } from '../components/layout/WorkspaceShell';
import { PageModeBadge } from '../components/ui/PageModeBadge';
import { RoleBadge } from '../components/ui/RoleBadge';
import { StatusBadge } from '../components/ui/StatusBadge';
import { dashboardProvider } from '../features/dashboard/dashboardProvider';
import type {
  ApplicantProfileSnapshot,
  MyApplicationDetail,
  ReleasedDecisionFinalStatus,
  ViewerStatus,
} from '../features/dashboard/types';
import './MyApplications.css';

export const routePath = '/me/applications/:id';

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

const FINAL_STATUS_TONES: Record<ReleasedDecisionFinalStatus, BadgeTone> = {
  accepted: 'success',
  waitlisted: 'warning',
  rejected: 'danger',
};

const hasProfileContent = (snapshot: ApplicantProfileSnapshot) =>
  Boolean(
    snapshot.full_name ||
      snapshot.institution_name_raw ||
      snapshot.country_code ||
      snapshot.career_stage ||
      (snapshot.research_keywords && snapshot.research_keywords.length > 0)
  );

const renderStatusBadge = (application: MyApplicationDetail) => {
  if (application.viewerStatus === 'result_released' && application.releasedDecision) {
    return (
      <StatusBadge tone={FINAL_STATUS_TONES[application.releasedDecision.finalStatus]}>
        {application.releasedDecision.displayLabel}
      </StatusBadge>
    );
  }

  return (
    <StatusBadge tone={VIEWER_STATUS_TONES[application.viewerStatus]}>
      {VIEWER_STATUS_LABELS[application.viewerStatus]}
    </StatusBadge>
  );
};

export default function MyApplicationDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [application, setApplication] = useState<MyApplicationDetail | null | undefined>(undefined);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    let active = true;

    if (!localStorage.getItem('token')) {
      navigate('/login');
      return;
    }

    if (!id) {
      setApplication(null);
      return;
    }

    setHasError(false);
    setApplication(undefined);

    dashboardProvider
      .getMyApplication(id)
      .then((value) => {
        if (active) {
          setApplication(value);
        }
      })
      .catch(() => {
        if (active) {
          setHasError(true);
          setApplication(null);
        }
      });

    return () => {
      active = false;
    };
  }, [id, navigate]);

  if (application === undefined) {
    return (
      <WorkspaceShell
        eyebrow="Applicant workspace"
        title="Application details"
        badges={
          <>
            <RoleBadge role="applicant" />
            <PageModeBadge mode="real-aligned" />
          </>
        }
      >
        <div className="conference-empty">Loading application...</div>
      </WorkspaceShell>
    );
  }

  if (hasError || application === null) {
    return (
      <WorkspaceShell
        eyebrow="Applicant workspace"
        title="Application not found"
        badges={
          <>
            <RoleBadge role="applicant" />
            <PageModeBadge mode="real-aligned" />
          </>
        }
      >
        <div className="conference-inline-message error">
          {hasError
            ? 'We could not load this application right now.'
            : 'This application does not exist or is not available to you.'}
        </div>
        <p>
          <Link to="/me/applications" className="my-applications__section-link">
            Back to My applications
          </Link>
        </p>
      </WorkspaceShell>
    );
  }

  const isGrant = application.applicationType === 'grant_application';
  const title =
    (isGrant ? application.grantTitle : application.conferenceTitle) ??
    (isGrant ? 'Untitled grant' : 'Untitled conference');
  const eyebrow = isGrant ? 'Travel grant application' : 'Conference application';
  const snapshot = application.applicantProfileSnapshot;

  return (
    <WorkspaceShell
      eyebrow={eyebrow}
      title={title}
      description={application.linkedConferenceTitle ? `Linked conference: ${application.linkedConferenceTitle}` : undefined}
      badges={
        <>
          <RoleBadge role="applicant" />
          <PageModeBadge mode="real-aligned" />
          {renderStatusBadge(application)}
        </>
      }
      actions={
        <Link to="/me/applications" className="my-applications__section-link">
          Back to My applications
        </Link>
      }
    >
      <div className="my-applications">
        {application.releasedDecision?.noteExternal ? (
          <section className="surface-card my-applications__row" aria-labelledby="detail-result">
            <h2 id="detail-result">Result</h2>
            <p>
              <strong>{application.releasedDecision.displayLabel}</strong>
              {application.releasedDecision.releasedAt ? (
                <>
                  {' '}
                  · released {new Date(application.releasedDecision.releasedAt).toLocaleDateString()}
                </>
              ) : null}
            </p>
            <p className="my-applications__detail-note">{application.releasedDecision.noteExternal}</p>
          </section>
        ) : null}

        {application.submittedAt ? (
          <p className="my-applications__row-timestamp">
            Submitted {new Date(application.submittedAt).toLocaleDateString()}
          </p>
        ) : (
          <p className="my-applications__row-timestamp">This application has not been submitted yet.</p>
        )}

        <section className="surface-card my-applications__row" aria-labelledby="detail-statement">
          <h2 id="detail-statement">Statement</h2>
          {application.statement ? (
            <p className="my-applications__detail-note">{application.statement}</p>
          ) : (
            <p className="conference-empty">No statement yet.</p>
          )}
        </section>

        {isGrant ? (
          <section className="surface-card my-applications__row" aria-labelledby="detail-travel">
            <h2 id="detail-travel">Travel plan and funding need</h2>
            <p className="my-applications__detail-subhead">Travel plan</p>
            {application.travelPlanSummary ? (
              <p className="my-applications__detail-note">{application.travelPlanSummary}</p>
            ) : (
              <p className="conference-empty">Not provided yet.</p>
            )}
            <p className="my-applications__detail-subhead">Funding need</p>
            {application.fundingNeedSummary ? (
              <p className="my-applications__detail-note">{application.fundingNeedSummary}</p>
            ) : (
              <p className="conference-empty">Not provided yet.</p>
            )}
          </section>
        ) : null}

        {application.submittedAt && hasProfileContent(snapshot) ? (
          <section className="surface-card my-applications__row" aria-labelledby="detail-snapshot">
            <h2 id="detail-snapshot">Profile at submission</h2>
            <dl className="my-applications__detail-snapshot">
              {snapshot.full_name ? (
                <>
                  <dt>Name</dt>
                  <dd>{snapshot.full_name}</dd>
                </>
              ) : null}
              {snapshot.institution_name_raw ? (
                <>
                  <dt>Institution</dt>
                  <dd>{snapshot.institution_name_raw}</dd>
                </>
              ) : null}
              {snapshot.country_code ? (
                <>
                  <dt>Country</dt>
                  <dd>{snapshot.country_code}</dd>
                </>
              ) : null}
              {snapshot.career_stage ? (
                <>
                  <dt>Career stage</dt>
                  <dd>{snapshot.career_stage}</dd>
                </>
              ) : null}
              {snapshot.research_keywords && snapshot.research_keywords.length > 0 ? (
                <>
                  <dt>Keywords</dt>
                  <dd>{snapshot.research_keywords.join(', ')}</dd>
                </>
              ) : null}
            </dl>
          </section>
        ) : null}
      </div>
    </WorkspaceShell>
  );
}
