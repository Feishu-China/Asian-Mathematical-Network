import { Request } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_key_for_development';

export const requireAuthenticatedUserId = (req: Request) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    throw new Error('UNAUTHORIZED');
  }

  const token = authHeader.split(' ')[1];
  const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
  return decoded.userId;
};
