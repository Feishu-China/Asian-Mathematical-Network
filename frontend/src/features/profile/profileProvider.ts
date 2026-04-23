import { fakeProfileProvider } from './fakeProfileProvider';
import { httpProfileProvider } from './httpProfileProvider';

const isTestEnv = import.meta.env.MODE === 'test' || import.meta.env.VITEST;

export const profileProvider = isTestEnv ? fakeProfileProvider : httpProfileProvider;
