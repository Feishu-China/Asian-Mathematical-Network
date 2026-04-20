import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma';
import { buildStarterProfile, getStarterFullName, mapProfileRecord } from '../lib/profile';
import { serializeProfile } from '../serializers/profile';

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_key_for_development';

export const getMyProfile = async (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }

  let userId: string;
  try {
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    userId = decoded.userId;
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
