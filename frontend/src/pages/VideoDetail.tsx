import { useEffect, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
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

export const routePath = '/videos/:slug';

export default function VideoDetail() {
  const { slug = '' } = useParams();
  const [video, setVideo] = useState<VideoPreview | null | undefined>(undefined);
  const [hasError, setHasError] = useState(false);
  const location = useLocation();
  const returnContext = readReturnContext(location.state);

  useEffect(() => {
    let active = true;

    setVideo(undefined);
    setHasError(false);
    videoProvider.getVideoBySlug(slug).then((value) => {
      if (active) {
        setVideo(value);
      }
    }).catch(() => {
      if (active) {
        setVideo(null);
        setHasError(true);
      }
    });

    return () => {
      active = false;
    };
  }, [slug]);

  const isLoading = video === undefined;
  const isUnavailable = video === null;

  return (
    <PortalShell
      masthead={<PublicPortalNav />}
      eyebrow="Video archive"
      title={video?.title ?? 'Video archive item'}
      description={video?.summary ?? 'Review the public video record and return to the archive from here.'}
      badges={
        <>
          <RoleBadge role="visitor" />
          <PageModeBadge mode="hybrid" />
          <StatusBadge tone={hasError ? 'danger' : isUnavailable ? 'neutral' : 'info'}>
            {hasError ? 'Unavailable' : isUnavailable ? 'Not found' : isLoading ? 'Loading' : 'Video archive'}
          </StatusBadge>
        </>
      }
      actions={
        <Link
          to="/videos"
          state={toReturnContextState(returnContext)}
          className="my-applications__section-link"
        >
          Back to videos
        </Link>
      }
      aside={
        video ? (
          <div className="video-detail-card video-teaser-card public-browse-card public-browse-aside-card">
            <h2>Video focus</h2>
            <p className="public-browse-copy">{video.videoFocus}</p>
            <Link
              className="public-browse-primary-link"
              to="/newsletter"
              state={{
                returnContext: {
                  to: `/videos/${video.slug}`,
                  label: 'Back to video',
                  state: toReturnContextState(returnContext),
                },
              }}
            >
              Open newsletter archive
            </Link>
          </div>
        ) : null
      }
    >
      <div className="video-page public-browse-page">
        {isLoading ? (
          <DemoStatePanel
            badgeLabel="Loading"
            title="Loading video archive item"
            description="Preparing the selected video for the public archive."
            tone="info"
          />
        ) : hasError ? (
          <DemoStatePanel
            badgeLabel="Error"
            title="Video archive unavailable"
            description="We could not load this video right now."
            tone="danger"
          />
        ) : isUnavailable ? (
          <DemoStatePanel
            badgeLabel="Unavailable"
            title="Video not found"
            description="This video is not published or is unavailable in the current archive."
            tone="neutral"
          />
        ) : (
          <section className="video-detail-card public-browse-card">
            <h2>Highlights</h2>
            <ul className="video-highlight-list public-browse-list">
              {video.highlights.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </PortalShell>
  );
}
