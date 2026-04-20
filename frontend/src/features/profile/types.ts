import type { CareerStage, Profile } from '../../../../src/types/models';

export type EditableProfile = Profile;

export type PublicScholarProfile = Omit<
  EditableProfile,
  'coiDeclarationText' | 'isProfilePublic' | 'verificationStatus' | 'verifiedAt' | 'userId' | 'createdAt'
>;

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
