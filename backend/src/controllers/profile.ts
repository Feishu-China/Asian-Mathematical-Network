import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { buildStarterProfile, getStarterFullName, mapProfileRecord } from '../lib/profile';
import { serializeProfile, serializePublicProfile } from '../serializers/profile';

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_key_for_development';
const CAREER_STAGES = new Set(['undergraduate', 'masters', 'phd', 'postdoc', 'faculty', 'other']);

type ProfileRecord = Prisma.ProfileGetPayload<{
  include: { mscCodes: true };
}>;

type ValidationResult<T> = { value: T } | { message: string };
type ParsedMscCodesResult = { mscCodes: ParsedMscCode[] } | { message: string };
type ParsedProfileUpdateResult = { profile: ParsedProfileUpdate } | { message: string };
type PersistProfileUpdateResult = { record: ProfileRecord } | { message: string };

type ParsedMscCode = {
  code: string;
  isPrimary: boolean;
};

type ParsedProfileUpdate = {
  fullName: string;
  title: string | null;
  institutionId: string | null;
  institutionNameRaw: string | null;
  countryCode: string;
  careerStage: string;
  bio: string | null;
  personalWebsite: string | null;
  researchKeywords: string[];
  mscCodes: ParsedMscCode[];
  orcidId: string | null;
  coiDeclarationText: string;
  isProfilePublic: boolean;
};

const getAuthenticatedUserId = (req: Request) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.split(' ')[1];
  const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
  return decoded.userId;
};

const parseNullableTrimmedString = (
  value: unknown,
  fieldName: string
): ValidationResult<string | null> => {
  if (value === undefined || value === null) {
    return { value: null };
  }

  if (typeof value !== 'string') {
    return { message: `${fieldName} must be a string` };
  }

  const trimmedValue = value.trim();
  return { value: trimmedValue ? trimmedValue : null };
};

const parseRequiredTrimmedString = (
  value: unknown,
  fieldName: string
): ValidationResult<string> => {
  const parsedValue = parseNullableTrimmedString(value, fieldName);
  if ('message' in parsedValue) {
    return parsedValue;
  }

  if (!parsedValue.value) {
    return { message: `${fieldName} is required` };
  }

  return { value: parsedValue.value };
};

const parseOptionalString = (
  value: unknown,
  fieldName: string,
  defaultValue: string
): ValidationResult<string> => {
  if (value === undefined || value === null) {
    return { value: defaultValue };
  }

  if (typeof value !== 'string') {
    return { message: `${fieldName} must be a string` };
  }

  return { value };
};

const parseOptionalBoolean = (
  value: unknown,
  fieldName: string,
  defaultValue: boolean
): ValidationResult<boolean> => {
  if (value === undefined) {
    return { value: defaultValue };
  }

  if (typeof value !== 'boolean') {
    return { message: `${fieldName} must be a boolean` };
  }

  return { value };
};

const parseResearchKeywords = (value: unknown): ValidationResult<string[]> => {
  if (value === undefined) {
    return { value: [] };
  }

  if (!Array.isArray(value)) {
    return { message: 'research_keywords must be an array of strings' };
  }

  const researchKeywords: string[] = [];
  for (const item of value) {
    if (typeof item !== 'string') {
      return { message: 'research_keywords must be an array of strings' };
    }

    researchKeywords.push(item.trim());
  }

  return { value: researchKeywords };
};

const parseMscCodes = (value: unknown): ParsedMscCodesResult => {
  if (value === undefined) {
    return { mscCodes: [] };
  }

  if (!Array.isArray(value)) {
    return { message: 'msc_codes must be an array' };
  }

  const mscCodes: ParsedMscCode[] = [];

  for (const item of value) {
    const candidate = item as { code?: unknown; is_primary?: unknown };

    if (
      !item ||
      typeof item !== 'object' ||
      typeof candidate.code !== 'string' ||
      typeof candidate.is_primary !== 'boolean'
    ) {
      return { message: 'msc_codes items must include code and is_primary' };
    }

    const parsedCode = parseRequiredTrimmedString(candidate.code, 'msc_codes code');
    if ('message' in parsedCode) {
      return { message: 'msc_codes items must include code and is_primary' };
    }

    mscCodes.push({
      code: parsedCode.value,
      isPrimary: candidate.is_primary,
    });
  }

  const uniqueCodes = new Set(mscCodes.map((item) => item.code));
  if (uniqueCodes.size !== mscCodes.length) {
    return { message: 'msc_codes must not contain duplicate codes' };
  }

  const primaryCount = mscCodes.filter((item) => item.isPrimary).length;
  if (primaryCount > 1) {
    return { message: 'msc_codes must not contain more than one primary code' };
  }

  return { mscCodes };
};

