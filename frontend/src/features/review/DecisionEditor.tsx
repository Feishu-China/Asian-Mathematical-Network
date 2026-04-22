import { useEffect, useState } from 'react';
import { StatusBadge } from '../../components/ui/StatusBadge';
import type { DecisionValues, InternalDecision } from './types';

type Props = {
  decision: InternalDecision | null;
  status: 'idle' | 'saving' | 'saved' | 'releasing' | 'released' | 'error';
  onSave: (values: DecisionValues) => Promise<void>;
  onRelease: () => Promise<void>;
};

export function DecisionEditor({ decision, status, onSave, onRelease }: Props) {
  const [values, setValues] = useState<DecisionValues>({
    finalStatus: decision?.finalStatus ?? '',
    noteInternal: decision?.noteInternal ?? '',
    noteExternal: decision?.noteExternal ?? '',
  });

  useEffect(() => {
    setValues({
      finalStatus: decision?.finalStatus ?? '',
      noteInternal: decision?.noteInternal ?? '',
      noteExternal: decision?.noteExternal ?? '',
    });
  }, [decision]);

  const badgeTone =
    status === 'saved' || status === 'released'
      ? 'success'
      : status === 'saving' || status === 'releasing'
        ? 'warning'
        : status === 'error'
          ? 'danger'
          : 'info';

  const canRelease = decision?.releaseStatus === 'unreleased';

  return (
    <form
      className="surface-card review-panel review-form"
      onSubmit={async (event) => {
        event.preventDefault();
        await onSave(values);
      }}
    >
      <header className="review-panel__header">
        <div>
          <h2>Internal decision</h2>
          <p className="conference-muted-note">
            Internal decision and released applicant outcome remain separate states.
          </p>
        </div>
        <StatusBadge tone={badgeTone}>
          Release status: {decision?.releaseStatus ?? 'unreleased'}
        </StatusBadge>
      </header>

      <label>
        Final status
        <select
          aria-label="Final status"
          value={values.finalStatus}
          onChange={(event) => setValues((current) => ({ ...current, finalStatus: event.target.value as DecisionValues['finalStatus'] }))}
          required
        >
          <option value="">Select one</option>
          <option value="accepted">accepted</option>
          <option value="rejected">rejected</option>
          <option value="waitlisted">waitlisted</option>
        </select>
      </label>

      <label>
        Internal note
        <textarea
          aria-label="Internal note"
          rows={3}
          value={values.noteInternal}
          onChange={(event) => setValues((current) => ({ ...current, noteInternal: event.target.value }))}
        />
      </label>

      <label>
        External note
        <textarea
          aria-label="External note"
          rows={4}
          value={values.noteExternal}
          onChange={(event) => setValues((current) => ({ ...current, noteExternal: event.target.value }))}
        />
      </label>

      <div className="conference-form-actions">
        <button type="submit" disabled={!values.finalStatus || status === 'saving'}>
          {status === 'saving' ? 'Saving...' : 'Save decision'}
        </button>
        <button type="button" disabled={!canRelease || status === 'releasing'} onClick={() => void onRelease()}>
          {status === 'releasing' ? 'Releasing...' : 'Release decision'}
        </button>
      </div>
    </form>
  );
}
