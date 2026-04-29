export type PrizeListItem = {
  id: string;
  slug: string;
  title: string;
  cycleLabel: string;
  shortLabel: string;
  ctaLabel: string;
  summary: string;
  stageLabel: string;
};

export type PrizeDetail = {
  id: string;
  slug: string;
  title: string;
  cycleLabel: string;
  shortLabel: string;
  ctaLabel: string;
  summary: string;
  positioning: string;
  audience: string;
  selectionPreview: string;
  governanceSignals: string[];
};

export type PrizeProvider = {
  listPublicPrizes(): Promise<PrizeListItem[]>;
  getPrizeBySlug(slug: string): Promise<PrizeDetail | null>;
};
