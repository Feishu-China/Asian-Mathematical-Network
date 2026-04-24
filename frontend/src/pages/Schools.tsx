import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { PortalShell } from '../components/layout/PortalShell';
import { PageModeBadge } from '../components/ui/PageModeBadge';
import { RoleBadge } from '../components/ui/RoleBadge';
import { StatusBadge } from '../components/ui/StatusBadge';
import { DemoStatePanel } from '../features/demo/DemoStatePanel';
import { readReturnContext } from '../features/navigation/returnContext';
import { schoolProvider } from '../features/school/schoolProvider';
import type { SchoolListItem } from '../features/school/types';
import './School.css';

export const routePath = '/schools';

export default function Schools() {
  const [items, setItems] = useState<SchoolListItem[] | null>(null);
  const [hasError, setHasError] = useState(false);
  const location = useLocation();
  const returnContext = readReturnContext(location.state);

  useEffect(() => {
    let active = true;

    setItems(null);
    setHasError(false);

    schoolProvider
      .listPublicSchools()
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
      eyebrow="Training opportunities"
      title="Schools"
      description="Programs that emphasize guided learning, cohort building, and pedagogical progression rather than conference presentation."
      badges={
        <>
          <RoleBadge role="visitor" />
          <PageModeBadge mode="hybrid" />
          <StatusBadge tone="info">School opportunities</StatusBadge>
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
      <div className="school-page">
        {items === null ? (
          <DemoStatePanel
            badgeLabel={hasError ? 'Error' : 'Loading'}
            title={hasError ? 'School list unavailable' : 'Loading schools'}
            description={
              hasError
                ? 'We could not load the published school opportunities right now.'
                : 'Preparing the published school opportunities used in the demo.'
            }
            tone={hasError ? 'danger' : 'info'}
          />
        ) : items.length === 0 ? (
          <DemoStatePanel
            badgeLabel="Empty"
            title="No schools or training programs yet"
            description="Published schools and training programs will appear here once they are ready for the demo."
            tone="neutral"
          />
        ) : (
          <div className="school-grid">
            {items.map((school) => (
              <article key={school.id} className="school-card">
                <div className="school-card__meta">
                  <span>{school.locationText || 'Location pending'}</span>
                  <span>{school.startDate || 'Date pending'}</span>
                </div>
                <h2>{school.title}</h2>
                <p className="school-card__subtitle">{school.shortLabel}</p>
                <p className="school-card__summary">{school.summary}</p>
                <div className="school-card__actions">
                  <StatusBadge tone={school.travelSupportAvailable ? 'success' : 'neutral'}>
                    {school.travelSupportAvailable
                      ? 'Travel support available'
                      : 'Travel support unavailable'}
                  </StatusBadge>
                  <Link to={`/schools/${school.slug}`}>{school.ctaLabel}</Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </PortalShell>
  );
}
