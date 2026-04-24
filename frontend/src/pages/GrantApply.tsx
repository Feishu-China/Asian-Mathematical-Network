import { useEffect, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { getMe } from '../api/auth';
import { WorkspaceShell } from '../components/layout/WorkspaceShell';
import { PageModeBadge } from '../components/ui/PageModeBadge';
import { RoleBadge } from '../components/ui/RoleBadge';
import { StatusBadge } from '../components/ui/StatusBadge';
import { conferenceProvider } from '../features/conference/conferenceProvider';
import { GrantApplyForm } from '../features/grant/GrantApplyForm';
import { GrantApplicationStatePanel } from '../features/grant/components/GrantApplicationStatePanel';
import { GrantApplicationSummaryCard } from '../features/grant/components/GrantApplicationSummaryCard';
import { GrantReleasedResultCard } from '../features/grant/components/GrantReleasedResultCard';
import {
  getDemoReleasedGrantResult,
  getGrantApplicantVisibleState,
} from '../features/grant/grantApplicantState';
import {
  buildSyntheticSchoolParticipation,
  getLinkedOpportunityCopy,
} from '../features/grant/linkedOpportunity';
import { readReturnContext, toReturnContextState } from '../features/navigation/returnContext';
import { grantProvider } from '../features/grant/grantProvider';
import type {
  GrantApplication,
  GrantApplicationValues,
  GrantDetail,
  GrantFormSchema,
  LinkedOpportunityType,
} from '../features/grant/types';
import './Conference.css';

export const routePath = '/grants/:slug/apply';

type GrantPrerequisite = {
  id: string;
  title: string | null;
  type: LinkedOpportunityType;
  status: 'draft' | 'submitted' | 'ready';
};

export default function GrantApply() {
  const { slug = '' } = useParams();
  const location = useLocation();
  const returnContext = readReturnContext(location.state);
  const [grant, setGrant] = useState<GrantDetail | null | undefined>(undefined);
  const [schema, setSchema] = useState<GrantFormSchema>({ fields: [] });
  const [application, setApplication] = useState<GrantApplication | null>(null);
  const [prerequisite, setPrerequisite] = useState<GrantPrerequisite | null>(null);
  const [viewerEmail, setViewerEmail] = useState<string | null>(null);
  const [status, setStatus] = useState<
    'idle' | 'saving' | 'submitting' | 'submitted' | 'conflict' | 'prerequisite' | 'error'
  >('idle');

  useEffect(() => {
    let active = true;

    setGrant(undefined);
    setSchema({ fields: [] });
    setApplication(null);
    setPrerequisite(null);
    setViewerEmail(null);
    setStatus('idle');

    grantProvider
      .getGrantBySlug(slug)
      .then(async (value) => {
        if (!active) {
          return;
        }

        setGrant(value);

        const token = localStorage.getItem('token');

        if (!value || !token) {
          return;
        }

        const [nextSchema, nextApplication, nextPrerequisite, me] = await Promise.all([
          grantProvider.getGrantApplicationForm(value.id),
          grantProvider.getMyGrantApplication(value.id),
          readGrantPrerequisite(value, token),
          getMe(token).catch(() => null),
        ]);

        if (active) {
          setSchema(nextSchema);
          setApplication(nextApplication);
          setPrerequisite(nextPrerequisite);
          setViewerEmail(me?.user?.email ?? null);
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

  const isSignedIn = Boolean(localStorage.getItem('token'));
  const linkedOpportunityCopy = getLinkedOpportunityCopy(grant.linkedOpportunityType);

  if (!isSignedIn) {
    return (
      <WorkspaceShell
        eyebrow="Grant application"
        title={grant.title}
        description="Sign in to continue the grant applicant slice in a grant-owned context."
        badges={
          <>
            <RoleBadge role="visitor" />
            <PageModeBadge mode="hybrid" />
            <StatusBadge tone="info">Grant applicant slice</StatusBadge>
          </>
        }
      >
        <div className="conference-page">
          <div className="conference-detail-card">
            <h2>Sign in to start a grant application</h2>
            <p>You need an authenticated session before creating a draft.</p>
            <Link className="conference-primary-link" to="/login">
              Go to login
            </Link>
          </div>
        </div>
      </WorkspaceShell>
    );
  }

  const prerequisiteReady = prerequisite?.status === 'submitted' || prerequisite?.status === 'ready';
  const linkedOpportunityApplicationId =
    application?.linkedOpportunityApplicationId ?? (prerequisiteReady ? prerequisite?.id ?? '' : '');
  const prerequisiteBlocked = !linkedOpportunityApplicationId;
  const releasedResult = getDemoReleasedGrantResult({
    application,
    viewerEmail,
    grantSlug: grant.slug,
  });
  const visibleState = getGrantApplicantVisibleState({
    application,
    prerequisiteReady: !prerequisiteBlocked,
    releasedResult,
  });
  const shellStatusTone =
    status === 'error' || status === 'conflict' || status === 'prerequisite'
      ? 'danger'
      : visibleState === 'released_result'
        ? 'success'
        : visibleState === 'draft_exists'
          ? 'warning'
          : 'info';

  const saveDraft = async (values: GrantApplicationValues) => {
    if (!linkedOpportunityApplicationId) {
      setStatus('prerequisite');
      return;
    }

    try {
      setStatus('saving');

      const payload = {
        ...values,
        linkedOpportunityApplicationId,
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
    <WorkspaceShell
      eyebrow="Grant application"
      title={grant.title}
      description={linkedOpportunityCopy.shellDescription}
      badges={
        <>
          <RoleBadge role="applicant" />
          <PageModeBadge mode="hybrid" />
          <StatusBadge tone={shellStatusTone}>Grant applicant slice</StatusBadge>
        </>
      }
      aside={
        <div className="conference-page">
          <GrantApplicationSummaryCard
            grant={grant}
            application={application}
            linkedOpportunityApplicationId={linkedOpportunityApplicationId}
            visibleState={visibleState}
          />
          <div className="conference-detail-card stack-sm">
            <h2>Grant snapshot</h2>
            <p>{grant.coverageSummary || 'Coverage summary pending.'}</p>
            <p>{grant.eligibilitySummary || 'Eligibility summary pending.'}</p>
            <p>Deadline: {grant.applicationDeadline || 'Pending'}</p>
            <Link to={`/grants/${grant.slug}`} state={toReturnContextState(returnContext)}>
              Back to grant detail
            </Link>
          </div>
        </div>
      }
    >
      <div className="conference-page conference-detail-page">
        {prerequisiteBlocked || status === 'prerequisite' ? (
          <div className="conference-inline-message error">
            {linkedOpportunityCopy.blockedMessage}
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

        {status === 'idle' && application?.status === 'draft' ? (
          <div className="conference-inline-message success">Draft saved.</div>
        ) : null}

        {status === 'error' ? (
          <div className="conference-inline-message error">
            We could not update the grant application right now.
          </div>
        ) : null}

        <GrantApplicationStatePanel
          state={visibleState}
          linkedOpportunityType={grant.linkedOpportunityType}
        />

        {releasedResult ? <GrantReleasedResultCard result={releasedResult} /> : null}

        <GrantApplyForm
          schema={schema}
          application={application}
          linkedOpportunityType={grant.linkedOpportunityType}
          linkedOpportunityApplicationId={linkedOpportunityApplicationId}
          visibleState={visibleState}
          status={status}
          blocked={prerequisiteBlocked}
          onSave={saveDraft}
          onSubmit={submit}
        />
      </div>
    </WorkspaceShell>
  );
}

const readGrantPrerequisite = async (
  grant: GrantDetail,
  token: string
): Promise<GrantPrerequisite | null> => {
  if (grant.linkedOpportunityType === 'school') {
    return buildSyntheticSchoolParticipation(
      grant.linkedOpportunityId,
      grant.linkedOpportunityTitle,
      token
    );
  }

  const conferenceApplication = await conferenceProvider.getMyConferenceApplication(
    grant.linkedOpportunityId
  );

  if (!conferenceApplication) {
    return null;
  }

  return {
    id: conferenceApplication.id,
    title: conferenceApplication.conferenceTitle,
    type: 'conference',
    status: conferenceApplication.status,
  };
};
