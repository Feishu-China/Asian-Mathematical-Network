import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { PublicPortalNav } from '../components/layout/PublicPortalNav';
import { PortalShell } from '../components/layout/PortalShell';
import { PageModeBadge } from '../components/ui/PageModeBadge';
import { RoleBadge } from '../components/ui/RoleBadge';
import { StatusBadge } from '../components/ui/StatusBadge';
import { DemoStatePanel } from '../features/demo/DemoStatePanel';
import { outreachProvider } from '../features/outreach/outreachProvider';
import type { OutreachProgram } from '../features/outreach/types';
import './Outreach.css';

export const routePath = '/outreach';

export default function Outreach() {
  const [programs, setPrograms] = useState<OutreachProgram[] | null>(null);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    let active = true;

    setPrograms(null);
    setHasError(false);

    outreachProvider.listPublicPrograms().then((value) => {
      if (active) {
        setPrograms(value);
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
      eyebrow="Community programs"
      title="Outreach"
      description="Browse public lectures, campus visits, and teacher-facing programmes from across the network."
      badges={
        <>
          <RoleBadge role="visitor" />
          <PageModeBadge mode="hybrid" />
          <StatusBadge tone="info">Outreach programs</StatusBadge>
        </>
      }
      aside={
        <div className="outreach-detail-card outreach-teaser-card public-browse-card public-browse-aside-card">
          <h2>Community pathway</h2>
          <p className="public-browse-copy">
            Outreach programs can later connect scholar profiles, event recaps, and media assets
            while staying focused on public programme records and partner-hosted events.
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
            Open video archive
          </Link>
        </div>
      }
    >
      <div className="outreach-page public-browse-page">
        {programs === null ? (
          <DemoStatePanel
            badgeLabel={hasError ? 'Error' : 'Loading'}
            title={hasError ? 'Outreach programs unavailable' : 'Loading outreach programs'}
            description={
              hasError
                ? 'We could not load the public outreach programme list right now.'
                : 'Preparing the public outreach programmes used in the demo.'
            }
            tone={hasError ? 'danger' : 'info'}
          />
        ) : programs.length === 0 ? (
          <DemoStatePanel
            badgeLabel="Empty"
            title="No public outreach programmes yet"
            description="Public outreach programmes will appear here once they are ready."
            tone="neutral"
          />
        ) : (
          <div className="outreach-grid public-browse-grid public-browse-grid--compact">
            {programs.map((program) => (
              <article key={program.id} className="outreach-card public-browse-card">
                <div className="outreach-card__meta public-browse-meta">
                  <span>{program.formatLabel}</span>
                  <span>Public archive</span>
                </div>
                <h2>{program.title}</h2>
                <p className="outreach-card__summary public-browse-copy">{program.summary}</p>
                <div className="outreach-card__actions public-browse-actions">
                  <StatusBadge tone="neutral">Community programme</StatusBadge>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </PortalShell>
  );
}
