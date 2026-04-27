import { conferenceProvider } from '../conference/conferenceProvider';
import type { ConferenceListItem } from '../conference/types';
import { grantProvider } from '../grant/grantProvider';
import type { GrantListItem } from '../grant/types';
import { newsletterProvider } from '../newsletter/newsletterProvider';
import { outreachProvider } from '../outreach/outreachProvider';
import { partnerProvider } from '../partner/partnerProvider';
import { scholarDirectoryProvider } from '../profile/scholarDirectoryProvider';
import type { PublicScholarSummary, ScholarExpertiseCluster } from '../profile/types';
import { prizeProvider } from '../prize/prizeProvider';
import { publicationProvider } from '../publication/publicationProvider';
import { schoolProvider } from '../school/schoolProvider';
import type { SchoolListItem } from '../school/types';
import { videoProvider } from '../video/videoProvider';

type OpportunityKind = 'conference' | 'grant' | 'school';
type HomepageOpportunityState = 'Open' | 'Upcoming' | 'Closed';

export type PortalOpportunityStory = {
  kind: OpportunityKind;
  href: string;
  title: string;
  location: string;
  dateLabel: string;
  statusLabel: 'Open' | 'Upcoming';
  summary: string;
};

export type PortalHeroFeature = PortalOpportunityStory & {
  eyebrow: string;
  callout: string;
  supportLink?: {
    href: string;
    label: string;
  };
};

export type FeaturedOpportunityCard = PortalOpportunityStory & {
  kind: 'conference' | 'grant';
};

export type FeaturedSchoolSpotlight = PortalOpportunityStory & {
  kind: 'school';
  travelSupportAvailable: boolean;
  supportLabel: string;
};

export type PortalOpportunityRailCard = PortalOpportunityStory & {
  supportLabel?: string;
};

export type PortalNetworkFeed = {
  kind: 'Newsletter' | 'Publication' | 'Video';
  href: string;
  items: Array<{
    title: string;
    meta: string;
    summary: string;
    href: string;
  }>;
};

export type PortalHomepageViewModel = {
  summary: {
    openConferences: number;
    openGrants: number;
    openSchools: number;
    openOpportunities: number;
    memberInstitutions: number;
    countries: number;
    scholarsInNetwork: number;
    note: string;
  };
  heroFeature: PortalHeroFeature | null;
  featuredOpportunities: FeaturedOpportunityCard[];
  opportunityRail: PortalOpportunityRailCard[];
  schoolSpotlights: FeaturedSchoolSpotlight[];
  scholarTeaser: {
    clusters: ScholarExpertiseCluster[];
    scholars: PublicScholarSummary[];
  };
  prizeTeaser: {
    title: string;
    summary: string;
    href: string;
    items: Array<{
      label: string;
      meta: string;
    }>;
  };
  outreachTeaser: {
    title: string;
    summary: string;
    href: string;
    links: Array<{
      label: string;
      description: string;
      href: string;
    }>;
  };
  networkFeeds: PortalNetworkFeed[];
  partnerStrip: Array<{
    label: string;
    href: string;
  }>;
};

const formatDateLabel = (start: string | null, end?: string | null) => {
  if (!start) {
    return 'Date to be announced';
  }

  const startDate = new Date(start);

  if (!end) {
    return startDate.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }

  const endDate = new Date(end);

  return `${startDate.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  })} - ${endDate.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })}`;
};

const formatDeadlineLabel = (deadline: string | null) => {
  if (!deadline) {
    return 'Deadline to be announced';
  }

  return `Deadline ${new Date(deadline).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })}`;
};

const hasDatePassed = (value: string | null) => {
  if (!value) {
    return false;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.valueOf())) {
    return false;
  }

  return parsed.getTime() < Date.now();
};

const getConferenceHomepageState = (
  conference: ConferenceListItem
): HomepageOpportunityState => {
  if (conference.status === 'closed') {
    return 'Closed';
  }

  if (conference.isApplicationOpen) {
    return 'Open';
  }

  if (hasDatePassed(conference.applicationDeadline ?? conference.startDate)) {
    return 'Closed';
  }

  return 'Upcoming';
};

const getGrantHomepageState = (grant: GrantListItem): HomepageOpportunityState => {
  if (grant.status === 'closed') {
    return 'Closed';
  }

  if (grant.isApplicationOpen) {
    return 'Open';
  }

  if (hasDatePassed(grant.applicationDeadline)) {
    return 'Closed';
  }

  return 'Upcoming';
};

const getSchoolHomepageState = (school: SchoolListItem): HomepageOpportunityState => {
  if (hasDatePassed(school.startDate)) {
    return 'Closed';
  }

  return 'Upcoming';
};

const resolveGrantLocation = ({
  grant,
  conferences,
  schools,
}: {
  grant: GrantListItem;
  conferences: ConferenceListItem[];
  schools: SchoolListItem[];
}) => {
  if (grant.linkedOpportunityType === 'conference') {
    return (
      conferences.find((conference) => conference.id === grant.linkedOpportunityId)?.locationText ??
      'Network-wide support'
    );
  }

  return (
    schools.find((school) => school.id === grant.linkedOpportunityId)?.locationText ??
    grant.linkedOpportunityTitle ??
    'Regional cohort'
  );
};

