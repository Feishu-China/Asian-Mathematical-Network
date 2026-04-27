import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { PublicPortalNav } from '../components/layout/PublicPortalNav';
import { PortalShell } from '../components/layout/PortalShell';
import { PageModeBadge } from '../components/ui/PageModeBadge';
import { RoleBadge } from '../components/ui/RoleBadge';
import { StatusBadge } from '../components/ui/StatusBadge';
import { DemoStatePanel } from '../features/demo/DemoStatePanel';
import { readReturnContext, toReturnContextState } from '../features/navigation/returnContext';
import { publicationProvider } from '../features/publication/publicationProvider';
import type { PublicationPreview } from '../features/publication/types';
import './Publication.css';

export const routePath = '/publications';

export default function Publications() {
  const [publications, setPublications] = useState<PublicationPreview[] | null>(null);
  const [hasError, setHasError] = useState(false);
  const location = useLocation();
  const returnContext = readReturnContext(location.state);
  const detailState = toReturnContextState(returnContext);

  useEffect(() => {
    let active = true;

    setPublications(null);
    setHasError(false);

    publicationProvider.listPublications().then((value) => {
      if (active) {
        setPublications(value);
      }
    }).catch(() => {
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
      eyebrow="Publication archive"
      title="Publications"
      description="Browse lecture notes, digests, and public research outputs from across the network."
      badges={
        <>
          <RoleBadge role="visitor" />
          <PageModeBadge mode="hybrid" />
          <StatusBadge tone="info">Publication archive</StatusBadge>
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
      <div className="publication-page public-browse-page">
        {publications === null ? (
          <DemoStatePanel
            badgeLabel={hasError ? 'Error' : 'Loading'}
            title={hasError ? 'Publication archive unavailable' : 'Loading publication archive'}
            description={
              hasError
                ? 'We could not load the public publication archive right now.'
                : 'Preparing the public publications used in the demo.'
            }
            tone={hasError ? 'danger' : 'info'}
          />
        ) : publications.length === 0 ? (
          <DemoStatePanel
            badgeLabel="Empty"
            title="No public publications yet"
            description="Public publications will appear here once they are ready."
            tone="neutral"
          />
        ) : (
          <div className="publication-grid public-browse-grid public-browse-grid--compact">
            {(publications ?? []).map((publication) => (
              <article key={publication.id} className="publication-card public-browse-card">
                <div className="publication-card__meta public-browse-meta">
                  <span>{publication.seriesLabel}</span>
                  <span>Public archive</span>
                </div>
                <h2>{publication.title}</h2>
                <p className="publication-card__summary public-browse-copy">{publication.summary}</p>
                <div className="publication-card__actions public-browse-actions">
                  <StatusBadge tone="neutral">Publication archive</StatusBadge>
                  <Link to={`/publications/${publication.slug}`} state={detailState}>
                    {publication.ctaLabel}
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
