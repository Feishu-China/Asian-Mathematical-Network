import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { PortalShell } from '../components/layout/PortalShell';
import { PageModeBadge } from '../components/ui/PageModeBadge';
import { RoleBadge } from '../components/ui/RoleBadge';
import { StatusBadge } from '../components/ui/StatusBadge';
import { ConferenceListCard } from '../features/conference/ConferenceListCard';
import { readReturnContext } from '../features/navigation/returnContext';
import { conferenceProvider } from '../features/conference/conferenceProvider';
import type { ConferenceListItem } from '../features/conference/types';
import './Conference.css';

export const routePath = '/conferences';

export default function Conferences() {
  const [items, setItems] = useState<ConferenceListItem[] | null>(null);
  const hasApplicantSession = Boolean(localStorage.getItem('token'));
  const location = useLocation();
  const returnContext = readReturnContext(location.state);

  useEffect(() => {
    conferenceProvider.listPublicConferences().then(setItems);
  }, []);

  if (items === null) {
    return <div className="conference-page">Loading conferences...</div>;
  }

  return (
    <PortalShell
      eyebrow="Public opportunities"
      title="Conferences"
      description="Browse the published conference opportunities currently open on the network."
      badges={
        <>
          <RoleBadge role="visitor" />
          <PageModeBadge mode="hybrid" />
          <StatusBadge tone="info">Portal entry</StatusBadge>
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
          <div className="conference-empty">No published conferences yet.</div>
        ) : (
          <div className="conference-grid">
            {items.map((conference) => (
              <ConferenceListCard key={conference.id} conference={conference} />
            ))}
          </div>
        )}
      </div>
    </PortalShell>
  );
}
