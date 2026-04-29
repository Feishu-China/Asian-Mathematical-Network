import type { WorkspaceKey } from '@asiamath/shared/models';
import {
  getWorkspaceRoot,
  readStoredWorkspace,
  resolvePreferredWorkspace,
} from './workspaces';

export type AuthReturnState = {
  returnTo?: string;
};

export const DEFAULT_AUTH_RETURN_TO = '/dashboard';

export const readReturnTo = (state: unknown, fallback = DEFAULT_AUTH_RETURN_TO): string => {
  if (!state || typeof state !== 'object' || !('returnTo' in state)) {
    return fallback;
  }

  const returnTo = (state as AuthReturnState).returnTo;

  return typeof returnTo === 'string' && returnTo.length > 0 ? returnTo : fallback;
};

export const hasExplicitReturnTo = (state: unknown) => readReturnTo(state, '').length > 0;

export const resolvePostAuthWorkspace = (
  availableWorkspaces: readonly WorkspaceKey[] | null | undefined,
  preferredWorkspace = readStoredWorkspace()
) => resolvePreferredWorkspace(availableWorkspaces, preferredWorkspace);

export const resolvePostAuthDestination = (
  state: unknown,
  availableWorkspaces: readonly WorkspaceKey[] | null | undefined,
  preferredWorkspace = readStoredWorkspace()
) => {
  const explicitReturnTo = readReturnTo(state, '');

  if (explicitReturnTo) {
    return explicitReturnTo;
  }

  return getWorkspaceRoot(resolvePostAuthWorkspace(availableWorkspaces, preferredWorkspace));
};

export const toReturnToState = (returnTo: string): AuthReturnState => ({
  returnTo,
});
