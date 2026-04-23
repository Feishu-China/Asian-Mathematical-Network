import { Link } from 'react-router-dom';
import { StatusBadge } from '../../components/ui/StatusBadge';
import type { ReturnContextState } from '../navigation/returnContext';
import type { GrantListItem } from './types';

type Props = {
  grant: GrantListItem;
  detailState?: ReturnContextState;
};

const formatGrantType = (grantType: GrantListItem['grantType']) => {
  if (grantType === 'conference_travel_grant') {
    return 'Conference travel grant';
  }

  return grantType;
};

export function GrantListCard({ grant, detailState }: Props) {
  return (
    <article className="conference-card">
      <div className="conference-card-meta">
        <span>{formatGrantType(grant.grantType)}</span>
        <span>{grant.applicationDeadline || 'Deadline pending'}</span>
      </div>
      <h2>{grant.title}</h2>
      <p className="conference-card-subtitle">
        {grant.reportRequired ? 'Post-visit reporting required' : 'No post-visit report required'}
      </p>
      <div className="conference-card-actions">
        <StatusBadge tone={grant.isApplicationOpen ? 'success' : 'neutral'}>
          {grant.isApplicationOpen ? 'Applications open' : 'Applications closed'}
        </StatusBadge>
        <Link to={`/grants/${grant.slug}`} state={detailState}>
          View details
        </Link>
      </div>
    </article>
  );
}
