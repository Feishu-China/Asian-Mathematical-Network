import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { PublicPortalNav } from '../components/layout/PublicPortalNav';
import { PortalShell } from '../components/layout/PortalShell';
import { PageModeBadge } from '../components/ui/PageModeBadge';
import { RoleBadge } from '../components/ui/RoleBadge';
import { StatusBadge } from '../components/ui/StatusBadge';
import { ConferenceListCard } from '../features/conference/ConferenceListCard';
import { DemoStatePanel } from '../features/demo/DemoStatePanel';
import { readReturnContext, toReturnContextState } from '../features/navigation/returnContext';
import { conferenceProvider } from '../features/conference/conferenceProvider';
import type { ConferenceListItem } from '../features/conference/types';
import './Conference.css';

export const routePath = '/conferences';

export default function Conferences() {
  const [items, setItems] = useState<ConferenceListItem[] | null>(null);
  const [hasError, setHasError] = useState(false);
  const hasApplicantSession = Boolean(localStorage.getItem('token'));
  const location = useLocation();
  const returnContext = readReturnContext(location.state);
  const detailState = toReturnContextState(returnContext);

  useEffect(() => {
    let active = true;

    setHasError(false);
    setItems(null);

    conferenceProvider
      .listPublicConferences()
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
          <Link
            to={returnContext.to}
            state={returnContext.state}
            className="my-applications__section-link"
          >
            {returnContext.label}
          </Link>
        ) : hasApplicantSession ? (
          <Link to="/me/applications" className="my-applications__section-link">
            Back to my applications
          </Link>
        ) : null
      }
    >
      <div className="conference-page public-browse-page">
        {items === null ? (
          <DemoStatePanel
            badgeLabel={hasError ? 'Error' : 'Loading'}
            title={hasError ? 'Conference list unavailable' : 'Loading conferences'}
            description={
              hasError
                ? 'We could not load the published conference list right now.'
                : 'Preparing the published conference opportunities used in the demo.'
            }
            tone={hasError ? 'danger' : 'info'}
          />
        ) : items.length === 0 ? (
          <DemoStatePanel
            badgeLabel="Empty"
            title="No published conferences yet"
            description="Published conference opportunities will appear here once organizers release them."
            tone="neutral"
          />
        ) : (
          <div className="conference-grid public-browse-grid">
            {items.map((conference) => (
              <ConferenceListCard key={conference.id} conference={conference} detailState={detailState} />
            ))}
          </div>
        )}
      </div>
    </PortalShell>
  );
}
