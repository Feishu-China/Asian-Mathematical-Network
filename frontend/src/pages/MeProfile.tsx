import { useEffect, useState } from 'react';
import { ProfileForm } from '../features/profile/ProfileForm';
import { profileProvider } from '../features/profile/profileProvider';
import type { EditableProfile, ProfileFormValues } from '../features/profile/types';
import './Profile.css';

export const routePath = '/me/profile';

export default function MeProfile() {
  const [profile, setProfile] = useState<EditableProfile | null>(null);
  const [status, setStatus] = useState<'loading' | 'idle' | 'saving' | 'saved' | 'error'>(
    'loading'
  );

  useEffect(() => {
    profileProvider.getMyProfile().then((value) => {
      setProfile(value);
      setStatus('idle');
    });
  }, []);

  const handleSave = async (values: ProfileFormValues) => {
    setStatus('saving');

    try {
      const nextProfile = await profileProvider.updateMyProfile(values);
      setProfile(nextProfile);
      setStatus('saved');
    } catch {
      setStatus('error');
    }
  };

  if (!profile) {
    return <div className="profile-page">Loading profile...</div>;
  }

  return (
    <div className="profile-page">
      <ProfileForm profile={profile} status={status} onSave={handleSave} />
    </div>
  );
}
