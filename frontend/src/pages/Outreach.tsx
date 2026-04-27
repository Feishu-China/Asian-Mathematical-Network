import { Link } from 'react-router-dom';
import { PublicPortalNav } from '../components/layout/PublicPortalNav';
import { PortalShell } from '../components/layout/PortalShell';
import { PageModeBadge } from '../components/ui/PageModeBadge';
import { RoleBadge } from '../components/ui/RoleBadge';
import { StatusBadge } from '../components/ui/StatusBadge';
import { outreachPrograms } from '../features/outreach/staticOutreachContent';
import './Outreach.css';

export const routePath = '/outreach';

export default function Outreach() {
  return (
    <PortalShell
      masthead={<PublicPortalNav />}
      eyebrow="Community programs"
      title="Outreach"
      description="A static preview surface for math circles, public lectures, and school-facing engagement programs."
      badges={
        <>
          <RoleBadge role="visitor" />
          <PageModeBadge mode="static-preview" />
          <StatusBadge tone="info">Outreach programs</StatusBadge>
        </>
      }
      aside={
        <div className="outreach-detail-card outreach-teaser-card public-browse-card public-browse-aside-card">
          <h2>Community pathway</h2>
          <p className="public-browse-copy">
            Outreach programs can later connect scholar profiles, event recaps, and media assets
            without requiring a live program management system in d0.
          </p>
          <Link
            className="public-browse-primary-link"
            to="/videos"
            state={{
              returnContext: {
                to: '/outreach',
                label: 'Back to outreach',
              },
            }}
          >
            View media recap sample
          </Link>
        </div>
      }
    >
      <div className="outreach-page public-browse-page">
        <div className="outreach-grid public-browse-grid public-browse-grid--compact">
          {outreachPrograms.map((program) => (
            <article key={program.id} className="outreach-card public-browse-card">
              <div className="outreach-card__meta public-browse-meta">
                <span>{program.formatLabel}</span>
                <span>Static preview</span>
              </div>
              <h2>{program.title}</h2>
              <p className="outreach-card__summary public-browse-copy">{program.summary}</p>
              <div className="outreach-card__actions public-browse-actions">
                <StatusBadge tone="neutral">Community-facing preview</StatusBadge>
              </div>
            </article>
          ))}
        </div>
      </div>
    </PortalShell>
  );
}
