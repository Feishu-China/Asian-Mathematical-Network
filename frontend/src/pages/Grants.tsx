import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { PublicPortalNav } from '../components/layout/PublicPortalNav';
import { PortalShell } from '../components/layout/PortalShell';
import { PageModeBadge } from '../components/ui/PageModeBadge';
import { RoleBadge } from '../components/ui/RoleBadge';
import { StatusBadge } from '../components/ui/StatusBadge';
import { DemoStatePanel } from '../features/demo/DemoStatePanel';
import { DASHBOARD_RETURN_CONTEXT } from '../features/demo/demoWalkthrough';
import { readReturnContext, toReturnContextState } from '../features/navigation/returnContext';
import { GrantListCard } from '../features/grant/GrantListCard';
import { grantProvider } from '../features/grant/grantProvider';
import type { GrantListItem, LinkedOpportunityType } from '../features/grant/types';
import './Conference.css';

export const routePath = '/grants';

export default function Grants() {
  const [items, setItems] = useState<GrantListItem[] | null>(null);
  const [hasError, setHasError] = useState(false);
  const hasApplicantSession = Boolean(localStorage.getItem('token'));
  const location = useLocation();
  const returnContext = readReturnContext(location.state);
  const detailState = toReturnContextState(returnContext);
  const preferredOpportunityType = readPreferredOpportunityType(returnContext?.to);

  useEffect(() => {
    let active = true;

    setHasError(false);
    setItems(null);

    grantProvider
      .listPublicGrants()
      .then((value) => {
        if (active) {
          setItems(value);
        }
      })
      .catch(() => {
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
      eyebrow="Public opportunities"
      title="Travel grants"
      description="Browse published grant opportunities and open the applicant flow without taking ownership of the future portal dashboard."
      badges={
        <>
          <RoleBadge role="visitor" />
          <PageModeBadge mode="hybrid" />
          <StatusBadge tone="info">Published grants only</StatusBadge>
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
        ) : hasApplicantSession ? (
          <Link to={DASHBOARD_RETURN_CONTEXT.to} className="my-applications__section-link">
            {DASHBOARD_RETURN_CONTEXT.label}
          </Link>
        ) : null
      }
    >
      <div className="conference-page public-browse-page">
        {items === null ? (
          <DemoStatePanel
            badgeLabel={hasError ? 'Error' : 'Loading'}
            title={hasError ? 'Grant list unavailable' : 'Loading grants'}
            description={
              hasError
                ? 'We could not load grants right now.'
                : 'Preparing the published grant opportunities used in the demo.'
            }
            tone={hasError ? 'danger' : 'info'}
          />
        ) : items.length === 0 ? (
          <DemoStatePanel
            badgeLabel="Empty"
            title="No published grants yet"
            description="Published grant opportunities will appear here once organizers release them."
            tone="neutral"
          />
        ) : (
          <div className="conference-grid public-browse-grid">
            {sortByPreferredOpportunity(items, preferredOpportunityType).map((grant) => (
              <GrantListCard key={grant.id} grant={grant} detailState={detailState} />
            ))}
          </div>
        )}
      </div>
    </PortalShell>
  );
}

const readPreferredOpportunityType = (path?: string): LinkedOpportunityType | null => {
  if (!path) {
    return null;
  }

  if (path.startsWith('/schools/')) {
    return 'school';
  }

  if (path.startsWith('/conferences/')) {
    return 'conference';
  }

  return null;
};

const sortByPreferredOpportunity = (
  items: GrantListItem[],
  preferredOpportunityType: LinkedOpportunityType | null
) => {
  if (!preferredOpportunityType) {
    return items;
  }

  return [...items].sort((left, right) => {
    const leftScore = left.linkedOpportunityType === preferredOpportunityType ? 0 : 1;
    const rightScore = right.linkedOpportunityType === preferredOpportunityType ? 0 : 1;
    return leftScore - rightScore;
  });
};
