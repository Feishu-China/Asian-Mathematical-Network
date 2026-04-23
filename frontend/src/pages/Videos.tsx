import { Link, useLocation } from 'react-router-dom';
import { PortalShell } from '../components/layout/PortalShell';
import { PageModeBadge } from '../components/ui/PageModeBadge';
import { RoleBadge } from '../components/ui/RoleBadge';
import { StatusBadge } from '../components/ui/StatusBadge';
import { readReturnContext, toReturnContextState } from '../features/navigation/returnContext';
import { videoPreviews } from '../features/video/staticVideoContent';
import './Video.css';

export const routePath = '/videos';

export default function Videos() {
  const location = useLocation();
  const returnContext = readReturnContext(location.state);
  const detailState = toReturnContextState(returnContext);

  return (
    <PortalShell
      eyebrow="Media archive"
      title="Videos"
      description="A static preview surface for session recaps, explainers, and community-facing media layers."
      badges={
        <>
          <RoleBadge role="visitor" />
          <PageModeBadge mode="static-preview" />
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
      <div className="video-page">
        <div className="video-grid">
          {videoPreviews.map((video) => (
            <article key={video.id} className="video-card">
              <div className="video-card__meta">
                <span>{video.seriesLabel}</span>
                <span>Static preview</span>
              </div>
              <h2>{video.title}</h2>
              <p className="video-card__summary">{video.summary}</p>
              <div className="video-card__actions">
                <StatusBadge tone="neutral">Media layer</StatusBadge>
                <Link to={`/videos/${video.slug}`} state={detailState}>
                  {video.ctaLabel}
                </Link>
              </div>
            </article>
          ))}
        </div>
      </div>
    </PortalShell>
  );
}
