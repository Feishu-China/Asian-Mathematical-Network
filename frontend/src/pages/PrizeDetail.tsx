import { useEffect, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { PortalShell } from '../components/layout/PortalShell';
import { PageModeBadge } from '../components/ui/PageModeBadge';
import { RoleBadge } from '../components/ui/RoleBadge';
import { StatusBadge } from '../components/ui/StatusBadge';
import { DemoStatePanel } from '../features/demo/DemoStatePanel';
import { readReturnContext, toReturnContextState } from '../features/navigation/returnContext';
import { prizeProvider } from '../features/prize/prizeProvider';
import type { PrizeDetail as PrizeDetailModel } from '../features/prize/types';
import './Prize.css';

export const routePath = '/prizes/:slug';

export default function PrizeDetail() {
  const { slug = '' } = useParams();
  const location = useLocation();
  const returnContext = readReturnContext(location.state);
  const [prize, setPrize] = useState<PrizeDetailModel | null | undefined>(undefined);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    let active = true;

    setPrize(undefined);
    setHasError(false);

    prizeProvider
      .getPrizeBySlug(slug)
      .then((value) => {
        if (active) {
          setPrize(value);
        }
      })
      .catch(() => {
        if (active) {
          setPrize(null);
          setHasError(true);
        }
      });

    return () => {
      active = false;
    };
  }, [slug]);

  return (
    <PortalShell
      eyebrow="Prize detail"
      title={prize?.title ?? 'Prize detail'}
      description={prize?.summary ?? 'Review the public prize record and governance-preview handoff from here.'}
      badges={
        <>
          <RoleBadge role="visitor" />
          <PageModeBadge mode="hybrid" />
          <StatusBadge tone={hasError ? 'danger' : 'warning'}>
            {hasError ? 'Unavailable' : 'Selection process preview'}
          </StatusBadge>
        </>
      }
      actions={
        <Link
          to="/prizes"
          state={toReturnContextState(returnContext)}
          className="my-applications__section-link"
        >
          Back to prizes
        </Link>
      }
      aside={
        prize ? (
          <div className="prize-detail-card prize-teaser-card">
            <h2>Selection process preview</h2>
            <p>{prize.selectionPreview}</p>
            <Link
              className="prize-primary-link"
              to="/admin/governance"
              state={{
                returnContext: {
                  to: `/prizes/${prize.slug}`,
                  label: 'Back to prize',
                  state: toReturnContextState(returnContext),
                },
              }}
            >
              View governance preview
            </Link>
            <Link
              className="prize-primary-link"
              to="/scholars/prof-reviewer"
              state={{
                returnContext: {
                  to: `/prizes/${prize.slug}`,
                  label: 'Back to prize',
                  state: toReturnContextState(returnContext),
                },
              }}
            >
              View scholar context
            </Link>
          </div>
        ) : null
      }
    >
      <div className="prize-page prize-detail-page">
        {prize === undefined ? (
          <DemoStatePanel
            badgeLabel="Loading"
            title="Loading prize detail"
            description="Preparing this public prize record for the demo."
            tone="info"
          />
        ) : hasError ? (
          <DemoStatePanel
            badgeLabel="Error"
            title="Prize detail unavailable"
            description="We could not load this prize right now."
            tone="danger"
          />
        ) : prize === null ? (
          <DemoStatePanel
            badgeLabel="Unavailable"
            title="Prize not found"
            description="This prize is unavailable in the current demo dataset."
            tone="neutral"
          />
        ) : (
          <>
            <section className="prize-detail-card">
              <h2>Recognition positioning</h2>
              <p>{prize.positioning}</p>
            </section>

            <section className="prize-detail-card">
              <h2>Audience and evaluation context</h2>
              <p>{prize.audience}</p>
            </section>

            <section className="prize-detail-card">
              <h2>Governance signals</h2>
              <ul className="prize-signal-list">
                {prize.governanceSignals.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </section>
          </>
        )}
      </div>
    </PortalShell>
  );
}
