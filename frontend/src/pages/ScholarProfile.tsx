import { useEffect, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { PortalShell } from '../components/layout/PortalShell';
import { PageModeBadge } from '../components/ui/PageModeBadge';
import { RoleBadge } from '../components/ui/RoleBadge';
import { DemoStatePanel } from '../features/demo/DemoStatePanel';
import { readReturnContext } from '../features/navigation/returnContext';
import { PublicScholarCard } from '../features/profile/PublicScholarCard';
import { profileProvider } from '../features/profile/profileProvider';
import type { PublicScholarProfile } from '../features/profile/types';
import './Profile.css';

export const routePath = '/scholars/:slug';

export default function ScholarProfile() {
  const { slug = '' } = useParams();
  const [profile, setProfile] = useState<PublicScholarProfile | null | undefined>(undefined);
  const [loadError, setLoadError] = useState(false);
  const location = useLocation();
  const returnContext = readReturnContext(location.state);

  useEffect(() => {
    let cancelled = false;

    profileProvider
      .getScholarProfile(slug)
      .then((value) => {
        if (cancelled) {
          return;
        }

        setProfile(value);
      })
      .catch(() => {
        if (cancelled) {
          return;
        }

        setLoadError(true);
        setProfile(null);
      });

    return () => {
      cancelled = true;
    };
  }, [slug]);

  if (profile === null) {
    return (
      <PortalShell
        eyebrow="Academic directory"
        title="Scholar profile"
        description="A sample public scholar profile used across the directory, reviewer, and partner-matching demos."
        badges={
          <>
            <RoleBadge role="visitor" />
            <PageModeBadge mode="real-aligned" />
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
        <div className="profile-page">
          <DemoStatePanel
            className="profile-empty-card"
            badgeLabel={loadError ? 'Error' : 'Unavailable'}
            title={loadError ? 'Profile failed to load' : 'Profile unavailable'}
            description={
              loadError
                ? 'The public scholar profile could not be loaded right now.'
                : 'This scholar profile is not public or is unavailable. Only profiles with public visibility enabled appear on this route.'
            }
            tone={loadError ? 'danger' : 'neutral'}
          />
        </div>
      </PortalShell>
    );
  }

  return (
    <PortalShell
      eyebrow="Academic directory"
      title="Scholar profile"
      description="A sample public scholar profile used across the directory, reviewer, and partner-matching demos."
      badges={
        <>
          <RoleBadge role="visitor" />
          <PageModeBadge mode="real-aligned" />
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
      <div className="profile-page">
        {profile === undefined ? (
          <DemoStatePanel
            badgeLabel="Loading"
            title="Loading scholar profile"
            description="Preparing this public scholar profile for the demo."
            tone="info"
          />
        ) : (
          <PublicScholarCard profile={profile} />
        )}
      </div>
    </PortalShell>
  );
}
