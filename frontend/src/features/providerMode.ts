type ProviderEnv = {
  MODE?: string;
  VITEST?: string | boolean;
  VITE_DEMO_MODE?: string;
};

export const shouldUseFakeProvider = (env: ProviderEnv) =>
  env.MODE === 'test' || Boolean(env.VITEST) || env.VITE_DEMO_MODE === 'true';

