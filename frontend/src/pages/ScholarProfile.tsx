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

  useEffect(() => {
    profileProvider.getScholarProfile(slug).then(setProfile);
  }, [slug]);

  if (profile === undefined) {
    return <div className="profile-page">Loading scholar...</div>;
  }

  if (profile === null) {
    return <div className="profile-page">This scholar profile is not public.</div>;
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
