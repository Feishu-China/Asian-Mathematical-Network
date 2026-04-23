export type PartnerListItem = {
  id: string;
  slug: string;
  title: string;
  sectorLabel: string;
  geographyLabel: string;
  summary: string;
  matchingFocus: string;
};

export type PartnerProvider = {
  listPublicPartners(): Promise<PartnerListItem[]>;
};
