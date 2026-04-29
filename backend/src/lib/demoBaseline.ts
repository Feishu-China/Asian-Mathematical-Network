import bcrypt from 'bcryptjs';
import { Prisma } from '@prisma/client';
import type { Conference, GrantOpportunity, PrismaClient, User } from '@prisma/client';
import { buildApplicantProfileSnapshot } from './conference';
import { mapProfileRecord } from './profile';
import { ensureUserRole } from './userRoles';
import { getDecisionKind } from './workflow';

type DemoAccountActorKey = 'organizer' | 'reviewer' | 'applicant' | 'showcaseApplicant';
type DemoLoginRole = 'organizer' | 'reviewer' | 'applicant';
type DemoOpportunityStatus = 'published' | 'closed';
type DemoMscCode = {
  code: string;
  isPrimary: boolean;
};
type DemoConferenceFixture = {
  slug: string;
  title: string;
  shortName: string;
  locationText: string;
  startDate: string;
  endDate: string;
  description: string;
  applicationDeadline: string;
  status: DemoOpportunityStatus;
  publishedAt: string;
  closedAt: string | null;
};
type DemoGrantFixture = {
  slug: string;
  linkedConferenceSlug: string;
  title: string;
  grantType: string;
  description: string;
  eligibilitySummary: string;
  coverageSummary: string;
  applicationDeadline: string;
  status: DemoOpportunityStatus;
  reportRequired: boolean;
  publishedAt: string;
  closedAt: string | null;
};
type DemoStatusHistoryFixture = {
  fromStatus: string | null;
  toStatus: string;
  changedBy: DemoAccountActorKey;
  reason: string;
  createdAt: string;
};
type DemoDecisionFixture = {
  finalStatus: 'accepted' | 'rejected' | 'waitlisted';
  noteInternal: string;
  noteExternal: string;
  decidedBy: 'organizer';
  decidedAt: string;
  releasedAt: string | null;
};
type DemoConferenceApplicationFixture = {
  conferenceSlug: string;
  createdAt: string;
  submittedAt: string;
  status: 'under_review' | 'decided';
  participationType: string;
  statement: string;
  abstractTitle: string | null;
  abstractText: string | null;
  interestedInTravelSupport: boolean;
  statusHistory: readonly DemoStatusHistoryFixture[];
  decision?: DemoDecisionFixture;
};
type DemoGrantApplicationFixture = {
  grantSlug: string;
  linkedConferenceSlug: string;
  createdAt: string;
  submittedAt: string;
  statement: string;
  travelPlanSummary: string;
  fundingNeedSummary: string;
  statusHistory: readonly DemoStatusHistoryFixture[];
  decision: DemoDecisionFixture;
  postVisitReport: {
    status: 'submitted';
    reportNarrative: string;
    attendanceConfirmed: boolean;
    submittedAt: string;
  };
};
type ProfileRecord = Prisma.ProfileGetPayload<{
  include: { mscCodes: true };
}>;

