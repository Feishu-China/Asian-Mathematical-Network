import { conferenceProvider } from '../conference/conferenceProvider';
import { grantProvider } from '../grant/grantProvider';
import { scholarDirectoryProvider } from '../profile/scholarDirectoryProvider';
import type { PublicScholarSummary, ScholarExpertiseCluster } from '../profile/types';
import { schoolProvider } from '../school/schoolProvider';

export type FeaturedOpportunityCard = {
  kind: 'conference' | 'grant';
  href: string;
  title: string;
  location: string;
  dateLabel: string;
  statusLabel: 'Open' | 'Upcoming';
  summary: string;
};

export type FeaturedSchoolSpotlight = {
  href: string;
  title: string;
  location: string;
  summary: string;
  travelSupportAvailable: boolean;
};

export type PortalHomepageViewModel = {
  summary: {
    openConferences: number;
    openGrants: number;
    openSchools: number;
    note: string;
  };
  featuredOpportunities: FeaturedOpportunityCard[];
  schoolSpotlights: FeaturedSchoolSpotlight[];
  scholarTeaser: {
    clusters: ScholarExpertiseCluster[];
    scholars: PublicScholarSummary[];
  };
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

const resolveGrantLocation = ({
  grantOpportunityType,
  grantOpportunityId,
  grantOpportunityTitle,
  conferences,
  schools,
}: {
  grantOpportunityType: 'conference' | 'school';
  grantOpportunityId: string;
  grantOpportunityTitle: string | null;
  conferences: Awaited<ReturnType<typeof conferenceProvider.listPublicConferences>>;
  schools: Awaited<ReturnType<typeof schoolProvider.listPublicSchools>>;
}) => {
  if (grantOpportunityType === 'conference') {
    return (
      conferences.find((conference) => conference.id === grantOpportunityId)?.locationText ??
      'Network-wide support'
    );
  }

  return (
    schools.find((school) => school.id === grantOpportunityId)?.locationText ??
    grantOpportunityTitle ??
    'Regional cohort'
  );
};

export const loadPortalHomepageViewModel = async (): Promise<PortalHomepageViewModel> => {
  const [conferences, grants, schools, scholarDirectory] = await Promise.all([
    conferenceProvider.listPublicConferences(),
    grantProvider.listPublicGrants(),
    schoolProvider.listPublicSchools(),
    scholarDirectoryProvider.getDirectoryViewModel(),
  ]);

  const featuredCards: FeaturedOpportunityCard[] = [];
  const featuredConference = conferences[0];
  const featuredGrant = grants[0];

  if (featuredConference) {
    featuredCards.push({
      kind: 'conference',
      href: `/conferences/${featuredConference.slug}`,
      title: featuredConference.title,
      location: featuredConference.locationText ?? 'Location to be announced',
      dateLabel: formatDateLabel(featuredConference.startDate, featuredConference.endDate),
      statusLabel: featuredConference.isApplicationOpen ? 'Open' : 'Upcoming',
      summary: 'Published conference applications open across the network.',
    });
  }

  if (featuredGrant) {
    featuredCards.push({
      kind: 'grant',
      href: `/grants/${featuredGrant.slug}`,
      title: featuredGrant.title,
      location: resolveGrantLocation({
        grantOpportunityType: featuredGrant.linkedOpportunityType,
        grantOpportunityId: featuredGrant.linkedOpportunityId,
        grantOpportunityTitle: featuredGrant.linkedOpportunityTitle,
        conferences,
        schools,
      }),
      dateLabel: featuredGrant.applicationDeadline
        ? `Deadline ${new Date(featuredGrant.applicationDeadline).toLocaleDateString()}`
        : 'Deadline to be announced',
      statusLabel: featuredGrant.isApplicationOpen ? 'Open' : 'Upcoming',
      summary: 'Travel support for eligible participants attending network programmes.',
    });
  }

  return {
    summary: {
      openConferences: conferences.filter((item) => item.isApplicationOpen).length,
      openGrants: grants.filter((item) => item.isApplicationOpen).length,
      openSchools: schools.length,
      note: 'Travel support is available for eligible participants in selected programmes.',
    },
    featuredOpportunities: featuredCards.slice(0, 2),
    schoolSpotlights: schools.slice(0, 2).map((school) => ({
      href: `/schools/${school.slug}`,
      title: school.title,
      location: school.locationText ?? 'Regional cohort',
      summary: school.summary,
      travelSupportAvailable: school.travelSupportAvailable,
    })),
    scholarTeaser: {
      clusters: scholarDirectory.clusters.slice(0, 4),
      scholars: scholarDirectory.scholars.slice(0, 3),
    },
  };
};
