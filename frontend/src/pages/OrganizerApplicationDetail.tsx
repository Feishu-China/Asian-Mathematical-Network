import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { WorkspaceShell } from '../components/layout/WorkspaceShell';
import { PageModeBadge } from '../components/ui/PageModeBadge';
import { RoleBadge } from '../components/ui/RoleBadge';
import { StatusBadge } from '../components/ui/StatusBadge';
import { AssignReviewerForm } from '../features/review/AssignReviewerForm';
import { DecisionEditor } from '../features/review/DecisionEditor';
import { reviewProvider } from '../features/review/reviewProvider';
import type { OrganizerApplicationDetail, ReviewerCandidate } from '../features/review/types';
import './Review.css';

export const routePath = '/organizer/applications/:id';

export default function OrganizerApplicationDetailPage() {
  const { id = '' } = useParams();
  const [application, setApplication] = useState<OrganizerApplicationDetail | null | undefined>(undefined);
  const [candidates, setCandidates] = useState<ReviewerCandidate[]>([]);
  const [assignStatus, setAssignStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [decisionStatus, setDecisionStatus] = useState<
    'idle' | 'saving' | 'saved' | 'releasing' | 'released' | 'error'
  >('idle');

  const load = async () => {
    const [nextApplication, nextCandidates] = await Promise.all([
      reviewProvider.getOrganizerApplicationDetail(id),
      reviewProvider.listReviewerCandidates(id),
    ]);

    setApplication(nextApplication);
    setCandidates(nextCandidates);
  };

  useEffect(() => {
    load()
      .catch(() => setApplication(null));
  }, [id]);

  if (application === undefined) {
    return <div className="review-page">Loading review application...</div>;
  }

  if (application === null) {
    return <div className="review-page">Application not found.</div>;
  }

  return (
    <WorkspaceShell
      eyebrow="Organizer workspace"
      title="Review application detail"
      description="Assign reviewers, record the internal decision, and control release without exposing internal state to applicants."
      badges={
        <>
          <RoleBadge role="organizer" />
          <PageModeBadge mode="real-aligned" />
          <StatusBadge tone={application.decision?.releaseStatus === 'released' ? 'success' : 'warning'}>
            Internal status: {application.status}
          </StatusBadge>
        </>
      }
      aside={
        <div className="surface-card review-sidebar">
          <h3>Application snapshot</h3>
          <p>Conference: {application.conferenceTitle}</p>
          <p>Participation type: {application.participationType ?? 'not set'}</p>
          <p>Submitted at: {application.submittedAt ?? 'not submitted'}</p>
          <p>Applicant: {application.applicantProfileSnapshot.fullName ?? 'Unknown applicant'}</p>
          <Link to={`/organizer/conferences/${application.conferenceId}/applications`}>Back to conference queue</Link>
        </div>
      }
    >
      <div className="review-page">
        {assignStatus === 'saved' ? (
          <div className="review-inline-message review-inline-message--success">
            Internal assignment updated.
          </div>
        ) : null}
        {decisionStatus === 'saved' ? (
          <div className="review-inline-message review-inline-message--success">
            Internal decision saved.
          </div>
        ) : null}
        {decisionStatus === 'released' ? (
          <div className="review-inline-message review-inline-message--success">
            Decision released.
          </div>
        ) : null}

        <section className="surface-card review-card">
          <div className="review-card__header">
            <div>
              <p className="conference-eyebrow">Conference application</p>
              <h2>{application.applicantProfileSnapshot.fullName ?? 'Applicant'}</h2>
            </div>
            <StatusBadge tone={application.decision?.releaseStatus === 'released' ? 'success' : 'info'}>
              Release status: {application.decision?.releaseStatus ?? 'unreleased'}
            </StatusBadge>
          </div>

          <div className="review-card__meta">
            <p>Statement: {application.statement ?? 'No statement provided.'}</p>
            <p>Abstract title: {application.abstractTitle ?? 'No abstract title.'}</p>
            <p>Abstract text: {application.abstractText ?? 'No abstract text.'}</p>
            <p>Travel support intent: {application.interestedInTravelSupport ? 'yes' : 'no'}</p>
          </div>
        </section>

        <div className="review-grid">
          <div className="review-list">
            <AssignReviewerForm
              candidates={candidates}
              status={assignStatus}
              onAssign={async (values) => {
                try {
                  setAssignStatus('saving');
                  await reviewProvider.assignReviewer(application.id, values);
                  await load();
                  setAssignStatus('saved');
                } catch {
                  setAssignStatus('error');
                }
              }}
            />

            <section className="surface-card review-panel">
              <header className="review-panel__header">
                <div>
                  <h2>Assigned reviewers</h2>
                  <p className="conference-muted-note">Organizer-facing assignment records stay internal until result release happens elsewhere.</p>
                </div>
              </header>

              <div className="review-list">
                {application.reviewAssignments.length === 0 ? (
                  <p className="review-note">No reviewer assignments yet.</p>
                ) : (
                  application.reviewAssignments.map((assignment) => (
                    <div key={assignment.id} className="review-card">
                      <p>{assignment.reviewerName ?? assignment.reviewerUserId}</p>
                      <p>Assignment status: {assignment.status}</p>
                      <p>Conflict state: {assignment.conflictState}</p>
                      <p>Review due: {assignment.dueAt ?? 'not set'}</p>
                    </div>
                  ))
                )}
              </div>
            </section>
          </div>

          <div className="review-list">
            <DecisionEditor
              decision={application.decision}
              status={decisionStatus}
              onSave={async (values) => {
                try {
                  setDecisionStatus('saving');
                  await reviewProvider.upsertDecision(application.id, values);
                  await load();
                  setDecisionStatus('saved');
                } catch {
                  setDecisionStatus('error');
                }
              }}
              onRelease={async () => {
                try {
                  setDecisionStatus('releasing');
                  await reviewProvider.releaseDecision(application.id);
                  await load();
                  setDecisionStatus('released');
                } catch {
                  setDecisionStatus('error');
                }
              }}
            />

            <section className="surface-card review-panel">
              <header className="review-panel__header">
                <div>
                  <h2>Submitted reviews</h2>
                  <p className="conference-muted-note">Reviewer recommendations inform the organizer decision but do not become applicant-visible outcomes by themselves.</p>
                </div>
              </header>

              <div className="review-list">
                {application.reviews.length === 0 ? (
                  <p className="review-note">No reviews submitted yet.</p>
                ) : (
                  application.reviews.map((review) => (
                    <div key={review.id} className="review-card">
                      <p>Recommendation: {review.recommendation}</p>
                      <p>Score: {review.score ?? 'not set'}</p>
                      <p>{review.comment}</p>
                    </div>
                  ))
                )}
              </div>
            </section>
          </div>
        </div>
      </div>
    </WorkspaceShell>
  );
}
