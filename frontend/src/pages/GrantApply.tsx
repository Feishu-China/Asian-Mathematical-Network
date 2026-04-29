import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { getMe } from '../api/auth';
import { WorkspaceShell } from '../components/layout/WorkspaceShell';
import { PageModeBadge } from '../components/ui/PageModeBadge';
import { RoleBadge } from '../components/ui/RoleBadge';
import { StatusBadge } from '../components/ui/StatusBadge';
import { conferenceProvider } from '../features/conference/conferenceProvider';
import { DemoStatePanel } from '../features/demo/DemoStatePanel';
import { DemoStatusNotice } from '../features/demo/DemoStatusNotice';
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
import { toReturnToState } from '../features/navigation/authReturn';
import { readReturnContext, toReturnContextState } from '../features/navigation/returnContext';
import { buildWorkspaceAccountMenu } from '../features/navigation/workspaceAccountMenu';
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
  const navigate = useNavigate();
  const returnContext = readReturnContext(location.state);
  const isSignedIn = Boolean(localStorage.getItem('token'));
  const accountMenu = isSignedIn
    ? buildWorkspaceAccountMenu(() => {
        localStorage.removeItem('token');
        navigate('/portal');
      })
    : undefined;
  const [grant, setGrant] = useState<GrantDetail | null | undefined>(undefined);
  const [loadState, setLoadState] = useState<'loading' | 'ready' | 'not_found' | 'error'>(
    'loading'
  );
  const [schema, setSchema] = useState<GrantFormSchema>({ fields: [] });
  const [application, setApplication] = useState<GrantApplication | null>(null);
  const [prerequisite, setPrerequisite] = useState<GrantPrerequisite | null>(null);
  const [viewerEmail, setViewerEmail] = useState<string | null>(null);
  const [status, setStatus] = useState<
    'idle' | 'saving' | 'submitting' | 'submitted' | 'conflict' | 'prerequisite' | 'error'
  >('idle');
  const [notice, setNotice] = useState<null | {
    tone: 'success' | 'warning' | 'danger';
    badgeLabel: string;
    title: string;
    description: string;
  }>(null);

  useEffect(() => {
    let active = true;

    setGrant(undefined);
    setLoadState('loading');
    setSchema({ fields: [] });
    setApplication(null);
    setPrerequisite(null);
    setViewerEmail(null);
    setStatus('idle');
    setNotice(null);

    grantProvider
      .getGrantBySlug(slug)
      .then(async (value) => {
        if (!active) {
          return;
        }

        setGrant(value);

        const token = localStorage.getItem('token');

        if (!value) {
          setLoadState('not_found');
          return;
        }

        if (!token) {
          setLoadState('ready');
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
          setLoadState('ready');

          if (nextApplication?.status === 'draft') {
            setNotice({
              tone: 'warning',
              badgeLabel: 'Draft in progress',
              title: 'This grant application draft is already on file.',
              description: 'Keep editing the saved draft before submitting it into review.',
            });
          }
        }
      })
      .catch(() => {
        if (active) {
          setGrant(null);
          setLoadState('error');
        }
      });

    return () => {
      active = false;
    };
  }, [slug]);

  if (loadState !== 'ready' || !grant) {
    return (
      <WorkspaceShell
        eyebrow="Grant application"
        title={grant?.title ?? 'Grant application'}
        description="Request travel support through a dedicated grant-owned applicant flow."
        badges={
          <>
            <RoleBadge role={isSignedIn ? 'applicant' : 'visitor'} />
            <PageModeBadge mode="hybrid" />
            <StatusBadge tone={loadState === 'error' ? 'danger' : 'info'}>
              {loadState === 'not_found'
                ? 'Unavailable'
                : loadState === 'error'
                  ? 'Load failed'
                : 'Grant applicant slice'}
            </StatusBadge>
          </>
        }
        accountMenu={accountMenu}
      >
        <div className="conference-page">
          {loadState === 'loading' ? (
            <DemoStatePanel
              badgeLabel="Loading"
              title="Loading grant application"
              description="Preparing this grant application surface for the demo."
              tone="info"
            />
          ) : loadState === 'error' ? (
            <DemoStatePanel
              badgeLabel="Error"
              title="Grant application unavailable"
              description="We could not load this grant application right now."
              tone="danger"
              actions={
                <Link className="my-applications__section-link" to="/grants">
                  Back to grants
                </Link>
              }
            />
          ) : (
            <DemoStatePanel
              badgeLabel="Unavailable"
              title="Grant not found"
              description="This grant is not published or is unavailable in the current demo dataset."
              tone="neutral"
              actions={
                <Link className="my-applications__section-link" to="/grants">
                  Back to grants
                </Link>
              }
            />
          )}
        </div>
      </WorkspaceShell>
    );
  }

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
        accountMenu={accountMenu}
      >
        <div className="conference-page">
          <DemoStatePanel
            badgeLabel="Sign in required"
            title="Sign in to start a grant application"
            description="You need an authenticated session before creating a draft."
            tone="info"
            actions={
              <Link
                className="conference-primary-link"
                to="/login"
                state={toReturnToState(location.pathname)}
              >
                Go to login
              </Link>
            }
          />
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
    setNotice(null);

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
      setNotice({
        tone: 'success',
        badgeLabel: 'Saved',
        title: 'Draft saved',
        description: 'You can keep editing this grant application before submitting it into review.',
      });
    } catch (error) {
      const code = (error as { code?: string }).code;

      if (code === 'CONFLICT') {
        setStatus('conflict');
        setNotice({
          tone: 'danger',
          badgeLabel: 'Conflict',
          title: 'Draft already exists',
          description: 'An application draft already exists for this grant.',
        });
        return;
      }

      if (code === 'PREREQUISITE') {
        setStatus('prerequisite');
        return;
      }

      setStatus('error');
      setNotice({
        tone: 'danger',
        badgeLabel: 'Error',
        title: 'Grant application update failed',
        description: 'We could not save your grant application right now.',
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
      const submitted = await grantProvider.submitGrantApplication(application.id);
      setApplication(submitted);
      setStatus('submitted');
      setNotice({
        tone: 'success',
        badgeLabel: 'Submitted',
        title: 'Application submitted',
        description: 'The applicant view now reflects the submitted grant record and waits for review.',
      });
    } catch (error) {
      if ((error as { code?: string }).code === 'PREREQUISITE') {
        setStatus('prerequisite');
        return;
      }

      setStatus('error');
      setNotice({
        tone: 'danger',
        badgeLabel: 'Error',
        title: 'Grant application submission failed',
        description: 'We could not submit this grant application right now.',
      });
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
      accountMenu={accountMenu}
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
          <DemoStatusNotice
            tone="warning"
            badgeLabel="Prerequisite"
            title="Grant application blocked"
            description={linkedOpportunityCopy.blockedMessage}
          />
        ) : null}

        {notice ? (
          <DemoStatusNotice
            tone={notice.tone}
            badgeLabel={notice.badgeLabel}
            title={notice.title}
            description={notice.description}
          />
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
