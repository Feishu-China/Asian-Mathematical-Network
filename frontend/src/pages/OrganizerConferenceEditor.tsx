import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useParams } from 'react-router-dom';
import { ConferenceEditorForm } from '../features/conference/ConferenceEditorForm';
import { fromTransportOrganizerConference } from '../features/conference/conferenceMappers';
import { conferenceProvider } from '../features/conference/conferenceProvider';
import type { ConferenceEditorValues, OrganizerConference } from '../features/conference/types';
import './Conference.css';

export const routePath = '/organizer/conferences/:id';

const toEditorValues = (conference: OrganizerConference): ConferenceEditorValues =>
  fromTransportOrganizerConference({
    id: conference.id,
    slug: conference.slug,
    title: conference.title,
    short_name: conference.shortName,
    location_text: conference.locationText,
    start_date: conference.startDate,
    end_date: conference.endDate,
    description: conference.description,
    application_deadline: conference.applicationDeadline,
    status: conference.status,
    application_form_schema: conference.applicationFormSchema,
    settings: conference.settings,
    published_at: conference.publishedAt,
    closed_at: conference.closedAt,
    staff: conference.staff.map((member) => ({
      user_id: member.userId,
      staff_role: member.staffRole,
    })),
  }).values;

export default function OrganizerConferenceEditor() {
  const { id = '' } = useParams();
  const [conference, setConference] = useState<OrganizerConference | null | undefined>(undefined);
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'publishing' | 'closing' | 'error'>(
    'idle'
  );

  useEffect(() => {
    conferenceProvider
      .getOrganizerConference(id)
      .then(setConference)
      .catch(() => setConference(null));
  }, [id]);

  if (conference === undefined) {
    return <div className="conference-page">Loading organizer conference...</div>;
  }

  if (conference === null) {
    return <div className="conference-page">Conference not found.</div>;
  }

  return (
    <div className="conference-page">
      <ConferenceEditorForm
        key={`${conference.id}:${conference.status}:${conference.slug}`}
        title={conference.title}
        conference={conference}
        initialValues={toEditorValues(conference)}
        status={status}
        onSave={async (values) => {
          setStatus('saving');

          try {
            const updated = await conferenceProvider.updateOrganizerConference(id, values);
            setConference(updated);
            setStatus('saved');
          } catch {
            setStatus('error');
          }
        }}
        onPublish={async (values) => {
          setStatus('publishing');

          try {
            const updated = await conferenceProvider.updateOrganizerConference(id, values);
            setConference(updated);
            const published = await conferenceProvider.publishOrganizerConference(id);
            setConference(published);
            setStatus('saved');
          } catch {
            setStatus('error');
          }
        }}
        onClose={async () => {
          setStatus('closing');

          try {
            const closed = await conferenceProvider.closeOrganizerConference(id);
            setConference(closed);
            setStatus('saved');
          } catch {
            setStatus('error');
          }
        }}
      />

      <div className="conference-detail-card">
        <h3>Review workflow</h3>
        <p>Open the organizer application queue once you are ready to assign reviewers and manage decisions.</p>
        <Link className="conference-primary-link" to={`/organizer/conferences/${conference.id}/applications`}>
          Open conference applications
        </Link>
      </div>
    </div>
  );
}
