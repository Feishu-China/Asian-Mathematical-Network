import type { SchoolDetail, SchoolListItem, SchoolProvider } from './types';

const schoolSeed: SchoolDetail[] = [
  {
    id: 'school-001',
    slug: 'algebraic-geometry-research-school-2026',
    title: 'Asia-Pacific Research School in Algebraic Geometry',
    shortLabel: 'Training programs',
    ctaLabel: 'View school',
    summary:
      'School and training opportunities distinct from conferences, focused on pedagogy, cohort learning, and structured research preparation.',
    positioning:
      'An intensive research-school format for graduate students and early-career researchers who need a guided learning environment rather than a conference presentation venue.',
    audience:
      'Advanced undergraduates, MSc students, PhD students, and recent graduates preparing for research in algebraic geometry.',
    programOutline: [
      'Morning lecture blocks on birational techniques and moduli foundations',
      'Small-group problem sessions led by postdoctoral mentors',
      'Research communication workshops and guided reading groups',
    ],
    travelSupportAvailable: true,
    travelSupportTeaser:
      'Travel support is available through the Asiamath mobility grant track for selected school participants.',
    outputsTeaser:
      'Videos, publications, and newsletters can grow from school activity once the cohort work is documented.',
  },
  {
    id: 'school-002',
    slug: 'discrete-math-training-week-2026',
    title: 'Discrete Mathematics Training Week 2026',
    shortLabel: 'Preparatory cohort',
    ctaLabel: 'View program',
    summary:
      'A short-format training program for combinatorics and discrete methods with emphasis on learning progression rather than conference-style dissemination.',
    positioning:
      'Built as a pedagogical bridge into research topics, not as a paper-presentation venue.',
    audience: 'Undergraduate and early graduate learners looking for guided entry into combinatorics.',
    programOutline: [
      'Foundations refreshers in graph theory and extremal combinatorics',
      'Mentored group exercises and proof clinics',
      'Applied pathway session linking theory to data and optimization topics',
    ],
    travelSupportAvailable: false,
    travelSupportTeaser: 'Travel support is not configured for this school yet.',
    outputsTeaser:
      'Future outputs could include short explainer videos or recap articles when the training archive is built out.',
  },
];

let state = schoolSeed.map((item) => structuredClone(item));

const toListItem = (school: SchoolDetail): SchoolListItem => ({
  id: school.id,
  slug: school.slug,
  title: school.title,
  locationText: 'Hybrid regional cohort',
  startDate: '2026-07-12',
  shortLabel: school.shortLabel,
  ctaLabel: school.ctaLabel,
  summary: school.summary,
  travelSupportAvailable: school.travelSupportAvailable,
});

export const resetSchoolFakeState = () => {
  state = schoolSeed.map((item) => structuredClone(item));
};

export const fakeSchoolProvider: SchoolProvider = {
  async listPublicSchools() {
    return state.map(toListItem);
  },

  async getSchoolBySlug(slug) {
    return state.find((school) => school.slug === slug) ?? null;
  },
};
