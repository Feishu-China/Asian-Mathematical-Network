import { Link, useLocation, useParams } from 'react-router-dom';
import { PortalShell } from '../components/layout/PortalShell';
import { PageModeBadge } from '../components/ui/PageModeBadge';
import { RoleBadge } from '../components/ui/RoleBadge';
import { StatusBadge } from '../components/ui/StatusBadge';
import { readReturnContext, toReturnContextState } from '../features/navigation/returnContext';
import { getPublicationBySlug } from '../features/publication/staticPublicationContent';
import './Publication.css';

export const routePath = '/publications/:slug';

export default function PublicationDetail() {
  const { slug = '' } = useParams();
  const location = useLocation();
  const returnContext = readReturnContext(location.state);
  const publication = getPublicationBySlug(slug);

  if (!publication) {
    return <div className="publication-page">Publication preview not found.</div>;
  }

  return (
    <PortalShell
      eyebrow="Publication preview"
      title={publication.title}
      description={publication.summary}
      badges={
        <>
          <RoleBadge role="visitor" />
          <PageModeBadge mode="static-preview" />
          <StatusBadge tone="info">Publication preview</StatusBadge>
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
        <div className="publication-detail-card publication-teaser-card">
          <h2>Publication focus</h2>
          <p>{publication.publicationFocus}</p>
          <Link
            className="publication-primary-link"
            to="/newsletter"
            state={{
              returnContext: {
                to: `/publications/${publication.slug}`,
                label: 'Back to publication',
                state: toReturnContextState(returnContext),
              },
            }}
          >
            Continue to editorial layer
          </Link>
        </div>
      }
    >
      <div className="publication-page">
        <section className="publication-detail-card">
          <h2>Highlights</h2>
          <ul className="publication-highlight-list">
            {publication.highlights.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
      </div>
    </PortalShell>
  );
}
