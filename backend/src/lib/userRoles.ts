import { Prisma, PrismaClient } from '@prisma/client';
import { prisma } from './prisma';

type PrismaLike = Prisma.TransactionClient | PrismaClient | typeof prisma;

const ROLE_PRIORITY: Record<string, number> = {
  admin: 400,
  organizer: 300,
  reviewer: 200,
  applicant: 100,
};

const sortRoles = <
  T extends {
    role: string;
    isPrimary: boolean;
    createdAt: Date;
  },
>(
  roles: T[]
) =>
  [...roles].sort((left, right) => {
    const priorityDelta = (ROLE_PRIORITY[right.role] ?? 0) - (ROLE_PRIORITY[left.role] ?? 0);
    if (priorityDelta !== 0) {
      return priorityDelta;
    }

    if (left.isPrimary !== right.isPrimary) {
      return left.isPrimary ? -1 : 1;
    }

    return left.createdAt.getTime() - right.createdAt.getTime();
  });

export const listUserRoles = async (userId: string, client: PrismaLike = prisma) => {
  const roles = await client.userRole.findMany({
    where: { userId },
  });

  return sortRoles(roles).map((item) => item.role);
};

export const readPrimaryRole = async (userId: string, client: PrismaLike = prisma) => {
  const roles = await client.userRole.findMany({
    where: { userId },
  });

  return sortRoles(roles)[0]?.role ?? null;
};

export const ensureUserRole = async (
  userId: string,
  role: string,
  client: PrismaLike = prisma,
  isPrimary = false
) =>
  client.userRole.upsert({
    where: {
      userId_role: {
        userId,
        role,
      },
    },
    update: isPrimary ? { isPrimary: true } : {},
    create: {
      userId,
      role,
      isPrimary,
    },
  });

export const hasAnyUserRole = async (
  userId: string,
  roles: string[],
  client: PrismaLike = prisma
) => {
  const count = await client.userRole.count({
    where: {
      userId,
      role: { in: roles },
    },
  });

  return count > 0;
};
