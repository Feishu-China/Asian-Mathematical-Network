import { Link } from 'react-router-dom';
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
        <div className="outreach-detail-card outreach-teaser-card">
          <h2>Community pathway</h2>
          <p>
            Outreach programs can later connect scholar profiles, event recaps, and media assets
            without requiring a live program management system in d0.
          </p>
          <Link
            className="outreach-primary-link"
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
      <div className="outreach-page">
        <div className="outreach-grid">
          {outreachPrograms.map((program) => (
            <article key={program.id} className="outreach-card">
              <div className="outreach-card__meta">
                <span>{program.formatLabel}</span>
                <span>Static preview</span>
              </div>
              <h2>{program.title}</h2>
              <p className="outreach-card__summary">{program.summary}</p>
              <div className="outreach-card__actions">
                <StatusBadge tone="neutral">Community-facing preview</StatusBadge>
              </div>
            </article>
          ))}
        </div>
      </div>
    </PortalShell>
  );
}
