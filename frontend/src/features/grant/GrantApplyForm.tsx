import { useEffect, useState } from 'react';
import { StatusBadge } from '../../components/ui/StatusBadge';
import type { GrantApplicantVisibleState } from './grantApplicantState';
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
  visibleState: GrantApplicantVisibleState;
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
  visibleState,
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
  const isSubmitted = application?.status === 'submitted';
  const canSubmit = Boolean(
    application &&
      values.statement.trim() &&
      values.travelPlanSummary.trim() &&
      values.fundingNeedSummary.trim() &&
      !blocked &&
      !isSubmitted
  );
  const badgeTone =
    status === 'error' || status === 'conflict'
      ? 'danger'
      : status === 'saving' || status === 'submitting'
          ? 'warning'
        : visibleState === 'released_result'
          ? 'success'
          : visibleState === 'draft_exists' || blocked
            ? 'warning'
            : 'info';
  const badgeText =
    status === 'error'
      ? 'Status: update failed'
      : status === 'conflict'
        ? 'Status: draft already exists'
        : status === 'saving'
          ? 'Status: saving draft'
          : status === 'submitting'
            ? 'Status: submitting'
            : visibleState === 'released_result'
              ? 'Applicant view: released outcome'
              : visibleState === 'submitted_under_review'
                ? 'Applicant view: under review'
                : visibleState === 'draft_exists'
                  ? 'Status: draft in progress'
                  : blocked
                    ? 'Status: not started'
                    : 'Status: not started';

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
        <StatusBadge tone={badgeTone}>{badgeText}</StatusBadge>
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
            disabled={isSubmitted}
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
            disabled={isSubmitted}
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
            disabled={isSubmitted}
            required
          />
        </label>
      ) : null}

      <div className="conference-form-actions">
        <button type="submit" disabled={blocked || status === 'saving' || isSubmitted}>
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
