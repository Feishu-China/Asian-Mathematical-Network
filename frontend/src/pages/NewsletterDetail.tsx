import { Link, useLocation, useParams } from 'react-router-dom';
import { PortalShell } from '../components/layout/PortalShell';
import { PageModeBadge } from '../components/ui/PageModeBadge';
import { RoleBadge } from '../components/ui/RoleBadge';
import { StatusBadge } from '../components/ui/StatusBadge';
import { readReturnContext, toReturnContextState } from '../features/navigation/returnContext';
import { getNewsletterBySlug } from '../features/newsletter/staticNewsletterContent';
import './Newsletter.css';

export const routePath = '/newsletter/:slug';

export default function NewsletterDetail() {
  const { slug = '' } = useParams();
  const location = useLocation();
  const returnContext = readReturnContext(location.state);
  const issue = getNewsletterBySlug(slug);

  if (!issue) {
    return <div className="newsletter-page">Newsletter issue not found.</div>;
  }

  return (
    <PortalShell
      eyebrow="Newsletter issue"
      title={issue.title}
      description={issue.summary}
      badges={
        <>
          <RoleBadge role="visitor" />
          <PageModeBadge mode="static-preview" />
          <StatusBadge tone="info">Issue preview</StatusBadge>
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
        <div className="newsletter-detail-card newsletter-teaser-card">
          <h2>Issue focus</h2>
          <p>{issue.issueFocus}</p>
          <Link className="newsletter-primary-link" to="/conferences">
            Return to opportunities
          </Link>
        </div>
      }
    >
      <div className="newsletter-page newsletter-detail-page">
        <section className="newsletter-detail-card">
          <h2>Highlights</h2>
          <ul className="newsletter-highlight-list">
            {issue.highlights.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
      </div>
    </PortalShell>
  );
}
