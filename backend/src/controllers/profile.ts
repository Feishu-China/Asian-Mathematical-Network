import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import type { Profile } from '../../../src/types/models';
import { prisma } from '../lib/prisma';
import { serializeProfile } from '../serializers/profile';

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_key_for_development';

const slugify = (input: string) =>
  input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

type ProfileRecord = {
  userId: string;
  slug: string;
  fullName: string;
  title: string | null;
  institutionId: string | null;
  institutionNameRaw: string | null;
  countryCode: string | null;
  careerStage: string | null;
  bio: string | null;
  personalWebsite: string | null;
  researchKeywordsJson: string;
  orcidId: string | null;
  coiDeclarationText: string;
  isProfilePublic: boolean;
  verificationStatus: string;
  verifiedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  mscCodes: Array<{
    mscCode: string;
    isPrimary: boolean;
  }>;
};

export const buildStarterProfile = (userId: string, fullName: string) => ({
  userId,
  slug: `${slugify(fullName)}-${userId.slice(0, 8)}`,
  fullName,
  researchKeywordsJson: '[]',
});

const mapProfileRecord = (record: ProfileRecord): Profile => ({
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

export const getMyProfile = async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };

    const record = await prisma.profile.findUnique({
      where: { userId: decoded.userId },
      include: { mscCodes: true },
    });

    if (!record) {
      res.status(404).json({ message: 'Profile not found' });
      return;
    }

    res.status(200).json({
      data: {
        profile: serializeProfile(mapProfileRecord(record as ProfileRecord)),
      },
    });
  } catch (error) {
    res.status(401).json({ message: 'Unauthorized' });
  }
};
