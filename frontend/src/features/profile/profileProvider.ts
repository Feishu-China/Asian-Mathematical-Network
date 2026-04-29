import { fakeProfileProvider } from './fakeProfileProvider';
import { httpProfileProvider } from './httpProfileProvider';
import { shouldUseFakeProvider } from '../providerMode';

export const profileProvider = shouldUseFakeProvider(import.meta.env)
  ? fakeProfileProvider
  : httpProfileProvider;
