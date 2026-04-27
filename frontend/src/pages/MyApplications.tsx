import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { WorkspaceShell } from '../components/layout/WorkspaceShell';
import { PageModeBadge } from '../components/ui/PageModeBadge';
import { RoleBadge } from '../components/ui/RoleBadge';
import { StatusBadge } from '../components/ui/StatusBadge';
import { dashboardProvider } from '../features/dashboard/dashboardProvider';
import { DemoStatePanel } from '../features/demo/DemoStatePanel';
import type {
  MyApplication,
  NextAction,
  ReleasedDecisionFinalStatus,
  ViewerStatus,
} from '../features/dashboard/types';
import { DemoShortcutPanel } from '../features/demo/DemoShortcutPanel';
import {
  buildChainedReturnState,
  DASHBOARD_RETURN_CONTEXT,
  demoWalkthroughCopy,
  DEMO_PRIMARY_CONFERENCE_LIST_PATH,
  MY_APPLICATIONS_RETURN_CONTEXT,
} from '../features/demo/demoWalkthrough';
import { toReturnToState } from '../features/navigation/authReturn';
import { readReturnContext, type ReturnContextState } from '../features/navigation/returnContext';
import { buildWorkspaceAccountMenu } from '../features/navigation/workspaceAccountMenu';
import './MyApplications.css';

export const routePath = '/me/applications';

type Bucket = {
  conference: MyApplication[];
  grant: MyApplication[];
};

type BadgeTone = 'neutral' | 'info' | 'success' | 'warning' | 'danger';

const VIEWER_STATUS_TONES: Record<ViewerStatus, BadgeTone> = {
  draft: 'neutral',
  under_review: 'warning',
  result_released: 'info',
};

const VIEWER_STATUS_LABELS: Record<ViewerStatus, string> = {
  draft: 'Draft',
  under_review: 'Under review',
  result_released: 'Result released',
};

const FINAL_STATUS_TONES: Record<ReleasedDecisionFinalStatus, BadgeTone> = {
  accepted: 'success',
  waitlisted: 'warning',
  rejected: 'danger',
};

const NEXT_ACTION_LABELS: Record<NextAction, string> = {
  continue_draft: 'Continue draft',
  view_submission: 'View submission',
  view_result: 'View result',
  submit_post_visit_report: 'Submit post-visit report',
};

const buildApplicationNextStepTarget = (item: MyApplication) => {
  if (item.nextAction === 'continue_draft' && item.sourceSlug) {
    return item.applicationType === 'conference_application'
      ? `/conferences/${item.sourceSlug}/apply`
      : `/grants/${item.sourceSlug}/apply`;
  }

  return `/me/applications/${item.id}`;
};

const splitByKind = (items: MyApplication[]): Bucket =>
  items.reduce<Bucket>(
    (acc, item) => {
      if (item.applicationType === 'conference_application') {
        acc.conference.push(item);
      } else {
        acc.grant.push(item);
      }
      return acc;
    },
    { conference: [], grant: [] }
  );

const renderStatusBadge = (item: MyApplication) => {
  if (item.viewerStatus === 'result_released' && item.releasedDecision) {
    return (
      <StatusBadge tone={FINAL_STATUS_TONES[item.releasedDecision.finalStatus]}>
        {item.releasedDecision.displayLabel}
      </StatusBadge>
    );
  }

  return (
    <StatusBadge tone={VIEWER_STATUS_TONES[item.viewerStatus]}>
      {VIEWER_STATUS_LABELS[item.viewerStatus]}
    </StatusBadge>
  );
};

