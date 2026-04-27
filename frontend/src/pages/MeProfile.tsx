import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { WorkspaceShell } from '../components/layout/WorkspaceShell';
import { PageModeBadge } from '../components/ui/PageModeBadge';
import { RoleBadge } from '../components/ui/RoleBadge';
import { StatusBadge } from '../components/ui/StatusBadge';
import { DemoStatePanel } from '../features/demo/DemoStatePanel';
import { DemoStatusNotice } from '../features/demo/DemoStatusNotice';
import { ProfileForm } from '../features/profile/ProfileForm';
import { isUnauthorizedSessionError } from '../features/auth/sessionErrors';
import {
  buildScholarRoute,
  formatDateTime,
  formatVerificationStatus,
  PRIVATE_ONLY_FIELD_LABELS,
  PROFILE_REUSE_LABELS,
  PUBLIC_PROFILE_FIELD_LABELS,
} from '../features/profile/profilePresentation';
import { profileProvider } from '../features/profile/profileProvider';
import { toReturnToState } from '../features/navigation/authReturn';
import { buildWorkspaceAccountMenu } from '../features/navigation/workspaceAccountMenu';
import type { EditableProfile, ProfileFormValues } from '../features/profile/types';
import './Profile.css';

export const routePath = '/me/profile';

