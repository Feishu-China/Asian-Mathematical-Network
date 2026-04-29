import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { PublicPortalNav } from '../components/layout/PublicPortalNav';
import { PortalShell } from '../components/layout/PortalShell';
import { PageModeBadge } from '../components/ui/PageModeBadge';
import { RoleBadge } from '../components/ui/RoleBadge';
import { StatusBadge } from '../components/ui/StatusBadge';
import { DemoStatePanel } from '../features/demo/DemoStatePanel';
import { readReturnContext, toReturnContextState } from '../features/navigation/returnContext';
import { newsletterProvider } from '../features/newsletter/newsletterProvider';
import type { NewsletterIssue } from '../features/newsletter/types';
import './Newsletter.css';

export const routePath = '/newsletter';

export default function Newsletters() {
  const [issues, setIssues] = useState<NewsletterIssue[] | null>(null);
  const [hasError, setHasError] = useState(false);
  const location = useLocation();
  const returnContext = readReturnContext(location.state);
  const detailState = toReturnContextState(returnContext);

  useEffect(() => {
    let active = true;

    setIssues(null);
    setHasError(false);

    newsletterProvider.listPublicIssues().then((value) => {
      if (active) {
        setIssues(value);
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
      eyebrow="Editorial archive"
      title="Newsletter"
      description="Browse current newsletter issues covering workshops, mobility updates, and partner news across the network."
      badges={
        <>
          <RoleBadge role="visitor" />
          <PageModeBadge mode="hybrid" />
          <StatusBadge tone="info">Newsletter archive</StatusBadge>
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
      <div className="newsletter-page public-browse-page">
        {issues === null ? (
          <DemoStatePanel
            badgeLabel={hasError ? 'Error' : 'Loading'}
            title={hasError ? 'Newsletter archive unavailable' : 'Loading newsletter archive'}
            description={
              hasError
                ? 'We could not load the public newsletter archive right now.'
                : 'Preparing the public newsletter issues used in the demo.'
            }
            tone={hasError ? 'danger' : 'info'}
          />
        ) : issues.length === 0 ? (
          <DemoStatePanel
            badgeLabel="Empty"
            title="No public newsletter issues yet"
            description="Public newsletter issues will appear here once they are ready."
            tone="neutral"
          />
        ) : (
          <div className="newsletter-grid public-browse-grid public-browse-grid--compact">
            {(issues ?? []).map((issue) => (
              <article key={issue.id} className="newsletter-card public-browse-card">
                <div className="newsletter-card__meta public-browse-meta">
                  <span>{issue.issueLabel}</span>
                  <span>Public archive</span>
                </div>
                <h2>{issue.title}</h2>
                <p className="newsletter-card__summary public-browse-copy">{issue.summary}</p>
                <div className="newsletter-card__actions public-browse-actions">
                  <StatusBadge tone="neutral">Newsletter archive</StatusBadge>
                  <Link to={`/newsletter/${issue.slug}`} state={detailState}>
                    {issue.ctaLabel}
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
