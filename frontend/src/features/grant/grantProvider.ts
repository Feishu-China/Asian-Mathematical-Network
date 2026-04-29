import { fakeGrantProvider } from './fakeGrantProvider';
import { httpGrantProvider } from './httpGrantProvider';
import { shouldUseFakeProvider } from '../providerMode';

export const grantProvider = shouldUseFakeProvider(import.meta.env)
  ? fakeGrantProvider
  : httpGrantProvider;
