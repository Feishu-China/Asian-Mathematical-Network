import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { PortalShell } from '../components/layout/PortalShell';
import { PageModeBadge } from '../components/ui/PageModeBadge';
import { RoleBadge } from '../components/ui/RoleBadge';
import { StatusBadge } from '../components/ui/StatusBadge';
import { prizeProvider } from '../features/prize/prizeProvider';
import type { PrizeDetail as PrizeDetailModel } from '../features/prize/types';
import './Prize.css';

export const routePath = '/prizes/:slug';

export default function PrizeDetail() {
  const { slug = '' } = useParams();
  const [prize, setPrize] = useState<PrizeDetailModel | null | undefined>(undefined);

  useEffect(() => {
    prizeProvider.getPrizeBySlug(slug).then(setPrize);
  }, [slug]);

  if (prize === undefined) {
    return <div className="prize-page">Loading prize...</div>;
  }

  if (prize === null) {
    return <div className="prize-page">Prize not found.</div>;
  }

  return (
    <PortalShell
      eyebrow="Prize detail"
      title={prize.title}
      description={prize.summary}
      badges={
        <>
          <RoleBadge role="visitor" />
          <PageModeBadge mode="hybrid" />
          <StatusBadge tone="warning">Selection process preview</StatusBadge>
        </>
      }
      actions={
        <Link to="/prizes" className="my-applications__section-link">
          Back to prizes
        </Link>
      }
      aside={
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
                  },
                }}
              >
                View governance preview
              </Link>
              <Link className="prize-primary-link" to="/scholars/prof-reviewer">
                View scholar context
              </Link>
            </div>
          }
    >
      <div className="prize-page prize-detail-page">
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
      </div>
    </PortalShell>
  );
}
