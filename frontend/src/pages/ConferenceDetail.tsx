import { useEffect, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { PortalShell } from '../components/layout/PortalShell';
import { PageModeBadge } from '../components/ui/PageModeBadge';
import { RoleBadge } from '../components/ui/RoleBadge';
import { StatusBadge } from '../components/ui/StatusBadge';
import { DemoStatePanel } from '../features/demo/DemoStatePanel';
import { readReturnContext, toReturnContextState } from '../features/navigation/returnContext';
import { conferenceProvider } from '../features/conference/conferenceProvider';
import type { ConferenceDetail as ConferenceDetailModel } from '../features/conference/types';
import './Conference.css';

export const routePath = '/conferences/:slug';

export default function ConferenceDetail() {
  const { slug = '' } = useParams();
  const location = useLocation();
  const returnContext = readReturnContext(location.state);
  const [conference, setConference] = useState<ConferenceDetailModel | null | undefined>(undefined);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    let active = true;

    setConference(undefined);
    setHasError(false);

    conferenceProvider
      .getConferenceBySlug(slug)
      .then((value) => {
        if (active) {
          setConference(value);
        }
      })
      .catch(() => {
        if (active) {
          setConference(null);
          setHasError(true);
        }
      });

    return () => {
      active = false;
    };
  }, [slug]);

  return (
    <PortalShell
      eyebrow="Conference detail"
      title={conference?.title ?? 'Conference detail'}
      description={
        conference?.description || 'Review the public conference record and continue into the applicant flow from here.'
      }
      badges={
        <>
          <RoleBadge role="visitor" />
          <PageModeBadge mode="hybrid" />
          <StatusBadge tone={conference ? (conference.isApplicationOpen ? 'success' : 'neutral') : hasError ? 'danger' : 'info'}>
            {conference
              ? conference.isApplicationOpen
                ? 'Applications open'
                : 'Applications closed'
              : hasError
                ? 'Unavailable'
                : 'Published detail'}
          </StatusBadge>
        </>
      }
      actions={
        <Link
          to="/conferences"
          state={toReturnContextState(returnContext)}
          className="my-applications__section-link"
        >
          Back to conferences
        </Link>
      }
      aside={
        conference ? (
          <>
            <div className="conference-detail-card conference-cta-card">
              <p>
                Conference applications remain separate from travel-grant applications in the MVP.
              </p>
              {conference.isApplicationOpen ? (
                <Link
                  className="conference-primary-link"
                  to={`/conferences/${conference.slug}/apply`}
                  state={toReturnContextState(returnContext)}
                >
                  Apply for conference
                </Link>
              ) : (
                <div className="conference-muted-note">
                  This conference is no longer accepting applications.
                </div>
              )}
            </div>
            <div className="conference-detail-card conference-scholar-card">
              <h2>Related scholar context</h2>
              <p>
                Show how one public scholar profile can support speaker, organiser, and review
                context across the wider platform demo.
              </p>
              <Link
                className="conference-primary-link"
                to="/scholars/alice-chen-demo"
                state={{
                  returnContext: {
                    to: `/conferences/${conference.slug}`,
                    label: 'Back to conference',
                    state: toReturnContextState(returnContext),
                  },
                }}
              >
                Alice Chen
              </Link>
            </div>
          </>
        ) : null
      }
    >
      <div className="conference-page conference-detail-page">
        {conference === undefined ? (
          <DemoStatePanel
            badgeLabel="Loading"
            title="Loading conference detail"
            description="Preparing this published conference record for the demo."
            tone="info"
          />
        ) : hasError ? (
          <DemoStatePanel
            badgeLabel="Error"
            title="Conference detail unavailable"
            description="We could not load this conference right now."
            tone="danger"
          />
        ) : conference === null ? (
          <DemoStatePanel
            badgeLabel="Unavailable"
            title="Conference not found"
            description="This conference is not published or is unavailable in the current demo dataset."
            tone="neutral"
          />
        ) : (
          <section className="conference-detail-card">
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
          </section>
        )}
      </div>
    </PortalShell>
  );
}
