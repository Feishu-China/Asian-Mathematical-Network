import type { PartnerListItem, PartnerProvider } from './types';

const partnerSeed: PartnerListItem[] = [
  {
    id: 'partner-001',
    slug: 'national-university-of-singapore',
    title: 'National University of Singapore',
    sectorLabel: 'Member institution',
    geographyLabel: 'Singapore',
    summary:
      'A member institution participating in regional workshops, training programmes, and scholar collaboration across the network.',
    matchingFocus:
      'Active in geometry, analysis, and cross-institution training collaborations.',
  },
  {
    id: 'partner-002',
    slug: 'indian-statistical-institute',
    title: 'Indian Statistical Institute',
    sectorLabel: 'Member institution',
    geographyLabel: 'India',
    summary:
      'A long-standing mathematical research institution contributing to training, collaboration, and network visibility.',
    matchingFocus:
      'Interested in combinatorics, probability, and joint student-facing programmes.',
  },
  {
    id: 'partner-003',
    slug: 'academia-sinica',
    title: 'Academia Sinica',
    sectorLabel: 'Member institution',
    geographyLabel: 'Taiwan',
    summary:
      'A research anchor for scholar exchange, school visits, and advanced training partnerships.',
    matchingFocus:
      'Strong in PDE, analysis, and public-facing mathematical programming.',
  },
  {
    id: 'partner-004',
    slug: 'tsinghua-university',
    title: 'Tsinghua University',
    sectorLabel: 'Member institution',
    geographyLabel: 'China',
    summary:
      'A network institution supporting conferences, thematic schools, and long-term academic exchange.',
    matchingFocus:
      'Interested in algebraic geometry, number theory, and collaborative supervision routes.',
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