export default function MeProfile() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<EditableProfile | null>(null);
  const [loadState, setLoadState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [status, setStatus] = useState<'loading' | 'idle' | 'saving' | 'saved' | 'error'>(
    'loading'
  );
  const accountMenu = buildWorkspaceAccountMenu(() => {
    localStorage.removeItem('token');
    navigate('/portal');
  });

  useEffect(() => {
    let cancelled = false;

    if (!localStorage.getItem('token')) {
      navigate('/login', { state: toReturnToState('/me/profile') });
      return;
    }

    profileProvider
      .getMyProfile()
      .then((value) => {
        if (cancelled) {
          return;
        }

        setProfile(value);
        setLoadState('ready');
        setStatus('idle');
      })
      .catch((error) => {
        if (cancelled) {
          return;
        }

        if (isUnauthorizedSessionError(error)) {
          localStorage.removeItem('token');
          navigate('/login', { state: toReturnToState('/me/profile') });
          return;
        }

        setLoadState('error');
        setStatus('error');
      });

    return () => {
      cancelled = true;
    };
  }, [navigate]);

  const handleSave = async (values: ProfileFormValues) => {
    setStatus('saving');

    try {
      const nextProfile = await profileProvider.updateMyProfile(values);
      setProfile(nextProfile);
      setStatus('saved');
    } catch (error) {
      if (isUnauthorizedSessionError(error)) {
        localStorage.removeItem('token');
        navigate('/login', { state: toReturnToState('/me/profile') });
        return;
      }

      setStatus('error');
    }
  };

  const badgeTone =
    loadState === 'error'
      ? 'danger'
      : status === 'saved'
        ? 'success'
        : status === 'saving'
          ? 'warning'
          : status === 'error'
            ? 'danger'
            : 'info';
  const badgeLabel =
    loadState === 'error'
      ? 'Profile unavailable'
      : status === 'saved'
        ? 'Saved'
        : status === 'saving'
          ? 'Saving'
          : status === 'error'
            ? 'Save failed'
            : loadState === 'loading'
              ? 'Loading'
              : 'Ready';

  if (!profile) {
    return (
      <WorkspaceShell
        eyebrow="Academic directory"
        title="Profile"
        description="Edit the authenticated scholar record here, explain the public/private boundary clearly, and hand off to the public scholar view without changing the underlying PROFILE contract."
        badges={
          <>
            <RoleBadge role="applicant" />
            <PageModeBadge mode="real-aligned" />
            <StatusBadge tone={badgeTone}>{badgeLabel}</StatusBadge>
          </>
        }
        accountMenu={accountMenu}
      >
        <div className="profile-page">
          <DemoStatePanel
            badgeLabel={loadState === 'error' ? 'Error' : 'Loading'}
            title={loadState === 'error' ? 'Profile editor unavailable' : 'Loading profile editor'}
            description={
              loadState === 'error'
                ? 'Unable to load the profile editor.'
                : 'Preparing the authenticated scholar profile used across the demo.'
            }
            tone={loadState === 'error' ? 'danger' : 'info'}
          />
        </div>
      </WorkspaceShell>
    );
  }

  const publicScholarHref = `/scholars/${profile.slug}`;
  const visibilityLabel = profile.isProfilePublic
    ? 'Public scholar page is enabled'
    : 'Hidden from visitor route';
  const publicPreviewLine = [profile.title, profile.institutionNameRaw, profile.countryCode]
    .filter(Boolean)
    .join(' · ');

  return (
    <WorkspaceShell
      eyebrow="Academic directory"
      title="Profile"
      description="Edit the authenticated scholar record here, explain the public/private boundary clearly, and hand off to the public scholar view without changing the underlying PROFILE contract."
      badges={
        <>
          <RoleBadge role="applicant" />
          <PageModeBadge mode="real-aligned" />
          <StatusBadge tone={badgeTone}>{badgeLabel}</StatusBadge>
        </>
      }
      accountMenu={accountMenu}
    >
      <div className="profile-page">
        {status === 'saved' ? (
          <DemoStatusNotice
            tone="success"
            badgeLabel="Saved"
            title="Profile changes saved"
            description="The private editor and public scholar preview now reflect the latest profile fields."
          />
        ) : null}

        {status === 'error' ? (
          <DemoStatusNotice
            tone="danger"
            badgeLabel="Error"
            title="Profile update failed"
            description="We could not save your latest profile changes right now."
          />
        ) : null}

        <section className="profile-context-grid">
          <article className="surface-card profile-context-card">
            <p className="profile-section-kicker">Current demo state</p>
            <h2>{profile.fullName}</h2>
            <dl className="profile-definition-list">
              <div>
                <dt>Mode</dt>
                <dd>Authenticated /me surface</dd>
              </div>
              <div>
                <dt>Public visibility</dt>
                <dd>{visibilityLabel}</dd>
              </div>
              <div>
                <dt>Verification</dt>
                <dd>{formatVerificationStatus(profile.verificationStatus)}</dd>
              </div>
              <div>
                <dt>Public slug</dt>
                <dd>{profile.slug}</dd>
              </div>
              <div>
                <dt>Last updated</dt>
                <dd>{formatDateTime(profile.updatedAt)}</dd>
              </div>
            </dl>
          </article>

          <article className="surface-card profile-context-card">
            <p className="profile-section-kicker">Demo walkthrough use</p>
            <p>
              Start on the private editor, then explain how the same shared fields are reused in
              application, reviewer, and organizer contexts.
            </p>
            {profile.isProfilePublic ? (
              <div className="profile-link-row">
                <Link className="conference-primary-link" to={publicScholarHref}>
                  Open public scholar page
                </Link>
              </div>
            ) : (
              <p className="profile-inline-note">
                Public scholar page is currently hidden. Enable visibility here before narrating
                the visitor-facing route.
              </p>
            )}
          </article>

          {profile.isProfilePublic ? (
            <article className="surface-card profile-context-card">
              <p className="profile-section-kicker">Public scholar preview</p>
              <h2>Public scholar preview</h2>
              <p className="profile-inline-note">{profile.fullName}</p>
              <p>{publicPreviewLine || 'Public-facing scholar summary.'}</p>
              <dl className="profile-definition-list">
                <div>
                  <dt>Visitor route</dt>
                  <dd>{buildScholarRoute(profile.slug)}</dd>
                </div>
                <div>
                  <dt>Public scope</dt>
                  <dd>Visitors see only the public scholar subset from this same profile record.</dd>
                </div>
              </dl>
              <p className="profile-inline-note">
                This preview mirrors the visitor-facing route without exposing COI declaration or
                verification state.
              </p>
            </article>
          ) : null}

          <article className="surface-card profile-context-card profile-context-card--wide">
            <p className="profile-section-kicker">Visibility boundary</p>
            <div className="profile-boundary-grid">
              <div>
                <h3>Public when visible</h3>
                <ul className="profile-bullet-list">
                  {PUBLIC_PROFILE_FIELD_LABELS.map((label) => (
                    <li key={label}>{label}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h3>Private-only</h3>
                <ul className="profile-bullet-list">
                  {PRIVATE_ONLY_FIELD_LABELS.map((label) => (
                    <li key={label}>{label}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h3>Shared downstream uses</h3>
                <ul className="profile-bullet-list">
                  {PROFILE_REUSE_LABELS.map((label) => (
                    <li key={label}>{label}</li>
                  ))}
                </ul>
              </div>
            </div>
            <p className="profile-inline-note">
              COI declaration, verification state, and internal identifiers stay private even when
              the public scholar page is enabled.
            </p>
          </article>
        </section>

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
