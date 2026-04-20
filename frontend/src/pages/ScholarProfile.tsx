import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
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
    <div className="profile-page">
      <PublicScholarCard profile={profile} />
    </div>
  );
}
