import bcrypt from 'bcryptjs';
import { Prisma } from '@prisma/client';
import type { PrismaClient } from '@prisma/client';
import { mapProfileRecord } from './profile';
import { ensureUserRole } from './userRoles';

export const DEMO_BASELINE_FIXTURE = {
  creatorEmail: 'demo.organizer@asiamath.org',
  creatorFullName: 'Mei-Lin Zhou',
  creatorPassword: 'demo123456',
  reviewerEmail: 'demo.reviewer@asiamath.org',
  reviewerFullName: 'Ravi Iyer',
  reviewerPassword: 'demo123456',
  applicantEmail: 'demo.applicant@asiamath.org',
  applicantFullName: 'Aisha Rahman',
  applicantPassword: 'demo123456',
  demoPassword: 'demo123456',
  conferenceSlug: 'integration-grant-conf-2026',
  grantSlug: 'integration-grant-2026-travel-support',
  conferenceTitle: 'Integration Grant Conference 2026',
  grantTitle: 'Integration Grant 2026 Travel Support',
  demoAccounts: {
    organizer: {
      label: 'Organizer',
      email: 'demo.organizer@asiamath.org',
      slug: 'mei-lin-zhou',
      fullName: 'Mei-Lin Zhou',
      title: 'Professor of Mathematics',
      institutionNameRaw: 'National University of Singapore',
      countryCode: 'SG',
      careerStage: 'faculty',
      bio: 'Conference owner for the Asiamath demo baseline. Uses the shared scholar profile to explain organizer context without expanding into a portal surface.',
      personalWebsite: 'https://example.org/scholars/mei-lin-zhou',
      researchKeywords: ['academic networks', 'algebraic combinatorics', 'regional collaboration'],
      mscCodes: [
        { code: '05E18', isPrimary: true },
        { code: '97A20', isPrimary: false },
      ],
      orcidId: '0000-0002-1400-1101',
      coiDeclarationText:
        'Internal only: owns the seeded conference and should not be used as a reviewer on the demo baseline.',
      isProfilePublic: false,
      verificationStatus: 'verified',
      verifiedAt: '2026-04-18T09:00:00.000Z',
      demoUse:
        'Use on /me/profile to explain the authenticated editor surface, hidden public route, and organizer-owned usage.',
    },
    reviewer: {
      label: 'Reviewer',
      email: 'demo.reviewer@asiamath.org',
      slug: 'ravi-iyer',
      fullName: 'Ravi Iyer',
      title: 'Associate Professor',
      institutionNameRaw: 'Indian Institute of Science',
      countryCode: 'IN',
      careerStage: 'faculty',
      bio: 'Public-facing reviewer-style scholar profile used to narrate reviewer sourcing and expert context in the demo without inventing a new object model.',
      personalWebsite: 'https://example.org/scholars/ravi-iyer',
      researchKeywords: ['harmonic analysis', 'partial differential equations', 'review panels'],
      mscCodes: [
        { code: '42B35', isPrimary: true },
        { code: '35Q55', isPrimary: false },
      ],
      orcidId: '0000-0003-2400-2202',
      coiDeclarationText:
        'Internal only: keep conflict notes private even when the public scholar page is enabled.',
      isProfilePublic: true,
      verificationStatus: 'verified',
      verifiedAt: '2026-04-18T09:30:00.000Z',
      demoUse:
        'Use on /scholars/:slug to show the polished public scholar page and explain reviewer/expert reuse.',
    },
    applicant: {
      label: 'Applicant',
      email: 'demo.applicant@asiamath.org',
      slug: 'aisha-rahman',
      fullName: 'Aisha Rahman',
      title: 'PhD Candidate',
      institutionNameRaw: 'University of Malaya',
      countryCode: 'MY',
      careerStage: 'phd',
      bio: 'Early-career researcher demo account for the shared profile backbone. Rich enough to prefill downstream application summaries and hand off cleanly to the public scholar page.',
      personalWebsite: 'https://example.org/scholars/aisha-rahman',
      researchKeywords: ['number theory', 'automorphic forms', 'women in mathematics'],
      mscCodes: [
        { code: '11F70', isPrimary: true },
        { code: '11B68', isPrimary: false },
      ],
      orcidId: '0000-0001-3400-3303',
      coiDeclarationText:
        'Internal only: no current conflicts declared for the seeded applicant walkthrough.',
      isProfilePublic: true,
      verificationStatus: 'pending_review',
      verifiedAt: null,
      demoUse:
        'Use on /me/profile first, then hand off to the same record at /scholars/:slug to explain the public/private boundary.',
    },
  },
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

type DemoAccountKey = keyof typeof DEMO_BASELINE_FIXTURE.demoAccounts;
type DemoAccountFixture = (typeof DEMO_BASELINE_FIXTURE.demoAccounts)[DemoAccountKey];
type DemoMscCode = {
  code: string;
  isPrimary: boolean;
};
type ProfileRecord = Prisma.ProfileGetPayload<{
  include: { mscCodes: true };
}>;

const DEMO_ACCOUNT_ENTRIES = Object.entries(DEMO_BASELINE_FIXTURE.demoAccounts) as Array<
  [DemoAccountKey, DemoAccountFixture]
>;

let demoPasswordHashPromise: Promise<string> | null = null;

const getDemoPasswordHash = () => {
  demoPasswordHashPromise ??= bcrypt.hash(DEMO_BASELINE_FIXTURE.demoPassword, 10);
  return demoPasswordHashPromise;
};

const replaceProfileMscCodes = async (
  prisma: PrismaClient,
  userId: string,
  mscCodes: readonly DemoMscCode[]
) => {
  await prisma.profileMscCode.deleteMany({
    where: { userId },
  });

  if (mscCodes.length < 1) {
    return;
  }

  await Promise.all(
    mscCodes.map((item) =>
      prisma.mscCode.upsert({
        where: { code: item.code },
        update: {},
        create: { code: item.code },
      })
    )
  );

  await prisma.profileMscCode.createMany({
    data: mscCodes.map((item) => ({
      userId,
      mscCode: item.code,
      isPrimary: item.isPrimary,
    })),
  });
};

const readProfileRecord = (prisma: PrismaClient, userId: string) =>
  prisma.profile.findUniqueOrThrow({
    where: { userId },
    include: { mscCodes: true },
  });

const ensureDemoAccountRoles = async (
  prisma: PrismaClient,
  userId: string,
  key: DemoAccountKey
) => {
  if (key === 'organizer') {
    await Promise.all([
      ensureUserRole(userId, 'applicant', prisma, true),
      ensureUserRole(userId, 'organizer', prisma),
    ]);
    return;
  }

  if (key === 'reviewer') {
    await Promise.all([
      ensureUserRole(userId, 'applicant', prisma, true),
      ensureUserRole(userId, 'reviewer', prisma),
    ]);
    return;
  }

  await ensureUserRole(userId, 'applicant', prisma, true);
};

const upsertDemoAccount = async (
  prisma: PrismaClient,
  key: DemoAccountKey,
  fixture: DemoAccountFixture
) => {
  const passwordHash = await getDemoPasswordHash();
  const verifiedAt = fixture.verifiedAt ? new Date(fixture.verifiedAt) : null;

  const user = await prisma.user.upsert({
    where: { email: fixture.email },
    update: {
      passwordHash,
      status: 'active',
    },
    create: {
      email: fixture.email,
      passwordHash,
      status: 'active',
    },
  });

  await prisma.profile.upsert({
    where: { userId: user.id },
    update: {
      slug: fixture.slug,
      fullName: fixture.fullName,
      title: fixture.title,
      institutionId: null,
      institutionNameRaw: fixture.institutionNameRaw,
      countryCode: fixture.countryCode,
      careerStage: fixture.careerStage,
      bio: fixture.bio,
      personalWebsite: fixture.personalWebsite,
      researchKeywordsJson: JSON.stringify(fixture.researchKeywords),
      orcidId: fixture.orcidId,
      coiDeclarationText: fixture.coiDeclarationText,
      isProfilePublic: fixture.isProfilePublic,
      verificationStatus: fixture.verificationStatus,
      verifiedAt,
    },
    create: {
      userId: user.id,
      slug: fixture.slug,
      fullName: fixture.fullName,
      title: fixture.title,
      institutionId: null,
      institutionNameRaw: fixture.institutionNameRaw,
      countryCode: fixture.countryCode,
      careerStage: fixture.careerStage,
      bio: fixture.bio,
      personalWebsite: fixture.personalWebsite,
      researchKeywordsJson: JSON.stringify(fixture.researchKeywords),
      orcidId: fixture.orcidId,
      coiDeclarationText: fixture.coiDeclarationText,
      isProfilePublic: fixture.isProfilePublic,
      verificationStatus: fixture.verificationStatus,
      verifiedAt,
    },
  });

  await replaceProfileMscCodes(prisma, user.id, fixture.mscCodes);
  await ensureDemoAccountRoles(prisma, user.id, key);

  const profileRecord = await readProfileRecord(prisma, user.id);

  return {
    key,
    label: fixture.label,
    email: fixture.email,
    password: DEMO_BASELINE_FIXTURE.demoPassword,
    demoUse: fixture.demoUse,
    user,
    profile: mapProfileRecord(profileRecord),
  };
};

export const ensureDemoBaseline = async (prisma: PrismaClient) => {
  const organizerAccount = await upsertDemoAccount(
    prisma,
    'organizer',
    DEMO_BASELINE_FIXTURE.demoAccounts.organizer
  );
  const reviewerAccount = await upsertDemoAccount(
    prisma,
    'reviewer',
    DEMO_BASELINE_FIXTURE.demoAccounts.reviewer
  );
  const applicantAccount = await upsertDemoAccount(
    prisma,
    'applicant',
    DEMO_BASELINE_FIXTURE.demoAccounts.applicant
  );
  const creator = organizerAccount.user;
  const reviewer = reviewerAccount.user;

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
        userId: organizerAccount.user.id,
      },
    },
    update: {
      staffRole: 'owner',
    },
    create: {
      conferenceId: conference.id,
      userId: organizerAccount.user.id,
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
    reviewer,
    conference,
    grant,
    demoAccounts: [organizerAccount, reviewerAccount, applicantAccount],
  };
};

export const cleanupDemoBaseline = async (prisma: PrismaClient) => {
  const demoEmails = DEMO_ACCOUNT_ENTRIES.map(([, account]) => account.email);

  await prisma.applicationStatusHistory.deleteMany({
    where: {
      OR: [
        {
          application: {
            OR: [
              { conference: { slug: DEMO_BASELINE_FIXTURE.conferenceSlug } },
              { grant: { slug: DEMO_BASELINE_FIXTURE.grantSlug } },
            ],
          },
        },
        {
          application: {
            applicant: {
              email: {
                in: demoEmails,
              },
            },
          },
        },
      ],
    },
  });

  await prisma.application.deleteMany({
    where: {
      OR: [
        { conference: { slug: DEMO_BASELINE_FIXTURE.conferenceSlug } },
        { grant: { slug: DEMO_BASELINE_FIXTURE.grantSlug } },
        {
          applicant: {
            email: {
              in: demoEmails,
            },
          },
        },
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
    where: {
      email: {
        in: demoEmails,
      },
    },
  });
};
