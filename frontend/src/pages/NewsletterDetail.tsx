import { useEffect, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { PublicPortalNav } from '../components/layout/PublicPortalNav';
import { PortalShell } from '../components/layout/PortalShell';
import { PageModeBadge } from '../components/ui/PageModeBadge';
import { RoleBadge } from '../components/ui/RoleBadge';
import { StatusBadge } from '../components/ui/StatusBadge';
import { DemoStatePanel } from '../features/demo/DemoStatePanel';
import {
  buildChainedReturnState,
  OPPORTUNITIES_RETURN_CONTEXT,
} from '../features/demo/demoWalkthrough';
import { readReturnContext, toReturnContextState } from '../features/navigation/returnContext';
import { newsletterProvider } from '../features/newsletter/newsletterProvider';
import type { NewsletterIssue } from '../features/newsletter/types';
import './Newsletter.css';

export const routePath = '/newsletter/:slug';

export default function NewsletterDetail() {
  const { slug = '' } = useParams();
  const [issue, setIssue] = useState<NewsletterIssue | null | undefined>(undefined);
  const [hasError, setHasError] = useState(false);
  const location = useLocation();
  const returnContext = readReturnContext(location.state);

  useEffect(() => {
    let active = true;

    setIssue(undefined);
    setHasError(false);
    newsletterProvider.getIssueBySlug(slug).then((value) => {
      if (active) {
        setIssue(value);
      }
    }).catch(() => {
      if (active) {
        setIssue(null);
        setHasError(true);
      }
    });

    return () => {
      active = false;
    };
  }, [slug]);

  const isLoading = issue === undefined;
  const isUnavailable = issue === null;

  return (
    <PortalShell
      masthead={<PublicPortalNav />}
      eyebrow="Newsletter issue"
      title={issue?.title ?? 'Newsletter issue'}
      description={issue?.summary ?? 'Review the public newsletter record and return to the archive from here.'}
      badges={
        <>
          <RoleBadge role="visitor" />
          <PageModeBadge mode="hybrid" />
          <StatusBadge tone={hasError ? 'danger' : isUnavailable ? 'neutral' : 'info'}>
            {hasError ? 'Unavailable' : isUnavailable ? 'Not found' : isLoading ? 'Loading' : 'Newsletter archive'}
          </StatusBadge>
        </>
      }
      actions={
        <Link
          to="/newsletter"
          state={toReturnContextState(returnContext)}
          className="my-applications__section-link"
        >
          Back to newsletter
        </Link>
      }
      aside={
        issue ? (
          <div className="newsletter-detail-card newsletter-teaser-card public-browse-card public-browse-aside-card">
            <h2>Issue focus</h2>
            <p className="public-browse-copy">{issue.issueFocus}</p>
            <Link
              className="public-browse-primary-link"
              to="/opportunities"
              state={buildChainedReturnState(OPPORTUNITIES_RETURN_CONTEXT, {
                to: `/newsletter/${issue.slug}`,
                label: 'Back to newsletter issue',
                state: toReturnContextState(returnContext),
              })}
            >
              Return to opportunities
            </Link>
          </div>
        ) : null
      }
    >
      <div className="newsletter-page newsletter-detail-page public-browse-page">
        {isLoading ? (
          <DemoStatePanel
            badgeLabel="Loading"
            title="Loading newsletter archive item"
            description="Preparing the selected newsletter issue for the public archive."
            tone="info"
          />
        ) : hasError ? (
          <DemoStatePanel
            badgeLabel="Error"
            title="Newsletter archive unavailable"
            description="We could not load this newsletter issue right now."
            tone="danger"
          />
        ) : isUnavailable ? (
          <DemoStatePanel
            badgeLabel="Unavailable"
            title="Newsletter issue not found"
            description="This newsletter issue is not published or is unavailable in the current archive."
            tone="neutral"
          />
        ) : (
          <section className="newsletter-detail-card public-browse-card">
            <h2>Highlights</h2>
            <ul className="newsletter-highlight-list public-browse-list">
              {issue.highlights.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </PortalShell>
  );
}
