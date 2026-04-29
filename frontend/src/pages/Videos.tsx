import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { PublicPortalNav } from '../components/layout/PublicPortalNav';
import { PortalShell } from '../components/layout/PortalShell';
import { PageModeBadge } from '../components/ui/PageModeBadge';
import { RoleBadge } from '../components/ui/RoleBadge';
import { StatusBadge } from '../components/ui/StatusBadge';
import { DemoStatePanel } from '../features/demo/DemoStatePanel';
import { readReturnContext, toReturnContextState } from '../features/navigation/returnContext';
import { videoProvider } from '../features/video/videoProvider';
import type { VideoPreview } from '../features/video/types';
import './Video.css';

export const routePath = '/videos';

export default function Videos() {
  const [videos, setVideos] = useState<VideoPreview[] | null>(null);
  const [hasError, setHasError] = useState(false);
  const location = useLocation();
  const returnContext = readReturnContext(location.state);
  const detailState = toReturnContextState(returnContext);

  useEffect(() => {
    let active = true;

    setVideos(null);
    setHasError(false);

    videoProvider.listPublicVideos().then((value) => {
      if (active) {
        setVideos(value);
      }
    }).catch(() => {
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
      eyebrow="Media archive"
      title="Videos"
      description="Browse recorded sessions, explainers, and media recaps from across the network."
      badges={
        <>
          <RoleBadge role="visitor" />
          <PageModeBadge mode="hybrid" />
          <StatusBadge tone="info">Video archive</StatusBadge>
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
        ) : null
      }
    >
      <div className="video-page public-browse-page">
        {videos === null ? (
          <DemoStatePanel
            badgeLabel={hasError ? 'Error' : 'Loading'}
            title={hasError ? 'Video archive unavailable' : 'Loading video archive'}
            description={
              hasError
                ? 'We could not load the public video archive right now.'
                : 'Preparing the public videos used in the demo.'
            }
            tone={hasError ? 'danger' : 'info'}
          />
        ) : videos.length === 0 ? (
          <DemoStatePanel
            badgeLabel="Empty"
            title="No public videos yet"
            description="Public videos will appear here once they are ready."
            tone="neutral"
          />
        ) : (
          <div className="video-grid public-browse-grid public-browse-grid--compact">
            {(videos ?? []).map((video) => (
              <article key={video.id} className="video-card public-browse-card">
                <div className="video-card__meta public-browse-meta">
                  <span>{video.seriesLabel}</span>
                  <span>Public archive</span>
                </div>
                <h2>{video.title}</h2>
                <p className="video-card__summary public-browse-copy">{video.summary}</p>
                <div className="video-card__actions public-browse-actions">
                  <StatusBadge tone="neutral">Video archive</StatusBadge>
                  <Link to={`/videos/${video.slug}`} state={detailState}>
                    {video.ctaLabel}
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </PortalShell>
  );
}
