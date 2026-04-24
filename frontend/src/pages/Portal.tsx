import { Link } from 'react-router-dom';
import { PortalShell } from '../components/layout/PortalShell';
import { PageModeBadge } from '../components/ui/PageModeBadge';
import { RoleBadge } from '../components/ui/RoleBadge';
import { StatusBadge } from '../components/ui/StatusBadge';
import { DemoShortcutPanel } from '../features/demo/DemoShortcutPanel';
import {
  buildChainedReturnState,
  demoWalkthroughCopy,
  MY_APPLICATIONS_RETURN_CONTEXT,
  PORTAL_RETURN_CONTEXT,
} from '../features/demo/demoWalkthrough';
import type { ReturnContextState } from '../features/navigation/returnContext';

export const routePath = '/portal';

const browseLinks = [
  {
    to: '/conferences',
    title: 'Browse conferences',
    description: 'Published conferences open for application across the network.',
  },
  {
    to: '/grants',
    title: 'Browse travel grants',
    description: 'Travel funding opportunities linked to upcoming conferences.',
  },
  {
    to: '/prizes',
    title: 'Browse prizes',
    description:
      'Recognition archives that preview nomination, review, and release surfaces without requiring a live governance workflow in d0.',
  },
  {
    to: '/partners',
    title: 'Browse partners',
    description:
      'Applied collaboration teasers and expertise-matching pathways for future partner-facing surfaces.',
  },
];

const accountLinks = [
  {
    to: '/login',
    title: 'Sign in',
    description: 'Continue an in-progress application or open your dashboard.',
  },
  {
    to: '/register',
    title: 'Create an account',
    description: 'Set up an applicant profile to apply for conferences and grants.',
  },
];

export default function Portal() {
  const portalReturnState: ReturnContextState = {
    returnContext: PORTAL_RETURN_CONTEXT,
  };

  return (
    <PortalShell
      eyebrow="Asian Mathematical Network"
      title="Portal"
      description="A public entry point into conferences, travel grants, and applicant tools across the network."
      badges={
        <>
          <RoleBadge role="visitor" />
          <PageModeBadge mode="real-aligned" />
          <StatusBadge tone="info">Portal entry</StatusBadge>
        </>
      }
    >
      <DemoShortcutPanel
        className="dashboard-widget"
        title={demoWalkthroughCopy.portal.title}
        intro={demoWalkthroughCopy.portal.intro}
        shortcuts={[
          {
            to: '/conferences',
            state: portalReturnState,
            label: 'Start with published conferences',
            description: 'Open the public conference list and keep a direct return path back to the portal.',
          },
          {
            to: '/login',
            label: 'Continue to sign in',
            description: 'Move into the authenticated applicant workspace when you are ready to leave the public entry.',
            note: 'Use the seeded demo account before continuing to Dashboard or My applications.',
          },
          {
            to: '/me/applications',
            state: buildChainedReturnState(MY_APPLICATIONS_RETURN_CONTEXT, PORTAL_RETURN_CONTEXT),
            label: 'Jump to My applications',
            description: 'Skip directly to the stable applicant control point when the walkthrough needs a shorter route.',
          },
        ]}
      />

      <section className="dashboard-widget" aria-labelledby="portal-browse-heading">
        <h2 id="portal-browse-heading">Browse opportunities</h2>
        <ul className="portal-link-list">
          {browseLinks.map((link) => (
            <li key={link.to} className="surface-card portal-link-card">
              <Link to={link.to} state={portalReturnState} className="portal-link-card__title">
                {link.title}
              </Link>
              <p>{link.description}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="dashboard-widget" aria-labelledby="portal-account-heading">
        <h2 id="portal-account-heading">Your account</h2>
        <ul className="portal-link-list">
          {accountLinks.map((link) => (
            <li key={link.to} className="surface-card portal-link-card">
              <Link to={link.to} className="portal-link-card__title">
                {link.title}
              </Link>
              <p>{link.description}</p>
            </li>
          ))}
          <li className="surface-card portal-link-card">
            <Link
              to="/me/applications"
              state={buildChainedReturnState(MY_APPLICATIONS_RETURN_CONTEXT, PORTAL_RETURN_CONTEXT)}
              className="portal-link-card__title"
            >
              My applications
            </Link>
            <p>Review seeded conference and grant records with a presenter-safe way back to the portal.</p>
          </li>
        </ul>
      </section>
    </PortalShell>
  );
}
