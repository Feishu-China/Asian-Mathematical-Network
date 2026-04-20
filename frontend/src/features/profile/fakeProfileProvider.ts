import type {
  EditableProfile,
  ProfileProvider,
  PublicScholarProfile,
} from './types';

let profileState: EditableProfile = {
  userId: 'local-user',
  slug: 'alice-chen-demo',
  fullName: 'Alice Chen',
  title: 'Dr',
  institutionId: null,
  institutionNameRaw: 'National University of Singapore',
  countryCode: 'SG',
  careerStage: 'faculty',
  bio: 'Interested in algebraic geometry.',
  personalWebsite: 'https://example.org',
  researchKeywords: ['algebraic geometry', 'birational geometry'],
  mscCodes: [{ code: '14J60', isPrimary: true }],
  orcidId: null,
  coiDeclarationText: '',
  isProfilePublic: true,
  verificationStatus: 'unverified',
  verifiedAt: null,
  createdAt: new Date('2026-04-14T10:00:00Z').toISOString(),
  updatedAt: new Date('2026-04-14T10:06:00Z').toISOString(),
};

const clone = <T,>(value: T): T => structuredClone(value);

const toPublicProfile = (profile: EditableProfile): PublicScholarProfile | null => {
  if (!profile.isProfilePublic) {
    return null;
  }

  const {
    coiDeclarationText: _coiDeclarationText,
    isProfilePublic: _isProfilePublic,
    verificationStatus: _verificationStatus,
    verifiedAt: _verifiedAt,
    userId: _userId,
    createdAt: _createdAt,
    ...publicProfile
  } = profile;

  return publicProfile;
};

export const fakeProfileProvider: ProfileProvider = {
  async getMyProfile() {
    return clone(profileState);
  },

  async updateMyProfile(values) {
    profileState = {
      ...profileState,
      fullName: values.fullName,
      title: values.title || null,
      institutionNameRaw: values.institutionNameRaw || null,
      countryCode: values.countryCode || null,
      careerStage: values.careerStage || null,
      bio: values.bio || null,
      personalWebsite: values.personalWebsite || null,
      researchKeywords: values.researchKeywordsText
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean),
      mscCodes: [
        ...(values.primaryMscCode
          ? [{ code: values.primaryMscCode.trim().toUpperCase(), isPrimary: true }]
          : []),
        ...values.secondaryMscCodesText
          .split(',')
          .map((item) => item.trim().toUpperCase())
          .filter(Boolean)
          .map((code) => ({ code, isPrimary: false })),
      ],
      orcidId: values.orcidId || null,
      coiDeclarationText: values.coiDeclarationText,
      isProfilePublic: values.isProfilePublic,
      updatedAt: new Date().toISOString(),
    };

    return clone(profileState);
  },

  async getScholarProfile(slug) {
    if (slug !== profileState.slug) {
      return null;
    }

    return clone(toPublicProfile(profileState));
  },
};
