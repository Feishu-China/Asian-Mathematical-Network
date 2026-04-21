import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ConferenceApplyForm } from '../features/conference/ConferenceApplyForm';
import { conferenceProvider } from '../features/conference/conferenceProvider';
import type {
  ConferenceApplication,
  ConferenceApplicationValues,
  ConferenceDetail,
  ConferenceFormSchema,
} from '../features/conference/types';
import './Conference.css';

export const routePath = '/conferences/:slug/apply';

export default function ConferenceApply() {
  const { slug = '' } = useParams();
  const [conference, setConference] = useState<ConferenceDetail | null | undefined>(undefined);
  const [schema, setSchema] = useState<ConferenceFormSchema>({ fields: [] });
  const [application, setApplication] = useState<ConferenceApplication | null>(null);
  const [status, setStatus] = useState<'idle' | 'saving' | 'submitting' | 'submitted' | 'conflict' | 'error'>(
    'idle'
  );

  useEffect(() => {
    let active = true;
    setApplication(null);
    setSchema({ fields: [] });

    conferenceProvider.getConferenceBySlug(slug).then(async (value) => {
      if (!active) {
        return;
      }

      setConference(value);

      if (!value) {
        return;
      }

      const [nextSchema, nextApplication] = await Promise.all([
        conferenceProvider.getConferenceApplicationForm(value.id),
        localStorage.getItem('token')
          ? conferenceProvider.getMyConferenceApplication(value.id)
          : Promise.resolve(null),
      ]);

      if (active) {
        setSchema(nextSchema);
        setApplication(nextApplication);
      }
    });

    return () => {
      active = false;
    };
  }, [slug]);

  if (conference === undefined) {
    return <div className="conference-page">Loading conference application...</div>;
  }

  if (conference === null) {
    return <div className="conference-page">Conference not found.</div>;
  }

  if (!localStorage.getItem('token')) {
    return (
      <div className="conference-page">
        <div className="conference-detail-card">
          <h1>Sign in to start a conference application</h1>
          <p>You need an authenticated session before creating a draft.</p>
          <Link className="conference-primary-link" to="/login">
            Go to login
          </Link>
        </div>
      </div>
    );
  }

  const saveDraft = async (values: ConferenceApplicationValues) => {
    try {
      setStatus('saving');

      const nextApplication = application
        ? await conferenceProvider.updateConferenceApplication(application.id, values)
        : await conferenceProvider.createConferenceApplication(conference.id, values);

      setApplication(nextApplication);
      setStatus('idle');
    } catch (error) {
      if ((error as { code?: string }).code === 'CONFLICT') {
        setStatus('conflict');
        return;
      }

      setStatus('error');
    }
  };

  const submit = async () => {
    if (!application) {
      return;
    }

    try {
      setStatus('submitting');
      const submitted = await conferenceProvider.submitConferenceApplication(application.id);
      setApplication(submitted);
      setStatus('submitted');
    } catch {
      setStatus('error');
    }
  };

  return (
    <div className="conference-page conference-detail-page">
      <header className="conference-hero">
        <p className="conference-eyebrow">Conference application</p>
        <h1>{conference.title}</h1>
        <p>Draft and submit your conference application without leaving the opportunity page.</p>
      </header>

      {status === 'conflict' ? (
        <div className="conference-inline-message error">
          An application draft already exists for this conference.
        </div>
      ) : null}

      {status === 'submitted' ? (
        <div className="conference-inline-message success">Application submitted.</div>
      ) : null}

      {status === 'idle' && application ? (
        <div className="conference-inline-message success">Draft saved.</div>
      ) : null}

      <ConferenceApplyForm
        schema={schema}
        application={application}
        status={status}
        onSave={saveDraft}
        onSubmit={submit}
      />
    </div>
  );
}
