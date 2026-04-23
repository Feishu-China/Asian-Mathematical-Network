import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { PortalShell } from '../components/layout/PortalShell';
import { PageModeBadge } from '../components/ui/PageModeBadge';
import { RoleBadge } from '../components/ui/RoleBadge';
import { StatusBadge } from '../components/ui/StatusBadge';
import { readReturnContext } from '../features/navigation/returnContext';
import { partnerProvider } from '../features/partner/partnerProvider';
import type { PartnerListItem } from '../features/partner/types';
import './Partner.css';

export const routePath = '/partners';

export default function Partners() {
  const [items, setItems] = useState<PartnerListItem[] | null>(null);
  const location = useLocation();
  const returnContext = readReturnContext(location.state);

  useEffect(() => {
    partnerProvider.listPublicPartners().then(setItems);
  }, []);

  if (items === null) {
    return <div className="partner-page">Loading partners...</div>;
  }

  return (
    <PortalShell
      eyebrow="Applied collaboration"
      title="Partners"
      description="A breadth-facing surface for institutions, applied collaborations, and expertise-matching direction without building a live partner system in d0."
      badges={
        <>
          <RoleBadge role="visitor" />
          <PageModeBadge mode="hybrid" />
          <StatusBadge tone="info">Industry and partner network</StatusBadge>
        </>
      }
      actions={
        returnContext ? (
          <Link to={returnContext.to} className="my-applications__section-link">
            {returnContext.label}
          </Link>
        ) : null
      }
      aside={
        <div className="partner-detail-card partner-teaser-card">
          <h2>Expertise matching teaser</h2>
          <p>
            A future partner workflow could start from scholar records, research interests, and
            trusted profile context before expanding into managed introductions.
          </p>
          <Link
            className="partner-primary-link"
            to="/scholars/prof-reviewer"
            state={{
              returnContext: {
                to: '/partners',
                label: 'Back to partners',
              },
            }}
          >
            View matching context
          </Link>
        </div>
      }
    >
      <div className="partner-page">
        {items.length === 0 ? (
          <div className="conference-empty">No partners or collaboration teasers yet.</div>
        ) : (
          <div className="partner-grid">
            {items.map((partner) => (
              <article key={partner.id} className="partner-card">
                <div className="partner-card__meta">
                  <span>{partner.sectorLabel}</span>
                  <span>{partner.geographyLabel}</span>
                </div>
                <h2>{partner.title}</h2>
                <p className="partner-card__summary">{partner.summary}</p>
                <div className="partner-card__matching">
                  <StatusBadge tone="warning">Matching teaser</StatusBadge>
                  <p>{partner.matchingFocus}</p>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </PortalShell>
  );
}
