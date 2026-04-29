import { Prisma } from '@prisma/client';
import type { Profile } from '@asiamath/shared/models';

type ProfileRecord = Prisma.ProfileGetPayload<{
  include: { mscCodes: true };
}>;

const getSlugBase = (input: string) => {
  const tokens =
    input
      .normalize('NFKC')
      .trim()
      .toLocaleLowerCase()
      .match(/[\p{Letter}\p{Number}]+/gu) ?? [];

  return tokens.join('-') || 'user';
};

export const getStarterFullName = (email: string, fullName?: string | null) => {
  const normalizedFullName = fullName?.trim();
  if (normalizedFullName) {
    return normalizedFullName;
  }

  const emailLocalPart = email.split('@')[0]?.trim();
  return emailLocalPart || 'user';
};

export const buildStarterProfile = (userId: string, fullName: string) => ({
  userId,
  slug: `${getSlugBase(fullName)}-${userId.slice(0, 8)}`,
  fullName,
  researchKeywordsJson: '[]',
});

export const mapProfileRecord = (record: ProfileRecord): Profile => ({
  userId: record.userId,
  slug: record.slug,
  fullName: record.fullName,
  title: record.title,
  institutionId: record.institutionId,
  institutionNameRaw: record.institutionNameRaw,
  countryCode: record.countryCode,
  careerStage: record.careerStage as Profile['careerStage'],
  bio: record.bio,
  personalWebsite: record.personalWebsite,
  researchKeywords: JSON.parse(record.researchKeywordsJson),
  mscCodes: record.mscCodes.map((item) => ({
    code: item.mscCode,
    isPrimary: item.isPrimary,
  })),
  orcidId: record.orcidId,
  coiDeclarationText: record.coiDeclarationText,
  isProfilePublic: record.isProfilePublic,
  verificationStatus: record.verificationStatus as Profile['verificationStatus'],
  verifiedAt: record.verifiedAt?.toISOString() ?? null,
  createdAt: record.createdAt.toISOString(),
  updatedAt: record.updatedAt.toISOString(),
});
