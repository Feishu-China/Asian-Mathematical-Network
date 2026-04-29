import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { PublicScholarSummary, ScholarExpertiseCluster } from './types';
import { resetProfileFakeState, seedProfileFakeState } from './fakeProfileProvider';
import { scholarDirectoryProvider } from './scholarDirectoryProvider';

vi.mock('../../api/profile', () => ({
  fetchScholarDirectory: vi.fn(),
}));

describe('scholarDirectoryProvider', () => {
  beforeEach(() => {
    resetProfileFakeState();
    vi.clearAllMocks();
  });

  it('includes the editable public profile at the front of the hybrid directory list', async () => {
    const result = await scholarDirectoryProvider.getDirectoryViewModel();

    expect(result.scholars[0].slug).toBe('alice-chen-demo');
    expect(result.scholars[0].fullName).toBe('Alice Chen');
    expect(
      result.clusters.map((item: ScholarExpertiseCluster) => item.label)
    ).toContain('Algebraic Geometry');
  });

  it('omits the editable profile when public visibility is turned off', async () => {
    seedProfileFakeState({ isProfilePublic: false });

    const result = await scholarDirectoryProvider.getDirectoryViewModel();

    expect(
      result.scholars.find((item: PublicScholarSummary) => item.slug === 'alice-chen-demo')
    ).toBeUndefined();
  });

  it('uses the real API-backed directory payload when fake providers are disabled', async () => {
    vi.resetModules();
    vi.stubEnv('MODE', 'development');
    vi.stubEnv('VITEST', '');
    vi.unstubAllEnvs();
    vi.stubEnv('MODE', 'development');
    vi.stubEnv('VITEST', '');

    const { fetchScholarDirectory } = await import('../../api/profile');
    vi.mocked(fetchScholarDirectory).mockResolvedValueOnce({
      data: {
        scholars: [
          {
            slug: 'real-scholar',
            full_name: 'Real Scholar',
            title: 'Professor',
            institution_name_raw: 'National University of Singapore',
            country_code: 'SG',
            research_keywords: ['algebraic geometry', 'moduli'],
            primary_msc_code: '14J60',
            bio: 'Real public scholar profile.',
          },
        ],
        clusters: [
          {
            id: 'cluster-ag',
            label: 'Algebraic Geometry',
            summary: 'Birational geometry, moduli, and arithmetic interfaces.',
            scholar_count: 1,
            institution_count: 1,
          },
        ],
      },
      meta: { total: 1 },
    });

    const { scholarDirectoryProvider: realDirectoryProvider } = await import('./scholarDirectoryProvider');
    const result = await realDirectoryProvider.getDirectoryViewModel();

    expect(fetchScholarDirectory).toHaveBeenCalledTimes(1);
    expect(result).toEqual({
      scholars: [
        {
          slug: 'real-scholar',
          fullName: 'Real Scholar',
          title: 'Professor',
          institutionNameRaw: 'National University of Singapore',
          countryCode: 'SG',
          researchKeywords: ['algebraic geometry', 'moduli'],
          primaryMscCode: '14J60',
          bio: 'Real public scholar profile.',
        },
      ],
      clusters: [
        {
          id: 'cluster-ag',
          label: 'Algebraic Geometry',
          summary: 'Birational geometry, moduli, and arithmetic interfaces.',
          scholarCount: 1,
          institutionCount: 1,
        },
      ],
    });
  });
});
