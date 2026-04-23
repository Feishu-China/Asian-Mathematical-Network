import { Link, useLocation } from 'react-router-dom';
import { PortalShell } from '../components/layout/PortalShell';
import { PageModeBadge } from '../components/ui/PageModeBadge';
import { RoleBadge } from '../components/ui/RoleBadge';
import { StatusBadge } from '../components/ui/StatusBadge';
import { readReturnContext } from '../features/navigation/returnContext';
import { newsletterIssues } from '../features/newsletter/staticNewsletterContent';
import './Newsletter.css';

export const routePath = '/newsletter';

export default function Newsletters() {
  const location = useLocation();
  const returnContext = readReturnContext(location.state);

  return (
    <PortalShell
      eyebrow="Editorial archive"
      title="Newsletter"
      description="A static preview surface for editorial curation, issue framing, and product-signaling content."
      badges={
        <>
          <RoleBadge role="visitor" />
          <PageModeBadge mode="static-preview" />
          <StatusBadge tone="info">Newsletter archive</StatusBadge>
        </>
      }
      actions={
        returnContext ? (
          <Link to={returnContext.to} className="my-applications__section-link">
            {returnContext.label}
          </Link>
        ) : null
      }
    >
      <div className="newsletter-page">
        <div className="newsletter-grid">
          {newsletterIssues.map((issue) => (
            <article key={issue.id} className="newsletter-card">
              <div className="newsletter-card__meta">
                <span>{issue.issueLabel}</span>
                <span>Static preview</span>
              </div>
              <h2>{issue.title}</h2>
              <p className="newsletter-card__summary">{issue.summary}</p>
                <div className="newsletter-card__actions">
                  <StatusBadge tone="neutral">Editorial layer</StatusBadge>
                  <Link to={`/newsletter/${issue.slug}`}>{issue.ctaLabel}</Link>
                </div>
              </article>
            ))}
        </div>
      </div>
    </PortalShell>
  );
}
