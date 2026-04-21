import type { PrismaClient } from '@prisma/client';

export const DEMO_BASELINE_FIXTURE = {
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

export const ensureDemoBaseline = async (prisma: PrismaClient) => {
  const creator = await prisma.user.upsert({
    where: { email: DEMO_BASELINE_FIXTURE.creatorEmail },
    update: {},
    create: {
      email: DEMO_BASELINE_FIXTURE.creatorEmail,
      passwordHash: 'hash',
      status: 'active',
    },
  });

  const conference = await prisma.conference.upsert({
    where: { slug: DEMO_BASELINE_FIXTURE.conferenceSlug },
    update: {
      title: DEMO_BASELINE_FIXTURE.conferenceTitle,
      shortName: 'AM2026',
      locationText: 'Singapore',
      startDate: '2026-08-10',
      endDate: '2026-08-14',
      description: 'Conference fixture used for GRANT real integration checks.',
      applicationDeadline: new Date('2026-07-15T23:59:59Z'),
      status: 'published',
      applicationFormSchemaJson: JSON.stringify({
        fields: DEMO_BASELINE_FIXTURE.conferenceFormFields,
      }),
      settingsJson: JSON.stringify({}),
      publishedAt: new Date('2026-04-20T10:00:00Z'),
      closedAt: null,
      createdByUserId: creator.id,
    },
    create: {
      slug: DEMO_BASELINE_FIXTURE.conferenceSlug,
      title: DEMO_BASELINE_FIXTURE.conferenceTitle,
      shortName: 'AM2026',
      locationText: 'Singapore',
      startDate: '2026-08-10',
      endDate: '2026-08-14',
      description: 'Conference fixture used for GRANT real integration checks.',
      applicationDeadline: new Date('2026-07-15T23:59:59Z'),
      status: 'published',
      applicationFormSchemaJson: JSON.stringify({
        fields: DEMO_BASELINE_FIXTURE.conferenceFormFields,
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
    where: { slug: DEMO_BASELINE_FIXTURE.grantSlug },
    update: {
      linkedConferenceId: conference.id,
      title: DEMO_BASELINE_FIXTURE.grantTitle,
      grantType: 'conference_travel_grant',
      description: 'Partial travel support for accepted participants.',
      eligibilitySummary: 'Open to eligible conference applicants.',
      coverageSummary: 'Partial airfare and accommodation support.',
      applicationDeadline: new Date('2026-06-05T23:59:59Z'),
      status: 'published',
      reportRequired: true,
      applicationFormSchemaJson: JSON.stringify({
        fields: DEMO_BASELINE_FIXTURE.grantFormFields,
      }),
      settingsJson: JSON.stringify({}),
      publishedAt: new Date('2026-04-22T12:00:00Z'),
      closedAt: null,
      createdByUserId: creator.id,
    },
    create: {
      linkedConferenceId: conference.id,
      slug: DEMO_BASELINE_FIXTURE.grantSlug,
      title: DEMO_BASELINE_FIXTURE.grantTitle,
      grantType: 'conference_travel_grant',
      description: 'Partial travel support for accepted participants.',
      eligibilitySummary: 'Open to eligible conference applicants.',
      coverageSummary: 'Partial airfare and accommodation support.',
      applicationDeadline: new Date('2026-06-05T23:59:59Z'),
      status: 'published',
      reportRequired: true,
      applicationFormSchemaJson: JSON.stringify({
        fields: DEMO_BASELINE_FIXTURE.grantFormFields,
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

export const cleanupDemoBaseline = async (prisma: PrismaClient) => {
  await prisma.applicationStatusHistory.deleteMany({
    where: {
      application: {
        OR: [
          { conference: { slug: DEMO_BASELINE_FIXTURE.conferenceSlug } },
          { grant: { slug: DEMO_BASELINE_FIXTURE.grantSlug } },
        ],
      },
    },
  });

  await prisma.application.deleteMany({
    where: {
      OR: [
        { conference: { slug: DEMO_BASELINE_FIXTURE.conferenceSlug } },
        { grant: { slug: DEMO_BASELINE_FIXTURE.grantSlug } },
      ],
    },
  });

  await prisma.grantOpportunity.deleteMany({
    where: { slug: DEMO_BASELINE_FIXTURE.grantSlug },
  });

  await prisma.conference.deleteMany({
    where: { slug: DEMO_BASELINE_FIXTURE.conferenceSlug },
  });

  await prisma.user.deleteMany({
    where: { email: DEMO_BASELINE_FIXTURE.creatorEmail },
  });
};
