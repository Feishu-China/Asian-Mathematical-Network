import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { conferenceProvider } from '../features/conference/conferenceProvider';
import type { ConferenceDetail as ConferenceDetailModel } from '../features/conference/types';
import './Conference.css';

export const routePath = '/conferences/:slug';

export default function ConferenceDetail() {
  const { slug = '' } = useParams();
  const [conference, setConference] = useState<ConferenceDetailModel | null | undefined>(undefined);

  useEffect(() => {
    conferenceProvider.getConferenceBySlug(slug).then(setConference);
  }, [slug]);

  if (conference === undefined) {
    return <div className="conference-page">Loading conference...</div>;
  }

  if (conference === null) {
    return <div className="conference-page">Conference not found.</div>;
  }

  return (
    <div className="conference-page conference-detail-page">
      <header className="conference-hero">
        <p className="conference-eyebrow">Conference detail</p>
        <h1>{conference.title}</h1>
        <p>{conference.description || 'No description has been published yet.'}</p>
      </header>

      <section className="conference-detail-grid">
        <div className="conference-detail-card">
          <h2>Event snapshot</h2>
          <dl>
            <div>
              <dt>Location</dt>
              <dd>{conference.locationText || 'Pending'}</dd>
            </div>
            <div>
              <dt>Dates</dt>
              <dd>
                {conference.startDate || 'Pending'} to {conference.endDate || 'Pending'}
              </dd>
            </div>
            <div>
              <dt>Application deadline</dt>
              <dd>{conference.applicationDeadline || 'Pending'}</dd>
            </div>
          </dl>
        </div>

        <aside className="conference-detail-card conference-cta-card">
          <span className={conference.isApplicationOpen ? 'conference-chip open' : 'conference-chip closed'}>
            {conference.isApplicationOpen ? 'Applications open' : 'Applications closed'}
          </span>
          <p>
            Conference applications remain separate from travel-grant applications in the MVP.
          </p>
          {conference.isApplicationOpen ? (
            <Link className="conference-primary-link" to={`/conferences/${conference.slug}/apply`}>
              Apply for conference
            </Link>
          ) : (
            <div className="conference-muted-note">This conference is no longer accepting applications.</div>
          )}
        </aside>
      </section>
    </div>
  );
}