const parseProfileUpdate = (body: Record<string, unknown>): ParsedProfileUpdateResult => {
  const fullName = parseRequiredTrimmedString(body.full_name, 'full_name');
  if ('message' in fullName) {
    return fullName;
  }

  const institutionId = parseNullableTrimmedString(body.institution_id, 'institution_id');
  if ('message' in institutionId) {
    return institutionId;
  }

  const institutionNameRaw = parseNullableTrimmedString(
    body.institution_name_raw,
    'institution_name_raw'
  );
  if ('message' in institutionNameRaw) {
    return institutionNameRaw;
  }

  if (!institutionId.value && !institutionNameRaw.value) {
    return { message: 'institution_id or institution_name_raw is required' };
  }

  const countryCode = parseRequiredTrimmedString(body.country_code, 'country_code');
  if ('message' in countryCode) {
    return countryCode;
  }

  const careerStage = parseRequiredTrimmedString(body.career_stage, 'career_stage');
  if ('message' in careerStage) {
    return careerStage;
  }

  if (!CAREER_STAGES.has(careerStage.value)) {
    return { message: 'career_stage is required' };
  }

  const title = parseNullableTrimmedString(body.title, 'title');
  if ('message' in title) {
    return title;
  }

  const bio = parseNullableTrimmedString(body.bio, 'bio');
  if ('message' in bio) {
    return bio;
  }

  const personalWebsite = parseNullableTrimmedString(body.personal_website, 'personal_website');
  if ('message' in personalWebsite) {
    return personalWebsite;
  }

  const orcidId = parseNullableTrimmedString(body.orcid_id, 'orcid_id');
  if ('message' in orcidId) {
    return orcidId;
  }

  const coiDeclarationText = parseOptionalString(
    body.coi_declaration_text,
    'coi_declaration_text',
    ''
  );
  if ('message' in coiDeclarationText) {
    return coiDeclarationText;
  }

  const isProfilePublic = parseOptionalBoolean(
    body.is_profile_public,
    'is_profile_public',
    false
  );
  if ('message' in isProfilePublic) {
    return isProfilePublic;
  }

  const researchKeywords = parseResearchKeywords(body.research_keywords);
  if ('message' in researchKeywords) {
    return researchKeywords;
  }

  const parsedMscCodes = parseMscCodes(body.msc_codes);
  if ('message' in parsedMscCodes) {
    return parsedMscCodes;
  }

  return {
    profile: {
      fullName: fullName.value,
      title: title.value,
      institutionId: institutionId.value,
      institutionNameRaw: institutionNameRaw.value,
      countryCode: countryCode.value,
      careerStage: careerStage.value,
      bio: bio.value,
      personalWebsite: personalWebsite.value,
      researchKeywords: researchKeywords.value,
      mscCodes: parsedMscCodes.mscCodes,
      orcidId: orcidId.value,
      coiDeclarationText: coiDeclarationText.value,
      isProfilePublic: isProfilePublic.value,
    },
  };
};

const buildProfileWriteData = (profile: ParsedProfileUpdate) => ({
  fullName: profile.fullName,
  title: profile.title,
  institutionId: profile.institutionId,
  institutionNameRaw: profile.institutionNameRaw,
  countryCode: profile.countryCode,
  careerStage: profile.careerStage,
  bio: profile.bio,
  personalWebsite: profile.personalWebsite,
  researchKeywordsJson: JSON.stringify(profile.researchKeywords),
  orcidId: profile.orcidId,
  coiDeclarationText: profile.coiDeclarationText,
  isProfilePublic: profile.isProfilePublic,
});

