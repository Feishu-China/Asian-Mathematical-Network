import type { PartnerListItem, PartnerProvider } from './types';

const partnerSeed: PartnerListItem[] = [
  {
    id: 'partner-001',
    slug: 'institute-for-mathematical-systems-and-data',
    title: 'Institute for Mathematical Systems and Data',
    sectorLabel: 'Research and applied institute',
    geographyLabel: 'Singapore and regional collaborations',
    summary:
      'Institutional collaboration, applied research pathways, and expertise matching can appear as part of the same Asiamath product surface.',
    matchingFocus:
      'Seeking scholars in optimization, geometry, and mathematical modeling for visiting labs, applied seminars, and collaborative supervision.',
  },
  {
    id: 'partner-002',
    slug: 'asia-quant-mobility-consortium',
    title: 'Asia Quant Mobility Consortium',
    sectorLabel: 'Industry consortium',
    geographyLabel: 'Hybrid cross-border network',
    summary:
      'A breadth-facing partner teaser that suggests internships, mentorship, and applied projects without requiring a live partner CRM.',
    matchingFocus:
      'Interested in stochastic methods, combinatorics, and data-intensive research training collaborations.',
  },
];

let state = partnerSeed.map((item) => structuredClone(item));

export const resetPartnerFakeState = () => {
  state = partnerSeed.map((item) => structuredClone(item));
};

export const fakePartnerProvider: PartnerProvider = {
  async listPublicPartners() {
    return state.map((item) => structuredClone(item));
  },
};
