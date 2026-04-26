import { useEffect, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { WorkspaceShell } from '../components/layout/WorkspaceShell';
import { PageModeBadge } from '../components/ui/PageModeBadge';
import { RoleBadge } from '../components/ui/RoleBadge';
import { StatusBadge } from '../components/ui/StatusBadge';
import { ConferenceApplyForm } from '../features/conference/ConferenceApplyForm';
import { conferenceProvider } from '../features/conference/conferenceProvider';
import { DemoStatePanel } from '../features/demo/DemoStatePanel';
import { DemoStatusNotice } from '../features/demo/DemoStatusNotice';
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
  const [loadState, setLoadState] = useState<'loading' | 'ready' | 'not_found' | 'error'>(
    'loading'
  );
  const [schema, setSchema] = useState<ConferenceFormSchema>({ fields: [] });
  const [application, setApplication] = useState<ConferenceApplication | null>(null);
  const [status, setStatus] = useState<'idle' | 'saving' | 'submitting' | 'submitted' | 'conflict' | 'error'>(
    'idle'
  );
  const [notice, setNotice] = useState<null | {
    tone: 'info' | 'success' | 'warning' | 'danger';
    badgeLabel: string;
    title: string;
    description: string;
  }>(null);

  useEffect(() => {
    let active = true;

    setConference(undefined);
    setSchema({ fields: [] });
    setApplication(null);
    setStatus('idle');
    setLoadState('loading');
    setNotice(null);

    const load = async () => {
      try {
        const value = await conferenceProvider.getConferenceBySlug(slug);

        if (!active) {
          return;
        }

        setConference(value);

        if (!value) {
          setLoadState('not_found');
          return;
        }

        const [nextSchema, nextApplication] = await Promise.all([
          conferenceProvider.getConferenceApplicationForm(value.id),
          localStorage.getItem('token')
            ? conferenceProvider.getMyConferenceApplication(value.id)
            : Promise.resolve(null),
        ]);

        if (!active) {
          return;
        }

        setSchema(nextSchema);
        setApplication(nextApplication);
        setLoadState('ready');

        if (nextApplication?.status === 'submitted') {
          setStatus('submitted');
          setNotice({
            tone: 'success',
            badgeLabel: 'Submitted',
            title: 'Submitted and under review',
            description:
              'This conference application has already been submitted and is waiting for review.',
          });
        } else if (nextApplication) {
          setNotice({
            tone: 'warning',
            badgeLabel: 'Draft in progress',
            title: 'This conference application draft is already on file.',
            description: 'Keep editing the saved draft before submitting it into review.',
          });
        }
      } catch {
        if (active) {
          setConference(null);
          setLoadState('error');
        }
      }
    };

    void load();

    return () => {
      active = false;
    };
  }, [slug]);

  const isSignedIn = Boolean(localStorage.getItem('token'));

  if (loadState !== 'ready' || !conference) {
    return (
      <WorkspaceShell
        eyebrow="Conference application"
        title={conference?.title ?? 'Conference application'}
        description="Draft and submit your conference application without leaving the opportunity page."
        badges={
          <>
            <RoleBadge role={isSignedIn ? 'applicant' : 'visitor'} />
            <PageModeBadge mode="real-aligned" />
            <StatusBadge tone={loadState === 'error' ? 'danger' : 'info'}>
              {loadState === 'not_found'
                ? 'Unavailable'
                : loadState === 'error'
                  ? 'Load failed'
                  : 'Applicant flow'}
            </StatusBadge>
          </>
        }
      >
        <div className="conference-page">
          {loadState === 'loading' ? (
            <DemoStatePanel
              badgeLabel="Loading"
              title="Loading conference application"
              description="Preparing this conference application surface for the demo."
              tone="info"
            />
          ) : loadState === 'error' ? (
            <DemoStatePanel
              badgeLabel="Error"
              title="Conference application unavailable"
              description="We could not load this conference application right now."
              tone="danger"
              actions={
                <Link className="my-applications__section-link" to="/conferences">
                  Back to conferences
                </Link>
              }
            />
          ) : loadState === 'not_found' ? (
            <DemoStatePanel
              badgeLabel="Unavailable"
              title="Conference not found"
              description="This conference is not published or is unavailable in the current demo dataset."
              tone="neutral"
              actions={
                <Link className="my-applications__section-link" to="/conferences">
                  Back to conferences
                </Link>
              }
            />
          ) : (
            <DemoStatePanel
              badgeLabel="Sign in required"
              title="Sign in to start a conference application"
              description="You need an authenticated session before creating a draft."
              tone="info"
              actions={
                <Link className="conference-primary-link" to="/login">
                  Go to login
                </Link>
              }
            />
          )}
        </div>
      </WorkspaceShell>
    );
  }

  if (!isSignedIn) {
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
          <DemoStatePanel
            badgeLabel="Sign in required"
            title="Sign in to start a conference application"
            description="You need an authenticated session before creating a draft."
            tone="info"
            actions={
              <Link className="conference-primary-link" to="/login">
                Go to login
              </Link>
            }
          />
        </div>
      </WorkspaceShell>
    );
  }

  const saveDraft = async (values: ConferenceApplicationValues) => {
    setNotice(null);

    try {
      setStatus('saving');

      const nextApplication = application
        ? await conferenceProvider.updateConferenceApplication(application.id, values)
        : await conferenceProvider.createConferenceApplication(conference.id, values);

      setApplication(nextApplication);
      setStatus('idle');
      setNotice({
        tone: 'success',
        badgeLabel: 'Saved',
        title: 'Draft saved',
        description: 'You can keep editing this conference application before submitting it into review.',
      });
    } catch (error) {
      if ((error as { code?: string }).code === 'CONFLICT') {
        setStatus('conflict');
        setNotice({
          tone: 'danger',
          badgeLabel: 'Conflict',
          title: 'Draft already exists',
          description: 'An application draft already exists for this conference.',
        });
        return;
      }

      setStatus('error');
      setNotice({
        tone: 'danger',
        badgeLabel: 'Error',
        title: 'Conference application update failed',
        description: 'We could not save your conference application right now.',
      });
    }
  };

  const submit = async () => {
    if (!application) {
      return;
    }

    setNotice(null);

    try {
      setStatus('submitting');
      const submitted = await conferenceProvider.submitConferenceApplication(application.id);
      setApplication(submitted);
      setStatus('submitted');
      setNotice({
        tone: 'success',
        badgeLabel: 'Submitted',
        title: 'Application submitted',
        description: 'The applicant view now reflects the submitted record and waits for review.',
      });
    } catch {
      setStatus('error');
      setNotice({
        tone: 'danger',
        badgeLabel: 'Error',
        title: 'Conference application submission failed',
        description: 'We could not submit this conference application right now.',
      });
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
        {notice ? (
          <DemoStatusNotice
            tone={notice.tone}
            badgeLabel={notice.badgeLabel}
            title={notice.title}
            description={notice.description}
          />
        ) : null}

        {!application && status === 'idle' ? (
          <DemoStatePanel
            badgeLabel="Empty"
            title="No draft started yet"
            description="Start a conference application draft here and keep it separate from any later grant request."
            tone="neutral"
          />
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
