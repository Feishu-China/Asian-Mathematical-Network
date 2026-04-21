import { fakeGrantProvider } from './fakeGrantProvider';
import { httpGrantProvider } from './httpGrantProvider';

const isTestEnv = import.meta.env.MODE === 'test' || import.meta.env.VITEST;

export const grantProvider = isTestEnv ? fakeGrantProvider : httpGrantProvider;
