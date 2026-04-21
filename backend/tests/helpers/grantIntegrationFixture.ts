import type { PrismaClient } from '@prisma/client';

export const GRANT_INTEGRATION_FIXTURE = {
  creatorEmail: 'grant.integration.creator@example.com',
  conferenceSlug: 'integration-grant-conf-2026',
  grantSlug: 'integration-grant-2026-travel-support',
  conferenceTitle: 'Integration Grant Conference 2026',
  grantTitle: 'Integration Grant 2026 Travel Support',
  conferenceFormFields: [
    { key: 'participation_type', type: 'select', required: true },
    { key: 'statement', type: 'textarea', required: true },
    { key: 'abstract_title', type: 'text', required: false },
    { key: 'abstract_text', type: 'textarea', required: false },
    { key: 'interested_in_travel_support', type: 'checkbox', required: false },
  ],
  grantFormFields: [
    { key: 'linked_conference_application_id', type: 'select', required: true },
    { key: 'statement', type: 'textarea', required: true },
    { key: 'travel_plan_summary', type: 'textarea', required: true },
    { key: 'funding_need_summary', type: 'textarea', required: true },
  ],
} as const;

export const ensureGrantIntegrationFixture = async (prisma: PrismaClient) => {
  const creator = await prisma.user.upsert({
    where: { email: GRANT_INTEGRATION_FIXTURE.creatorEmail },
    update: {},
    create: {
      email: GRANT_INTEGRATION_FIXTURE.creatorEmail,
      passwordHash: 'hash',
      status: 'active',
    },
  });

  const conference = await prisma.conference.upsert({
    where: { slug: GRANT_INTEGRATION_FIXTURE.conferenceSlug },
    update: {
      title: GRANT_INTEGRATION_FIXTURE.conferenceTitle,
      shortName: 'AM2026',
      locationText: 'Singapore',
      startDate: '2026-08-10',
      endDate: '2026-08-14',
      description: 'Conference fixture used for GRANT real integration checks.',
      applicationDeadline: new Date('2026-07-15T23:59:59Z'),
      status: 'published',
      applicationFormSchemaJson: JSON.stringify({
        fields: GRANT_INTEGRATION_FIXTURE.conferenceFormFields,
      }),
      settingsJson: JSON.stringify({}),
      publishedAt: new Date('2026-04-20T10:00:00Z'),
      closedAt: null,
      createdByUserId: creator.id,
    },
    create: {
      slug: GRANT_INTEGRATION_FIXTURE.conferenceSlug,
      title: GRANT_INTEGRATION_FIXTURE.conferenceTitle,
      shortName: 'AM2026',
      locationText: 'Singapore',
      startDate: '2026-08-10',
      endDate: '2026-08-14',
      description: 'Conference fixture used for GRANT real integration checks.',
      applicationDeadline: new Date('2026-07-15T23:59:59Z'),
      status: 'published',
      applicationFormSchemaJson: JSON.stringify({
        fields: GRANT_INTEGRATION_FIXTURE.conferenceFormFields,
      }),
      settingsJson: JSON.stringify({}),
      publishedAt: new Date('2026-04-20T10:00:00Z'),
      createdByUserId: creator.id,
      staff: {
        create: {
          userId: creator.id,
          staffRole: 'owner',
        },
      },
    },
  });

  await prisma.conferenceStaff.upsert({
    where: {
      conferenceId_userId: {
        conferenceId: conference.id,
        userId: creator.id,
      },
    },
    update: {
      staffRole: 'owner',
    },
    create: {
      conferenceId: conference.id,
      userId: creator.id,
      staffRole: 'owner',
    },
  });

  const grant = await prisma.grantOpportunity.upsert({
    where: { slug: GRANT_INTEGRATION_FIXTURE.grantSlug },
    update: {
      linkedConferenceId: conference.id,
      title: GRANT_INTEGRATION_FIXTURE.grantTitle,
      grantType: 'conference_travel_grant',
      description: 'Partial travel support for accepted participants.',
      eligibilitySummary: 'Open to eligible conference applicants.',
      coverageSummary: 'Partial airfare and accommodation support.',
      applicationDeadline: new Date('2026-06-05T23:59:59Z'),
      status: 'published',
      reportRequired: true,
      applicationFormSchemaJson: JSON.stringify({
        fields: GRANT_INTEGRATION_FIXTURE.grantFormFields,
      }),
      settingsJson: JSON.stringify({}),
      publishedAt: new Date('2026-04-22T12:00:00Z'),
      closedAt: null,
      createdByUserId: creator.id,
    },
    create: {
      linkedConferenceId: conference.id,
      slug: GRANT_INTEGRATION_FIXTURE.grantSlug,
      title: GRANT_INTEGRATION_FIXTURE.grantTitle,
      grantType: 'conference_travel_grant',
      description: 'Partial travel support for accepted participants.',
      eligibilitySummary: 'Open to eligible conference applicants.',
      coverageSummary: 'Partial airfare and accommodation support.',
      applicationDeadline: new Date('2026-06-05T23:59:59Z'),
      status: 'published',
      reportRequired: true,
      applicationFormSchemaJson: JSON.stringify({
        fields: GRANT_INTEGRATION_FIXTURE.grantFormFields,
      }),
      settingsJson: JSON.stringify({}),
      publishedAt: new Date('2026-04-22T12:00:00Z'),
      createdByUserId: creator.id,
    },
  });

  return {
    creator,
    conference,
    grant,
  };
};

export const cleanupGrantIntegrationFixture = async (prisma: PrismaClient) => {
  await prisma.applicationStatusHistory.deleteMany({
    where: {
      application: {
        OR: [
          { conference: { slug: GRANT_INTEGRATION_FIXTURE.conferenceSlug } },
          { grant: { slug: GRANT_INTEGRATION_FIXTURE.grantSlug } },
        ],
      },
    },
  });

  await prisma.application.deleteMany({
    where: {
      OR: [
        { conference: { slug: GRANT_INTEGRATION_FIXTURE.conferenceSlug } },
        { grant: { slug: GRANT_INTEGRATION_FIXTURE.grantSlug } },
      ],
    },
  });

  await prisma.grantOpportunity.deleteMany({
    where: { slug: GRANT_INTEGRATION_FIXTURE.grantSlug },
  });

  await prisma.conference.deleteMany({
    where: { slug: GRANT_INTEGRATION_FIXTURE.conferenceSlug },
  });

  await prisma.user.deleteMany({
    where: { email: GRANT_INTEGRATION_FIXTURE.creatorEmail },
  });
};
