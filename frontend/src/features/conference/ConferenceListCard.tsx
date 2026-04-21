import { Link } from 'react-router-dom';
import type { ConferenceListItem } from './types';

type Props = {
  conference: ConferenceListItem;
};

export function ConferenceListCard({ conference }: Props) {
  return (
    <article className="conference-card">
      <div className="conference-card-meta">
        <span>{conference.locationText || 'Location pending'}</span>
        <span>{conference.startDate || 'Date pending'}</span>
      </div>
      <h2>{conference.title}</h2>
      <p className="conference-card-subtitle">{conference.shortName || 'Conference opportunity'}</p>
      <div className="conference-card-actions">
        <span className={conference.isApplicationOpen ? 'conference-chip open' : 'conference-chip closed'}>
          {conference.isApplicationOpen ? 'Applications open' : 'Applications closed'}
        </span>
        <Link to={`/conferences/${conference.slug}`}>View details</Link>
      </div>
    </article>
  );
}
