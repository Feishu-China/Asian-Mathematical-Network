import type { CareerStage, Profile } from '@asiamath/shared/models';

export type EditableProfile = Profile;

export type PublicScholarProfile = Omit<
  EditableProfile,
  'coiDeclarationText' | 'isProfilePublic' | 'verificationStatus' | 'verifiedAt' | 'userId' | 'createdAt'
>;

export type PublicScholarSummary = {
  slug: string;
  fullName: string;
  title: string | null;
  institutionNameRaw: string | null;
  countryCode: string | null;
  researchKeywords: string[];
  primaryMscCode: string | null;
  bio: string | null;
};

export type ScholarExpertiseCluster = {
  id: string;
  label: string;
  summary: string;
  scholarCount: number;
  institutionCount: number;
};

export type ProfileFormValues = {
  fullName: string;
  title: string;
  institutionNameRaw: string;
  countryCode: string;
  careerStage: CareerStage | '';
  bio: string;
  personalWebsite: string;
  researchKeywordsText: string;
  primaryMscCode: string;
  secondaryMscCodesText: string;
  orcidId: string;
  coiDeclarationText: string;
  isProfilePublic: boolean;
};

export type ProfileProvider = {
  getMyProfile(): Promise<EditableProfile>;
  updateMyProfile(values: ProfileFormValues): Promise<EditableProfile>;
  getScholarProfile(slug: string): Promise<PublicScholarProfile | null>;
};