const PRIMARY_CONFERENCE_SLUG = 'integration-grant-conf-2026';
const PRIMARY_GRANT_SLUG = 'integration-grant-2026-travel-support';
const PRIMARY_CONFERENCE_TITLE = 'Integration Grant Conference 2026';
const PRIMARY_GRANT_TITLE = 'Integration Grant 2026 Travel Support';

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
  showcaseApplicantEmail: 'demo.showcase.applicant@asiamath.org',
  showcaseApplicantFullName: 'Farah Iskandar',
  showcaseApplicantPassword: 'demo123456',
  demoPassword: 'demo123456',
  conferenceSlug: PRIMARY_CONFERENCE_SLUG,
  grantSlug: PRIMARY_GRANT_SLUG,
  conferenceTitle: PRIMARY_CONFERENCE_TITLE,
  grantTitle: PRIMARY_GRANT_TITLE,
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
        'Use on /dashboard first to show the shared applicant landing and workspace switcher, then switch into reviewer surfaces or the public scholar page as needed.',
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
    showcaseApplicant: {
      label: 'Showcase applicant',
      email: 'demo.showcase.applicant@asiamath.org',
      slug: 'farah-iskandar',
      fullName: 'Farah Iskandar',
      title: 'Postdoctoral Fellow',
      institutionNameRaw: 'University of Indonesia',
      countryCode: 'ID',
      careerStage: 'postdoc',
      bio: 'Workflow-rich showcase account seeded with ready-made applications so the hosted preview can immediately demonstrate under-review, accepted, rejected, and post-visit-report states.',
      personalWebsite: 'https://example.org/scholars/farah-iskandar',
      researchKeywords: ['topology', 'travel grants', 'regional collaboration'],
      mscCodes: [
        { code: '57R19', isPrimary: true },
        { code: '55N35', isPrimary: false },
      ],
      orcidId: '0000-0004-4400-4404',
      coiDeclarationText:
        'Internal only: seeded showcase account for applicant workflow demos; do not assign review duties.',
      isProfilePublic: true,
      verificationStatus: 'verified',
      verifiedAt: '2026-04-19T09:00:00.000Z',
      demoUse:
        'Use on /me/applications to show a ready-made applicant journey with under-review, accepted, rejected, and completed grant follow-up states.',
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
type DemoAccountSummary = {
  key: DemoAccountKey;
  label: string;
  loginRole: DemoLoginRole;
  email: string;
  password: string;
  meProfilePath: '/me/profile' | '/me/applications';
  scholarSlug: string;
  scholarPath: string | null;
  startHere: string;
  visibility: 'public' | 'private';
  title: string | null;
  affiliation: string | null;
  countryCode: string | null;
  careerStage: string | null;
  narrativeFocus: string;
};
type DemoSeedAccount = {
  key: DemoAccountKey;
  label: string;
  email: string;
  password: string;
  demoUse: string;
  user: User;
  profile: ReturnType<typeof mapProfileRecord>;
};
type DemoBaselineFixture = {
  creator: User;
  reviewer: User;
  conference: Conference;
  conferences: Conference[];
  grant: GrantOpportunity;
  grants: GrantOpportunity[];
  demoAccounts: DemoSeedAccount[];
};

const DEMO_CONFERENCE_FIXTURES: readonly DemoConferenceFixture[] = [
  {
    slug: PRIMARY_CONFERENCE_SLUG,
    title: PRIMARY_CONFERENCE_TITLE,
    shortName: 'AM2026',
    locationText: 'Singapore',
    startDate: '2026-08-10',
    endDate: '2026-08-14',
    description:
      'Flagship demo conference used for the clean end-to-end applicant walkthrough and the linked travel-support integration flow.',
    applicationDeadline: '2026-07-15T23:59:59Z',
    status: 'published',
    publishedAt: '2026-04-20T10:00:00Z',
    closedAt: null,
  },
  {
    slug: 'regional-topology-symposium-2026',
    title: 'Regional Topology Symposium 2026',
    shortName: 'RTS2026',
    locationText: 'Seoul',
    startDate: '2026-09-18',
    endDate: '2026-09-21',
    description:
      'Published upcoming symposium used to demonstrate an under-review application on the hosted applicant dashboard.',
    applicationDeadline: '2026-07-30T23:59:59Z',
    status: 'published',
    publishedAt: '2026-04-21T09:00:00Z',
    closedAt: null,
  },
  {
    slug: 'number-theory-collaboration-workshop-2026',
    title: 'Number Theory Collaboration Workshop 2026',
    shortName: 'NTCW2026',
    locationText: 'Bangkok',
    startDate: '2026-02-18',
    endDate: '2026-02-21',
    description:
      'Earlier 2026 workshop kept publicly visible as an archive-style opportunity so the demo can show released conference and grant outcomes plus a completed post-visit report.',
    applicationDeadline: '2025-12-10T23:59:59Z',
    status: 'published',
    publishedAt: '2025-10-15T08:00:00Z',
    closedAt: null,
  },
  {
    slug: 'applied-pde-exchange-2025',
    title: 'Applied PDE Exchange 2025',
    shortName: 'APDE2025',
    locationText: 'Bengaluru',
    startDate: '2025-10-12',
    endDate: '2025-10-15',
    description:
      'Closed historical conference used to make the applicant workflow more realistic by carrying a released rejection state.',
    applicationDeadline: '2025-08-31T23:59:59Z',
    status: 'closed',
    publishedAt: '2025-05-15T08:00:00Z',
    closedAt: '2025-09-20T12:00:00Z',
  },
] as const;

const DEMO_GRANT_FIXTURES: readonly DemoGrantFixture[] = [
  {
    slug: PRIMARY_GRANT_SLUG,
    linkedConferenceSlug: PRIMARY_CONFERENCE_SLUG,
    title: PRIMARY_GRANT_TITLE,
    grantType: 'conference_travel_grant',
    description: 'Partial travel support for accepted participants in the flagship demo conference.',
    eligibilitySummary: 'Open to eligible Integration Grant Conference 2026 applicants.',
    coverageSummary: 'Partial airfare and accommodation support.',
    applicationDeadline: '2026-06-05T23:59:59Z',
    status: 'published',
    reportRequired: true,
    publishedAt: '2026-04-22T12:00:00Z',
    closedAt: null,
  },
  {
    slug: 'number-theory-collaboration-travel-support-2026',
    linkedConferenceSlug: 'number-theory-collaboration-workshop-2026',
    title: 'Number Theory Collaboration Travel Support 2026',
    grantType: 'conference_travel_grant',
    description:
      'Travel support archive for workshop participants, kept public in the demo so accepted grant outcomes and reporting can be shown immediately.',
    eligibilitySummary: 'For accepted Number Theory Collaboration Workshop 2026 participants.',
    coverageSummary: 'Travel reimbursement plus lodging stipend.',
    applicationDeadline: '2025-12-20T23:59:59Z',
    status: 'published',
    reportRequired: true,
    publishedAt: '2025-10-20T11:00:00Z',
    closedAt: null,
  },
] as const;

const DEMO_SHOWCASE_CONFERENCE_APPLICATIONS: readonly DemoConferenceApplicationFixture[] = [
  {
    conferenceSlug: 'regional-topology-symposium-2026',
    createdAt: '2026-04-22T08:00:00Z',
    submittedAt: '2026-04-22T09:15:00Z',
    status: 'under_review',
    participationType: 'participant',
    statement:
      'I am preparing a regional collaboration visit on low-dimensional topology and would like to join the working sessions.',
    abstractTitle: null,
    abstractText: null,
    interestedInTravelSupport: false,
    statusHistory: [
      {
        fromStatus: 'draft',
        toStatus: 'submitted',
        changedBy: 'showcaseApplicant',
        reason: 'applicant_submit',
        createdAt: '2026-04-22T09:15:00Z',
      },
      {
        fromStatus: 'submitted',
        toStatus: 'under_review',
        changedBy: 'reviewer',
        reason: 'review_queue_opened',
        createdAt: '2026-04-24T08:30:00Z',
      },
    ],
  },
  {
    conferenceSlug: 'number-theory-collaboration-workshop-2026',
    createdAt: '2025-12-05T09:00:00Z',
    submittedAt: '2025-12-06T10:30:00Z',
    status: 'decided',
    participationType: 'speaker',
    statement:
      'I am proposing a talk on collaborative approaches to p-adic L-functions and would also like to mentor the early-career discussion group.',
    abstractTitle: 'P-adic L-functions in cross-border collaboration',
    abstractText:
      'This talk connects recent p-adic interpolation results with collaborative data-sharing practices across Southeast Asian number theory groups.',
    interestedInTravelSupport: true,
    statusHistory: [
      {
        fromStatus: 'draft',
        toStatus: 'submitted',
        changedBy: 'showcaseApplicant',
        reason: 'applicant_submit',
        createdAt: '2025-12-06T10:30:00Z',
      },
      {
        fromStatus: 'submitted',
        toStatus: 'decided',
        changedBy: 'organizer',
        reason: 'internal_decision_recorded',
        createdAt: '2025-12-18T09:00:00Z',
      },
    ],
    decision: {
      finalStatus: 'accepted',
      noteInternal: 'Strong invited-speaker fit for the collaboration track.',
      noteExternal: 'Your workshop application has been accepted.',
      decidedBy: 'organizer',
      decidedAt: '2025-12-18T09:00:00Z',
      releasedAt: '2025-12-18T12:00:00Z',
    },
  },
  {
    conferenceSlug: 'applied-pde-exchange-2025',
    createdAt: '2025-08-10T08:00:00Z',
    submittedAt: '2025-08-12T09:00:00Z',
    status: 'decided',
    participationType: 'speaker',
    statement:
      'I hoped to present recent work on inverse problems in dispersive systems and receive feedback from the applied analysis group.',
    abstractTitle: 'Inverse methods for nonlinear dispersive systems',
    abstractText:
      'The submission focused on stability bounds for inverse recovery in nonlinear dispersive equations with incomplete observation.',
    interestedInTravelSupport: false,
    statusHistory: [
      {
        fromStatus: 'draft',
        toStatus: 'submitted',
        changedBy: 'showcaseApplicant',
        reason: 'applicant_submit',
        createdAt: '2025-08-12T09:00:00Z',
      },
      {
        fromStatus: 'submitted',
        toStatus: 'decided',
        changedBy: 'organizer',
        reason: 'internal_decision_recorded',
        createdAt: '2025-09-05T15:00:00Z',
      },
    ],
    decision: {
      finalStatus: 'rejected',
      noteInternal: 'Topic fit was weaker than the accepted minisymposium cluster.',
      noteExternal: 'Thank you for applying. We are unable to offer admission this round.',
      decidedBy: 'organizer',
      decidedAt: '2025-09-05T15:00:00Z',
      releasedAt: '2025-09-06T10:00:00Z',
    },
  },
] as const;

const DEMO_REVIEWER_CONFERENCE_APPLICATIONS: readonly DemoConferenceApplicationFixture[] = [
  {
    conferenceSlug: 'regional-topology-symposium-2026',
    createdAt: '2026-04-21T08:30:00Z',
    submittedAt: '2026-04-21T09:10:00Z',
    status: 'under_review',
    participationType: 'participant',
    statement:
      'I plan to attend the topology collaboration sessions and meet regional organizers while continuing to use this account for reviewer duties.',
    abstractTitle: null,
    abstractText: null,
    interestedInTravelSupport: false,
    statusHistory: [
      {
        fromStatus: 'draft',
        toStatus: 'submitted',
        changedBy: 'reviewer',
        reason: 'applicant_submit',
        createdAt: '2026-04-21T09:10:00Z',
      },
      {
        fromStatus: 'submitted',
        toStatus: 'under_review',
        changedBy: 'organizer',
        reason: 'review_queue_opened',
        createdAt: '2026-04-23T08:45:00Z',
      },
    ],
  },
] as const;

const DEMO_SHOWCASE_GRANT_APPLICATIONS: readonly DemoGrantApplicationFixture[] = [
  {
    grantSlug: 'number-theory-collaboration-travel-support-2026',
    linkedConferenceSlug: 'number-theory-collaboration-workshop-2026',
    createdAt: '2025-12-07T11:00:00Z',
    submittedAt: '2025-12-08T10:00:00Z',
    statement:
      'Travel support will allow me to extend the Bangkok collaboration visit and meet the regional mentoring cohort in person.',
    travelPlanSummary: 'Round-trip Jakarta to Bangkok plus four nights near the workshop venue.',
    fundingNeedSummary: 'Requesting partial airfare reimbursement and lodging support.',
    statusHistory: [
      {
        fromStatus: 'draft',
        toStatus: 'submitted',
        changedBy: 'showcaseApplicant',
        reason: 'applicant_submit',
        createdAt: '2025-12-08T10:00:00Z',
      },
      {
        fromStatus: 'submitted',
        toStatus: 'decided',
        changedBy: 'organizer',
        reason: 'internal_decision_recorded',
        createdAt: '2025-12-20T08:30:00Z',
      },
    ],
    decision: {
      finalStatus: 'accepted',
      noteInternal: 'Award archived so the hosted demo can show a completed grant cycle.',
      noteExternal: 'Your travel support request has been awarded.',
      decidedBy: 'organizer',
      decidedAt: '2025-12-20T08:30:00Z',
      releasedAt: '2025-12-20T09:00:00Z',
    },
    postVisitReport: {
      status: 'submitted',
      reportNarrative:
        'The workshop led to a new collaboration on p-adic interpolation and a follow-up reading group across Jakarta, Bangkok, and Kuala Lumpur.',
      attendanceConfirmed: true,
      submittedAt: '2026-02-24T10:15:00Z',
    },
  },
] as const;

const DEMO_ACCOUNT_ENTRIES = Object.entries(DEMO_BASELINE_FIXTURE.demoAccounts) as Array<
  [DemoAccountKey, DemoAccountFixture]
>;

let demoPasswordHashPromise: Promise<string> | null = null;

const getDemoPasswordHash = () => {
  demoPasswordHashPromise ??= bcrypt.hash(DEMO_BASELINE_FIXTURE.demoPassword, 10);
  return demoPasswordHashPromise;
};

const parseDate = (value: string | null) => (value ? new Date(value) : null);

const getConferenceFormSchemaJson = () =>
  JSON.stringify({
    fields: DEMO_BASELINE_FIXTURE.conferenceFormFields,
  });

const getGrantFormSchemaJson = () =>
  JSON.stringify({
    fields: DEMO_BASELINE_FIXTURE.grantFormFields,
  });

const getLoginRole = (key: DemoAccountKey): DemoLoginRole => {
  if (key === 'organizer') {
    return 'organizer';
  }

  if (key === 'reviewer') {
    return 'reviewer';
  }

  return 'applicant';
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
): Promise<DemoSeedAccount> => {
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

const getRequiredAccount = (accounts: readonly DemoSeedAccount[], key: DemoAccountKey) => {
  const account = accounts.find((item) => item.key === key);

  if (!account) {
    throw new Error(`Missing demo account fixture for ${key}`);
  }

  return account;
};

const getRequiredConference = (
  conferences: readonly Conference[],
  slug: string
) => {
  const conference = conferences.find((item) => item.slug === slug);

  if (!conference) {
    throw new Error(`Missing demo conference fixture for ${slug}`);
  }

  return conference;
};

const getRequiredGrant = (grants: readonly GrantOpportunity[], slug: string) => {
  const grant = grants.find((item) => item.slug === slug);

  if (!grant) {
    throw new Error(`Missing demo grant fixture for ${slug}`);
  }

  return grant;
};

const upsertConferenceFixture = async (
  prisma: PrismaClient,
  organizerUserId: string,
  creatorUserId: string,
  fixture: DemoConferenceFixture
) => {
  const conference = await prisma.conference.upsert({
    where: { slug: fixture.slug },
    update: {
      title: fixture.title,
      shortName: fixture.shortName,
      locationText: fixture.locationText,
      startDate: fixture.startDate,
      endDate: fixture.endDate,
      description: fixture.description,
      applicationDeadline: new Date(fixture.applicationDeadline),
      status: fixture.status,
      applicationFormSchemaJson: getConferenceFormSchemaJson(),
      settingsJson: JSON.stringify({}),
      publishedAt: new Date(fixture.publishedAt),
      closedAt: parseDate(fixture.closedAt),
      createdByUserId: creatorUserId,
    },
    create: {
      slug: fixture.slug,
      title: fixture.title,
      shortName: fixture.shortName,
      locationText: fixture.locationText,
      startDate: fixture.startDate,
      endDate: fixture.endDate,
      description: fixture.description,
      applicationDeadline: new Date(fixture.applicationDeadline),
      status: fixture.status,
      applicationFormSchemaJson: getConferenceFormSchemaJson(),
      settingsJson: JSON.stringify({}),
      publishedAt: new Date(fixture.publishedAt),
      closedAt: parseDate(fixture.closedAt),
      createdByUserId: creatorUserId,
      staff: {
        create: {
          userId: organizerUserId,
          staffRole: 'owner',
        },
      },
    },
  });

  await prisma.conferenceStaff.upsert({
    where: {
      conferenceId_userId: {
        conferenceId: conference.id,
        userId: organizerUserId,
      },
    },
    update: {
      staffRole: 'owner',
    },
    create: {
      conferenceId: conference.id,
      userId: organizerUserId,
      staffRole: 'owner',
    },
  });

  return conference;
};

const upsertGrantFixture = async (
  prisma: PrismaClient,
  creatorUserId: string,
  linkedConferenceId: string,
  fixture: DemoGrantFixture
) =>
  prisma.grantOpportunity.upsert({
    where: { slug: fixture.slug },
    update: {
      linkedConferenceId,
      title: fixture.title,
      grantType: fixture.grantType,
      description: fixture.description,
      eligibilitySummary: fixture.eligibilitySummary,
      coverageSummary: fixture.coverageSummary,
      applicationDeadline: new Date(fixture.applicationDeadline),
      status: fixture.status,
      reportRequired: fixture.reportRequired,
      applicationFormSchemaJson: getGrantFormSchemaJson(),
      settingsJson: JSON.stringify({}),
      publishedAt: new Date(fixture.publishedAt),
      closedAt: parseDate(fixture.closedAt),
      createdByUserId: creatorUserId,
    },
    create: {
      linkedConferenceId,
      slug: fixture.slug,
      title: fixture.title,
      grantType: fixture.grantType,
      description: fixture.description,
      eligibilitySummary: fixture.eligibilitySummary,
      coverageSummary: fixture.coverageSummary,
      applicationDeadline: new Date(fixture.applicationDeadline),
      status: fixture.status,
      reportRequired: fixture.reportRequired,
      applicationFormSchemaJson: getGrantFormSchemaJson(),
      settingsJson: JSON.stringify({}),
      publishedAt: new Date(fixture.publishedAt),
      closedAt: parseDate(fixture.closedAt),
      createdByUserId: creatorUserId,
    },
  });

const replaceApplicationStatusHistory = async (
  prisma: PrismaClient,
  applicationId: string,
  accountByKey: Record<DemoAccountKey, DemoSeedAccount>,
  history: readonly DemoStatusHistoryFixture[]
) => {
  await prisma.applicationStatusHistory.deleteMany({
    where: { applicationId },
  });

  if (history.length < 1) {
    return;
  }

  await prisma.applicationStatusHistory.createMany({
    data: history.map((item) => ({
      applicationId,
      fromStatus: item.fromStatus,
      toStatus: item.toStatus,
      changedByUserId: accountByKey[item.changedBy].user.id,
      reason: item.reason,
      createdAt: new Date(item.createdAt),
    })),
  });
};

const syncDecision = async (
  prisma: PrismaClient,
  applicationId: string,
  applicationType: 'conference_application' | 'grant_application',
  accountByKey: Record<DemoAccountKey, DemoSeedAccount>,
  decision: DemoDecisionFixture | undefined
) => {
  if (!decision) {
    await prisma.decision.deleteMany({
      where: { applicationId },
    });
    return;
  }

  await prisma.decision.upsert({
    where: { applicationId },
    update: {
      decisionKind: getDecisionKind(applicationType),
      finalStatus: decision.finalStatus,
      releaseStatus: decision.releasedAt ? 'released' : 'unreleased',
      noteInternal: decision.noteInternal,
      noteExternal: decision.noteExternal,
      decidedByUserId: accountByKey[decision.decidedBy].user.id,
      decidedAt: new Date(decision.decidedAt),
      releasedAt: parseDate(decision.releasedAt),
    },
    create: {
      applicationId,
      decisionKind: getDecisionKind(applicationType),
      finalStatus: decision.finalStatus,
      releaseStatus: decision.releasedAt ? 'released' : 'unreleased',
      noteInternal: decision.noteInternal,
      noteExternal: decision.noteExternal,
      decidedByUserId: accountByKey[decision.decidedBy].user.id,
      decidedAt: new Date(decision.decidedAt),
      releasedAt: parseDate(decision.releasedAt),
    },
  });
};

const syncPostVisitReport = async (
  prisma: PrismaClient,
  applicationId: string,
  postVisitReport: DemoGrantApplicationFixture['postVisitReport'] | undefined
) => {
  if (!postVisitReport) {
    await prisma.postVisitReport.deleteMany({
      where: { applicationId },
    });
    return;
  }

  await prisma.postVisitReport.upsert({
    where: { applicationId },
    update: {
      status: postVisitReport.status,
      reportNarrative: postVisitReport.reportNarrative,
      attendanceConfirmed: postVisitReport.attendanceConfirmed,
      submittedAt: new Date(postVisitReport.submittedAt),
    },
    create: {
      applicationId,
      status: postVisitReport.status,
      reportNarrative: postVisitReport.reportNarrative,
      attendanceConfirmed: postVisitReport.attendanceConfirmed,
      submittedAt: new Date(postVisitReport.submittedAt),
    },
  });
};

const resetDemoApplicantApplications = async (
  prisma: PrismaClient,
  applicantUserIds: readonly string[]
) => {
  await prisma.application.deleteMany({
    where: {
      applicantUserId: {
        in: [...applicantUserIds],
      },
    },
  });
};

const seedShowcaseApplications = async (
  prisma: PrismaClient,
  accounts: readonly DemoSeedAccount[],
  conferences: readonly Conference[],
  grants: readonly GrantOpportunity[]
) => {
  const accountByKey = {
    organizer: getRequiredAccount(accounts, 'organizer'),
    reviewer: getRequiredAccount(accounts, 'reviewer'),
    applicant: getRequiredAccount(accounts, 'applicant'),
    showcaseApplicant: getRequiredAccount(accounts, 'showcaseApplicant'),
  } satisfies Record<DemoAccountKey, DemoSeedAccount>;

  await resetDemoApplicantApplications(prisma, [
    accountByKey.reviewer.user.id,
    accountByKey.applicant.user.id,
    accountByKey.showcaseApplicant.user.id,
  ]);

  const reviewerProfileSnapshotJson = JSON.stringify(
    buildApplicantProfileSnapshot(accountByKey.reviewer.profile)
  );
  const showcaseProfileSnapshotJson = JSON.stringify(
    buildApplicantProfileSnapshot(accountByKey.showcaseApplicant.profile)
  );
  const acceptedConferenceApplicationsBySlug = new Map<string, { id: string }>();

  for (const fixture of DEMO_REVIEWER_CONFERENCE_APPLICATIONS) {
    const conference = getRequiredConference(conferences, fixture.conferenceSlug);
    const decidedAt = fixture.decision ? new Date(fixture.decision.decidedAt) : null;
    const application = await prisma.application.upsert({
      where: {
        conferenceId_applicantUserId_applicationType: {
          conferenceId: conference.id,
          applicantUserId: accountByKey.reviewer.user.id,
          applicationType: 'conference_application',
        },
      },
      update: {
        sourceModule: 'M2',
        grantId: null,
        linkedConferenceId: null,
        linkedConferenceApplicationId: null,
        status: fixture.status,
        participationType: fixture.participationType,
        statement: fixture.statement,
        abstractTitle: fixture.abstractTitle,
        abstractText: fixture.abstractText,
        interestedInTravelSupport: fixture.interestedInTravelSupport,
        travelPlanSummary: null,
        fundingNeedSummary: null,
        extraAnswersJson: '{}',
        applicantProfileSnapshotJson: reviewerProfileSnapshotJson,
        submittedAt: new Date(fixture.submittedAt),
        decidedAt,
      },
      create: {
        applicationType: 'conference_application',
        sourceModule: 'M2',
        conferenceId: conference.id,
        applicantUserId: accountByKey.reviewer.user.id,
        status: fixture.status,
        participationType: fixture.participationType,
        statement: fixture.statement,
        abstractTitle: fixture.abstractTitle,
        abstractText: fixture.abstractText,
        interestedInTravelSupport: fixture.interestedInTravelSupport,
        travelPlanSummary: null,
        fundingNeedSummary: null,
        extraAnswersJson: '{}',
        applicantProfileSnapshotJson: reviewerProfileSnapshotJson,
        submittedAt: new Date(fixture.submittedAt),
        decidedAt,
        createdAt: new Date(fixture.createdAt),
      },
    });

    await replaceApplicationStatusHistory(prisma, application.id, accountByKey, fixture.statusHistory);
    await syncDecision(
      prisma,
      application.id,
      'conference_application',
      accountByKey,
      fixture.decision
    );
    await syncPostVisitReport(prisma, application.id, undefined);
  }

  for (const fixture of DEMO_SHOWCASE_CONFERENCE_APPLICATIONS) {
    const conference = getRequiredConference(conferences, fixture.conferenceSlug);
    const decidedAt = fixture.decision ? new Date(fixture.decision.decidedAt) : null;
    const application = await prisma.application.upsert({
      where: {
        conferenceId_applicantUserId_applicationType: {
          conferenceId: conference.id,
          applicantUserId: accountByKey.showcaseApplicant.user.id,
          applicationType: 'conference_application',
        },
      },
      update: {
        sourceModule: 'M2',
        grantId: null,
        linkedConferenceId: null,
        linkedConferenceApplicationId: null,
        status: fixture.status,
        participationType: fixture.participationType,
        statement: fixture.statement,
        abstractTitle: fixture.abstractTitle,
        abstractText: fixture.abstractText,
        interestedInTravelSupport: fixture.interestedInTravelSupport,
        travelPlanSummary: null,
        fundingNeedSummary: null,
        extraAnswersJson: '{}',
        applicantProfileSnapshotJson: showcaseProfileSnapshotJson,
        submittedAt: new Date(fixture.submittedAt),
        decidedAt,
      },
      create: {
        applicationType: 'conference_application',
        sourceModule: 'M2',
        conferenceId: conference.id,
        applicantUserId: accountByKey.showcaseApplicant.user.id,
        status: fixture.status,
        participationType: fixture.participationType,
        statement: fixture.statement,
        abstractTitle: fixture.abstractTitle,
        abstractText: fixture.abstractText,
        interestedInTravelSupport: fixture.interestedInTravelSupport,
        travelPlanSummary: null,
        fundingNeedSummary: null,
        extraAnswersJson: '{}',
        applicantProfileSnapshotJson: showcaseProfileSnapshotJson,
        submittedAt: new Date(fixture.submittedAt),
        decidedAt,
        createdAt: new Date(fixture.createdAt),
      },
    });

    await replaceApplicationStatusHistory(prisma, application.id, accountByKey, fixture.statusHistory);
    await syncDecision(
      prisma,
      application.id,
      'conference_application',
      accountByKey,
      fixture.decision
    );
    await syncPostVisitReport(prisma, application.id, undefined);

    if (fixture.decision?.finalStatus === 'accepted') {
      acceptedConferenceApplicationsBySlug.set(fixture.conferenceSlug, { id: application.id });
    }
  }

  for (const fixture of DEMO_SHOWCASE_GRANT_APPLICATIONS) {
    const grant = getRequiredGrant(grants, fixture.grantSlug);
    const linkedConference = getRequiredConference(conferences, fixture.linkedConferenceSlug);
    const linkedConferenceApplication = acceptedConferenceApplicationsBySlug.get(
      fixture.linkedConferenceSlug
    );

    if (!linkedConferenceApplication) {
      throw new Error(
        `Grant showcase fixture ${fixture.grantSlug} requires an accepted conference application for ${fixture.linkedConferenceSlug}`
      );
    }

    if (!grant.linkedConferenceId || grant.linkedConferenceId !== linkedConference.id) {
      throw new Error(`Grant fixture ${fixture.grantSlug} is not linked to ${fixture.linkedConferenceSlug}`);
    }

    const application = await prisma.application.upsert({
      where: {
        grantId_applicantUserId_applicationType: {
          grantId: grant.id,
          applicantUserId: accountByKey.showcaseApplicant.user.id,
          applicationType: 'grant_application',
        },
      },
      update: {
        sourceModule: 'M7',
        conferenceId: null,
        linkedConferenceId: linkedConference.id,
        linkedConferenceApplicationId: linkedConferenceApplication.id,
        status: 'decided',
        participationType: null,
        statement: fixture.statement,
        abstractTitle: null,
        abstractText: null,
        interestedInTravelSupport: false,
        travelPlanSummary: fixture.travelPlanSummary,
        fundingNeedSummary: fixture.fundingNeedSummary,
        extraAnswersJson: '{}',
        applicantProfileSnapshotJson: showcaseProfileSnapshotJson,
        submittedAt: new Date(fixture.submittedAt),
        decidedAt: new Date(fixture.decision.decidedAt),
      },
      create: {
        applicationType: 'grant_application',
        sourceModule: 'M7',
        grantId: grant.id,
        linkedConferenceId: linkedConference.id,
        linkedConferenceApplicationId: linkedConferenceApplication.id,
        applicantUserId: accountByKey.showcaseApplicant.user.id,
        status: 'decided',
        participationType: null,
        statement: fixture.statement,
        abstractTitle: null,
        abstractText: null,
        interestedInTravelSupport: false,
        travelPlanSummary: fixture.travelPlanSummary,
        fundingNeedSummary: fixture.fundingNeedSummary,
        extraAnswersJson: '{}',
        applicantProfileSnapshotJson: showcaseProfileSnapshotJson,
        submittedAt: new Date(fixture.submittedAt),
        decidedAt: new Date(fixture.decision.decidedAt),
        createdAt: new Date(fixture.createdAt),
      },
    });

    await replaceApplicationStatusHistory(prisma, application.id, accountByKey, fixture.statusHistory);
    await syncDecision(prisma, application.id, 'grant_application', accountByKey, fixture.decision);
    await syncPostVisitReport(prisma, application.id, fixture.postVisitReport);
  }
};

export const ensureDemoBaseline = async (prisma: PrismaClient): Promise<DemoBaselineFixture> => {
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
  const showcaseApplicantAccount = await upsertDemoAccount(
    prisma,
    'showcaseApplicant',
    DEMO_BASELINE_FIXTURE.demoAccounts.showcaseApplicant
  );
  const creator = organizerAccount.user;
  const reviewer = reviewerAccount.user;

  const conferences = [];
  for (const conferenceFixture of DEMO_CONFERENCE_FIXTURES) {
    conferences.push(
      await upsertConferenceFixture(
        prisma,
        organizerAccount.user.id,
        creator.id,
        conferenceFixture
      )
    );
  }

  const grants = [];
  for (const grantFixture of DEMO_GRANT_FIXTURES) {
    const linkedConference = conferences.find((item) => item.slug === grantFixture.linkedConferenceSlug);
    if (!linkedConference) {
      throw new Error(`Missing linked conference ${grantFixture.linkedConferenceSlug} for ${grantFixture.slug}`);
    }

    grants.push(await upsertGrantFixture(prisma, creator.id, linkedConference.id, grantFixture));
  }

  const demoAccounts = [
    organizerAccount,
    reviewerAccount,
    applicantAccount,
    showcaseApplicantAccount,
  ] as const;

  await seedShowcaseApplications(prisma, demoAccounts, conferences, grants);

  const conference = getRequiredConference(conferences, DEMO_BASELINE_FIXTURE.conferenceSlug);
  const grant = getRequiredGrant(grants, DEMO_BASELINE_FIXTURE.grantSlug);

  return {
    creator,
    reviewer,
    conference,
    conferences,
    grant,
    grants,
    demoAccounts: [...demoAccounts],
  };
};

export const buildDemoBaselineSummary = (fixture: Awaited<ReturnType<typeof ensureDemoBaseline>>) => {
  const demoAccounts: DemoAccountSummary[] = fixture.demoAccounts.map((account) => {
    const loginRole = getLoginRole(account.key);
    const meProfilePath =
      account.key === 'showcaseApplicant' ? '/me/applications' : ('/me/profile' as const);
    const scholarPath = account.profile.isProfilePublic ? `/scholars/${account.profile.slug}` : null;
    const startHere =
      account.key === 'showcaseApplicant'
        ? '/me/applications'
        : account.key === 'applicant'
          ? '/me/profile'
          : account.key === 'reviewer'
            ? '/dashboard'
          : scholarPath ?? '/me/profile';

    return {
      key: account.key,
      label: account.label,
      loginRole,
      email: account.email,
      password: account.password,
      meProfilePath,
      scholarSlug: account.profile.slug,
      scholarPath,
      startHere,
      visibility: account.profile.isProfilePublic ? 'public' : 'private',
      title: account.profile.title ?? null,
      affiliation: account.profile.institutionNameRaw ?? null,
      countryCode: account.profile.countryCode ?? null,
      careerStage: account.profile.careerStage ?? null,
      narrativeFocus: account.demoUse,
    };
  });

  const applicantAccount = demoAccounts.find((account) => account.key === 'applicant');
  const reviewerAccount = demoAccounts.find((account) => account.key === 'reviewer');
  const organizerAccount = demoAccounts.find((account) => account.key === 'organizer');

  if (!applicantAccount || !reviewerAccount || !organizerAccount) {
    throw new Error('Demo baseline summary requires organizer, reviewer, and applicant accounts.');
  }

  return {
    conference: {
      id: fixture.conference.id,
      slug: fixture.conference.slug,
      status: fixture.conference.status,
    },
    accounts: {
      organizer: {
        email: DEMO_BASELINE_FIXTURE.creatorEmail,
        password: DEMO_BASELINE_FIXTURE.creatorPassword,
        role: 'organizer',
      },
      reviewer: {
        email: DEMO_BASELINE_FIXTURE.reviewerEmail,
        password: DEMO_BASELINE_FIXTURE.reviewerPassword,
        role: 'reviewer',
      },
      applicant: {
        email: DEMO_BASELINE_FIXTURE.applicantEmail,
        password: DEMO_BASELINE_FIXTURE.applicantPassword,
        role: 'applicant',
      },
      showcaseApplicant: {
        email: DEMO_BASELINE_FIXTURE.showcaseApplicantEmail,
        password: DEMO_BASELINE_FIXTURE.showcaseApplicantPassword,
        role: 'applicant',
      },
    },
    counts: {
      conferences: fixture.conferences.length,
      publishedConferences: fixture.conferences.filter((item) => item.status === 'published').length,
      closedConferences: fixture.conferences.filter((item) => item.status === 'closed').length,
      grants: fixture.grants.length,
    },
    grant: {
      id: fixture.grant.id,
      slug: fixture.grant.slug,
      status: fixture.grant.status,
    },
    routes: {
      applicantPrivateProfile: '/me/profile',
      applicantPublicScholar: applicantAccount.scholarPath,
      reviewerPublicScholar: reviewerAccount.scholarPath,
      organizerPrivateProfile: '/me/profile',
      organizerPublicScholar: organizerAccount.scholarPath,
    },
    quickStart: [
      {
        step: 1,
        account: 'applicant',
        loginRequired: true,
        open: '/me/profile',
        focus: 'Explain the private editor surface and the shared scholar record.',
      },
      {
        step: 2,
        account: 'applicant',
        loginRequired: false,
        open: applicantAccount.scholarPath,
        focus: 'Hand off from the private editor to the public scholar page using the same profile record.',
      },
      {
        step: 3,
        account: 'reviewer',
        loginRequired: true,
        open: '/dashboard',
        focus:
          'Log in with the reviewer demo account, land on the shared applicant dashboard, and use the workspace switcher to enter reviewer surfaces.',
      },
      {
        step: 4,
        account: 'showcaseApplicant',
        loginRequired: true,
        open: '/me/applications',
        focus: 'Show a seeded applicant workflow with under-review, accepted, rejected, and completed grant-report states.',
      },
      {
        step: 5,
        account: 'organizer',
        loginRequired: true,
        open: '/me/profile',
        focus: 'Show the organizer private profile state and explain why the public scholar route stays hidden.',
      },
    ],
    storyline: [
      'Applicant private profile editor',
      'Applicant public scholar handoff',
      'Reviewer workspace switch from applicant root',
      'Showcase applicant workflow states',
      'Organizer hidden public route',
    ],
    demoAccounts: demoAccounts.map((account) => ({
      key: account.key,
      label: account.label,
      login_role: account.loginRole,
      email: account.email,
      password: account.password,
      me_profile_path: account.meProfilePath,
      scholar_slug: account.scholarSlug,
      scholar_path: account.scholarPath,
      start_here: account.startHere,
      visibility: account.visibility,
      title: account.title,
      affiliation: account.affiliation,
      country_code: account.countryCode,
      career_stage: account.careerStage,
      narrative_focus: account.narrativeFocus,
    })),
    walkthrough: [
      '1. Log in as the applicant demo account and open /me/profile to explain the private editor surface.',
      '2. Use the public scholar handoff from /me/profile to show that the same profile record can be viewed at /scholars/:slug.',
      '3. Log in as the reviewer demo account, land on /dashboard, and use the workspace switcher to move from Applicant into Reviewer.',
      '4. Log in as the showcase applicant and open /me/applications to narrate under-review, accepted, rejected, and completed grant follow-up states.',
      '5. Log in as the organizer demo account to explain that the same profile contract also supports internal organizer context while keeping the public route hidden.',
      '6. Re-run npm run seed:demo to reset the same demo accounts, opportunity set, and application workflow baseline.',
    ],
  };
};

export const cleanupDemoBaseline = async (prisma: PrismaClient) => {
  const demoEmails = DEMO_ACCOUNT_ENTRIES.map(([, account]) => account.email);
  const conferenceSlugs = DEMO_CONFERENCE_FIXTURES.map((conference) => conference.slug);
  const grantSlugs = DEMO_GRANT_FIXTURES.map((grant) => grant.slug);

  await prisma.applicationStatusHistory.deleteMany({
    where: {
      OR: [
        {
          application: {
            OR: [
              { conference: { slug: { in: conferenceSlugs } } },
              { grant: { slug: { in: grantSlugs } } },
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
        { conference: { slug: { in: conferenceSlugs } } },
        { grant: { slug: { in: grantSlugs } } },
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
    where: {
      slug: {
        in: grantSlugs,
      },
    },
  });

  await prisma.conference.deleteMany({
    where: {
      slug: {
        in: conferenceSlugs,
      },
    },
  });

  await prisma.user.deleteMany({
    where: {
      email: {
        in: demoEmails,
      },
    },
  });
};
