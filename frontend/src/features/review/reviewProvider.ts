import { fakeReviewProvider } from './fakeReviewProvider';
import { httpReviewProvider } from './httpReviewProvider';

const isTestEnv = import.meta.env.MODE === 'test' || import.meta.env.VITEST;

export const reviewProvider = isTestEnv ? fakeReviewProvider : httpReviewProvider;
