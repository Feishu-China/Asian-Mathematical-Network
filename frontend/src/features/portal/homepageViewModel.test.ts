import { describe, expect, it } from 'vitest';
import { loadPortalHomepageViewModel } from './homepageViewModel';

describe('loadPortalHomepageViewModel', () => {
  it('returns opportunity, school, and scholar teaser data for the homepage', async () => {
    const model = await loadPortalHomepageViewModel();

    expect(model.featuredOpportunities).toHaveLength(2);
    expect(model.schoolSpotlights.length).toBeGreaterThan(0);
    expect(model.scholarTeaser.clusters.length).toBeGreaterThan(0);
    expect(model.scholarTeaser.scholars.length).toBeGreaterThan(0);
  });
});
