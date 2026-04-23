import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { PortalShell } from '../components/layout/PortalShell';
import { PageModeBadge } from '../components/ui/PageModeBadge';
import { RoleBadge } from '../components/ui/RoleBadge';
import { StatusBadge } from '../components/ui/StatusBadge';
import { readReturnContext, toReturnContextState } from '../features/navigation/returnContext';
import { prizeProvider } from '../features/prize/prizeProvider';
import type { PrizeListItem } from '../features/prize/types';
import './Prize.css';

export const routePath = '/prizes';

export default function Prizes() {
  const [items, setItems] = useState<PrizeListItem[] | null>(null);
  const location = useLocation();
  const returnContext = readReturnContext(location.state);
  const detailState = toReturnContextState(returnContext);

  useEffect(() => {
    prizeProvider.listPublicPrizes().then(setItems);
  }, []);

  if (items === null) {
    return <div className="prize-page">Loading prizes...</div>;
  }

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
        {items.length === 0 ? (
          <div className="conference-empty">No prizes or awards yet.</div>
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
                  <StatusBadge tone="warning">Governance-oriented preview</StatusBadge>
                  <Link to={`/prizes/${prize.slug}`} state={detailState}>
                    {prize.ctaLabel}
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </PortalShell>
  );
}
