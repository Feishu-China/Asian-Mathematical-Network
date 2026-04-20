import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma';
import { buildStarterProfile } from '../lib/profile';

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_key_for_development';

export const register = async (req: Request, res: Response) => {
  try {
    const { email, password, fullName } = req.body;

    if (!email || !password || !fullName) {
      res.status(400).json({ message: 'Email, password and fullName are required' });
      return;
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      res.status(400).json({ message: 'User already exists' });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    
    const newUser = await prisma.$transaction(async (tx) => {
      const createdUser = await tx.user.create({
        data: {
          email,
          passwordHash: hashedPassword,
          status: 'active'
        }
      });

      await tx.profile.create({
        data: buildStarterProfile(createdUser.id, fullName)
      });

      return createdUser;
    });

    const token = jwt.sign({ userId: newUser.id }, JWT_SECRET, { expiresIn: '1d' });

    res.status(201).json({
      accessToken: token,
      user: {
        id: newUser.id,
        email: newUser.email,
        status: newUser.status,
        createdAt: newUser.createdAt,
        updatedAt: newUser.updatedAt
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ message: 'Email and password are required' });
      return;
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      res.status(401).json({ message: 'Invalid credentials' });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      res.status(401).json({ message: 'Invalid credentials' });
      return;
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() }
    });

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '1d' });

    res.status(200).json({
      accessToken: token,
      user: {
        id: user.id,
        email: user.email,
        status: user.status,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const getMe = async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };

    const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    res.status(200).json({
      user: {
        id: user.id,
        email: user.email,
        status: user.status,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      },
      profile: {
        userId: user.id,
        slug: 'mock-slug',
        fullName: 'Mock User',
        title: null,
        institutionId: null,
        institutionNameRaw: null,
        countryCode: null,
        careerStage: 'other',
        bio: null,
        personalWebsite: null,
        researchKeywords: [],
        orcidId: null,
        coiDeclarationText: '',
        isProfilePublic: false,
        verificationStatus: 'unverified',
        verifiedAt: null,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }
    });
  } catch (error) {
    res.status(401).json({ message: 'Unauthorized' });
  }
};
