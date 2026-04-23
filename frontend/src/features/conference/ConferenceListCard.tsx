import { Link } from 'react-router-dom';
import { StatusBadge } from '../../components/ui/StatusBadge';
import type { ReturnContextState } from '../navigation/returnContext';
import type { ConferenceListItem } from './types';

type Props = {
  conference: ConferenceListItem;
  detailState?: ReturnContextState;
};

export function ConferenceListCard({ conference, detailState }: Props) {
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
        <Link to={`/conferences/${conference.slug}`} state={detailState}>
          View details
        </Link>
      </div>
    </article>
  );
}
