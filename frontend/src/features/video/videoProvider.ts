import { videoPreviews } from './staticVideoContent';
import type { VideoProvider } from './types';

export const videoProvider: VideoProvider = {
  async listPublicVideos() {
    return videoPreviews.map((item) => structuredClone(item));
  },

  async getVideoBySlug(slug) {
    return structuredClone(videoPreviews.find((item) => item.slug === slug) ?? null);
  },
};
