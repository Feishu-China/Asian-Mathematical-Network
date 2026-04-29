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

export const resolveReturnContext = (
  state: unknown,
  currentPath: string,
  fallback: ReturnContext
): ReturnContext => {
  let returnContext = readReturnContext(state);

  while (returnContext?.to === currentPath) {
    returnContext = readReturnContext(returnContext.state);
  }

  return returnContext ?? fallback;
};
