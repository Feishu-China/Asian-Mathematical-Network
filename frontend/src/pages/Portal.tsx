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
  type PortalOpportunityStory,
} from '../features/portal/homepageViewModel';
import type { ReturnContextState } from '../features/navigation/returnContext';
import './Portal.css';

export const routePath = '/portal';

const opportunityLabels = {
  conference: 'Conference',
  grant: 'Travel Grant',
  school: 'School',
} as const;

const renderOpportunityMeta = (story: PortalOpportunityStory) => (
  <div className="portal-home__story-meta">
    <span>{story.location}</span>
    <span>{story.dateLabel}</span>
  </div>
);

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

  const statItems = homepageModel
    ? [
        {
          value: homepageModel.summary.openOpportunities,
          label: 'Open opportunities',
        },
        {
          value: homepageModel.summary.memberInstitutions,
          label: 'Member institutions',
        },
        {
          value: homepageModel.summary.countries,
          label: 'Countries',
        },
        {
          value: homepageModel.summary.scholarsInNetwork,
          label: 'Scholars in network',
          suffix: '+',
        },
      ]
    : [];

  const leadOpportunity = homepageModel?.featuredOpportunities[0] ?? null;
  const opportunityDigest = homepageModel
    ? [...homepageModel.featuredOpportunities.slice(1), ...homepageModel.schoolSpotlights]
    : [];

  return (
    <PortalShell masthead={<PublicPortalNav />}>
      <section className="portal-home__hero" aria-labelledby="portal-home-heading">
        <div className="portal-home__hero-main">
          <p className="portal-home__eyebrow">Mathematics network · Asia-Pacific</p>
          <h1 id="portal-home-heading">Connecting Asia&apos;s mathematical community</h1>
          <p className="portal-home__lede">
            Asiamath brings together researchers, institutions, schools, and public-facing
            programmes across the region, making opportunities part of a wider scholarly network
            rather than the whole story.
          </p>

          <div className="portal-home__actions">
            <Link to="/opportunities" state={portalReturnState} className="conference-primary-link">
              Explore opportunities
            </Link>
            <Link to="/scholars" state={portalReturnState} className="portal-home__secondary-link">
              Meet the scholars
            </Link>
          </div>

          {homepageModel ? (
            <dl className="portal-home__stats" aria-label="Network activity summary">
              {statItems.map((item) => (
                <div key={item.label}>
                  <dd>
                    {item.value}
                    {item.suffix ?? ''}
                  </dd>
                  <dt>{item.label}</dt>
                </div>
              ))}
            </dl>
          ) : (
            <div className="portal-home__stats portal-home__stats--loading">
              <span>Loading current network snapshot...</span>
            </div>
          )}
        </div>

        <aside className="portal-home__hero-panel" aria-labelledby="portal-home-featured-call-heading">
          <p className="portal-home__summary-kicker">
            {homepageModel?.heroFeature?.eyebrow ?? 'Featured call'}
          </p>
          <h2 id="portal-home-featured-call-heading">Featured call</h2>
          {homepageModel?.heroFeature ? (
            <>
              <div className="portal-home__story-header">
                <span className="portal-home__card-kind">
                  {opportunityLabels[homepageModel.heroFeature.kind]}
                </span>
                <span className="portal-home__card-status">
                  {homepageModel.heroFeature.statusLabel}
                </span>
              </div>
              <Link
                to={homepageModel.heroFeature.href}
                state={portalReturnState}
                className="portal-home__hero-feature-title"
              >
                {homepageModel.heroFeature.title}
              </Link>
              {renderOpportunityMeta(homepageModel.heroFeature)}
              <p className="portal-home__summary-note">{homepageModel.heroFeature.summary}</p>
              <div className="portal-home__hero-callout">
                <p>{homepageModel.heroFeature.callout}</p>
                {homepageModel.heroFeature.supportLink ? (
                  <Link to={homepageModel.heroFeature.supportLink.href} state={portalReturnState}>
                    {homepageModel.heroFeature.supportLink.label}
                  </Link>
                ) : null}
              </div>
            </>
          ) : (
            <p className="portal-home__summary-note">
              {loadFailed
                ? 'Featured opportunity data is temporarily unavailable.'
                : 'Loading current opportunity data...'}
            </p>
          )}
        </aside>
      </section>

      <section
        className="portal-home__opportunities"
        aria-labelledby="portal-home-opportunities-heading"
      >
        <div className="portal-home__section-heading">
          <div className="portal-home__section-copy">
            <p className="portal-home__section-kicker">Open calls and pathways</p>
            <h2 id="portal-home-opportunities-heading">Opportunities</h2>
            <p>
              Conferences, mobility support, and schools are edited together here so the homepage
              reads like a live network front page instead of a menu of disconnected modules.
            </p>
          </div>
          <Link to="/opportunities" state={portalReturnState} className="portal-home__section-link">
            View all opportunities
          </Link>
        </div>

        {homepageModel && leadOpportunity ? (
          <div className="portal-home__opportunity-layout">
            <article className="portal-home__opportunity-feature surface-card">
              <div className="portal-home__story-header">
                <span className="portal-home__card-kind">
                  {opportunityLabels[leadOpportunity.kind]}
                </span>
                <span className="portal-home__card-status">{leadOpportunity.statusLabel}</span>
              </div>
              <Link
                to={leadOpportunity.href}
                state={portalReturnState}
                className="portal-home__feature-title"
              >
                {leadOpportunity.title}
              </Link>
              <p className="portal-home__feature-summary">{leadOpportunity.summary}</p>
              {renderOpportunityMeta(leadOpportunity)}
              <div className="portal-home__feature-footer">
                <p>{homepageModel.summary.note}</p>
                <Link to={leadOpportunity.href} state={portalReturnState}>
                  Read the call
                </Link>
              </div>
            </article>

            <div className="portal-home__opportunity-sidebar">
              <article className="portal-home__editorial-note surface-card">
                <p className="portal-home__section-kicker">Editorial mix</p>
                <h3>Travel, training, and participation stay in one conversation</h3>
                <p>
                  Schools no longer sit in their own homepage block. They now strengthen the main
                  opportunity narrative alongside conferences and grants.
                </p>
              </article>

              {opportunityDigest.map((story) => (
                <article
                  key={story.href}
                  className={`portal-home__story-card surface-card${story.kind === 'school' ? ' portal-home__story-card--school' : ''}`}
                >
                  <div className="portal-home__story-header">
                    <span className="portal-home__card-kind">{opportunityLabels[story.kind]}</span>
                    <span className="portal-home__card-status">{story.statusLabel}</span>
                  </div>
                  <Link
                    to={story.href}
                    state={portalReturnState}
                    className="portal-home__story-title"
                  >
                    {story.title}
                  </Link>
                  {renderOpportunityMeta(story)}
                  <p className="portal-home__story-summary">{story.summary}</p>
                  {'supportLabel' in story ? (
                    <p className="portal-home__school-support">{story.supportLabel}</p>
                  ) : null}
                </article>
              ))}
            </div>
          </div>
        ) : (
          <div className="surface-card portal-home__loading-card">
            {loadFailed
              ? 'Opportunity stories could not be loaded.'
              : 'Loading opportunity stories...'}
          </div>
        )}
      </section>

      <section className="portal-home__scholars" aria-labelledby="portal-home-scholars-heading">
        <div className="portal-home__section-heading">
          <div className="portal-home__section-copy">
            <p className="portal-home__section-kicker">M4 · Academic directory</p>
            <h2 id="portal-home-scholars-heading">Scholars & expertise</h2>
            <p>
              The network is made visible through people as much as through calls. Public scholar
              profiles and expertise clusters keep the homepage grounded in fields, institutions,
              and collaboration capacity.
            </p>
          </div>
          <Link to="/scholars" state={portalReturnState} className="conference-primary-link">
            Browse Scholar Directory
          </Link>
        </div>

        {homepageModel ? (
          <>
            <ScholarExpertiseClusterList clusters={homepageModel.scholarTeaser.clusters} />

            <div className="portal-home__scholar-grid">
              {homepageModel.scholarTeaser.scholars.map((scholar) => (
                <ScholarSummaryCard
                  key={scholar.slug}
                  scholar={scholar}
                  detailState={portalReturnState}
                />
              ))}
            </div>
          </>
        ) : (
          <div className="surface-card portal-home__loading-card">
            {loadFailed ? 'Scholar teaser could not be loaded.' : 'Loading scholar teaser...'}
          </div>
        )}
      </section>

      <section className="portal-home__duo" aria-label="Prize and outreach highlights">
        {homepageModel ? (
          <>
            <article className="portal-home__duo-card" aria-labelledby="portal-home-prize-heading">
              <p className="portal-home__duo-kicker">Recognition pathways</p>
              <h2 id="portal-home-prize-heading">{homepageModel.prizeTeaser.title}</h2>
              <p className="portal-home__duo-summary">{homepageModel.prizeTeaser.summary}</p>
              <ul className="portal-home__duo-list">
                {homepageModel.prizeTeaser.items.map((item) => (
                  <li key={item.label}>
                    <span>{item.label}</span>
                    <span>{item.meta}</span>
                  </li>
                ))}
              </ul>
              <Link
                to={homepageModel.prizeTeaser.href}
                state={portalReturnState}
                className="portal-home__duo-link"
              >
                Browse prize archive
              </Link>
            </article>

            <article
              className="portal-home__duo-card"
              aria-labelledby="portal-home-outreach-heading"
            >
              <p className="portal-home__duo-kicker">Community-facing work</p>
              <h2 id="portal-home-outreach-heading">{homepageModel.outreachTeaser.title}</h2>
              <p className="portal-home__duo-summary">{homepageModel.outreachTeaser.summary}</p>
              <div className="portal-home__outreach-links">
                {homepageModel.outreachTeaser.links.map((link) => (
                  <Link
                    key={link.label}
                    to={link.href}
                    state={portalReturnState}
                    className="portal-home__outreach-link"
                  >
                    <strong>{link.label}</strong>
                    <span>{link.description}</span>
                  </Link>
                ))}
              </div>
              <Link
                to={homepageModel.outreachTeaser.href}
                state={portalReturnState}
                className="portal-home__duo-link"
              >
                Explore outreach programmes
              </Link>
            </article>
          </>
        ) : (
          <div className="surface-card portal-home__loading-card">
            {loadFailed
              ? 'Prize and outreach highlights could not be loaded.'
              : 'Loading prize and outreach highlights...'}
          </div>
        )}
      </section>

      <section
        className="portal-home__closing-page"
        aria-label="From the network and partner institutions"
      >
        <div className="portal-home__closing-main">
          <div className="portal-home__section-heading">
            <div className="portal-home__section-copy">
              <p className="portal-home__section-kicker">Signals and memory</p>
              <h2 id="portal-home-network-heading">From the Network</h2>
              <p>
                A network homepage should carry news, publications, and media traces, not only the
                current application moment.
              </p>
            </div>
          </div>

          {homepageModel ? (
            <div className="portal-home__network-grid">
              {homepageModel.networkStories.map((story) => (
                <article key={story.title} className="portal-home__network-card surface-card">
                  <p className="portal-home__network-kind">{story.kind}</p>
                  <h3>{story.title}</h3>
                  <p className="portal-home__network-meta">{story.meta}</p>
                  <p className="portal-home__network-summary">{story.summary}</p>
                  <Link to={story.href} state={portalReturnState}>
                    Open {story.kind.toLowerCase()}
                  </Link>
                </article>
              ))}
            </div>
          ) : (
            <div className="surface-card portal-home__loading-card">
              {loadFailed ? 'Network stories could not be loaded.' : 'Loading network stories...'}
            </div>
          )}
        </div>

        <div className="portal-home__partners-block">
          <div className="portal-home__section-copy portal-home__section-copy--centered">
            <p className="portal-home__section-kicker">Closing strip</p>
            <h2 id="portal-home-partners-heading">Institutions & partners</h2>
            <p>
              The homepage closes by signalling institutional breadth and partner-facing trust
              rather than ending on a final grid of module links.
            </p>
          </div>

          {homepageModel ? (
            <div className="portal-home__partner-strip">
              {homepageModel.partnerStrip.map((item) => (
                <Link
                  key={item.label}
                  to={item.href}
                  state={portalReturnState}
                  className="portal-home__partner-pill"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          ) : (
            <div className="surface-card portal-home__loading-card">
              {loadFailed ? 'Partner strip could not be loaded.' : 'Loading partner strip...'}
            </div>
          )}
        </div>
      </section>
    </PortalShell>
  );
}
