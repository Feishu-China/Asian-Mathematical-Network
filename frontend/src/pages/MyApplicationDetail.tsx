import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { WorkspaceShell } from '../components/layout/WorkspaceShell';
import { PageModeBadge } from '../components/ui/PageModeBadge';
import { RoleBadge } from '../components/ui/RoleBadge';
import { StatusBadge } from '../components/ui/StatusBadge';
import { dashboardProvider } from '../features/dashboard/dashboardProvider';
import type {
  ApplicantProfileSnapshot,
  MyApplicationDetail,
  PostVisitReport,
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
  const [reportNarrative, setReportNarrative] = useState('');
  const [attendanceConfirmed, setAttendanceConfirmed] = useState(true);
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const [reportError, setReportError] = useState<string | null>(null);

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
    setReportNarrative('');
    setAttendanceConfirmed(true);
    setReportError(null);

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

  const handleReportSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!application) {
      return;
    }
    const trimmed = reportNarrative.trim();
    if (!trimmed) {
      setReportError('Please describe the visit before submitting.');
      return;
    }

    setReportError(null);
    setReportSubmitting(true);
    try {
      const submitted: PostVisitReport = await dashboardProvider.submitPostVisitReport(
        application.id,
        { reportNarrative: trimmed, attendanceConfirmed }
      );
      setApplication({
        ...application,
        postVisitReport: submitted,
        postVisitReportStatus: submitted.status,
      });
    } catch {
      setReportError('We could not submit your post-visit report. Please try again.');
    } finally {
      setReportSubmitting(false);
    }
  };

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

        {isGrant && application.releasedDecision?.finalStatus === 'accepted' ? (
          application.postVisitReport ? (
            <section className="surface-card my-applications__row" aria-labelledby="detail-report">
              <h2 id="detail-report">Post-visit report</h2>
              <p className="my-applications__row-timestamp">
                Submitted{' '}
                {application.postVisitReport.submittedAt
                  ? new Date(application.postVisitReport.submittedAt).toLocaleDateString()
                  : 'just now'}
                {application.postVisitReport.attendanceConfirmed
                  ? ' · attendance confirmed'
                  : ' · attendance not confirmed'}
              </p>
              <p className="my-applications__detail-note">
                {application.postVisitReport.reportNarrative}
              </p>
            </section>
          ) : (
            <section className="surface-card my-applications__row" aria-labelledby="detail-report-form">
              <h2 id="detail-report-form">Submit post-visit report</h2>
              <p className="my-applications__detail-note">
                Tell the organizer what happened on your trip. You can submit one report per
                accepted travel grant.
              </p>
              <form onSubmit={handleReportSubmit} className="conference-form">
                <label>
                  Report narrative
                  <textarea
                    value={reportNarrative}
                    onChange={(event) => setReportNarrative(event.target.value)}
                    rows={6}
                    maxLength={4000}
                    required
                  />
                </label>
                <label className="my-applications__detail-checkbox">
                  <input
                    type="checkbox"
                    checked={attendanceConfirmed}
                    onChange={(event) => setAttendanceConfirmed(event.target.checked)}
                  />{' '}
                  I confirm I attended the conference.
                </label>
                {reportError ? (
                  <p className="conference-inline-message error">{reportError}</p>
                ) : null}
                <div className="conference-form-actions">
                  <button type="submit" disabled={reportSubmitting}>
                    {reportSubmitting ? 'Submitting...' : 'Submit report'}
                  </button>
                </div>
              </form>
            </section>
          )
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
