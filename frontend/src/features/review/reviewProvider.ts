import { fakeReviewProvider } from './fakeReviewProvider';
import { httpReviewProvider } from './httpReviewProvider';
import { shouldUseFakeProvider } from '../providerMode';

export const reviewProvider = shouldUseFakeProvider(import.meta.env)
  ? fakeReviewProvider
  : httpReviewProvider;
