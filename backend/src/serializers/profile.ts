import type { Profile } from '../../../src/types/models';

type PublicProfile = Pick<
  Profile,
  | 'slug'
  | 'fullName'
  | 'title'
  | 'institutionNameRaw'
  | 'countryCode'
  | 'careerStage'
  | 'bio'
  | 'personalWebsite'
  | 'researchKeywords'
  | 'mscCodes'
  | 'orcidId'
  | 'updatedAt'
>;

const serializeMscCodes = (mscCodes: Profile['mscCodes']) =>
  mscCodes
    .slice()
    .sort((left, right) => {
      if (left.isPrimary !== right.isPrimary) {
        return Number(right.isPrimary) - Number(left.isPrimary);
      }

      return left.code.localeCompare(right.code);
    })
    .map((item) => ({
      code: item.code,
      is_primary: item.isPrimary,
    }));

export const serializeProfile = (profile: Profile) => ({
  user_id: profile.userId,
  slug: profile.slug,
  full_name: profile.fullName,
  title: profile.title,
  institution_id: profile.institutionId,
  institution_name_raw: profile.institutionNameRaw,
  country_code: profile.countryCode,
  career_stage: profile.careerStage,
  bio: profile.bio,
  personal_website: profile.personalWebsite,
  research_keywords: profile.researchKeywords,
  msc_codes: serializeMscCodes(profile.mscCodes),
  orcid_id: profile.orcidId,
  coi_declaration_text: profile.coiDeclarationText,
  is_profile_public: profile.isProfilePublic,
  verification_status: profile.verificationStatus,
  verified_at: profile.verifiedAt,
  created_at: profile.createdAt,
  updated_at: profile.updatedAt,
});

export const serializePublicProfile = (profile: PublicProfile) => ({
  slug: profile.slug,
  full_name: profile.fullName,
  title: profile.title,
  institution_name_raw: profile.institutionNameRaw,
  country_code: profile.countryCode,
  career_stage: profile.careerStage,
  bio: profile.bio,
  personal_website: profile.personalWebsite,
  research_keywords: profile.researchKeywords,
  msc_codes: serializeMscCodes(profile.mscCodes),
  orcid_id: profile.orcidId,
  updated_at: profile.updatedAt,
});
