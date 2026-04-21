import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { grantProvider } from '../features/grant/grantProvider';
import type { GrantDetail as GrantDetailModel } from '../features/grant/types';
import './Conference.css';

export const routePath = '/grants/:slug';

export default function GrantDetail() {
  const { slug = '' } = useParams();
  const [grant, setGrant] = useState<GrantDetailModel | null | undefined>(undefined);

  useEffect(() => {
    grantProvider.getGrantBySlug(slug).then(setGrant);
  }, [slug]);

  if (grant === undefined) {
    return <div className="conference-page">Loading grant...</div>;
  }

  if (grant === null) {
    return <div className="conference-page">Grant not found.</div>;
  }

  return (
    <div className="conference-page conference-detail-page">
      <header className="conference-hero">
        <p className="conference-eyebrow">Grant detail</p>
        <h1>{grant.title}</h1>
        <p>{grant.description || 'No description has been published yet.'}</p>
      </header>

      <section className="conference-detail-grid">
        <div className="conference-detail-card">
          <h2>Support snapshot</h2>
          <dl>
            <div>
              <dt>Grant type</dt>
              <dd>Conference travel grant</dd>
            </div>
            <div>
              <dt>Deadline</dt>
              <dd>{grant.applicationDeadline || 'Pending'}</dd>
            </div>
            <div>
              <dt>Coverage</dt>
              <dd>{grant.coverageSummary || 'Pending'}</dd>
            </div>
            <div>
              <dt>Eligibility</dt>
              <dd>{grant.eligibilitySummary || 'Pending'}</dd>
            </div>
          </dl>
        </div>

        <aside className="conference-detail-card conference-cta-card">
          <span className={grant.isApplicationOpen ? 'conference-chip open' : 'conference-chip closed'}>
            {grant.isApplicationOpen ? 'Applications open' : 'Applications closed'}
          </span>
          <p>Submit your conference application first, then request travel support through a separate grant application.</p>
          {grant.isApplicationOpen ? (
            <Link className="conference-primary-link" to={`/grants/${grant.slug}/apply`}>
              Apply for grant
            </Link>
          ) : (
            <div className="conference-muted-note">This grant is no longer accepting applications.</div>
          )}
        </aside>
      </section>
    </div>
  );
}
