import { fakeConferenceProvider } from './fakeConferenceProvider';
import { httpConferenceProvider } from './httpConferenceProvider';
import { shouldUseFakeProvider } from '../providerMode';

export const conferenceProvider = shouldUseFakeProvider(import.meta.env)
  ? fakeConferenceProvider
  : httpConferenceProvider;
