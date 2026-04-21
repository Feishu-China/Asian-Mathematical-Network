import { useEffect, useMemo, useState } from 'react';
import type { ConferenceEditorValues, OrganizerConference } from './types';

type Props = {
  title: string;
  initialValues: ConferenceEditorValues;
  conference?: OrganizerConference;
  status: 'idle' | 'saving' | 'saved' | 'publishing' | 'closing' | 'error';
  onSave: (values: ConferenceEditorValues) => Promise<void>;
  onPublish?: (values: ConferenceEditorValues) => Promise<void>;
  onClose?: () => Promise<void>;
};

const isPublishReady = (values: ConferenceEditorValues) =>
  Boolean(
    values.slug.trim() &&
      values.title.trim() &&
      values.locationText.trim() &&
      values.startDate &&
      values.endDate &&
      values.description.trim() &&
      values.applicationDeadline
  );

export function ConferenceEditorForm({
  title,
  initialValues,
  conference,
  status,
  onSave,
  onPublish,
  onClose,
}: Props) {
  const [values, setValues] = useState(initialValues);

  useEffect(() => {
    setValues(initialValues);
  }, [initialValues]);

  const publishReady = useMemo(() => isPublishReady(values), [values]);

  const setField = <K extends keyof ConferenceEditorValues>(key: K, value: ConferenceEditorValues[K]) => {
    setValues((current) => ({ ...current, [key]: value }));
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
          <p className="conference-eyebrow">Organizer workspace</p>
          <h1>{title}</h1>
          <p className="conference-muted-note">
            The application form editor intentionally supports only the current M2 field subset.
          </p>
        </div>
        <div className="conference-status-badge">status: {conference?.status ?? 'draft'}</div>
      </header>

      <div className="conference-form-grid">
        <label>
          Title
          <input value={values.title} onChange={(event) => setField('title', event.target.value)} required />
        </label>
        <label>
          Slug
          <input value={values.slug} onChange={(event) => setField('slug', event.target.value)} required />
        </label>
        <label>
          Short name
          <input value={values.shortName} onChange={(event) => setField('shortName', event.target.value)} />
        </label>
        <label>
          Location
          <input
            value={values.locationText}
            onChange={(event) => setField('locationText', event.target.value)}
          />
        </label>
        <label>
          Start date
          <input
            value={values.startDate}
            onChange={(event) => setField('startDate', event.target.value)}
            placeholder="2026-10-11"
          />
        </label>
        <label>
          End date
          <input
            value={values.endDate}
            onChange={(event) => setField('endDate', event.target.value)}
            placeholder="2026-10-15"
          />
        </label>
        <label>
          Application deadline
          <input
            value={values.applicationDeadline}
            onChange={(event) => setField('applicationDeadline', event.target.value)}
            placeholder="2026-09-15T23:59:59.000Z"
          />
        </label>
      </div>

      <label>
        Description
        <textarea
          rows={5}
          value={values.description}
          onChange={(event) => setField('description', event.target.value)}
        />
      </label>

      <div className="conference-toggle-grid">
        <label className="conference-toggle">
          <input
            type="checkbox"
            checked={values.includeAbstractFields}
            onChange={(event) => setField('includeAbstractFields', event.target.checked)}
          />
          Include abstract fields
        </label>
        <label className="conference-toggle">
          <input
            type="checkbox"
            checked={values.includeTravelSupportQuestion}
            onChange={(event) => setField('includeTravelSupportQuestion', event.target.checked)}
          />
          Include travel-support intent checkbox
        </label>
      </div>

      <div className="conference-publish-hint">
        {publishReady
          ? 'This draft is publish-ready.'
          : 'Publish requires title, slug, location, dates, description, and application deadline.'}
      </div>

      <div className="conference-form-actions">
        <button type="submit" disabled={status === 'saving'}>
          {status === 'saving' ? 'Saving...' : 'Save draft'}
        </button>
        {onPublish ? (
          <button
            type="button"
            onClick={() => void onPublish(values)}
            disabled={!publishReady || status === 'publishing'}
          >
            {status === 'publishing' ? 'Publishing...' : 'Publish conference'}
          </button>
        ) : null}
        {onClose ? (
          <button type="button" onClick={() => void onClose()} disabled={status === 'closing'}>
            {status === 'closing' ? 'Closing...' : 'Close conference'}
          </button>
        ) : null}
      </div>
    </form>
  );
}
