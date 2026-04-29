import type { AuthUser } from '../../api/auth';
import {
  isWorkspaceKey,
  normalizeAvailableWorkspaces,
  resolvePreferredWorkspace,
} from '../navigation/workspaces';

const AUTH_TOKEN_STORAGE_KEY = 'token';
const AUTH_USER_STORAGE_KEY = 'asiamath.authUser';

type StoredAuthUser = AuthUser;

const sanitizeAuthUser = (value: unknown): StoredAuthUser | null => {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const candidate = value as Partial<AuthUser>;

  if (typeof candidate.id !== 'string' || typeof candidate.email !== 'string') {
    return null;
  }

  const roles = Array.isArray(candidate.roles)
    ? candidate.roles.filter(isWorkspaceKey)
    : [];
  const availableWorkspaces = Array.isArray(candidate.available_workspaces)
    ? normalizeAvailableWorkspaces(candidate.available_workspaces)
    : normalizeAvailableWorkspaces(roles);
  const primaryRole =
    candidate.primary_role && isWorkspaceKey(candidate.primary_role) ? candidate.primary_role : null;
  const role = candidate.role && isWorkspaceKey(candidate.role) ? candidate.role : primaryRole;

  return {
    id: candidate.id,
    email: candidate.email,
    status: candidate.status ?? 'active',
    role,
    roles,
    available_workspaces: availableWorkspaces,
    primary_role: primaryRole,
    conference_staff_memberships: Array.isArray(candidate.conference_staff_memberships)
      ? candidate.conference_staff_memberships
          .filter(
            (membership): membership is NonNullable<AuthUser['conference_staff_memberships']>[number] =>
              Boolean(
                membership &&
                  typeof membership === 'object' &&
                  typeof membership.conference_id === 'string' &&
                  typeof membership.staff_role === 'string'
              )
          )
      : undefined,
    createdAt:
      typeof candidate.createdAt === 'string' ? candidate.createdAt : new Date(0).toISOString(),
    updatedAt:
      typeof candidate.updatedAt === 'string' ? candidate.updatedAt : new Date(0).toISOString(),
  };
};

export const readAuthToken = () => localStorage.getItem(AUTH_TOKEN_STORAGE_KEY);

export const writeAuthToken = (token: string) => {
  localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, token);
};

export const readStoredAuthUser = (): StoredAuthUser | null => {
  const raw = localStorage.getItem(AUTH_USER_STORAGE_KEY);

  if (!raw) {
    return null;
  }

  try {
    return sanitizeAuthUser(JSON.parse(raw));
  } catch {
    return null;
  }
};

export const writeStoredAuthUser = (user: AuthUser) => {
  const sanitized = sanitizeAuthUser(user);

  if (!sanitized) {
    return;
  }

  localStorage.setItem(AUTH_USER_STORAGE_KEY, JSON.stringify(sanitized));
};

export const clearStoredAuthUser = () => {
  localStorage.removeItem(AUTH_USER_STORAGE_KEY);
};

export const clearAuthSession = () => {
  localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
  clearStoredAuthUser();
};

export const readAvailableWorkspacesFromSession = () =>
  normalizeAvailableWorkspaces(readStoredAuthUser()?.available_workspaces);

export const readCurrentWorkspaceFromSession = () => {
  const authUser = readStoredAuthUser();

  return resolvePreferredWorkspace(authUser?.available_workspaces, authUser?.primary_role ?? authUser?.role);
};
