import { useState } from 'react';
import { ConferenceEditorForm } from '../features/conference/ConferenceEditorForm';
import { conferenceProvider } from '../features/conference/conferenceProvider';
import type { ConferenceEditorValues } from '../features/conference/types';
import './Conference.css';

export const routePath = '/organizer/conferences/new';

const emptyValues: ConferenceEditorValues = {
  slug: '',
  title: '',
  shortName: '',
  locationText: '',
  startDate: '',
  endDate: '',
  description: '',
  applicationDeadline: '',
  includeAbstractFields: true,
  includeTravelSupportQuestion: true,
};

export default function OrganizerConferenceNew() {
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'publishing' | 'closing' | 'error'>(
    'idle'
  );
  const [createdConferenceId, setCreatedConferenceId] = useState<string | null>(null);

  return (
    <div className="conference-page">
      <ConferenceEditorForm
        key="new-conference-draft"
        title="New conference draft"
        initialValues={emptyValues}
        status={status}
        onSave={async (values) => {
          setStatus('saving');

          try {
            const created = await conferenceProvider.createOrganizerConference(values);
            setCreatedConferenceId(created.id);
            setStatus('saved');
          } catch {
            setStatus('error');
          }
        }}
      />

      {status === 'saved' ? (
        <div className="conference-inline-message success">
          Draft saved. Conference id: {createdConferenceId}
        </div>
      ) : null}
    </div>
  );
}
