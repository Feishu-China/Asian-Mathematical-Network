import type { PrizeDetail, PrizeListItem, PrizeProvider } from './types';

const prizeSeed: PrizeDetail[] = [
  {
    id: 'prize-001',
    slug: 'asiamath-early-career-prize-2026',
    title: 'Asiamath Early Career Prize 2026',
    cycleLabel: '2026 cycle',
    shortLabel: 'Prize archive preview',
    ctaLabel: 'View prize',
    summary:
      'Scholar identity, nomination context, and governance signals converge in a prize surface that is distinct from opportunity applications.',
    positioning:
      'A recognition object designed to highlight scholar profile quality, committee judgment, and institutional legitimacy rather than event participation.',
    audience:
      'Early-career mathematicians with visible profile records, nomination support, and committee-facing evaluation context.',
    selectionPreview:
      'Nomination intake, confidential review, and committee release remain part of the same platform direction without requiring a live governance engine in d0.',
    governanceSignals: [
      'Nominations preview',
      'Confidential review concept',
      'Committee release pathway',
    ],
  },
  {
    id: 'prize-002',
    slug: 'asiamath-community-impact-award-2026',
    title: 'Asiamath Community Impact Award 2026',
    cycleLabel: '2026 cycle',
    shortLabel: 'Community award concept',
    ctaLabel: 'View award',
    summary:
      'A breadth preview for mission-oriented recognition that still relies on trusted scholar records and structured committee decisions.',
    positioning:
      'Shows that awards can recognize outreach and institution-building, not only research distinction.',
    audience: 'Community leaders, outreach organizers, and public-math contributors across the region.',
    selectionPreview:
      'This preview keeps the evaluation process conceptual while still making the governance layer visible.',
    governanceSignals: [
      'Nomination dossier concept',
      'Reviewer confidentiality',
      'Released citation preview',
    ],
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
  stageLabel: 'Selection process preview',
});

export const resetPrizeFakeState = () => {
  state = prizeSeed.map((item) => structuredClone(item));
};

export const fakePrizeProvider: PrizeProvider = {
  async listPublicPrizes() {
    return state.map(toListItem);
  },

  async getPrizeBySlug(slug) {
    return state.find((prize) => prize.slug === slug) ?? null;
  },
};
