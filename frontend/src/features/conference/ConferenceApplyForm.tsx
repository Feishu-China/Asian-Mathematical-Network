import { useId, useMemo, useState } from 'react';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { participationTypeOptions } from './conferenceFields';
import type {
  ConferenceApplication,
  ConferenceApplicationValues,
  ConferenceFormSchema,
} from './types';

type Props = {
  schema: ConferenceFormSchema;
  application: ConferenceApplication | null;
  status: 'idle' | 'saving' | 'submitting' | 'submitted' | 'conflict' | 'error';
  onSave: (values: ConferenceApplicationValues) => Promise<void>;
  onSubmit: () => Promise<void>;
};

const toValues = (application: ConferenceApplication | null): ConferenceApplicationValues => ({
  participationType: application?.participationType ?? '',
  statement: application?.statement ?? '',
  abstractTitle: application?.abstractTitle ?? '',
  abstractText: application?.abstractText ?? '',
  interestedInTravelSupport: application?.interestedInTravelSupport ?? false,
  extraAnswers: application?.extraAnswers ?? {},
});

const presentationTypes = new Set(['talk', 'poster']);

export function ConferenceApplyForm({ schema, application, status, onSave, onSubmit }: Props) {
  const [values, setValues] = useState<ConferenceApplicationValues>(() => toValues(application));
  const isLocked = application?.status === 'submitted' || status === 'submitted';
  const participationTypeFieldId = useId();
  const participationTypeHelpId = useId();

  const fieldKeys = useMemo(() => new Set(schema.fields.map((field) => field.key)), [schema]);

  const isPresentationSubmission = presentationTypes.has(values.participationType);
  const requiresAbstractTitle = isPresentationSubmission && fieldKeys.has('abstract_title');
  const requiresAbstractText = isPresentationSubmission && fieldKeys.has('abstract_text');
  const showAbstractFields = isPresentationSubmission && (requiresAbstractTitle || requiresAbstractText);
  const canSubmit =
    Boolean(values.participationType && values.statement.trim()) &&
    (!requiresAbstractTitle || Boolean(values.abstractTitle.trim())) &&
    (!requiresAbstractText || Boolean(values.abstractText.trim()));
  const submitDisabled = !application || !canSubmit || status === 'submitting' || isLocked;

  const participationGuidance = useMemo(() => {
    if (values.participationType === 'participant') {
      return 'You only need a short statement for participant registration.';
    }

    if (isPresentationSubmission) {
      return 'An abstract title and abstract text are required for presentation submissions.';
    }

    return 'Select a participation type to see what materials are required.';
  }, [isPresentationSubmission, values.participationType]);

  const submitHint = useMemo(() => {
    if (isLocked || status === 'submitting') {
      return null;
    }

    if (!application) {
      return 'Save this draft once before submitting.';
    }

    if (!values.participationType) {
      return 'Participation type is required before submitting.';
    }

    if (!values.statement.trim()) {
      return 'Statement is required before submitting.';
    }

    if (isPresentationSubmission) {
      const missingAbstractTitle = !values.abstractTitle.trim();
      const missingAbstractText = !values.abstractText.trim();
      const submissionType = values.participationType;

      if (requiresAbstractTitle && requiresAbstractText && missingAbstractTitle && missingAbstractText) {
        return `Abstract title and abstract text are required for ${submissionType} submissions.`;
      }

      if (requiresAbstractTitle && missingAbstractTitle) {
        return `Abstract title is required for ${submissionType} submissions.`;
      }

      if (requiresAbstractText && missingAbstractText) {
        return `Abstract text is required for ${submissionType} submissions.`;
      }
    }

    return null;
  }, [application, isLocked, isPresentationSubmission, requiresAbstractText, requiresAbstractTitle, status, values]);

  const setField = <K extends keyof ConferenceApplicationValues>(
    key: K,
    value: ConferenceApplicationValues[K]
  ) => {
    setValues((current) => ({ ...current, [key]: value }));
  };

  const badgeTone =
    status === 'submitted'
      ? 'success'
      : status === 'saving' || status === 'submitting'
        ? 'warning'
        : status === 'conflict' || status === 'error'
          ? 'danger'
          : 'info';

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
          <h2>Conference application</h2>
          <p className="conference-muted-note">
            Conference and grant applications stay separate, even when they later share workflow components.
          </p>
        </div>
        <StatusBadge tone={badgeTone}>Status: {application?.status ?? 'not started'}</StatusBadge>
      </header>

      <div className="conference-form-field">
        <label className="conference-field-label" htmlFor={participationTypeFieldId}>
          Participation type <span className="conference-required-indicator" aria-hidden="true">*</span>
        </label>
        <select
          id={participationTypeFieldId}
          value={values.participationType}
          onChange={(event) => setField('participationType', event.target.value)}
          disabled={isLocked}
          aria-describedby={participationTypeHelpId}
          required
        >
          <option value="">Select one</option>
          {participationTypeOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        <span id={participationTypeHelpId} className="conference-field-help">
          {participationGuidance}
        </span>
      </div>

      <label>
        <span className="conference-field-label">
          Statement <span className="conference-required-indicator" aria-hidden="true">*</span>
        </span>
        <textarea
          rows={5}
          value={values.statement}
          onChange={(event) => setField('statement', event.target.value)}
          disabled={isLocked}
          required
        />
      </label>

      {showAbstractFields && fieldKeys.has('abstract_title') ? (
        <label>
          <span className="conference-field-label">
            Abstract title <span className="conference-required-indicator" aria-hidden="true">*</span>
          </span>
          <input
            value={values.abstractTitle}
            onChange={(event) => setField('abstractTitle', event.target.value)}
            disabled={isLocked}
          />
        </label>
      ) : null}

      {showAbstractFields && fieldKeys.has('abstract_text') ? (
        <label>
          <span className="conference-field-label">
            Abstract text <span className="conference-required-indicator" aria-hidden="true">*</span>
          </span>
          <textarea
            rows={5}
            value={values.abstractText}
            onChange={(event) => setField('abstractText', event.target.value)}
            disabled={isLocked}
          />
        </label>
      ) : null}

      {fieldKeys.has('interested_in_travel_support') ? (
        <label className="conference-toggle">
          <input
            type="checkbox"
            checked={values.interestedInTravelSupport}
            onChange={(event) => setField('interestedInTravelSupport', event.target.checked)}
            disabled={isLocked}
          />
          Interested in travel support
        </label>
      ) : null}

      <div className="conference-form-actions">
        <button type="submit" disabled={status === 'saving' || isLocked}>
          {status === 'saving' ? 'Saving...' : 'Save draft'}
        </button>
        <button
          type="button"
          onClick={() => void onSubmit()}
          disabled={submitDisabled}
        >
          {status === 'submitting' ? 'Submitting...' : 'Submit application'}
        </button>
      </div>
      {submitHint ? (
        <p className="conference-submit-hint" aria-live="polite">
          {submitHint}
        </p>
      ) : null}
    </form>
  );
}
