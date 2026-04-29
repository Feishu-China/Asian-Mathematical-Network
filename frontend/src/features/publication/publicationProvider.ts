import { publicationPreviews } from './staticPublicationContent';
import type { PublicationProvider } from './types';

export const publicationProvider: PublicationProvider = {
  async listPublications() {
    return publicationPreviews.map((item) => structuredClone(item));
  },

  async getPublicationBySlug(slug) {
    return structuredClone(publicationPreviews.find((item) => item.slug === slug) ?? null);
  },
};
