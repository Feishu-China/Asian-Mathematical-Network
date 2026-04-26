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

export const toReturnToState = (returnTo: string): AuthReturnState => ({
  returnTo,
});
