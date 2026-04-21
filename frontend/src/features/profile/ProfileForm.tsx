import { useState } from 'react';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { careerStageOptions } from './profileFields';
import type { EditableProfile, ProfileFormValues } from './types';

type Props = {
  profile: EditableProfile;
  status: 'loading' | 'idle' | 'saving' | 'saved' | 'error';
  onSave: (values: ProfileFormValues) => Promise<void>;
};

const toFormValues = (profile: EditableProfile): ProfileFormValues => ({
  fullName: profile.fullName,
  title: profile.title ?? '',
  institutionNameRaw: profile.institutionNameRaw ?? '',
  countryCode: profile.countryCode ?? '',
  careerStage: profile.careerStage ?? '',
  bio: profile.bio ?? '',
  personalWebsite: profile.personalWebsite ?? '',
  researchKeywordsText: profile.researchKeywords.join(', '),
  primaryMscCode: profile.mscCodes.find((item) => item.isPrimary)?.code ?? '',
  secondaryMscCodesText: profile.mscCodes
    .filter((item) => !item.isPrimary)
    .map((item) => item.code)
    .join(', '),
  orcidId: profile.orcidId ?? '',
  coiDeclarationText: profile.coiDeclarationText,
  isProfilePublic: profile.isProfilePublic,
});

const statusTone: Record<Props['status'], 'info' | 'warning' | 'success' | 'danger'> = {
  loading: 'info',
  idle: 'info',
  saving: 'warning',
  saved: 'success',
  error: 'danger',
};

const statusLabel: Record<Props['status'], string> = {
  loading: 'Loading',
  idle: 'Ready',
  saving: 'Saving',
  saved: 'Saved',
  error: 'Error',
};

export function ProfileForm({ profile, status, onSave }: Props) {
  const [values, setValues] = useState<ProfileFormValues>(() => toFormValues(profile));

  const setField = <K extends keyof ProfileFormValues>(key: K, value: ProfileFormValues[K]) => {
    setValues((current) => ({ ...current, [key]: value }));
  };

  return (
    <form
      className="profile-card"
      onSubmit={async (event) => {
        event.preventDefault();
        await onSave(values);
      }}
    >
      <header className="profile-card-header">
        <div>
          <p className="profile-eyebrow">Private profile editor</p>
          <h2>{profile.fullName}</h2>
          <p className="profile-subtitle">
            Update the profile data that will later be connected to the real API in
            `INT-PROFILE-001`.
          </p>
        </div>
        <StatusBadge tone={statusTone[status]}>{statusLabel[status]}</StatusBadge>
      </header>

      <div className="profile-grid">
        <label>
          Full name
          <input
            value={values.fullName}
            onChange={(event) => setField('fullName', event.target.value)}
            required
          />
        </label>
        <label>
          Position / title
          <input value={values.title} onChange={(event) => setField('title', event.target.value)} />
        </label>
        <label>
          Affiliation
          <input
            value={values.institutionNameRaw}
            onChange={(event) => setField('institutionNameRaw', event.target.value)}
            required
          />
        </label>
        <label>
          Country code
          <input
            value={values.countryCode}
            onChange={(event) => setField('countryCode', event.target.value.toUpperCase())}
            maxLength={2}
            required
          />
        </label>
        <label>
          Career stage
          <select
            value={values.careerStage}
            onChange={(event) =>
              setField('careerStage', event.target.value as ProfileFormValues['careerStage'])
            }
            required
          >
            <option value="">Select a stage</option>
            {careerStageOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          Personal website
          <input
            value={values.personalWebsite}
            onChange={(event) => setField('personalWebsite', event.target.value)}
            placeholder="https://example.org"
          />
        </label>
      </div>

      <label>
        Research keywords
        <input
          value={values.researchKeywordsText}
          onChange={(event) => setField('researchKeywordsText', event.target.value)}
          placeholder="algebraic geometry, birational geometry"
        />
      </label>

      <div className="profile-grid">
        <label>
          Primary MSC code
          <input
            value={values.primaryMscCode}
            onChange={(event) => setField('primaryMscCode', event.target.value.toUpperCase())}
            placeholder="14J60"
          />
        </label>
        <label>
          Secondary MSC codes
          <input
            value={values.secondaryMscCodesText}
            onChange={(event) => setField('secondaryMscCodesText', event.target.value.toUpperCase())}
            placeholder="14E05, 14F18"
          />
        </label>
      </div>

      <label>
        Biography
        <textarea
          rows={5}
          value={values.bio}
          onChange={(event) => setField('bio', event.target.value)}
        />
      </label>

      <div className="profile-grid">
        <label>
          ORCID
          <input
            value={values.orcidId}
            onChange={(event) => setField('orcidId', event.target.value)}
            placeholder="0000-0000-0000-0000"
          />
        </label>
        <label>
          COI declaration
          <textarea
            rows={3}
            value={values.coiDeclarationText}
            onChange={(event) => setField('coiDeclarationText', event.target.value)}
          />
        </label>
      </div>

      <label className="profile-toggle">
        <input
          type="checkbox"
          checked={values.isProfilePublic}
          onChange={(event) => setField('isProfilePublic', event.target.checked)}
        />
        Make my scholar profile public
      </label>

      <div className="profile-cv-note">
        CV upload is intentionally deferred until the shared file integration exists.
      </div>

      <button className="profile-save-button" type="submit" disabled={status === 'saving'}>
        {status === 'saving' ? 'Saving...' : 'Save profile'}
      </button>
    </form>
  );
}
