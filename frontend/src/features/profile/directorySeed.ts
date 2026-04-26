import type { PublicScholarSummary, ScholarExpertiseCluster } from './types';

export const scholarDirectorySeed: PublicScholarSummary[] = [
  {
    slug: 'prof-reviewer',
    fullName: 'Prof Reviewer',
    title: 'Professor',
    institutionNameRaw: 'University of Tokyo',
    countryCode: 'JP',
    researchKeywords: ['review governance', 'algebraic geometry', 'cross-border collaboration'],
    primaryMscCode: '14J60',
    bio: 'Supports review governance, algebraic geometry, and cross-border mathematical collaboration.',
  },
  {
    slug: 'mei-lin',
    fullName: 'Dr Mei Lin',
    title: 'Associate Professor',
    institutionNameRaw: 'Academia Sinica',
    countryCode: 'TW',
    researchKeywords: ['PDE', 'harmonic analysis', 'dispersive equations'],
    primaryMscCode: '35Q55',
    bio: 'Works on PDE and harmonic-analysis interfaces across regional research networks.',
  },
  {
    slug: 'arjun-sen',
    fullName: 'Dr Arjun Sen',
    title: 'Reader',
    institutionNameRaw: 'Indian Statistical Institute',
    countryCode: 'IN',
    researchKeywords: ['number theory', 'automorphic forms', 'L-functions'],
    primaryMscCode: '11F70',
    bio: 'Builds number-theory collaborations through conferences, schools, and mobility programmes.',
  },
];

export const scholarExpertiseClusterSeed: ScholarExpertiseCluster[] = [
  {
    id: 'cluster-ag',
    label: 'Algebraic Geometry',
    summary: 'Birational geometry, moduli, and arithmetic interfaces.',
    scholarCount: 18,
    institutionCount: 6,
  },
  {
    id: 'cluster-nt',
    label: 'Number Theory',
    summary: 'Automorphic forms, arithmetic geometry, and analytic methods.',
    scholarCount: 14,
    institutionCount: 5,
  },
  {
    id: 'cluster-pde',
    label: 'PDE',
    summary: 'Dispersive equations, harmonic analysis, and applied models.',
    scholarCount: 16,
    institutionCount: 7,
  },
  {
    id: 'cluster-top',
    label: 'Topology',
    summary: 'Low-dimensional topology and geometry across training cohorts.',
    scholarCount: 11,
    institutionCount: 4,
  },
];
