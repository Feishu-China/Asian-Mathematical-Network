import { useEffect, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { WorkspaceShell } from '../components/layout/WorkspaceShell';
import { PageModeBadge } from '../components/ui/PageModeBadge';
import { RoleBadge } from '../components/ui/RoleBadge';
import { StatusBadge } from '../components/ui/StatusBadge';
import { ConferenceApplyForm } from '../features/conference/ConferenceApplyForm';
import { conferenceProvider } from '../features/conference/conferenceProvider';
import { readReturnContext, toReturnContextState } from '../features/navigation/returnContext';
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
  const location = useLocation();
  const returnContext = readReturnContext(location.state);
  const [conference, setConference] = useState<ConferenceDetail | null | undefined>(undefined);
  const [schema, setSchema] = useState<ConferenceFormSchema>({ fields: [] });
  const [application, setApplication] = useState<ConferenceApplication | null>(null);
  const [status, setStatus] = useState<'idle' | 'saving' | 'submitting' | 'submitted' | 'conflict' | 'error'>(
    'idle'
  );

  useEffect(() => {
    let active = true;

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
      <WorkspaceShell
        eyebrow="Conference application"
        title={conference.title}
        description="Sign in to continue the conference application flow."
        badges={
          <>
            <RoleBadge role="visitor" />
            <PageModeBadge mode="real-aligned" />
          </>
        }
      >
        <div className="conference-page">
          <div className="conference-detail-card">
            <h2>Sign in to start a conference application</h2>
            <p>You need an authenticated session before creating a draft.</p>
            <Link className="conference-primary-link" to="/login">
              Go to login
            </Link>
          </div>
        </div>
      </WorkspaceShell>
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
    <WorkspaceShell
      eyebrow="Conference application"
      title={conference.title}
      description="Draft and submit your conference application without leaving the opportunity page."
      badges={
        <>
          <RoleBadge role="applicant" />
          <PageModeBadge mode="real-aligned" />
          <StatusBadge tone={status === 'error' || status === 'conflict' ? 'danger' : 'info'}>
            Applicant flow
          </StatusBadge>
        </>
      }
      aside={
        <div className="conference-detail-card stack-sm">
          <h3>Event snapshot</h3>
          <p>{conference.locationText || 'Location pending'}</p>
          <p>
            {conference.startDate || 'Pending'} to {conference.endDate || 'Pending'}
          </p>
          <p>Deadline: {conference.applicationDeadline || 'Pending'}</p>
          <Link
            to={`/conferences/${conference.slug}`}
            state={toReturnContextState(returnContext)}
          >
            Back to conference detail
          </Link>
        </div>
      }
    >
      <div className="conference-page conference-detail-page">
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
          key={`${conference.id}:${application?.updatedAt ?? 'draft'}:${schema.fields.map((field) => field.key).join('|')}`}
          schema={schema}
          application={application}
          status={status}
          onSave={saveDraft}
          onSubmit={submit}
        />
      </div>
    </WorkspaceShell>
  );
}
