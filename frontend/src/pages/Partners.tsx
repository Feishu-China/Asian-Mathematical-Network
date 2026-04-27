import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { PublicPortalNav } from '../components/layout/PublicPortalNav';
import { PortalShell } from '../components/layout/PortalShell';
import { PageModeBadge } from '../components/ui/PageModeBadge';
import { RoleBadge } from '../components/ui/RoleBadge';
import { StatusBadge } from '../components/ui/StatusBadge';
import { DemoStatePanel } from '../features/demo/DemoStatePanel';
import { readReturnContext, toReturnContextState } from '../features/navigation/returnContext';
import { partnerProvider } from '../features/partner/partnerProvider';
import type { PartnerListItem } from '../features/partner/types';
import './Partner.css';

export const routePath = '/partners';

export default function Partners() {
  const [items, setItems] = useState<PartnerListItem[] | null>(null);
  const [hasError, setHasError] = useState(false);
  const location = useLocation();
  const returnContext = readReturnContext(location.state);

  useEffect(() => {
    let active = true;

    setItems(null);
    setHasError(false);

    partnerProvider
      .listPublicPartners()
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
      eyebrow="Applied collaboration"
      title="Partners"
      description="Institutional collaborations and member-network relationships across the Asiamath region."
      badges={
        <>
          <RoleBadge role="visitor" />
          <PageModeBadge mode="hybrid" />
          <StatusBadge tone="info">Industry and partner network</StatusBadge>
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
      aside={
        <div className="partner-detail-card partner-teaser-card public-browse-card public-browse-aside-card">
          <h2>Collaboration pathway</h2>
          <p className="public-browse-copy">
            Many collaborations begin with a public scholar profile, a clear research fit, and a
            visible institutional host across the network.
          </p>
          <Link
            className="public-browse-primary-link"
            to="/scholars/prof-reviewer"
            state={{
              returnContext: {
                to: '/partners',
                label: 'Back to partners',
                state: toReturnContextState(returnContext),
              },
            }}
          >
            View sample scholar profile
          </Link>
        </div>
      }
    >
      <div className="partner-page public-browse-page">
        {items === null ? (
          <DemoStatePanel
            badgeLabel={hasError ? 'Error' : 'Loading'}
            title={hasError ? 'Partner list unavailable' : 'Loading partners'}
            description={
              hasError
                ? 'We could not load the partner breadth surface right now.'
                : 'Preparing the partner breadth surface used in the demo.'
            }
            tone={hasError ? 'danger' : 'info'}
          />
        ) : items.length === 0 ? (
          <DemoStatePanel
            badgeLabel="Empty"
            title="No partners or collaboration teasers yet"
            description="Partner and collaboration breadth records will appear here once they are ready for the demo."
            tone="neutral"
          />
        ) : (
          <div className="partner-grid public-browse-grid public-browse-grid--compact">
            {items.map((partner) => (
              <article key={partner.id} className="partner-card public-browse-card">
                <div className="partner-card__meta public-browse-meta">
                  <span>{partner.sectorLabel}</span>
                  <span>{partner.geographyLabel}</span>
                </div>
                <h2>{partner.title}</h2>
                <p className="partner-card__summary public-browse-copy">{partner.summary}</p>
                <div className="partner-card__matching">
                  <StatusBadge tone="warning">Matching teaser</StatusBadge>
                  <p className="public-browse-copy">{partner.matchingFocus}</p>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </PortalShell>
  );
}
