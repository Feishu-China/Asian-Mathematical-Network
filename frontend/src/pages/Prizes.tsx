import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { PublicPortalNav } from '../components/layout/PublicPortalNav';
import { PortalShell } from '../components/layout/PortalShell';
import { PageModeBadge } from '../components/ui/PageModeBadge';
import { RoleBadge } from '../components/ui/RoleBadge';
import { StatusBadge } from '../components/ui/StatusBadge';
import { DemoStatePanel } from '../features/demo/DemoStatePanel';
import { readReturnContext, toReturnContextState } from '../features/navigation/returnContext';
import { prizeProvider } from '../features/prize/prizeProvider';
import type { PrizeListItem } from '../features/prize/types';
import './Prize.css';

export const routePath = '/prizes';

export default function Prizes() {
  const [items, setItems] = useState<PrizeListItem[] | null>(null);
  const [hasError, setHasError] = useState(false);
  const location = useLocation();
  const returnContext = readReturnContext(location.state);
  const detailState = toReturnContextState(returnContext);

  useEffect(() => {
    let active = true;

    setItems(null);
    setHasError(false);

    prizeProvider
      .listPublicPrizes()
      .then((value) => {
        if (active) {
          setItems(value);
        }
      })
      .catch(() => {
        if (active) {
          setHasError(true);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  return (
    <PortalShell
      masthead={<PublicPortalNav />}
      eyebrow="Recognition surfaces"
      title="Prizes"
      description="Archive-style recognition pages that preview how scholar identity, nomination context, and review governance can live inside the same platform."
      badges={
        <>
          <RoleBadge role="visitor" />
          <PageModeBadge mode="hybrid" />
          <StatusBadge tone="info">Prize archive</StatusBadge>
        </>
      }
      actions={
        returnContext ? (
          <Link
            to={returnContext.to}
            state={returnContext.state}
            className="my-applications__section-link"
          >
            {returnContext.label}
          </Link>
        ) : null
      }
    >
      <div className="prize-page public-browse-page">
        {items === null ? (
          <DemoStatePanel
            badgeLabel={hasError ? 'Error' : 'Loading'}
            title={hasError ? 'Prize list unavailable' : 'Loading prizes'}
            description={
              hasError
                ? 'We could not load the prize breadth surface right now.'
                : 'Preparing the prize breadth surface used in the demo.'
            }
            tone={hasError ? 'danger' : 'info'}
          />
        ) : items.length === 0 ? (
          <DemoStatePanel
            badgeLabel="Empty"
            title="No prizes or awards yet"
            description="Prize and award breadth records will appear here once they are ready for the demo."
            tone="neutral"
          />
        ) : (
          <>
            <section className="prize-hub">
              <div className="prize-hub__copy">
                <h2>Prize pathways</h2>
                <p className="public-browse-copy">
                  Public recognition pages should preview scholar records, nomination flow, and
                  governance structure before a visitor enters the full archive.
                </p>
              </div>
              <div className="prize-hub__grid public-browse-grid public-browse-grid--compact">
                <article className="prize-card prize-hub__card public-browse-card">
                  <h3>Archive overview</h3>
                  <p className="public-browse-copy">
                    Browse the public-facing recognition records that anchor the wider awards
                    surface in the demo.
                  </p>
                  <a href="#prize-archive-list">Browse prize archive</a>
                </article>
                <article className="prize-card prize-hub__card public-browse-card">
                  <h3>Selection process preview</h3>
                  <p className="public-browse-copy">
                    Detail pages continue into governance preview and sample laureate context
                    without leaving the shared portal narrative.
                  </p>
                </article>
              </div>
            </section>

            <section id="prize-archive-list" className="prize-archive">
              <div className="prize-grid public-browse-grid">
                {items.map((prize) => (
                  <article key={prize.id} className="prize-card public-browse-card">
                    <div className="prize-card__meta public-browse-meta">
                      <span>{prize.cycleLabel}</span>
                      <span>{prize.stageLabel}</span>
                    </div>
                    <h2>{prize.title}</h2>
                    <p className="prize-card__subtitle public-browse-copy">{prize.shortLabel}</p>
                    <p className="prize-card__summary public-browse-copy">{prize.summary}</p>
                    <div className="prize-card__actions public-browse-actions">
                      <StatusBadge tone="warning">Governance signals included</StatusBadge>
                      <Link to={`/prizes/${prize.slug}`} state={detailState}>
                        {prize.ctaLabel}
                      </Link>
                    </div>
                    <p className="prize-card__teaser public-browse-copy">
                      Open the detail view to see the governance and selection-process preview.
                    </p>
                  </article>
                ))}
              </div>
            </section>
          </>
        )}
      </div>
    </PortalShell>
  );
}