const toConferenceStory = (
  conference: ConferenceListItem,
  statusLabel: 'Open' | 'Upcoming'
): FeaturedOpportunityCard => ({
  kind: 'conference',
  href: `/conferences/${conference.slug}`,
  title: conference.title,
  location: conference.locationText ?? 'Location to be announced',
  dateLabel: formatDateLabel(conference.startDate, conference.endDate),
  statusLabel,
  summary:
    'A public conference call anchoring current research exchange, mobility support, and cross-border collaboration across the network.',
});

const toGrantStory = ({
  grant,
  conferences,
  schools,
  statusLabel,
}: {
  grant: GrantListItem;
  conferences: ConferenceListItem[];
  schools: SchoolListItem[];
  statusLabel: 'Open' | 'Upcoming';
}): FeaturedOpportunityCard => ({
  kind: 'grant',
  href: `/grants/${grant.slug}`,
  title: grant.title,
  location: resolveGrantLocation({ grant, conferences, schools }),
  dateLabel: formatDeadlineLabel(grant.applicationDeadline),
  statusLabel,
  summary:
    'Mobility support that keeps public opportunities connected to participation, not isolated from the programmes they enable.',
});

const toSchoolStory = (
  school: SchoolListItem,
  statusLabel: 'Upcoming'
): FeaturedSchoolSpotlight => ({
  kind: 'school',
  href: `/schools/${school.slug}`,
  title: school.title,
  location: school.locationText ?? 'Regional cohort',
  dateLabel: formatDateLabel(school.startDate),
  statusLabel,
  summary: school.summary,
  travelSupportAvailable: school.travelSupportAvailable,
  supportLabel: school.travelSupportAvailable
    ? 'Travel support available'
    : 'Travel support to be announced',
});

const buildHeroFeature = ({
  featuredConference,
  featuredConferenceState,
  featuredGrant,
  featuredGrantState,
  featuredSchool,
  conferences,
  schools,
}: {
  featuredConference: ConferenceListItem | undefined;
  featuredConferenceState?: 'Open' | 'Upcoming';
  featuredGrant: GrantListItem | undefined;
  featuredGrantState?: 'Open' | 'Upcoming';
  featuredSchool: SchoolListItem | undefined;
  conferences: ConferenceListItem[];
  schools: SchoolListItem[];
}): PortalHeroFeature | null => {
  const callout =
    'Programme details, linked travel support, and related training pathways are available from this call.';

  if (featuredConference && featuredConferenceState) {
    return {
      ...toConferenceStory(featuredConference, featuredConferenceState),
      eyebrow: 'Featured conference',
      callout,
      supportLink: featuredGrant
        ? {
            href: `/grants/${featuredGrant.slug}`,
            label: 'View linked travel support',
          }
        : undefined,
    };
  }

  if (featuredGrant && featuredGrantState) {
    return {
      ...toGrantStory({
        grant: featuredGrant,
        conferences,
        schools,
        statusLabel: featuredGrantState,
      }),
      eyebrow: 'Featured grant',
      callout,
    };
  }

  if (featuredSchool) {
    return {
      ...toSchoolStory(featuredSchool, 'Upcoming'),
      eyebrow: 'Featured school',
      callout,
    };
  }

  return null;
};

const resolveSupportingResult = <T>(result: PromiseSettledResult<T>, fallback: T): T =>
  result.status === 'fulfilled' ? result.value : fallback;

const toNetworkFeedItem = ({
  title,
  meta,
  summary,
  href,
}: {
  title: string;
  meta: string;
  summary: string;
  href: string;
}) => ({
  title,
  meta,
  summary,
  href,
});

