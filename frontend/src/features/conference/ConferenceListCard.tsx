import { Link } from 'react-router-dom';
import { StatusBadge } from '../../components/ui/StatusBadge';
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
        <StatusBadge tone={conference.isApplicationOpen ? 'success' : 'neutral'}>
          {conference.isApplicationOpen ? 'Applications open' : 'Applications closed'}
        </StatusBadge>
        <Link to={`/conferences/${conference.slug}`}>View details</Link>
      </div>
    </article>
  );
}
