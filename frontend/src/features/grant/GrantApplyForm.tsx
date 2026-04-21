import { useEffect, useState } from 'react';
import type {
  GrantApplication,
  GrantApplicationValues,
  GrantFormSchema,
  SupportedGrantFieldKey,
} from './types';

type Props = {
  schema: GrantFormSchema;
  application: GrantApplication | null;
  linkedConferenceApplicationId: string;
  status: 'idle' | 'saving' | 'submitting' | 'submitted' | 'conflict' | 'prerequisite' | 'error';
  blocked: boolean;
  onSave: (values: GrantApplicationValues) => Promise<void>;
  onSubmit: () => Promise<void>;
};

const toValues = (
  application: GrantApplication | null,
  linkedConferenceApplicationId: string
): GrantApplicationValues => ({
  linkedConferenceApplicationId:
    application?.linkedConferenceApplicationId ?? linkedConferenceApplicationId,
  statement: application?.statement ?? '',
  travelPlanSummary: application?.travelPlanSummary ?? '',
  fundingNeedSummary: application?.fundingNeedSummary ?? '',
  extraAnswers: application?.extraAnswers ?? {},
});

export function GrantApplyForm({
  schema,
  application,
  linkedConferenceApplicationId,
  status,
  blocked,
  onSave,
  onSubmit,
}: Props) {
  const [values, setValues] = useState<GrantApplicationValues>(() =>
    toValues(application, linkedConferenceApplicationId)
  );

  useEffect(() => {
    setValues(toValues(application, linkedConferenceApplicationId));
  }, [application, linkedConferenceApplicationId]);

  const fieldKeys = new Set<SupportedGrantFieldKey>(schema.fields.map((field) => field.key));
  const hasField = (key: SupportedGrantFieldKey) => fieldKeys.size === 0 || fieldKeys.has(key);
  const canSubmit = Boolean(
    application &&
      values.statement.trim() &&
      values.travelPlanSummary.trim() &&
      values.fundingNeedSummary.trim() &&
      !blocked
  );

  const setField = <K extends keyof GrantApplicationValues>(key: K, value: GrantApplicationValues[K]) => {
    setValues((current) => ({
      ...current,
      [key]: value,
    }));
  };

  return (
    <form
      className="conference-detail-card conference-form"
      onSubmit={async (event) => {
        event.preventDefault();
        await onSave(values);
      }}
    >
      <header className="conference-form-header">
        <div>
          <p className="conference-eyebrow">Applicant workspace</p>
          <h2>Travel grant application</h2>
          <p className="conference-muted-note">
            Grant applications stay separate from conference applications, even when the conference
            submission is required first.
          </p>
        </div>
        <span className="conference-status-badge">Status: {application?.status ?? 'not started'}</span>
      </header>

      <div className="conference-publish-hint">
        Linked conference application:{' '}
        {linkedConferenceApplicationId ? linkedConferenceApplicationId : 'Not available yet'}
      </div>

      {hasField('statement') ? (
        <label>
          Statement
          <textarea
            rows={5}
            value={values.statement}
            onChange={(event) => setField('statement', event.target.value)}
            required
          />
        </label>
      ) : null}

      {hasField('travel_plan_summary') ? (
        <label>
          Travel plan summary
          <textarea
            rows={5}
            value={values.travelPlanSummary}
            onChange={(event) => setField('travelPlanSummary', event.target.value)}
            required
          />
        </label>
      ) : null}

      {hasField('funding_need_summary') ? (
        <label>
          Funding need summary
          <textarea
            rows={5}
            value={values.fundingNeedSummary}
            onChange={(event) => setField('fundingNeedSummary', event.target.value)}
            required
          />
        </label>
      ) : null}

      <div className="conference-form-actions">
        <button type="submit" disabled={blocked || status === 'saving'}>
          {status === 'saving' ? 'Saving...' : 'Save draft'}
        </button>
        <button
          type="button"
          onClick={() => void onSubmit()}
          disabled={!canSubmit || status === 'submitting' || status === 'submitted'}
        >
          {status === 'submitting' ? 'Submitting...' : 'Submit application'}
        </button>
      </div>
    </form>
  );
}
