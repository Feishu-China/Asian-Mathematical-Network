import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma';
import { buildStarterProfile, getStarterFullName, mapProfileRecord } from '../lib/profile';
import { serializeProfile } from '../serializers/profile';

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_key_for_development';
const CAREER_STAGES = new Set(['undergraduate', 'masters', 'phd', 'postdoc', 'faculty', 'other']);

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

type ParsedMscCodesResult =
  | { mscCodes: ParsedMscCode[] }
  | { message: string };

type ParsedProfileUpdateResult =
  | { profile: ParsedProfileUpdate }
  | { message: string };

const getAuthenticatedUserId = (req: Request) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.split(' ')[1];
  const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
  return decoded.userId;
};

const normalizeOptionalString = (value: unknown) => {
  if (value === undefined || value === null) {
    return null;
  }

  if (typeof value !== 'string') {
    return null;
  }

  const trimmedValue = value.trim();
  return trimmedValue ? trimmedValue : null;
};

const parseMscCodes = (value: unknown): ParsedMscCodesResult => {
  if (value === undefined) {
    return { mscCodes: [] as ParsedMscCode[] };
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

    const code = candidate.code.trim();
    if (!code) {
      return { message: 'msc_codes items must include code and is_primary' };
    }

    mscCodes.push({
      code,
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
  const fullName = normalizeOptionalString(body.full_name);
  if (!fullName) {
    return { message: 'full_name is required' };
  }

  const institutionId = normalizeOptionalString(body.institution_id);
  const institutionNameRaw = normalizeOptionalString(body.institution_name_raw);
  if (!institutionId && !institutionNameRaw) {
    return { message: 'institution_id or institution_name_raw is required' };
  }

  const countryCode = normalizeOptionalString(body.country_code);
  if (!countryCode) {
    return { message: 'country_code is required' };
  }

  const careerStage = normalizeOptionalString(body.career_stage);
  if (!careerStage || !CAREER_STAGES.has(careerStage)) {
    return { message: 'career_stage is required' };
  }

  const parsedMscCodes = parseMscCodes(body.msc_codes);
  if ('message' in parsedMscCodes) {
    return parsedMscCodes;
  }

  if (
    body.research_keywords !== undefined &&
    (!Array.isArray(body.research_keywords) ||
      body.research_keywords.some((item) => typeof item !== 'string'))
  ) {
    return { message: 'research_keywords must be an array of strings' };
  }

  return {
    profile: {
      fullName,
      title: normalizeOptionalString(body.title),
      institutionId,
      institutionNameRaw,
      countryCode,
      careerStage,
      bio: normalizeOptionalString(body.bio),
      personalWebsite: normalizeOptionalString(body.personal_website),
      researchKeywords: ((body.research_keywords ?? []) as string[]).map((item) => item.trim()),
      mscCodes: parsedMscCodes.mscCodes,
      orcidId: normalizeOptionalString(body.orcid_id),
      coiDeclarationText:
        typeof body.coi_declaration_text === 'string' ? body.coi_declaration_text : '',
      isProfilePublic:
        typeof body.is_profile_public === 'boolean' ? body.is_profile_public : false,
    } satisfies ParsedProfileUpdate,
  };
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

    res.status(200).json({
      data: {
        profile: serializeProfile(mapProfileRecord(record)),
      },
    });
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

  const { profile } = parsedPayload;

  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    const record = await prisma.$transaction(async (tx) => {
      await tx.profile.upsert({
        where: { userId: user.id },
        update: {
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
        },
        create: {
          ...buildStarterProfile(user.id, profile.fullName),
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
        },
      });

      await tx.profileMscCode.deleteMany({ where: { userId: user.id } });

      if (profile.mscCodes.length > 0) {
        await tx.profileMscCode.createMany({
          data: profile.mscCodes.map((item: ParsedMscCode) => ({
            userId: user.id,
            mscCode: item.code,
            isPrimary: item.isPrimary,
          })),
        });
      }

      return tx.profile.findUniqueOrThrow({
        where: { userId: user.id },
        include: { mscCodes: true },
      });
    });

    res.status(200).json({
      data: {
        profile: serializeProfile(mapProfileRecord(record)),
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};
