import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { User, UserStatus } from '../../../src/types/models';

// In-memory mock database
const users: User[] = [];
// Also store passwords separately to avoid returning them
const passwords: Record<string, string> = {};

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_key_for_development';

export const register = async (req: Request, res: Response) => {
  try {
    const { email, password, fullName } = req.body;

    if (!email || !password || !fullName) {
      res.status(400).json({ message: 'Email, password and fullName are required' });
      return;
    }

    const existingUser = users.find(u => u.email === email);
    if (existingUser) {
      res.status(400).json({ message: 'User already exists' });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUserId = uuidv4();
    
    const newUser: User = {
      id: newUserId,
      email,
      status: 'active' as UserStatus,
      emailVerifiedAt: null,
      lastLoginAt: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    users.push(newUser);
    passwords[newUserId] = hashedPassword;

    const token = jwt.sign({ userId: newUserId }, JWT_SECRET, { expiresIn: '1d' });

    res.status(201).json({
      accessToken: token,
      user: newUser
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

    const user = users.find(u => u.email === email);
    if (!user) {
      res.status(401).json({ message: 'Invalid credentials' });
      return;
    }

    const isMatch = await bcrypt.compare(password, passwords[user.id]);
    if (!isMatch) {
      res.status(401).json({ message: 'Invalid credentials' });
      return;
    }

    user.lastLoginAt = new Date().toISOString();

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '1d' });

    res.status(200).json({
      accessToken: token,
      user
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

    const user = users.find(u => u.id === decoded.userId);
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    // Mock returning user and empty profile
    res.status(200).json({
      user,
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