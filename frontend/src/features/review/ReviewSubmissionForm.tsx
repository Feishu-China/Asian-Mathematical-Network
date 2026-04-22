import { useState } from 'react';
import { StatusBadge } from '../../components/ui/StatusBadge';
import type { ReviewSubmissionValues } from './types';

type Props = {
  blocked: boolean;
  status: 'idle' | 'submitting' | 'submitted' | 'error';
  onSubmit: (values: ReviewSubmissionValues) => Promise<void>;
};

export function ReviewSubmissionForm({ blocked, status, onSubmit }: Props) {
  const [values, setValues] = useState<ReviewSubmissionValues>({
    score: '',
    recommendation: '',
    comment: '',
  });

  const badgeTone =
    status === 'submitted'
      ? 'success'
      : status === 'submitting'
        ? 'warning'
        : status === 'error' || blocked
          ? 'danger'
          : 'info';

  return (
    <form
      className="surface-card review-panel review-form"
      onSubmit={async (event) => {
        event.preventDefault();
        await onSubmit(values);
      }}
    >
      <header className="review-panel__header">
        <div>
          <h2>Submit review</h2>
          <p className="conference-muted-note">Only the assigned, non-conflicted reviewer can submit this recommendation.</p>
        </div>
        <StatusBadge tone={badgeTone}>Assignment status</StatusBadge>
      </header>

      <div className="review-form-grid">
        <label>
          Score
          <select
            aria-label="Score"
            value={values.score}
            onChange={(event) =>
              setValues((current) => ({
                ...current,
                score: event.target.value ? Number(event.target.value) : '',
              }))
            }
          >
            <option value="">Select one</option>
            {[1, 2, 3, 4, 5].map((score) => (
              <option key={score} value={score}>
                {score}
              </option>
            ))}
          </select>
        </label>

        <label>
          Recommendation
          <select
            aria-label="Recommendation"
            value={values.recommendation}
            onChange={(event) =>
              setValues((current) => ({
                ...current,
                recommendation: event.target.value as ReviewSubmissionValues['recommendation'],
              }))
            }
            required
          >
            <option value="">Select one</option>
            <option value="accept">accept</option>
            <option value="reject">reject</option>
            <option value="waitlist">waitlist</option>
          </select>
        </label>
      </div>

      <label>
        Review comment
        <textarea
          aria-label="Review comment"
          rows={5}
          value={values.comment}
          onChange={(event) => setValues((current) => ({ ...current, comment: event.target.value }))}
          required
        />
      </label>

      <div className="conference-form-actions">
        <button
          type="submit"
          disabled={
            blocked ||
            !values.recommendation ||
            !values.comment.trim() ||
            status === 'submitting' ||
            status === 'submitted'
          }
        >
          {status === 'submitting' ? 'Submitting...' : 'Submit review'}
        </button>
      </div>
    </form>
  );
}
