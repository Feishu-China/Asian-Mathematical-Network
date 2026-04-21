import { useEffect, useState } from 'react';
import { WorkspaceShell } from '../components/layout/WorkspaceShell';
import { PageModeBadge } from '../components/ui/PageModeBadge';
import { RoleBadge } from '../components/ui/RoleBadge';
import { StatusBadge } from '../components/ui/StatusBadge';
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

  const badgeTone =
    status === 'saved' ? 'success' : status === 'saving' ? 'warning' : status === 'error' ? 'danger' : 'info';

  return (
    <WorkspaceShell
      eyebrow="Academic directory"
      title="Profile"
      description="Maintain the private profile record that will later feed directory, reviewer, and application contexts."
      badges={
        <>
          <RoleBadge role="applicant" />
          <PageModeBadge mode="real-aligned" />
          <StatusBadge tone={badgeTone}>{status}</StatusBadge>
        </>
      }
    >
      <div className="profile-page">
        <ProfileForm
          key={`${profile.userId}:${profile.updatedAt}`}
          profile={profile}
          status={status}
          onSave={handleSave}
        />
      </div>
    </WorkspaceShell>
  );
}
