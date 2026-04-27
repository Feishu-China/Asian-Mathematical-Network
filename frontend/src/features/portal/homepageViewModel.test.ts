import { afterEach, describe, expect, it } from 'vitest';
import { conferenceProvider } from '../conference/conferenceProvider';
import { grantProvider } from '../grant/grantProvider';
import { scholarDirectoryProvider } from '../profile/scholarDirectoryProvider';
import { schoolProvider } from '../school/schoolProvider';
import { loadPortalHomepageViewModel } from './homepageViewModel';

describe('loadPortalHomepageViewModel', () => {
  const originalConferenceList = conferenceProvider.listPublicConferences;
  const originalGrantList = grantProvider.listPublicGrants;
  const originalSchoolList = schoolProvider.listPublicSchools;
  const originalScholarDirectory = scholarDirectoryProvider.getDirectoryViewModel;

  afterEach(() => {
    conferenceProvider.listPublicConferences = originalConferenceList;
    grantProvider.listPublicGrants = originalGrantList;
    schoolProvider.listPublicSchools = originalSchoolList;
    scholarDirectoryProvider.getDirectoryViewModel = originalScholarDirectory;
  });

  it('returns editorial homepage data for hero, opportunities, scholars, and supporting sections', async () => {
    const model = await loadPortalHomepageViewModel();

    expect(model.heroFeature).not.toBeNull();
    expect(model.featuredOpportunities).toHaveLength(2);
    expect(model.schoolSpotlights.length).toBeGreaterThan(0);
    expect(model.scholarTeaser.clusters.length).toBeGreaterThan(0);
    expect(model.scholarTeaser.scholars.length).toBeGreaterThan(0);
    expect(model.prizeTeaser.items.length).toBeGreaterThan(0);
    expect(model.outreachTeaser.links.length).toBeGreaterThan(0);
    expect(model.networkStories.length).toBeGreaterThan(0);
    expect(model.partnerStrip.length).toBeGreaterThan(0);
  });

  it('filters closed opportunities out of featured homepage slots and keeps visible statuses to open or upcoming', async () => {
    conferenceProvider.listPublicConferences = async () => [
      {
        id: 'conf-closed',
        slug: 'closed-conference',
        title: 'Closed Conference',
        shortName: null,
        locationText: 'Seoul',
        startDate: '2026-01-10',
        endDate: '2026-01-12',
        applicationDeadline: '2026-01-01T00:00:00.000Z',
        status: 'closed',
        isApplicationOpen: false,
        relatedGrantCount: 0,
      },
      {
        id: 'conf-open',
        slug: 'open-conference',
        title: 'Open Conference',
        shortName: null,
        locationText: 'Tokyo',
        startDate: '2026-10-10',
        endDate: '2026-10-12',
        applicationDeadline: '2026-08-01T00:00:00.000Z',
        status: 'published',
        isApplicationOpen: true,
        relatedGrantCount: 0,
      },
    ];

    grantProvider.listPublicGrants = async () => [
      {
        id: 'grant-closed',
        slug: 'closed-grant',
        title: 'Closed Grant',
        grantType: 'conference_travel_grant',
        linkedOpportunityType: 'conference',
        linkedOpportunityId: 'conf-open',
        linkedOpportunityTitle: 'Open Conference',
        applicationDeadline: '2026-01-01T00:00:00.000Z',
        status: 'closed',
        reportRequired: false,
        isApplicationOpen: false,
      },
      {
        id: 'grant-upcoming',
        slug: 'upcoming-grant',
        title: 'Upcoming Grant',
        grantType: 'conference_travel_grant',
        linkedOpportunityType: 'conference',
        linkedOpportunityId: 'conf-open',
        linkedOpportunityTitle: 'Open Conference',
        applicationDeadline: '2026-12-01T00:00:00.000Z',
        status: 'published',
        reportRequired: false,
        isApplicationOpen: false,
      },
    ];

    schoolProvider.listPublicSchools = async () => [
      {
        id: 'school-1',
        slug: 'future-school',
        title: 'Future School',
        locationText: 'Hybrid regional cohort',
        startDate: '2026-12-12',
        shortLabel: 'School',
        ctaLabel: 'View school',
        summary: 'Future school summary',
        travelSupportAvailable: true,
      },
    ];

    scholarDirectoryProvider.getDirectoryViewModel = async () => ({
      clusters: [],
      scholars: [],
    });

    const model = await loadPortalHomepageViewModel();

    expect(model.heroFeature?.title).toBe('Open Conference');
    expect(model.featuredOpportunities.map((item) => item.title)).toEqual([
      'Open Conference',
      'Upcoming Grant',
    ]);
    expect(model.featuredOpportunities.map((item) => item.statusLabel)).toEqual([
      'Open',
      'Upcoming',
    ]);
    expect(model.schoolSpotlights.map((item) => item.statusLabel)).toEqual(['Upcoming']);
  });
});
