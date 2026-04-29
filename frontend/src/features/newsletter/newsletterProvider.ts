import { newsletterIssues } from './staticNewsletterContent';
import type { NewsletterProvider } from './types';

export const newsletterProvider: NewsletterProvider = {
  async listPublicIssues() {
    return newsletterIssues.map((issue) => structuredClone(issue));
  },

  async getIssueBySlug(slug) {
    return structuredClone(newsletterIssues.find((issue) => issue.slug === slug) ?? null);
  },
};
