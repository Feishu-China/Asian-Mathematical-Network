export type SchoolListItem = {
  id: string;
  slug: string;
  title: string;
  locationText: string | null;
  startDate: string | null;
  shortLabel: string;
  ctaLabel: string;
  summary: string;
  travelSupportAvailable: boolean;
};

export type SchoolDetail = {
  id: string;
  slug: string;
  title: string;
  shortLabel: string;
  ctaLabel: string;
  summary: string;
  positioning: string;
  audience: string;
  programOutline: string[];
  travelSupportAvailable: boolean;
  travelSupportTeaser: string;
  outputsTeaser: string;
};

export type SchoolProvider = {
  listPublicSchools(): Promise<SchoolListItem[]>;
  getSchoolBySlug(slug: string): Promise<SchoolDetail | null>;
};
