export type PublicationPreview = {
  id: string;
  slug: string;
  title: string;
  seriesLabel: string;
  ctaLabel: string;
  summary: string;
  publicationFocus: string;
  highlights: string[];
};

export type PublicationProvider = {
  listPublications(): Promise<PublicationPreview[]>;
  getPublicationBySlug(slug: string): Promise<PublicationPreview | null>;
};
