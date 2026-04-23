import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { PortalShell } from '../components/layout/PortalShell';
import { PageModeBadge } from '../components/ui/PageModeBadge';
import { RoleBadge } from '../components/ui/RoleBadge';
import { StatusBadge } from '../components/ui/StatusBadge';
import { readReturnContext, toReturnContextState } from '../features/navigation/returnContext';
import { GrantListCard } from '../features/grant/GrantListCard';
import { grantProvider } from '../features/grant/grantProvider';
import type { GrantListItem } from '../features/grant/types';
import './Conference.css';

export const routePath = '/grants';

export default function Grants() {
  const [items, setItems] = useState<GrantListItem[] | null>(null);
  const [hasError, setHasError] = useState(false);
  const hasApplicantSession = Boolean(localStorage.getItem('token'));
  const location = useLocation();
  const returnContext = readReturnContext(location.state);
  const detailState = toReturnContextState(returnContext);

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

  if (items === null) {
    if (hasError) {
      return <div className="conference-page">We could not load grants right now.</div>;
    }

    return <div className="conference-page">Loading grants...</div>;
  }

  return (
    <PortalShell
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
          <Link to={returnContext.to} className="my-applications__section-link">
            {returnContext.label}
          </Link>
        ) : hasApplicantSession ? (
          <Link to="/me/applications" className="my-applications__section-link">
            Back to my applications
          </Link>
        ) : null
      }
    >
      <div className="conference-page">
        {items.length === 0 ? (
          <div className="conference-empty">No published grants yet.</div>
        ) : (
          <div className="conference-grid">
            {items.map((grant) => (
              <GrantListCard key={grant.id} grant={grant} detailState={detailState} />
            ))}
          </div>
        )}
      </div>
    </PortalShell>
  );
}
