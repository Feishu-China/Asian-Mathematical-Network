import { careerStageOptions } from './profileFields';

const regionNames =
  typeof Intl !== 'undefined' && typeof Intl.DisplayNames !== 'undefined'
    ? new Intl.DisplayNames(['en'], { type: 'region' })
    : null;

const verificationLabels = {
  unverified: 'Unverified',
  pending_review: 'Pending review',
  verified: 'Verified',
  rejected: 'Rejected',
} as const;

export const PUBLIC_PROFILE_FIELD_LABELS = [
  'Full name',
  'Position / title',
  'Affiliation',
  'Country / region',
  'Career stage',
  'Bio',
  'Research keywords',
  'MSC codes',
  'Personal page',
  'ORCID',
] as const;

export const PRIVATE_ONLY_FIELD_LABELS = [
  'COI declaration',
  'Visibility setting',
  'Verification state',
  'Internal identifiers',
  'Private audit timestamps',
] as const;

export const PROFILE_REUSE_LABELS = [
  'Public scholar profile',
  'Application prefill',
  'Reviewer context',
  'Organizer context',
] as const;

export const formatCareerStage = (value: string | null | undefined) => {
  if (!value) {
    return 'Not provided';
  }

  return careerStageOptions.find((option) => option.value === value)?.label ?? value;
};

export const formatCountryCode = (value: string | null | undefined) => {
  if (!value) {
    return 'Not provided';
  }

  const code = value.toUpperCase();
  const label = regionNames?.of(code);
  return label ? `${label} (${code})` : code;
};

export const formatVerificationStatus = (
  value: keyof typeof verificationLabels | string | null | undefined
) => {
  if (!value) {
    return 'Not provided';
  }

  return verificationLabels[value as keyof typeof verificationLabels] ?? value;
};

export const formatDateTime = (value: string | null | undefined) => {
  if (!value) {
    return 'Not available';
  }

  return new Intl.DateTimeFormat('en', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
};

export const buildScholarRoute = (slug: string | null | undefined) => {
  if (!slug) {
    return 'Not available';
  }

  return `/scholars/${slug}`;
};
