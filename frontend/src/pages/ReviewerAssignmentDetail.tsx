import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { WorkspaceShell } from '../components/layout/WorkspaceShell';
import { PageModeBadge } from '../components/ui/PageModeBadge';
import { RoleBadge } from '../components/ui/RoleBadge';
import { StatusBadge } from '../components/ui/StatusBadge';
import { ReviewSubmissionForm } from '../features/review/ReviewSubmissionForm';
import { reviewProvider } from '../features/review/reviewProvider';
import type { ReviewerAssignmentDetail } from '../features/review/types';
import './Review.css';

export const routePath = '/reviewer/assignments/:id';

export default function ReviewerAssignmentDetailPage() {
  const { id = '' } = useParams();
  const [assignment, setAssignment] = useState<ReviewerAssignmentDetail | null | undefined>(undefined);
  const [status, setStatus] = useState<'idle' | 'submitting' | 'submitted' | 'error'>('idle');

  const load = async () => {
    const detail = await reviewProvider.getReviewerAssignmentDetail(id);
    setAssignment(detail);
  };

  useEffect(() => {
    load().catch(() => setAssignment(null));
  }, [id]);

  if (assignment === undefined) {
    return <div className="review-page">Loading review assignment...</div>;
  }

  if (assignment === null) {
    return <div className="review-page">Assignment not found.</div>;
  }

  const isConflictBlocked = assignment.conflictState === 'flagged';
  const isReviewSubmitted = assignment.status === 'review_submitted';
  const formStatus =
    status === 'idle' && isReviewSubmitted
      ? 'submitted'
      : status;
  const statusTone = isConflictBlocked ? 'danger' : isReviewSubmitted ? 'success' : 'info';

  return (
    <WorkspaceShell
      eyebrow="Reviewer workspace"
      title="Review assignment"
      description="Reviewer scope only includes assigned materials and the review action allowed by conflict state."
      badges={
        <>
          <RoleBadge role="reviewer" />
          <PageModeBadge mode="real-aligned" />
          <StatusBadge tone={statusTone}>
            Assignment status: {assignment.status}
          </StatusBadge>
        </>
      }
      aside={
        <div className="surface-card review-sidebar">
          <h3>Assignment summary</h3>
          <p>Due at: {assignment.dueAt ?? 'not set'}</p>
          <p>Conflict state: {assignment.conflictState}</p>
          <Link to="/reviewer">Back to reviewer queue</Link>
        </div>
      }
    >
      <div className="review-page">
        {status === 'submitted' ? (
          <div className="review-inline-message review-inline-message--success">Review submitted.</div>
        ) : null}

        {isConflictBlocked ? (
          <div className="review-inline-message review-inline-message--danger">
            Submission blocked. {assignment.conflictNote ?? 'Resolve the conflict before reviewing this application.'}
          </div>
        ) : null}

        <section className="surface-card review-card">
          <div className="review-card__header">
            <div>
              <p className="conference-eyebrow">Assigned application</p>
              <h2>{assignment.application.sourceTitle}</h2>
            </div>
            <StatusBadge tone={statusTone}>
              Conflict: {assignment.conflictState}
            </StatusBadge>
          </div>

          <div className="review-card__meta">
            <p>Participation type: {assignment.application.participationType ?? 'not set'}</p>
            <p>Statement: {assignment.application.statement ?? 'No statement provided.'}</p>
            <p>Abstract title: {assignment.application.abstractTitle ?? 'No abstract title.'}</p>
            <p>Abstract text: {assignment.application.abstractText ?? 'No abstract text.'}</p>
            <p>Applicant: {assignment.application.applicantProfileSnapshot.fullName ?? 'Applicant'}</p>
          </div>
        </section>

        <ReviewSubmissionForm
          blocked={assignment.submissionBlocked}
          status={formStatus}
          onSubmit={async (values) => {
            try {
              setStatus('submitting');
              await reviewProvider.submitReviewerReview(id, values);
              await load();
              setStatus('submitted');
            } catch {
              setStatus('error');
            }
          }}
        />
      </div>
    </WorkspaceShell>
  );
}
