import { Link, useLocation, useParams } from 'react-router-dom';
import { PortalShell } from '../components/layout/PortalShell';
import { PageModeBadge } from '../components/ui/PageModeBadge';
import { RoleBadge } from '../components/ui/RoleBadge';
import { StatusBadge } from '../components/ui/StatusBadge';
import { readReturnContext, toReturnContextState } from '../features/navigation/returnContext';
import { getVideoBySlug } from '../features/video/staticVideoContent';
import './Video.css';

export const routePath = '/videos/:slug';

export default function VideoDetail() {
  const { slug = '' } = useParams();
  const location = useLocation();
  const returnContext = readReturnContext(location.state);
  const video = getVideoBySlug(slug);

  if (!video) {
    return <div className="video-page">Video preview not found.</div>;
  }

  return (
    <PortalShell
      eyebrow="Video preview"
      title={video.title}
      description={video.summary}
      badges={
        <>
          <RoleBadge role="visitor" />
          <PageModeBadge mode="static-preview" />
          <StatusBadge tone="info">Video preview</StatusBadge>
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
        <div className="video-detail-card video-teaser-card">
          <h2>Video focus</h2>
          <p>{video.videoFocus}</p>
          <Link
            className="video-primary-link"
            to="/newsletter"
            state={{
              returnContext: {
                to: `/videos/${video.slug}`,
                label: 'Back to video',
                state: toReturnContextState(returnContext),
              },
            }}
          >
            Continue to editorial layer
          </Link>
        </div>
      }
    >
      <div className="video-page">
        <section className="video-detail-card">
          <h2>Highlights</h2>
          <ul className="video-highlight-list">
            {video.highlights.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
      </div>
    </PortalShell>
  );
}
