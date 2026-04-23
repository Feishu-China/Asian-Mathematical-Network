export type ReturnContext = {
  to: string;
  label: string;
  state?: unknown;
};

export type ReturnContextState = {
  returnContext?: ReturnContext;
};

export const readReturnContext = (state: unknown): ReturnContext | null => {
  if (!state || typeof state !== 'object' || !('returnContext' in state)) {
    return null;
  }

  const returnContext = (state as ReturnContextState).returnContext;

  if (
    !returnContext ||
    typeof returnContext !== 'object' ||
    typeof returnContext.to !== 'string' ||
    typeof returnContext.label !== 'string'
  ) {
    return null;
  }

  return returnContext;
};

export const toReturnContextState = (
  returnContext: ReturnContext | null
): ReturnContextState | undefined =>
  returnContext
    ? {
        returnContext,
      }
    : undefined;
