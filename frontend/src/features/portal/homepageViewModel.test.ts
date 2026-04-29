import { afterEach, describe, expect, it } from 'vitest';
import { conferenceProvider } from '../conference/conferenceProvider';
import { grantProvider } from '../grant/grantProvider';
import { newsletterProvider } from '../newsletter/newsletterProvider';
import { outreachProvider } from '../outreach/outreachProvider';
import { partnerProvider } from '../partner/partnerProvider';
import { scholarDirectoryProvider } from '../profile/scholarDirectoryProvider';
import { prizeProvider } from '../prize/prizeProvider';
import { publicationProvider } from '../publication/publicationProvider';
import { schoolProvider } from '../school/schoolProvider';
import { videoProvider } from '../video/videoProvider';
import { loadPortalHomepageViewModel } from './homepageViewModel';

describe('loadPortalHomepageViewModel', () => {
  const originalConferenceList = conferenceProvider.listPublicConferences;
  const originalGrantList = grantProvider.listPublicGrants;
  const originalSchoolList = schoolProvider.listPublicSchools;
  const originalScholarDirectory = scholarDirectoryProvider.getDirectoryViewModel;
  const originalPrizeList = prizeProvider.listPublicPrizes;
  const originalPartnerList = partnerProvider.listPublicPartners;
  const originalOutreachList = outreachProvider.listPublicPrograms;
  const originalNewsletterList = newsletterProvider.listPublicIssues;
  const originalPublicationList = publicationProvider.listPublications;
  const originalVideoList = videoProvider.listPublicVideos;

  afterEach(() => {
    conferenceProvider.listPublicConferences = originalConferenceList;
    grantProvider.listPublicGrants = originalGrantList;
    schoolProvider.listPublicSchools = originalSchoolList;
    scholarDirectoryProvider.getDirectoryViewModel = originalScholarDirectory;
    prizeProvider.listPublicPrizes = originalPrizeList;
    partnerProvider.listPublicPartners = originalPartnerList;
    outreachProvider.listPublicPrograms = originalOutreachList;
    newsletterProvider.listPublicIssues = originalNewsletterList;
    publicationProvider.listPublications = originalPublicationList;
    videoProvider.listPublicVideos = originalVideoList;
  });

  it('returns editorial homepage data for hero, opportunities, scholars, and supporting sections', async () => {
    const model = await loadPortalHomepageViewModel();

    expect(model.heroFeature).not.toBeNull();
    expect(model.featuredOpportunities).toHaveLength(2);
    expect(model.opportunityRail).toHaveLength(3);
    expect(model.schoolSpotlights.length).toBeGreaterThan(0);
    expect(model.scholarTeaser.clusters.length).toBeGreaterThan(0);
    expect(model.scholarTeaser.scholars.length).toBeGreaterThan(0);
    expect(model.prizeTeaser.items.length).toBeGreaterThan(0);
    expect(model.outreachTeaser.links.length).toBeGreaterThan(0);
    expect(model.networkFeeds).toHaveLength(3);
    expect(model.partnerStrip.length).toBeGreaterThan(0);
    expect(model.opportunityRail.map((item) => item.kind)).toEqual([
      'conference',
      'grant',
      'school',
    ]);
    expect(model.opportunityRail.map((item) => item.title)).toEqual([
      'Seoul Number Theory Forum 2026',
      'Asiamath 2026 Travel Grant',
      'Asia-Pacific Research School in Algebraic Geometry',
    ]);
    expect(model.prizeTeaser.items[0]).toEqual({
      label: 'Asiamath Early Career Prize 2026',
      meta: '2026 cycle · Selection process',
    });
    expect(model.outreachTeaser.links[0]).toEqual({
      label: 'Tokyo Public Lecture: Moduli After the Workshop',
      description:
        'A public lecture that extends workshop themes into an open audience programme hosted with regional partners in Tokyo.',
      href: '/outreach',
    });
    expect(model.networkFeeds[0]).toEqual({
      kind: 'Newsletter',
      href: '/newsletter',
      items: [
        {
          title: 'Asiamath Monthly Briefing — April 2026',
          meta: 'April 2026 issue',
          summary:
            'Workshop deadlines, school announcements, and partner updates from across the current Asiamath cycle.',
          href: '/newsletter',
        },
        {
          title: 'Research Mobility Digest — March 2026',
          meta: 'March 2026 digest',
          summary:
            'Mobility funding notes, application reminders, and regional participation guidance for early-career researchers.',
          href: '/newsletter',
        },
        {
          title: 'Summer School Bulletin — May 2026',
          meta: 'May 2026 bulletin',
          summary:
            'A forward look at the summer school schedule, mentor assignments, and coordinated participation notes.',
          href: '/newsletter',
        },
      ],
    });
    expect(model.networkFeeds[1]).toEqual({
      kind: 'Publication',
      href: '/publications',
      items: [
        {
          title: 'Algebraic Geometry School Notes',
          meta: 'School notes',
          summary:
            'Lecture notes and reading guidance from the 2026 algebraic geometry school, prepared for regional cohort use.',
          href: '/publications',
        },
        {
          title: 'Mobility and Collaboration Digest',
          meta: 'Research digest',
          summary:
            'A short-form digest connecting travel support, conference participation, and regional collaboration planning.',
          href: '/publications',
        },
        {
          title: 'Network Training Reader',
          meta: 'Teaching reader',
          summary:
            'A compact reader collecting lecture excerpts, exercise sets, and discussion prompts from the 2026 training programme.',
          href: '/publications',
        },
      ],
    });
    expect(model.networkFeeds[2]).toEqual({
      kind: 'Video',
      href: '/videos',
      items: [
        {
          title: 'Algebraic Geometry School Session Recap',
          meta: 'School recap',
          summary:
            'Recorded session highlights and speaker notes from the 2026 algebraic geometry training cohort.',
          href: '/videos',
        },
        {
          title: 'Travel Grant Application Explainer',
          meta: 'Grant explainer',
          summary:
            'A short guide to preparing a mobility application linked to an active conference or training call.',
          href: '/videos',
        },
        {
          title: 'Poster Session Highlight Reel',
          meta: 'Event highlights',
          summary:
            'A short reel capturing poster presentations, discussion rounds, and informal exchanges from the 2026 network meeting.',
          href: '/videos',
        },
      ],
    });
    expect(model.partnerStrip.map((item) => item.label)).toEqual([
      'National University of Singapore',
      'Indian Statistical Institute',
      'Academia Sinica',
      'Tsinghua University',
    ]);
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
        id: 'school-archived',
        slug: 'archived-school',
        title: 'Archived School',
        locationText: 'Taipei',
        startDate: '2025-01-12',
        shortLabel: 'School',
        ctaLabel: 'View school',
        summary: 'Archived school summary',
        travelSupportAvailable: false,
      },
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
    expect(model.opportunityRail.map((item) => item.title)).toEqual([
      'Upcoming Grant',
      'Future School',
    ]);
    expect(model.featuredOpportunities.map((item) => item.statusLabel)).toEqual([
      'Open',
      'Upcoming',
    ]);
    expect(model.summary.openSchools).toBe(1);
    expect(model.summary.openOpportunities).toBe(2);
    expect(model.schoolSpotlights.map((item) => item.title)).toEqual(['Future School']);
    expect(model.schoolSpotlights.map((item) => item.statusLabel)).toEqual(['Upcoming']);
  });

  it('degrades supporting sections independently when a supporting provider rejects', async () => {
    prizeProvider.listPublicPrizes = async () => {
      throw new Error('prize provider unavailable');
    };
    newsletterProvider.listPublicIssues = async () => {
      throw new Error('newsletter provider unavailable');
    };

    const model = await loadPortalHomepageViewModel();

    expect(model.heroFeature).not.toBeNull();
    expect(model.featuredOpportunities.length).toBeGreaterThan(0);
    expect(model.opportunityRail.length).toBeGreaterThan(0);
    expect(model.schoolSpotlights.length).toBeGreaterThan(0);
    expect(model.scholarTeaser.scholars.length).toBeGreaterThan(0);
    expect(model.prizeTeaser.items).toEqual([]);
    expect(model.outreachTeaser.links.length).toBeGreaterThan(0);
    expect(model.partnerStrip.length).toBeGreaterThan(0);
    expect(model.networkFeeds).toEqual([
      {
        kind: 'Publication',
        href: '/publications',
        items: [
          {
            title: 'Algebraic Geometry School Notes',
            meta: 'School notes',
            summary:
              'Lecture notes and reading guidance from the 2026 algebraic geometry school, prepared for regional cohort use.',
            href: '/publications',
          },
          {
            title: 'Mobility and Collaboration Digest',
            meta: 'Research digest',
            summary:
              'A short-form digest connecting travel support, conference participation, and regional collaboration planning.',
            href: '/publications',
          },
          {
            title: 'Network Training Reader',
            meta: 'Teaching reader',
            summary:
              'A compact reader collecting lecture excerpts, exercise sets, and discussion prompts from the 2026 training programme.',
            href: '/publications',
          },
        ],
      },
      {
        kind: 'Video',
        href: '/videos',
        items: [
          {
            title: 'Algebraic Geometry School Session Recap',
            meta: 'School recap',
            summary:
              'Recorded session highlights and speaker notes from the 2026 algebraic geometry training cohort.',
            href: '/videos',
          },
          {
            title: 'Travel Grant Application Explainer',
            meta: 'Grant explainer',
            summary:
              'A short guide to preparing a mobility application linked to an active conference or training call.',
            href: '/videos',
          },
          {
            title: 'Poster Session Highlight Reel',
            meta: 'Event highlights',
            summary:
              'A short reel capturing poster presentations, discussion rounds, and informal exchanges from the 2026 network meeting.',
            href: '/videos',
          },
        ],
      },
    ]);
  });
});
