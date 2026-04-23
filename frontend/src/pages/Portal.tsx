import { Link } from 'react-router-dom';
import { PortalShell } from '../components/layout/PortalShell';
import { PageModeBadge } from '../components/ui/PageModeBadge';
import { RoleBadge } from '../components/ui/RoleBadge';
import { StatusBadge } from '../components/ui/StatusBadge';

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
      <section className="dashboard-widget" aria-labelledby="portal-browse-heading">
        <h2 id="portal-browse-heading">Browse opportunities</h2>
        <ul className="portal-link-list">
          {browseLinks.map((link) => (
            <li key={link.to} className="surface-card portal-link-card">
              <Link to={link.to} className="portal-link-card__title">
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
            <Link to="/me/applications" className="portal-link-card__title">
              My applications
            </Link>
            <p>Review your conference and grant applications in one place.</p>
          </li>
        </ul>
      </section>
    </PortalShell>
  );
}