const validateSubmittedMscCodes = async (
  tx: Prisma.TransactionClient,
  mscCodes: ParsedMscCode[]
) => {
  if (mscCodes.length === 0) {
    return null;
  }

  const knownCodes = await tx.mscCode.findMany({
    where: {
      code: {
        in: mscCodes.map((item) => item.code),
      },
    },
    select: { code: true },
  });

  const knownCodeSet = new Set(knownCodes.map((item) => item.code));
  const hasUnknownCode = mscCodes.some((item) => !knownCodeSet.has(item.code));
  return hasUnknownCode ? 'msc_codes contains unknown codes' : null;
};

const replaceProfileMscCodes = async (
  tx: Prisma.TransactionClient,
  userId: string,
  mscCodes: ParsedMscCode[]
) => {
  await tx.profileMscCode.deleteMany({ where: { userId } });

  if (mscCodes.length === 0) {
    return;
  }

  await tx.profileMscCode.createMany({
    data: mscCodes.map((item) => ({
      userId,
      mscCode: item.code,
      isPrimary: item.isPrimary,
    })),
  });
};

const persistProfileUpdate = async (
  userId: string,
  profile: ParsedProfileUpdate
): Promise<PersistProfileUpdateResult> =>
  prisma.$transaction(async (tx) => {
    const mscCodeValidationMessage = await validateSubmittedMscCodes(tx, profile.mscCodes);
    if (mscCodeValidationMessage) {
      return { message: mscCodeValidationMessage };
    }

    const writeData = buildProfileWriteData(profile);

    await tx.profile.upsert({
      where: { userId },
      update: writeData,
      create: {
        ...buildStarterProfile(userId, profile.fullName),
        ...writeData,
      },
    });

    await replaceProfileMscCodes(tx, userId, profile.mscCodes);

    return {
      record: await tx.profile.findUniqueOrThrow({
        where: { userId },
        include: { mscCodes: true },
      }),
    };
  });

const sendProfileResponse = (res: Response, record: ProfileRecord) => {
  res.status(200).json({
    data: {
      profile: serializeProfile(mapProfileRecord(record)),
    },
  });
};

const sendPublicProfileResponse = (res: Response, record: ProfileRecord) => {
  res.status(200).json({
    data: {
      profile: serializePublicProfile(mapProfileRecord(record)),
    },
  });
};

export const getMyProfile = async (req: Request, res: Response) => {
  let userId: string;
  try {
    const authenticatedUserId = getAuthenticatedUserId(req);
    if (!authenticatedUserId) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    userId = authenticatedUserId;
  } catch (error) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }

  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    const record = await prisma.profile.upsert({
      where: { userId: user.id },
      update: {},
      create: buildStarterProfile(user.id, getStarterFullName(user.email)),
      include: { mscCodes: true },
    });

    sendProfileResponse(res, record);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const updateMyProfile = async (req: Request, res: Response) => {
  let userId: string;
  try {
    const authenticatedUserId = getAuthenticatedUserId(req);
    if (!authenticatedUserId) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    userId = authenticatedUserId;
  } catch (error) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }

  const parsedPayload = parseProfileUpdate(req.body ?? {});
  if ('message' in parsedPayload) {
    res.status(400).json({ message: parsedPayload.message });
    return;
  }

  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    const updateResult = await persistProfileUpdate(user.id, parsedPayload.profile);
    if ('message' in updateResult) {
      res.status(400).json({ message: updateResult.message });
      return;
    }

    sendProfileResponse(res, updateResult.record);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const getPublicScholarProfile = async (req: Request, res: Response) => {
  try {
    const slug = Array.isArray(req.params.slug) ? req.params.slug[0] : req.params.slug;
    if (!slug) {
      res.status(404).json({ message: 'Profile not found' });
      return;
    }

    const record = await prisma.profile.findUnique({
      where: { slug },
      include: { mscCodes: true },
    });

    if (!record || !record.isProfilePublic) {
      res.status(404).json({ message: 'Profile not found' });
      return;
    }

    sendPublicProfileResponse(res, record);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};
