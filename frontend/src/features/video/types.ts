export type VideoPreview = {
  id: string;
  slug: string;
  title: string;
  seriesLabel: string;
  ctaLabel: string;
  summary: string;
  videoFocus: string;
  highlights: string[];
};

export type VideoProvider = {
  listPublicVideos(): Promise<VideoPreview[]>;
  getVideoBySlug(slug: string): Promise<VideoPreview | null>;
};
