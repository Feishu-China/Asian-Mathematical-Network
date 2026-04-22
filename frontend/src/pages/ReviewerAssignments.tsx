import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { WorkspaceShell } from '../components/layout/WorkspaceShell';
import { PageModeBadge } from '../components/ui/PageModeBadge';
import { RoleBadge } from '../components/ui/RoleBadge';
import { StatusBadge } from '../components/ui/StatusBadge';
import { reviewProvider } from '../features/review/reviewProvider';
import type { ReviewerQueueItem } from '../features/review/types';
import './Review.css';

export const routePath = '/reviewer';

export default function ReviewerAssignmentsPage() {
  const [items, setItems] = useState<ReviewerQueueItem[] | null>(null);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    let active = true;

    reviewProvider
      .listReviewerAssignments()
      .then((value) => {
        if (active) {
          setItems(value);
        }
      })
      .catch(() => {
        if (active) {
          setHasError(true);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  if (items === null) {
    return <div className="review-page">{hasError ? 'We could not load reviewer assignments.' : 'Loading reviewer queue...'}</div>;
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
                  <Link className="conference-primary-link" to={`/reviewer/assignments/${item.assignmentId}`}>
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
