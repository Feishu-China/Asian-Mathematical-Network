import { useState } from 'react';
import { StatusBadge } from '../../components/ui/StatusBadge';
import type { AssignReviewerValues, ReviewConflictState, ReviewerCandidate } from './types';

type Props = {
  candidates: ReviewerCandidate[];
  status: 'idle' | 'saving' | 'saved' | 'error';
  onAssign: (values: AssignReviewerValues) => Promise<void>;
};

export function AssignReviewerForm({ candidates, status, onAssign }: Props) {
  const [values, setValues] = useState<AssignReviewerValues>({
    reviewerUserId: '',
    dueAt: '',
    conflictState: 'clear',
    conflictNote: '',
  });

  const setField = <K extends keyof AssignReviewerValues>(key: K, value: AssignReviewerValues[K]) => {
    setValues((current) => ({ ...current, [key]: value }));
  };

  const badgeTone = status === 'saved' ? 'success' : status === 'saving' ? 'warning' : status === 'error' ? 'danger' : 'info';

  return (
    <form
      className="surface-card review-panel review-form"
      onSubmit={async (event) => {
        event.preventDefault();
        await onAssign(values);
      }}
    >
      <header className="review-panel__header">
        <div>
          <h2>Assign reviewer</h2>
          <p className="conference-muted-note">Select an M4-backed reviewer candidate and record the minimum conflict gate.</p>
        </div>
        <StatusBadge tone={badgeTone}>Assignment</StatusBadge>
      </header>

      <div className="review-form-grid">
        <label>
          Reviewer
          <select
            aria-label="Reviewer"
            value={values.reviewerUserId}
            onChange={(event) => setField('reviewerUserId', event.target.value)}
            required
          >
            <option value="">Select one</option>
            {candidates.map((candidate) => (
              <option key={candidate.userId} value={candidate.userId}>
                {candidate.fullName}
              </option>
            ))}
          </select>
        </label>

        <label>
          Review due
          <input
            aria-label="Review due"
            value={values.dueAt}
            onChange={(event) => setField('dueAt', event.target.value)}
            placeholder="2026-08-30T23:59:59.000Z"
          />
        </label>

        <label>
          Conflict state
          <select
            value={values.conflictState}
            onChange={(event) => setField('conflictState', event.target.value as ReviewConflictState)}
          >
            <option value="clear">clear</option>
            <option value="flagged">flagged</option>
          </select>
        </label>
      </div>

      <label>
        Conflict note
        <textarea
          rows={3}
          value={values.conflictNote}
          onChange={(event) => setField('conflictNote', event.target.value)}
        />
      </label>

      <div className="conference-form-actions">
        <button type="submit" disabled={!values.reviewerUserId || status === 'saving'}>
          {status === 'saving' ? 'Assigning...' : 'Assign reviewer'}
        </button>
      </div>
    </form>
  );
}