export const loadPortalHomepageViewModel = async (): Promise<PortalHomepageViewModel> => {
  const [conferences, grants, schools, scholarDirectory] = await Promise.all([
    conferenceProvider.listPublicConferences(),
    grantProvider.listPublicGrants(),
    schoolProvider.listPublicSchools(),
    scholarDirectoryProvider.getDirectoryViewModel(),
  ]);

  const [
    prizesResult,
    partnersResult,
    outreachProgramsResult,
    newslettersResult,
    publicationsResult,
    videosResult,
  ] = await Promise.allSettled([
    prizeProvider.listPublicPrizes(),
    partnerProvider.listPublicPartners(),
    outreachProvider.listPublicPrograms(),
    newsletterProvider.listPublicIssues(),
    publicationProvider.listPublications(),
    videoProvider.listPublicVideos(),
  ]);

  const prizes = resolveSupportingResult(prizesResult, []);
  const partners = resolveSupportingResult(partnersResult, []);
  const outreachPrograms = resolveSupportingResult(outreachProgramsResult, []);
  const newsletters = resolveSupportingResult(newslettersResult, []);
  const publications = resolveSupportingResult(publicationsResult, []);
  const videos = resolveSupportingResult(videosResult, []);

  const visibleConferences = conferences
    .map((conference) => ({
      conference,
      statusLabel: getConferenceHomepageState(conference),
    }))
    .filter(
      (
        item
      ): item is {
        conference: ConferenceListItem;
        statusLabel: 'Open' | 'Upcoming';
      } => item.statusLabel !== 'Closed'
    );

  const visibleGrants = grants
    .map((grant) => ({
      grant,
      statusLabel: getGrantHomepageState(grant),
    }))
    .filter(
      (
        item
      ): item is {
        grant: GrantListItem;
        statusLabel: 'Open' | 'Upcoming';
      } => item.statusLabel !== 'Closed'
    );

  const visibleSchools = schools
    .map((school) => ({
      school,
      statusLabel: getSchoolHomepageState(school),
    }))
    .filter(
      (
        item
      ): item is {
        school: SchoolListItem;
        statusLabel: 'Upcoming';
      } => item.statusLabel !== 'Closed'
    );

  const featuredConference = visibleConferences[0];
  const featuredGrant = visibleGrants[0];
  const featuredSchool = visibleSchools[0];

  const featuredCards: FeaturedOpportunityCard[] = [];
  if (featuredConference) {
    featuredCards.push(
      toConferenceStory(featuredConference.conference, featuredConference.statusLabel)
    );
  }
  if (featuredGrant) {
    featuredCards.push(
      toGrantStory({
        grant: featuredGrant.grant,
        conferences,
        schools,
        statusLabel: featuredGrant.statusLabel,
      })
    );
  }

  const schoolSpotlights = visibleSchools
    .slice(0, 2)
    .map((item) => toSchoolStory(item.school, item.statusLabel));
  const additionalConferenceCards = visibleConferences
    .slice(1, 2)
    .map((item) => toConferenceStory(item.conference, item.statusLabel));
  const grantRailCards = featuredGrant
    ? [
        toGrantStory({
          grant: featuredGrant.grant,
          conferences,
          schools,
          statusLabel: featuredGrant.statusLabel,
        }),
      ]
    : [];
  const opportunityRail = [...additionalConferenceCards, ...grantRailCards, ...schoolSpotlights].slice(
    0,
    3
  );
  const openConferences = conferences.filter((item) => item.isApplicationOpen).length;
  const openGrants = grants.filter((item) => item.isApplicationOpen).length;
  const openSchools = visibleSchools.length;
  const networkFeeds: PortalNetworkFeed[] = [
    {
      kind: 'Newsletter' as const,
      href: '/newsletter',
      items: newsletters.slice(0, 3).map((item) =>
        toNetworkFeedItem({
          title: item.title,
          meta: item.issueLabel,
          summary: item.summary,
          href: '/newsletter',
        })
      ),
    },
    {
      kind: 'Publication' as const,
      href: '/publications',
      items: publications.slice(0, 3).map((item) =>
        toNetworkFeedItem({
          title: item.title,
          meta: item.seriesLabel,
          summary: item.summary,
          href: '/publications',
        })
      ),
    },
    {
      kind: 'Video' as const,
      href: '/videos',
      items: videos.slice(0, 3).map((item) =>
        toNetworkFeedItem({
          title: item.title,
          meta: item.seriesLabel,
          summary: item.summary,
          href: '/videos',
        })
      ),
    },
  ].filter((feed) => feed.items.length > 0);

  return {
    summary: {
      openConferences,
      openGrants,
      openSchools,
      openOpportunities: openConferences + openGrants + openSchools,
      memberInstitutions: 38,
      countries: 12,
      scholarsInNetwork: 840,
      note: 'Current cycle includes the Singapore workshop, linked travel support, and July training cohorts.',
    },
    heroFeature: buildHeroFeature({
      featuredConference: featuredConference?.conference,
      featuredConferenceState: featuredConference?.statusLabel,
      featuredGrant: featuredGrant?.grant,
      featuredGrantState: featuredGrant?.statusLabel,
      featuredSchool: featuredSchool?.school,
      conferences,
      schools,
    }),
    featuredOpportunities: featuredCards.slice(0, 2),
    opportunityRail,
    schoolSpotlights,
    scholarTeaser: {
      clusters: scholarDirectory.clusters.slice(0, 4),
      scholars: scholarDirectory.scholars.slice(0, 3),
    },
    prizeTeaser: {
      title: 'Prize archive & nominations',
      summary:
        'Current and recent prize cycles across the network, with public-facing records of recognition and committee release.',
      href: '/prizes',
      items: prizes.slice(0, 3).map((item) => ({
        label: item.title,
        meta: `${item.cycleLabel} · ${item.stageLabel}`,
      })),
    },
    outreachTeaser: {
      title: 'Outreach & engagement',
      summary:
        'Public lectures, school visits, and classroom-facing programmes extend network activity beyond the application cycle.',
      href: '/outreach',
      links: outreachPrograms.slice(0, 3).map((item) => ({
        label: item.title,
        description: item.summary,
        href: '/outreach',
      })),
    },
    networkFeeds,
    partnerStrip: partners.slice(0, 4).map((item) => ({
      label: item.title,
      href: '/partners',
    })),
  };
};
