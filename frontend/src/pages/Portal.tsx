import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { PortalShell } from '../components/layout/PortalShell';
import { PublicPortalNav } from '../components/layout/PublicPortalNav';
import { PORTAL_RETURN_CONTEXT } from '../features/demo/demoWalkthrough';
import { ScholarExpertiseClusterList } from '../features/profile/ScholarExpertiseClusterList';
import { ScholarSummaryCard } from '../features/profile/ScholarSummaryCard';
import {
  loadPortalHomepageViewModel,
  type PortalHomepageViewModel,
} from '../features/portal/homepageViewModel';
import type { ReturnContextState } from '../features/navigation/returnContext';
import './Portal.css';

export const routePath = '/portal';

const opportunityLabels = {
  conference: 'Conference',
  grant: 'Travel Grant',
} as const;

export default function Portal() {
  const [homepageModel, setHomepageModel] = useState<PortalHomepageViewModel | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const loadHomepage = async () => {
      try {
        const nextModel = await loadPortalHomepageViewModel();
        if (!cancelled) {
          setHomepageModel(nextModel);
          setLoadFailed(false);
        }
      } catch {
        if (!cancelled) {
          setLoadFailed(true);
        }
      }
    };

    void loadHomepage();

    return () => {
      cancelled = true;
    };
  }, []);

  const portalReturnState: ReturnContextState = {
    returnContext: PORTAL_RETURN_CONTEXT,
  };

  return (
    <PortalShell masthead={<PublicPortalNav />}>
      <section className="portal-home__hero" aria-labelledby="portal-home-heading">
        <div className="portal-home__hero-main">
          <p className="portal-home__eyebrow">Asian Mathematical Network</p>
          <h1 id="portal-home-heading">
            Opportunities and scholarly exchange across the Asian Mathematical Network
          </h1>
          <p className="portal-home__lede">
            Discover conferences, travel grants, schools, and public resources that support
            research participation, training, and regional scholarly exchange.
          </p>
          <div className="portal-home__actions">
            <Link to="/conferences" state={portalReturnState} className="conference-primary-link">
              Browse Conferences
            </Link>
            <Link to="/grants" state={portalReturnState} className="portal-home__secondary-link">
              Explore Travel Grants
            </Link>
          </div>

          {homepageModel ? (
            <dl className="portal-home__stats" aria-label="Network activity summary">
              <div>
                <dd>{homepageModel.summary.openConferences}</dd>
                <dt>Conferences open</dt>
              </div>
              <div>
                <dd>{homepageModel.summary.openGrants}</dd>
                <dt>Grants open</dt>
              </div>
              <div>
                <dd>{homepageModel.summary.openSchools}</dd>
                <dt>Schools active</dt>
              </div>
            </dl>
          ) : (
            <div className="portal-home__stats portal-home__stats--loading">
              <span>Loading current activity…</span>
            </div>
          )}
        </div>

        <aside
          className="portal-home__hero-panel"
          aria-labelledby="portal-home-glance-heading"
        >
          <p className="portal-home__summary-kicker">Open now</p>
          <h2 id="portal-home-glance-heading">Network at a glance</h2>
          {homepageModel ? (
            <>
              <p className="portal-home__summary-note">{homepageModel.summary.note}</p>
              <ul className="portal-home__summary-list">
                <li>
                  <strong>{homepageModel.summary.openConferences}</strong> conference
                  {homepageModel.summary.openConferences === 1 ? '' : 's'}
                  {' '}accepting applications
                </li>
                <li>
                  <strong>{homepageModel.summary.openGrants}</strong> grant
                  {homepageModel.summary.openGrants === 1 ? '' : 's'}
                  {' '}available for mobility support
                </li>
                <li>
                  <strong>{homepageModel.summary.openSchools}</strong> active school
                  {homepageModel.summary.openSchools === 1 ? '' : 's'}
                </li>
              </ul>
            </>
          ) : (
            <p className="portal-home__summary-note">
              {loadFailed
                ? 'Current opportunity data is temporarily unavailable.'
                : 'Loading current opportunity data...'}
            </p>
          )}
        </aside>
      </section>

      <section className="portal-home__featured" aria-labelledby="portal-home-featured-heading">
        <div className="portal-home__section-copy">
          <p className="portal-home__section-kicker">Featured now</p>
          <h2 id="portal-home-featured-heading">Featured opportunities</h2>
          <p>
            Public opportunities stay content-first on the homepage so visitors can immediately see
            what is active across the network.
          </p>
        </div>

        {homepageModel ? (
          <ul className="portal-home__card-grid">
            {homepageModel.featuredOpportunities.map((card) => (
              <li key={card.href} className="surface-card portal-home__card">
                <div className="portal-home__card-header">
                  <span className="portal-home__card-kind">{opportunityLabels[card.kind]}</span>
                  <span className="portal-home__card-status">{card.statusLabel}</span>
                </div>
                <Link to={card.href} state={portalReturnState} className="portal-home__card-title">
                  {card.title}
                </Link>
                <div className="portal-home__card-meta">
                  <span>{card.location}</span>
                  <span>{card.dateLabel}</span>
                </div>
                <p className="portal-home__card-summary">{card.summary}</p>
                <Link to={card.href} state={portalReturnState} className="portal-home__card-link">
                  View details
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <div className="surface-card portal-home__loading-card">
            {loadFailed
              ? 'Featured opportunity cards could not be loaded.'
              : 'Loading featured opportunities...'}
          </div>
        )}
      </section>

      <section className="portal-home__schools" aria-labelledby="portal-home-schools-heading">
        <div className="portal-home__section-copy">
          <p className="portal-home__section-kicker">Schools & training</p>
          <h2 id="portal-home-schools-heading">Training programmes across the network</h2>
          <p>
            School formats stay distinct from conferences and foreground pedagogy, cohort learning,
            and early-career support.
          </p>
        </div>

        {homepageModel ? (
          <div className="portal-home__school-grid">
            {homepageModel.schoolSpotlights.map((school) => (
              <article key={school.href} className="surface-card portal-home__school-card">
                <Link to={school.href} state={portalReturnState} className="portal-home__card-title">
                  {school.title}
                </Link>
                <p className="portal-home__card-meta">{school.location}</p>
                <p className="portal-home__card-summary">{school.summary}</p>
                <p className="portal-home__school-support">
                  {school.travelSupportAvailable
                    ? 'Travel support available'
                    : 'Travel support to be announced'}
                </p>
              </article>
            ))}
          </div>
        ) : (
          <div className="surface-card portal-home__loading-card">
            {loadFailed
              ? 'School spotlights could not be loaded.'
              : 'Loading school spotlights...'}
          </div>
        )}
      </section>

      <section className="portal-home__scholars" aria-labelledby="portal-home-scholars-heading">
        <div className="portal-home__section-copy">
          <p className="portal-home__section-kicker">M4 · Academic directory</p>
          <h2 id="portal-home-scholars-heading">Scholars & expertise</h2>
          <p>
            The network is not only a set of opportunities. Public scholar profiles and expertise
            clusters show the people and fields that support conferences, grants, prizes, and
            partner-facing collaboration.
          </p>
        </div>

        {homepageModel ? (
          <>
            <ScholarExpertiseClusterList clusters={homepageModel.scholarTeaser.clusters} />

            <div className="portal-home__scholar-grid">
              {homepageModel.scholarTeaser.scholars.map((scholar) => (
                <ScholarSummaryCard key={scholar.slug} scholar={scholar} />
              ))}
            </div>

            <Link to="/scholars" className="conference-primary-link">
              Browse Scholar Directory
            </Link>
          </>
        ) : (
          <div className="surface-card portal-home__loading-card">
            {loadFailed ? 'Scholar teaser could not be loaded.' : 'Loading scholar teaser...'}
          </div>
        )}
      </section>
    </PortalShell>
  );
}