export default function MyApplications() {
  const navigate = useNavigate();
  const location = useLocation();
  const [items, setItems] = useState<MyApplication[] | null>(null);
  const [hasError, setHasError] = useState(false);
  const returnContext = readReturnContext(location.state);
  const accountMenu = buildWorkspaceAccountMenu(() => {
    localStorage.removeItem('token');
    navigate('/portal');
  });
  const sectionReturnState = buildChainedReturnState(MY_APPLICATIONS_RETURN_CONTEXT, returnContext);
  const primaryWalkthroughShortcut =
    items && items.length > 0
      ? {
          to: `/me/applications/${items[0].id}`,
          state: sectionReturnState,
          label: 'Open latest walkthrough record',
          description:
            'Jump directly into the most recent applicant record used for the demo rehearsal.',
        }
      : {
          to: DEMO_PRIMARY_CONFERENCE_LIST_PATH,
          state: sectionReturnState,
          label: 'Start from published conferences',
          description:
            'Use the stable conference list to create a real applicant record before returning here.',
        };

  useEffect(() => {
    let active = true;

    if (!localStorage.getItem('token')) {
      navigate('/login', { state: toReturnToState(location.pathname) });
      return;
    }

    setHasError(false);
    setItems(null);

    dashboardProvider
      .listMyApplications()
      .then((value) => {
        if (active) {
          setItems(value);
        }
      })
      .catch(() => {
        if (active) {
          setHasError(true);
          setItems([]);
        }
      });

    return () => {
      active = false;
    };
  }, [location.pathname, navigate]);

  const buckets = items ? splitByKind(items) : null;

  return (
    <WorkspaceShell
      eyebrow="Applicant workspace"
      title="My applications"
      description="Conference and travel grant applications you've started or submitted."
      badges={
        <>
          <RoleBadge role="applicant" />
          <PageModeBadge mode="real-aligned" />
          <StatusBadge tone="info">My applications</StatusBadge>
        </>
      }
      actions={
        <Link
          to={returnContext?.to ?? DASHBOARD_RETURN_CONTEXT.to}
          state={returnContext?.state}
          className="my-applications__section-link"
        >
          {returnContext?.label ?? DASHBOARD_RETURN_CONTEXT.label}
        </Link>
      }
      accountMenu={accountMenu}
    >
      {items === null ? (
        <DemoStatePanel
          className="dashboard-widget"
          badgeLabel="Loading"
          title="Loading your applications"
          description="Preparing the applicant record list used as the main demo control point."
          tone="info"
        />
      ) : hasError ? (
        <DemoStatePanel
          className="dashboard-widget"
          badgeLabel="Error"
          title="My applications unavailable"
          description="We could not load your application records right now."
          tone="danger"
          actions={
            <Link to="/portal" className="my-applications__section-link">
              Restart from portal
            </Link>
          }
        />
      ) : (
        <div className="my-applications">
          <DemoShortcutPanel
            className="dashboard-widget"
            title={demoWalkthroughCopy.applications.title}
            intro={demoWalkthroughCopy.applications.intro}
            shortcuts={[
              primaryWalkthroughShortcut,
              {
                to: '/portal',
                label: 'Restart from portal',
                description: 'Return to the public entry if you need to re-run the demo from the beginning.',
              },
            ]}
          />

          <ApplicationSection
            heading="Conference applications"
            items={buckets?.conference ?? []}
            emptyHint="You have no conference applications yet."
            browseLink={{
              to: '/conferences',
              label: 'Browse conferences',
              state: sectionReturnState,
            }}
            untitledFallback="Untitled conference"
            detailState={sectionReturnState}
          />

          <ApplicationSection
            heading="Travel grant applications"
            items={buckets?.grant ?? []}
            emptyHint="You have no travel grant applications yet."
            browseLink={{
              to: '/grants',
              label: 'Browse grants',
              state: sectionReturnState,
            }}
            untitledFallback="Untitled grant"
            detailState={sectionReturnState}
          />
        </div>
      )}
    </WorkspaceShell>
  );
}

type ApplicationSectionProps = {
  heading: string;
  items: MyApplication[];
  emptyHint: string;
  browseLink: { to: string; label: string; state?: ReturnContextState };
  untitledFallback: string;
  detailState?: ReturnContextState;
};

function ApplicationSection({
  heading,
  items,
  emptyHint,
  browseLink,
  untitledFallback,
  detailState,
}: ApplicationSectionProps) {
  return (
    <section className="dashboard-widget" aria-labelledby={`section-${heading}`}>
      <header className="my-applications__section-header">
        <h2 id={`section-${heading}`}>{heading}</h2>
        <Link to={browseLink.to} state={browseLink.state} className="my-applications__section-link">
          {browseLink.label}
        </Link>
      </header>

      {items.length === 0 ? (
        <DemoStatePanel
          badgeLabel="Empty"
          title={emptyHint}
          description="Use the browse link in this section to start a new record."
          tone="neutral"
          compact
        />
      ) : (
        <ul className="my-applications__list">
          {items.map((item) => (
            <li key={item.id} className="surface-card my-applications__row">
              <div className="my-applications__row-meta">
                <h3>{item.sourceTitle ?? untitledFallback}</h3>
                {renderStatusBadge(item)}
              </div>
              {item.linkedConferenceTitle ? (
                <p className="my-applications__row-linked">
                  Linked conference: {item.linkedConferenceTitle}
                </p>
              ) : null}
              {item.submittedAt ? (
                <p className="my-applications__row-timestamp">
                  Submitted {new Date(item.submittedAt).toLocaleDateString()}
                </p>
              ) : null}
              <p className="my-applications__row-next-action" aria-label="Next step">
                <Link
                  to={buildApplicationNextStepTarget(item)}
                  state={detailState}
                  className="my-applications__row-next-action-link"
                  aria-label={NEXT_ACTION_LABELS[item.nextAction]}
                >
                  Next step: {NEXT_ACTION_LABELS[item.nextAction]}
                </Link>
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
