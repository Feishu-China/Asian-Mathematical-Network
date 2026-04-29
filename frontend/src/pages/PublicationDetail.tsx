import { useEffect, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
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

export const routePath = '/publications/:slug';

export default function PublicationDetail() {
  const { slug = '' } = useParams();
  const [publication, setPublication] = useState<PublicationPreview | null | undefined>(undefined);
  const [hasError, setHasError] = useState(false);
  const location = useLocation();
  const returnContext = readReturnContext(location.state);

  useEffect(() => {
    let active = true;

    setPublication(undefined);
    setHasError(false);
    publicationProvider.getPublicationBySlug(slug).then((value) => {
      if (active) {
        setPublication(value);
      }
    }).catch(() => {
      if (active) {
        setPublication(null);
        setHasError(true);
      }
    });

    return () => {
      active = false;
    };
  }, [slug]);

  const isLoading = publication === undefined;
  const isUnavailable = publication === null;

  return (
    <PortalShell
      masthead={<PublicPortalNav />}
      eyebrow="Publication archive"
      title={publication?.title ?? 'Publication archive item'}
      description={publication?.summary ?? 'Review the public publication record and return to the archive from here.'}
      badges={
        <>
          <RoleBadge role="visitor" />
          <PageModeBadge mode="hybrid" />
          <StatusBadge tone={hasError ? 'danger' : isUnavailable ? 'neutral' : 'info'}>
            {hasError ? 'Unavailable' : isUnavailable ? 'Not found' : isLoading ? 'Loading' : 'Publication archive'}
          </StatusBadge>
        </>
      }
      actions={
        <Link
          to="/publications"
          state={toReturnContextState(returnContext)}
          className="my-applications__section-link"
        >
          Back to publications
        </Link>
      }
      aside={
        publication ? (
          <div className="publication-detail-card publication-teaser-card public-browse-card public-browse-aside-card">
            <h2>Publication focus</h2>
            <p className="public-browse-copy">{publication.publicationFocus}</p>
            <Link
              className="public-browse-primary-link"
              to="/newsletter"
              state={{
                returnContext: {
                  to: `/publications/${publication.slug}`,
                  label: 'Back to publication',
                  state: toReturnContextState(returnContext),
                },
              }}
            >
              Open newsletter archive
            </Link>
          </div>
        ) : null
      }
    >
      <div className="publication-page public-browse-page">
        {isLoading ? (
          <DemoStatePanel
            badgeLabel="Loading"
            title="Loading publication archive item"
            description="Preparing the selected publication for the public archive."
            tone="info"
          />
        ) : hasError ? (
          <DemoStatePanel
            badgeLabel="Error"
            title="Publication archive unavailable"
            description="We could not load this publication right now."
            tone="danger"
          />
        ) : isUnavailable ? (
          <DemoStatePanel
            badgeLabel="Unavailable"
            title="Publication not found"
            description="This publication is not published or is unavailable in the current archive."
            tone="neutral"
          />
        ) : (
          <section className="publication-detail-card public-browse-card">
            <h2>Highlights</h2>
            <ul className="publication-highlight-list public-browse-list">
              {publication.highlights.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </PortalShell>
  );
}
