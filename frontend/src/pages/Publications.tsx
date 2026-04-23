import { Link, useLocation } from 'react-router-dom';
import { PortalShell } from '../components/layout/PortalShell';
import { PageModeBadge } from '../components/ui/PageModeBadge';
import { RoleBadge } from '../components/ui/RoleBadge';
import { StatusBadge } from '../components/ui/StatusBadge';
import { readReturnContext, toReturnContextState } from '../features/navigation/returnContext';
import { publicationPreviews } from '../features/publication/staticPublicationContent';
import './Publication.css';

export const routePath = '/publications';

export default function Publications() {
  const location = useLocation();
  const returnContext = readReturnContext(location.state);
  const detailState = toReturnContextState(returnContext);

  return (
    <PortalShell
      eyebrow="Publication archive"
      title="Publications"
      description="A static preview surface for lecture notes, digests, and publication-facing knowledge layers."
      badges={
        <>
          <RoleBadge role="visitor" />
          <PageModeBadge mode="static-preview" />
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
      <div className="publication-page">
        <div className="publication-grid">
          {publicationPreviews.map((publication) => (
            <article key={publication.id} className="publication-card">
              <div className="publication-card__meta">
                <span>{publication.seriesLabel}</span>
                <span>Static preview</span>
              </div>
              <h2>{publication.title}</h2>
              <p className="publication-card__summary">{publication.summary}</p>
              <div className="publication-card__actions">
                <StatusBadge tone="neutral">Publication layer</StatusBadge>
                <Link to={`/publications/${publication.slug}`} state={detailState}>
                  {publication.ctaLabel}
                </Link>
              </div>
            </article>
          ))}
        </div>
      </div>
    </PortalShell>
  );
}
