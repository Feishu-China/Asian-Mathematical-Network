import type { PrizeDetail, PrizeListItem, PrizeProvider } from './types';

const prizeSeed: PrizeDetail[] = [
  {
    id: 'prize-001',
    slug: 'asiamath-early-career-prize-2026',
    title: 'Asiamath Early Career Prize 2026',
    cycleLabel: '2026 cycle',
    shortLabel: 'Prize archive',
    ctaLabel: 'View prize',
    summary:
      'A public archive record for early-career recognition across the Asiamath network.',
    positioning:
      'This prize highlights research distinction, regional contribution, and scholar visibility across member institutions.',
    audience:
      'Early-career mathematicians, nominators, and committee members working across the network.',
    selectionPreview:
      'Nominations, committee review, and citation release remain visible as one public recognition pathway.',
    governanceSignals: ['Nomination record', 'Committee review', 'Released citation'],
  },
];

let state = prizeSeed.map((item) => structuredClone(item));

const toListItem = (prize: PrizeDetail): PrizeListItem => ({
  id: prize.id,
  slug: prize.slug,
  title: prize.title,
  cycleLabel: prize.cycleLabel,
  shortLabel: prize.shortLabel,
  ctaLabel: prize.ctaLabel,
  summary: prize.summary,
  stageLabel: 'Selection process',
});

export const resetPrizeFakeState = () => {
  state = prizeSeed.map((item) => structuredClone(item));
};

export const fakePrizeProvider: PrizeProvider = {
  async listPublicPrizes() {
    return state.map(toListItem);
  },

  async getPrizeBySlug(slug) {
    return structuredClone(state.find((prize) => prize.slug === slug) ?? null);
  },
};
