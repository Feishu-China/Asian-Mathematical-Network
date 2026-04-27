import { conferenceProvider } from '../conference/conferenceProvider';
import type { ConferenceListItem } from '../conference/types';
import { grantProvider } from '../grant/grantProvider';
import type { GrantListItem } from '../grant/types';
import { scholarDirectoryProvider } from '../profile/scholarDirectoryProvider';
import type { PublicScholarSummary, ScholarExpertiseCluster } from '../profile/types';
import { schoolProvider } from '../school/schoolProvider';
import type { SchoolListItem } from '../school/types';

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
  networkStories: Array<{
    kind: 'Newsletter' | 'Publication' | 'Video';
    title: string;
    meta: string;
    summary: string;
    href: string;
  }>;
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

const getSchoolHomepageState = (): 'Upcoming' => 'Upcoming';

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

const toSchoolStory = (school: SchoolListItem): FeaturedSchoolSpotlight => ({
  kind: 'school',
  href: `/schools/${school.slug}`,
  title: school.title,
  location: school.locationText ?? 'Regional cohort',
  dateLabel: formatDateLabel(school.startDate),
  statusLabel: getSchoolHomepageState(),
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
  if (featuredConference && featuredConferenceState) {
    return {
      ...toConferenceStory(featuredConference, featuredConferenceState),
      eyebrow: 'Featured conference',
      callout:
        'Use the conference page to assess fit, then continue through grants or school pathways where mobility support is relevant.',
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
      callout:
        'Mobility support remains visible as part of the public network story instead of being buried inside the application flow.',
    };
  }

  if (featuredSchool) {
    return {
      ...toSchoolStory(featuredSchool),
      eyebrow: 'Featured school',
      callout:
        'Schools stay within the main opportunities narrative so training, mentoring, and exchange read as part of one network.',
    };
  }

  return null;
};

export const loadPortalHomepageViewModel = async (): Promise<PortalHomepageViewModel> => {
  const [conferences, grants, schools, scholarDirectory] = await Promise.all([
    conferenceProvider.listPublicConferences(),
    grantProvider.listPublicGrants(),
    schoolProvider.listPublicSchools(),
    scholarDirectoryProvider.getDirectoryViewModel(),
  ]);

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

  const featuredConference = visibleConferences[0];
  const featuredGrant = visibleGrants[0];
  const featuredSchool = schools[0];

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

  const schoolSpotlights = schools.slice(0, 2).map(toSchoolStory);
  const openConferences = conferences.filter((item) => item.isApplicationOpen).length;
  const openGrants = grants.filter((item) => item.isApplicationOpen).length;
  const openSchools = schools.length;

  return {
    summary: {
      openConferences,
      openGrants,
      openSchools,
      openOpportunities: openConferences + openGrants + openSchools,
      memberInstitutions: 38,
      countries: 12,
      scholarsInNetwork: 840,
      note: 'Travel support, conferences, and cohort-based schools are edited together here so the homepage reads like a network, not a module index.',
    },
    heroFeature: buildHeroFeature({
      featuredConference: featuredConference?.conference,
      featuredConferenceState: featuredConference?.statusLabel,
      featuredGrant: featuredGrant?.grant,
      featuredGrantState: featuredGrant?.statusLabel,
      featuredSchool,
      conferences,
      schools,
    }),
    featuredOpportunities: featuredCards.slice(0, 2),
    schoolSpotlights,
    scholarTeaser: {
      clusters: scholarDirectory.clusters.slice(0, 4),
      scholars: scholarDirectory.scholars.slice(0, 3),
    },
    prizeTeaser: {
      title: 'Prize archive & nominations',
      summary:
        'Recognition pages should show how the network remembers scholarship, teaching, and long-form contribution beyond the active call cycle.',
      href: '/prizes',
      items: [
        {
          label: 'Asiamath Prize in Pure Mathematics',
          meta: '2026 nomination cycle',
        },
        {
          label: 'Prize for Mathematics Education',
          meta: 'Archive preview',
        },
        {
          label: 'Regional Collaboration Citation',
          meta: 'Editorial placeholder',
        },
      ],
    },
    outreachTeaser: {
      title: 'Outreach & engagement',
      summary:
        'Public-facing programmes can extend the network beyond applications through lectures, school-facing work, and media circulation.',
      href: '/outreach',
      links: [
        {
          label: 'Public lecture series',
          description: 'Preview how community programmes sit alongside the research-facing network.',
          href: '/outreach',
        },
        {
          label: 'School-facing pathways',
          description: 'Connect scholar expertise to classrooms and early talent pipelines.',
          href: '/outreach',
        },
        {
          label: 'Media recap samples',
          description: 'Bridge outreach activity into videos, newsletters, and public memory.',
          href: '/videos',
        },
      ],
    },
    networkStories: [
      {
        kind: 'Newsletter',
        title: 'Network update: new mobility round and member-institution notes',
        meta: 'Newsletter · Editorial preview',
        summary:
          'A homepage feed can surface public reporting, not only application funnels, so visitors understand the network as a living scholarly system.',
        href: '/newsletter',
      },
      {
        kind: 'Publication',
        title: 'Regional training note: how schools support early-career mathematical exchange',
        meta: 'Publication · Placeholder feature',
        summary:
          'Schools, grants, and scholar profiles can resolve into durable public documentation rather than disappearing after the call closes.',
        href: '/publications',
      },
      {
        kind: 'Video',
        title: 'Asiamath conversations: collaboration, mobility, and research communities',
        meta: 'Video · Sample archive',
        summary:
          'Video and recap content give the homepage a stronger editorial afterlife beyond the current application window.',
        href: '/videos',
      },
    ],
    partnerStrip: [
      { label: 'University of Tokyo', href: '/partners' },
      { label: 'Academia Sinica', href: '/partners' },
      { label: 'National University of Singapore', href: '/partners' },
      { label: 'Tsinghua University', href: '/partners' },
      { label: 'Indian Statistical Institute', href: '/partners' },
      { label: 'Seoul National University', href: '/partners' },
    ],
  };
};
