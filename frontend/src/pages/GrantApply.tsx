import axios from 'axios';
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { fetchMyConferenceApplication } from '../api/conference';
import { fromTransportConferenceApplication } from '../features/conference/conferenceMappers';
import { conferenceProvider } from '../features/conference/conferenceProvider';
import type { ConferenceApplication } from '../features/conference/types';
import { GrantApplyForm } from '../features/grant/GrantApplyForm';
import { grantProvider } from '../features/grant/grantProvider';
import type {
  GrantApplication,
  GrantApplicationValues,
  GrantDetail,
  GrantFormSchema,
} from '../features/grant/types';
import './Conference.css';

export const routePath = '/grants/:slug/apply';

const isTestEnv = import.meta.env.MODE === 'test' || import.meta.env.VITEST;

const readLinkedConferenceApplication = async (conferenceId: string) => {
  if (isTestEnv) {
    return conferenceProvider.getMyConferenceApplication(conferenceId);
  }

  const token = localStorage.getItem('token');
  if (!token) {
    return null;
  }

  try {
    const response = await fetchMyConferenceApplication(token, conferenceId);
    return fromTransportConferenceApplication(response.application);
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      return null;
    }

    throw error;
  }
};

export default function GrantApply() {
  const { slug = '' } = useParams();
  const [grant, setGrant] = useState<GrantDetail | null | undefined>(undefined);
  const [schema, setSchema] = useState<GrantFormSchema>({ fields: [] });
  const [application, setApplication] = useState<GrantApplication | null>(null);
  const [prerequisite, setPrerequisite] = useState<ConferenceApplication | null>(null);
  const [status, setStatus] = useState<
    'idle' | 'saving' | 'submitting' | 'submitted' | 'conflict' | 'prerequisite' | 'error'
  >('idle');

  useEffect(() => {
    let active = true;

    setGrant(undefined);
    setSchema({ fields: [] });
    setApplication(null);
    setPrerequisite(null);
    setStatus('idle');

    grantProvider
      .getGrantBySlug(slug)
      .then(async (value) => {
        if (!active) {
          return;
        }

        setGrant(value);

        if (!value || !localStorage.getItem('token')) {
          return;
        }

        const [nextSchema, nextApplication, nextPrerequisite] = await Promise.all([
          grantProvider.getGrantApplicationForm(value.id),
          grantProvider.getMyGrantApplication(value.id),
          readLinkedConferenceApplication(value.linkedConferenceId),
        ]);

        if (active) {
          setSchema(nextSchema);
          setApplication(nextApplication);
          setPrerequisite(nextPrerequisite);
        }
      })
      .catch(() => {
        if (active) {
          setGrant(null);
          setStatus('error');
        }
      });

    return () => {
      active = false;
    };
  }, [slug]);

  if (grant === undefined) {
    return <div className="conference-page">Loading grant application...</div>;
  }

  if (grant === null) {
    return <div className="conference-page">Grant not found.</div>;
  }

  if (!localStorage.getItem('token')) {
    return (
      <div className="conference-page">
        <div className="conference-detail-card">
          <h1>Sign in to start a grant application</h1>
          <p>You need an authenticated session before creating a draft.</p>
          <Link className="conference-primary-link" to="/login">
            Go to login
          </Link>
        </div>
      </div>
    );
  }

  const linkedConferenceApplicationId =
    application?.linkedConferenceApplicationId ??
    (prerequisite?.status === 'submitted' ? prerequisite.id : '');
  const prerequisiteBlocked = !linkedConferenceApplicationId;

  const saveDraft = async (values: GrantApplicationValues) => {
    if (!linkedConferenceApplicationId) {
      setStatus('prerequisite');
      return;
    }

    try {
      setStatus('saving');

      const payload = {
        ...values,
        linkedConferenceApplicationId,
      };
      const nextApplication = application
        ? await grantProvider.updateGrantApplication(application.id, payload)
        : await grantProvider.createGrantApplication(grant.id, payload);

      setApplication(nextApplication);
      setStatus('idle');
    } catch (error) {
      const code = (error as { code?: string }).code;

      if (code === 'CONFLICT') {
        setStatus('conflict');
        return;
      }

      if (code === 'PREREQUISITE') {
        setStatus('prerequisite');
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
      const submitted = await grantProvider.submitGrantApplication(application.id);
      setApplication(submitted);
      setStatus('submitted');
    } catch (error) {
      if ((error as { code?: string }).code === 'PREREQUISITE') {
        setStatus('prerequisite');
        return;
      }

      setStatus('error');
    }
  };

  return (
    <div className="conference-page conference-detail-page">
      <header className="conference-hero">
        <p className="conference-eyebrow">Grant application</p>
        <h1>{grant.title}</h1>
        <p>
          Request travel support through a dedicated grant application after your conference
          application has already been submitted.
        </p>
      </header>

      {prerequisiteBlocked || status === 'prerequisite' ? (
        <div className="conference-inline-message error">
          Submit your conference application before requesting travel support.
        </div>
      ) : null}

      {status === 'conflict' ? (
        <div className="conference-inline-message error">
          An application draft already exists for this grant.
        </div>
      ) : null}

      {status === 'submitted' ? (
        <div className="conference-inline-message success">Application submitted.</div>
      ) : null}

      {status === 'idle' && application ? (
        <div className="conference-inline-message success">Draft saved.</div>
      ) : null}

      {status === 'error' ? (
        <div className="conference-inline-message error">
          We could not update the grant application right now.
        </div>
      ) : null}

      <section className="conference-detail-grid">
        <GrantApplyForm
          schema={schema}
          application={application}
          linkedConferenceApplicationId={linkedConferenceApplicationId}
          status={status}
          blocked={prerequisiteBlocked}
          onSave={saveDraft}
          onSubmit={submit}
        />

        <aside className="conference-detail-card conference-cta-card">
          <h2>Grant snapshot</h2>
          <p>{grant.coverageSummary || 'Coverage summary pending.'}</p>
          <p>{grant.eligibilitySummary || 'Eligibility summary pending.'}</p>
          <p>Deadline: {grant.applicationDeadline || 'Pending'}</p>
          <Link to={`/grants/${grant.slug}`}>Back to grant detail</Link>
        </aside>
      </section>
    </div>
  );
}
