import { useEffect, useState } from 'react';
import { PortalShell } from '../components/layout/PortalShell';
import { PublicPortalNav } from '../components/layout/PublicPortalNav';
import { PageModeBadge } from '../components/ui/PageModeBadge';
import { RoleBadge } from '../components/ui/RoleBadge';
import { DemoStatePanel } from '../features/demo/DemoStatePanel';
import { ScholarExpertiseClusterList } from '../features/profile/ScholarExpertiseClusterList';
import { ScholarSummaryCard } from '../features/profile/ScholarSummaryCard';
import { scholarDirectoryProvider } from '../features/profile/scholarDirectoryProvider';
import type { PublicScholarSummary, ScholarExpertiseCluster } from '../features/profile/types';
import './Scholars.css';

export const routePath = '/scholars';

export default function Scholars() {
  const [scholars, setScholars] = useState<PublicScholarSummary[] | null>(null);
  const [clusters, setClusters] = useState<ScholarExpertiseCluster[]>([]);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    let active = true;

    scholarDirectoryProvider
      .getDirectoryViewModel()
      .then((value) => {
        if (!active) {
          return;
        }

        setScholars(value.scholars);
        setClusters(value.clusters);
      })
      .catch(() => {
        if (!active) {
          return;
        }

        setHasError(true);
        setScholars([]);
      });

    return () => {
      active = false;
    };
  }, []);

  return (
    <PortalShell
      masthead={<PublicPortalNav />}
      eyebrow="Academic directory"
      title="Scholar directory"
      description="Browse public scholar profiles and research areas that support conference, grant, prize, and partner-facing network discovery."
      badges={
        <>
          <RoleBadge role="visitor" />
          <PageModeBadge mode="hybrid" />
        </>
      }
    >
      <div className="scholar-directory-page">
        {scholars === null ? (
          <DemoStatePanel
            badgeLabel={hasError ? 'Error' : 'Loading'}
            title={hasError ? 'Scholar directory unavailable' : 'Loading scholar directory'}
            description={
              hasError
                ? 'We could not load the scholar directory right now.'
                : 'Preparing the public academic-directory surface for the demo.'
            }
            tone={hasError ? 'danger' : 'info'}
          />
        ) : (
          <>
            <section
              className="scholar-directory-page__clusters"
              aria-labelledby="scholar-clusters-heading"
            >
              <div className="scholar-directory-page__section-copy">
                <p className="page-shell__eyebrow">Expertise areas</p>
                <h2 id="scholar-clusters-heading">Research clusters across the network</h2>
              </div>
              <ScholarExpertiseClusterList clusters={clusters} />
            </section>

            <section className="scholar-directory-page__list" aria-labelledby="scholar-list-heading">
              <div className="scholar-directory-page__section-copy">
                <p className="page-shell__eyebrow">Featured scholars</p>
                <h2 id="scholar-list-heading">Public scholar profiles</h2>
              </div>
              <div className="scholar-directory-page__grid">
                {scholars.map((scholar) => (
                  <ScholarSummaryCard key={scholar.slug} scholar={scholar} />
                ))}
              </div>
            </section>
          </>
        )}
      </div>
    </PortalShell>
  );
}
