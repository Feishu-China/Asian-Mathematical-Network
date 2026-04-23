import type {
  EditableProfile,
  ProfileProvider,
  PublicScholarProfile,
} from './types';

const demoReviewerProfile: PublicScholarProfile = {
  slug: 'prof-reviewer',
  fullName: 'Prof Reviewer',
  title: 'Professor',
  institutionId: null,
  institutionNameRaw: 'University of Tokyo',
  countryCode: 'JP',
  careerStage: 'faculty',
  bio: 'Supports review governance, algebraic geometry, and cross-border mathematical collaboration through public-facing scholarly context.',
  personalWebsite: 'https://example.org/scholars/prof-reviewer',
  researchKeywords: [
    'review governance',
    'algebraic geometry',
    'cross-border mathematical collaboration',
  ],
  mscCodes: [
    { code: '14J60', isPrimary: true },
    { code: '14E05', isPrimary: false },
  ],
  orcidId: '0000-0003-5100-0042',
  updatedAt: new Date('2026-04-21T09:15:00Z').toISOString(),
};

const initialProfileState: EditableProfile = {
  userId: 'local-user',
  slug: 'alice-chen-demo',
  fullName: 'Alice Chen',
  title: 'Associate Professor',
  institutionId: null,
  institutionNameRaw: 'National University of Singapore',
  countryCode: 'SG',
  careerStage: 'faculty',
  bio: 'Builds a demo-ready scholar profile that can be explained consistently across private editing, public scholar display, and downstream application context.',
  personalWebsite: 'https://example.org/scholars/alice-chen',
  researchKeywords: ['algebraic geometry', 'birational geometry', 'mathematical networks'],
  mscCodes: [
    { code: '14J60', isPrimary: true },
    { code: '14E05', isPrimary: false },
  ],
  orcidId: '0000-0002-5100-0001',
  coiDeclarationText: 'Private demo-only COI note for the shared scholar profile.',
  isProfilePublic: true,
  verificationStatus: 'verified',
  verifiedAt: new Date('2026-04-18T09:00:00Z').toISOString(),
  createdAt: new Date('2026-04-14T10:00:00Z').toISOString(),
  updatedAt: new Date('2026-04-14T10:06:00Z').toISOString(),
};

const clone = <T,>(value: T): T => structuredClone(value);
let profileState: EditableProfile = clone(initialProfileState);

export const resetProfileFakeState = () => {
  profileState = clone(initialProfileState);
};

export const seedProfileFakeState = (partial: Partial<EditableProfile>) => {
  profileState = {
    ...profileState,
    ...clone(partial),
    researchKeywords: partial.researchKeywords
      ? clone(partial.researchKeywords)
      : clone(profileState.researchKeywords),
    mscCodes: partial.mscCodes ? clone(partial.mscCodes) : clone(profileState.mscCodes),
  };
};

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
    if (slug === demoReviewerProfile.slug) {
      return clone(demoReviewerProfile);
    }

    if (slug === profileState.slug) {
      return clone(toPublicProfile(profileState));
    }

    return null;
  },
};
