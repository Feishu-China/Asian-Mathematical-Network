import { fakeConferenceProvider } from './fakeConferenceProvider';
import { httpConferenceProvider } from './httpConferenceProvider';

const isTestEnv = import.meta.env.MODE === 'test' || import.meta.env.VITEST;

export const conferenceProvider = isTestEnv ? fakeConferenceProvider : httpConferenceProvider;
