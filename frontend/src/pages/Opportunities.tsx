import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { PortalShell } from '../components/layout/PortalShell';
import { PublicPortalNav } from '../components/layout/PublicPortalNav';
import { PageModeBadge } from '../components/ui/PageModeBadge';
import { RoleBadge } from '../components/ui/RoleBadge';
import { StatusBadge } from '../components/ui/StatusBadge';
import { DemoStatePanel } from '../features/demo/DemoStatePanel';
import {
  buildChainedReturnState,
  OPPORTUNITIES_RETURN_CONTEXT,
  PORTAL_RETURN_CONTEXT,
} from '../features/demo/demoWalkthrough';
import { resolveReturnContext } from '../features/navigation/returnContext';
import {
  loadPortalHomepageViewModel,
  type PortalHomepageViewModel,
} from '../features/portal/homepageViewModel';
import './Opportunities.css';

export const routePath = '/opportunities';

const opportunityFamilies = [
  {
    href: '/conferences',
    title: 'Conferences',
    countKey: 'openConferences' as const,
    summary: 'Published conference calls, event detail pages, and application entry points.',
    ctaLabel: 'Browse conferences',
  },
  {
    href: '/grants',
    title: 'Travel Grants',
    countKey: 'openGrants' as const,
    summary: 'Mobility support opportunities that stay distinct from conference applications.',
    ctaLabel: 'Browse travel grants',
  },
  {
    href: '/schools',
    title: 'Schools',
    countKey: 'openSchools' as const,
    summary: 'Training programmes and cohort-based opportunities with their own public presence.',
    ctaLabel: 'Browse schools',
  },
] as const;

export default function Opportunities() {
  const location = useLocation();
  const returnContext = resolveReturnContext(location.state, routePath, PORTAL_RETURN_CONTEXT);
  const [homepageModel, setHomepageModel] = useState<PortalHomepageViewModel | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
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

    void load();

    return () => {
      cancelled = true;
    };
  }, []);

  const browseState = buildChainedReturnState(OPPORTUNITIES_RETURN_CONTEXT, returnContext);

  return (
    <PortalShell
      masthead={<PublicPortalNav />}
      eyebrow="Public opportunities"
      title="Browse opportunities"
      description="Choose the opportunity family that matches your goal, then continue into the published conference, grant, or school surfaces."
      badges={
        <>
          <RoleBadge role="visitor" />
          <PageModeBadge mode="hybrid" />
          <StatusBadge tone="info">Discovery hub</StatusBadge>
        </>
      }
      actions={
        <Link
          to={returnContext.to}
          state={returnContext.state}
          className="my-applications__section-link"
        >
          {returnContext.label}
        </Link>
      }
    >
      <div className="opportunities-page public-browse-page">
        <section className="opportunities-page__intro surface-card public-browse-card">
          <h2>Opportunity families</h2>
          <p className="public-browse-copy">
            Keep public discovery broad at this layer, then branch into the module-specific browse
            pages once visitors know whether they want events, grants, or training pathways.
          </p>
          {homepageModel ? (
            <p className="opportunities-page__note">{homepageModel.summary.note}</p>
          ) : (
            <p className="opportunities-page__note">
              {loadFailed
                ? 'Current opportunity counts are temporarily unavailable.'
                : 'Loading current opportunity counts...'}
            </p>
          )}
        </section>

        {homepageModel || loadFailed ? (
          <div className="opportunities-page__grid public-browse-grid">
            {opportunityFamilies.map((family) => (
              <article key={family.href} className="opportunities-page__card surface-card public-browse-card">
                <p className="opportunities-page__count">
                  {homepageModel ? homepageModel.summary[family.countKey] : '—'}
                </p>
                <h2>{family.title}</h2>
                <p className="public-browse-copy">{family.summary}</p>
                <Link to={family.href} state={browseState} className="conference-primary-link">
                  {family.ctaLabel}
                </Link>
              </article>
            ))}
          </div>
        ) : (
          <DemoStatePanel
            badgeLabel="Loading"
            title="Loading opportunities"
            description="Preparing the public discovery hub used to branch into conference, grant, and school pages."
            tone="info"
          />
        )}
      </div>
    </PortalShell>
  );
}
