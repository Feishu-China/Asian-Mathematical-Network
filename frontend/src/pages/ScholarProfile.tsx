import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { PortalShell } from '../components/layout/PortalShell';
import { PageModeBadge } from '../components/ui/PageModeBadge';
import { RoleBadge } from '../components/ui/RoleBadge';
import { PublicScholarCard } from '../features/profile/PublicScholarCard';
import { profileProvider } from '../features/profile/profileProvider';
import type { PublicScholarProfile } from '../features/profile/types';
import './Profile.css';

export const routePath = '/scholars/:slug';

export default function ScholarProfile() {
  const { slug = '' } = useParams();
  const [profile, setProfile] = useState<PublicScholarProfile | null | undefined>(undefined);
  const [loadError, setLoadError] = useState(false);

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

  if (profile === undefined) {
    return <div className="profile-page">Loading scholar...</div>;
  }

  if (profile === null) {
    return (
      <PortalShell
        eyebrow="Academic directory"
        title="Scholar profile"
        description="Public-facing profile detail used for directory visibility and later reviewer sourcing context."
        badges={
          <>
            <RoleBadge role="visitor" />
            <PageModeBadge mode="real-aligned" />
          </>
        }
      >
        <div className="profile-page">
          <div className="surface-card profile-empty-card">
            <p className="profile-section-kicker">Public scholar route</p>
            <h2>{loadError ? 'Profile failed to load' : 'Profile unavailable'}</h2>
            <p>
              {loadError
                ? 'The public scholar profile could not be loaded right now.'
                : 'This scholar profile is not public or is unavailable.'}
            </p>
            <p>Only profiles with public visibility enabled appear on this route.</p>
          </div>
        </div>
      </PortalShell>
    );
  }

  return (
    <PortalShell
      eyebrow="Academic directory"
      title="Scholar profile"
      description="Public-facing profile detail used for directory visibility and later reviewer sourcing context."
      badges={
        <>
          <RoleBadge role="visitor" />
          <PageModeBadge mode="real-aligned" />
        </>
      }
    >
      <div className="profile-page">
        <PublicScholarCard profile={profile} />
      </div>
    </PortalShell>
  );
}
