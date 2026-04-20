import type { EditableProfile, ProfileFormValues, PublicScholarProfile } from './types';

type TransportMsc = {
  code: string;
  is_primary: boolean;
};

type TransportProfile = {
  user_id: string;
  slug: string;
  full_name: string;
  title: string | null;
  institution_id: string | null;
  institution_name_raw: string | null;
  country_code: string | null;
  career_stage: EditableProfile['careerStage'];
  bio: string | null;
  personal_website: string | null;
  research_keywords: string[];
  msc_codes: TransportMsc[];
  orcid_id: string | null;
  coi_declaration_text: string;
  is_profile_public: boolean;
  verification_status: EditableProfile['verificationStatus'];
  verified_at: string | null;
  created_at: string;
  updated_at: string;
};

type TransportPublicProfile = Omit<
  TransportProfile,
  | 'user_id'
  | 'institution_id'
  | 'coi_declaration_text'
  | 'is_profile_public'
  | 'verification_status'
  | 'verified_at'
  | 'created_at'
>;

export const fromTransportProfile = (profile: TransportProfile): EditableProfile => ({
  userId: profile.user_id,
  slug: profile.slug,
  fullName: profile.full_name,
  title: profile.title,
  institutionId: profile.institution_id,
  institutionNameRaw: profile.institution_name_raw,
  countryCode: profile.country_code,
  careerStage: profile.career_stage,
  bio: profile.bio,
  personalWebsite: profile.personal_website,
  researchKeywords: profile.research_keywords,
  mscCodes: profile.msc_codes.map((item) => ({
    code: item.code,
    isPrimary: item.is_primary,
  })),
  orcidId: profile.orcid_id,
  coiDeclarationText: profile.coi_declaration_text,
  isProfilePublic: profile.is_profile_public,
  verificationStatus: profile.verification_status,
  verifiedAt: profile.verified_at,
  createdAt: profile.created_at,
  updatedAt: profile.updated_at,
});

export const fromTransportPublicProfile = (
  profile: TransportPublicProfile
): PublicScholarProfile => ({
  slug: profile.slug,
  fullName: profile.full_name,
  title: profile.title,
  institutionId: null,
  institutionNameRaw: profile.institution_name_raw,
  countryCode: profile.country_code,
  careerStage: profile.career_stage,
  bio: profile.bio,
  personalWebsite: profile.personal_website,
  researchKeywords: profile.research_keywords,
  mscCodes: profile.msc_codes.map((item) => ({
    code: item.code,
    isPrimary: item.is_primary,
  })),
  orcidId: profile.orcid_id,
  updatedAt: profile.updated_at,
});

export const toTransportUpdatePayload = (values: ProfileFormValues) => ({
  full_name: values.fullName,
  title: values.title || null,
  institution_id: null,
  institution_name_raw: values.institutionNameRaw,
  country_code: values.countryCode,
  career_stage: values.careerStage,
  bio: values.bio || null,
  personal_website: values.personalWebsite || null,
  research_keywords: values.researchKeywordsText
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean),
  msc_codes: [
    ...(values.primaryMscCode
      ? [{ code: values.primaryMscCode.trim().toUpperCase(), is_primary: true }]
      : []),
    ...values.secondaryMscCodesText
      .split(',')
      .map((item) => item.trim().toUpperCase())
      .filter(Boolean)
      .map((code) => ({ code, is_primary: false })),
  ],
  orcid_id: values.orcidId || null,
  coi_declaration_text: values.coiDeclarationText,
  is_profile_public: values.isProfilePublic,
});
