import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
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
      <div className="prize-page">
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
          <div className="prize-grid">
            {items.map((prize) => (
              <article key={prize.id} className="prize-card">
                <div className="prize-card__meta">
                  <span>{prize.cycleLabel}</span>
                  <span>{prize.stageLabel}</span>
                </div>
                <h2>{prize.title}</h2>
                <p className="prize-card__subtitle">{prize.shortLabel}</p>
                <p className="prize-card__summary">{prize.summary}</p>
                <div className="prize-card__actions">
                  <StatusBadge tone="warning">Governance signals included</StatusBadge>
                  <Link to={`/prizes/${prize.slug}`} state={detailState}>
                    {prize.ctaLabel}
                  </Link>
                </div>
                <p className="prize-card__teaser">
                  Open the detail view to see the governance and selection-process preview.
                </p>
              </article>
            ))}
          </div>
        )}
      </div>
    </PortalShell>
  );
}
