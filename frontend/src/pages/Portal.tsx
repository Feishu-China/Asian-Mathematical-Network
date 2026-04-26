import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { PortalShell } from '../components/layout/PortalShell';
import { PageModeBadge } from '../components/ui/PageModeBadge';
import { RoleBadge } from '../components/ui/RoleBadge';
import { StatusBadge } from '../components/ui/StatusBadge';
import { conferenceProvider } from '../features/conference/conferenceProvider';
import { grantProvider } from '../features/grant/grantProvider';
import type { ConferenceListItem } from '../features/conference/types';
import type { GrantListItem } from '../features/grant/types';

export const routePath = '/portal';

const FEATURED_LIMIT = 3;

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

const formatRange = (startDate: string | null, endDate: string | null) => {
  if (!startDate && !endDate) {
    return null;
  }
  if (startDate && endDate) {
    return `${startDate} → ${endDate}`;
  }
  return startDate ?? endDate;
};

export default function Portal() {
  const [conferences, setConferences] = useState<ConferenceListItem[] | null>(null);
  const [grants, setGrants] = useState<GrantListItem[] | null>(null);
  const [conferencesError, setConferencesError] = useState(false);
  const [grantsError, setGrantsError] = useState(false);

  useEffect(() => {
    let active = true;

    conferenceProvider
      .listPublicConferences()
      .then((items) => {
        if (active) {
          setConferences(items);
        }
      })
      .catch(() => {
        if (active) {
          setConferencesError(true);
          setConferences([]);
        }
      });

    grantProvider
      .listPublicGrants()
      .then((items) => {
        if (active) {
          setGrants(items);
        }
      })
      .catch(() => {
        if (active) {
          setGrantsError(true);
          setGrants([]);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  const featuredConferences = conferences?.slice(0, FEATURED_LIMIT) ?? [];
  const featuredGrants = grants?.slice(0, FEATURED_LIMIT) ?? [];

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
      <section className="dashboard-widget" aria-labelledby="portal-conferences-heading">
        <header className="my-applications__section-header">
          <h2 id="portal-conferences-heading">Featured conferences</h2>
          <Link to="/conferences" className="my-applications__section-link">
            Browse all
          </Link>
        </header>
        {conferences === null ? (
          <p className="conference-empty">Loading conferences...</p>
        ) : conferencesError ? (
          <p className="conference-inline-message error">
            We could not load conferences right now.
          </p>
        ) : featuredConferences.length === 0 ? (
          <p className="conference-empty">No published conferences yet.</p>
        ) : (
          <ul className="portal-link-list">
            {featuredConferences.map((conference) => {
              const range = formatRange(conference.startDate, conference.endDate);
              return (
                <li key={conference.id} className="surface-card portal-link-card">
                  <Link
                    to={`/conferences/${conference.slug}`}
                    className="portal-link-card__title"
                  >
                    {conference.title}
                  </Link>
                  <p>
                    {[conference.locationText, range].filter(Boolean).join(' · ') ||
                      'Details available on the conference page.'}
                  </p>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="dashboard-widget" aria-labelledby="portal-grants-heading">
        <header className="my-applications__section-header">
          <h2 id="portal-grants-heading">Featured travel grants</h2>
          <Link to="/grants" className="my-applications__section-link">
            Browse all
          </Link>
        </header>
        {grants === null ? (
          <p className="conference-empty">Loading travel grants...</p>
        ) : grantsError ? (
          <p className="conference-inline-message error">
            We could not load travel grants right now.
          </p>
        ) : featuredGrants.length === 0 ? (
          <p className="conference-empty">No published travel grants yet.</p>
        ) : (
          <ul className="portal-link-list">
            {featuredGrants.map((grant) => (
              <li key={grant.id} className="surface-card portal-link-card">
                <Link to={`/grants/${grant.slug}`} className="portal-link-card__title">
                  {grant.title}
                </Link>
                <p>
                  {grant.applicationDeadline
                    ? `Apply by ${new Date(grant.applicationDeadline).toLocaleDateString()}`
                    : 'See the grant page for application details.'}
                </p>
              </li>
            ))}
          </ul>
        )}
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
