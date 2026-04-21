import { Link } from 'react-router-dom';
import type { GrantListItem } from './types';

type Props = {
  grant: GrantListItem;
};

const formatGrantType = (grantType: GrantListItem['grantType']) => {
  if (grantType === 'conference_travel_grant') {
    return 'Conference travel grant';
  }

  return grantType;
};

export function GrantListCard({ grant }: Props) {
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
        <span className={grant.isApplicationOpen ? 'conference-chip open' : 'conference-chip closed'}>
          {grant.isApplicationOpen ? 'Applications open' : 'Applications closed'}
        </span>
        <Link to={`/grants/${grant.slug}`}>View details</Link>
      </div>
    </article>
  );
}
