import { Prisma, PrismaClient } from '@prisma/client';
import type { UserRole, WorkspaceKey } from '@asiamath/shared/models';
import { prisma } from './prisma';

type PrismaLike = Prisma.TransactionClient | PrismaClient | typeof prisma;

const ROLE_PRIORITY: Record<string, number> = {
  admin: 400,
  organizer: 300,
  reviewer: 200,
  applicant: 100,
};

const WORKSPACE_ROLE_ORDER: WorkspaceKey[] = ['applicant', 'reviewer', 'organizer', 'admin'];

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

  return sortRoles(roles).map((item) => item.role as UserRole);
};

export const readPrimaryRole = async (
  userId: string,
  client: PrismaLike = prisma
): Promise<UserRole | null> => {
  const roles = await client.userRole.findMany({
    where: { userId },
  });

  const primaryRole = sortRoles(roles)[0]?.role;

  return (primaryRole as UserRole | undefined) ?? null;
};

export const listAvailableWorkspaces = async (
  userId: string,
  client: PrismaLike = prisma
): Promise<WorkspaceKey[]> => {
  const roles = await listUserRoles(userId, client);

  return WORKSPACE_ROLE_ORDER.filter((workspace) => roles.includes(workspace));
};

export const ensureUserRole = async (
  userId: string,
  role: UserRole,
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
  roles: UserRole[],
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
