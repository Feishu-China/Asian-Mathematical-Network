# Demo Seed Breadth And Workflow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Expand the real PostgreSQL demo seed so public opportunity pages feel fuller and applicant-facing pages can immediately demonstrate `under_review`, released `accepted`, and released `rejected` states without sacrificing the existing clean applicant walkthrough.

**Architecture:** Keep `backend/src/lib/demoBaseline.ts` as the single source of truth for real hosted demo data, but refactor it from “one conference + one grant + three accounts” into a small declarative seed graph: four demo accounts, four conferences, two grants, and one showcase applicant’s pre-seeded application lifecycle. Preserve backward compatibility for existing callers by keeping `fixture.conference` and `fixture.grant` as the primary anchors while adding `conferences`, `grants`, richer summary counts, and seeded workflow records. One seeded conference will be `closed`, but because the public conference/grant APIs only return `status=published`, that closed record is for applicant/result realism and summary counts rather than public list visibility.

**Tech Stack:** Prisma, PostgreSQL, TypeScript, Jest, Express, React, Vite, Railway, Vercel

---

## File Map

- Modify: `/Users/brenda/Projects/Asian-Mathematical-Network/backend/src/lib/demoBaseline.ts`
  - Expand fixture constants.
  - Seed four conferences and two grants deterministically.
  - Add one showcase applicant.
  - Seed application, decision, status-history, and post-visit-report records.
  - Preserve existing `conference` and `grant` return fields for current scripts.
- Modify: `/Users/brenda/Projects/Asian-Mathematical-Network/backend/tests/demoBaseline.test.ts`
  - Lock the new opportunity counts, demo accounts, clean/showcase applicant split, and workflow states with deterministic tests.
- No frontend code changes in this batch.
  - Public and applicant pages already consume backend data.
  - Only hosted reseeding and smoke checks are needed after backend changes.

## Preflight Note

The current workspace is on `codex/grant-post-visit-form` and already has unrelated local changes. Do **not** implement this plan in that dirty branch. Execute from a fresh worktree cut from `codex/demo-d0-postgres-deploy` or a new child branch of it.

### Task 0: Re-establish the correct execution workspace

**Files:**
- Create: none
- Modify: none
- Verify: `/Users/brenda/Projects/Asian-Mathematical-Network/.git/worktrees/*`

- [ ] **Step 1: Create a dedicated worktree from the demo deployment branch**

```bash
cd /Users/brenda/Projects/Asian-Mathematical-Network
git worktree add -b codex/demo-seed-breadth-workflow ../Asian-Mathematical-Network-demo-seed-breadth codex/demo-d0-postgres-deploy
```

- [ ] **Step 2: Verify the new worktree starts on the correct clean branch**

Run:

```bash
cd /Users/brenda/Projects/Asian-Mathematical-Network-demo-seed-breadth
git status --short --branch
```

Expected:

```text
## codex/demo-seed-breadth-workflow
```

- [ ] **Step 3: Commit the worktree setup only if you also need to document branch movement**

No commit is required if the worktree is clean.

### Task 1: Lock the expanded seed contract with failing tests

**Files:**
- Modify: `/Users/brenda/Projects/Asian-Mathematical-Network-demo-seed-breadth/backend/tests/demoBaseline.test.ts`
- Test: `/Users/brenda/Projects/Asian-Mathematical-Network-demo-seed-breadth/backend/tests/demoBaseline.test.ts`

- [ ] **Step 1: Add a breadth test that expects four conferences, two grants, and one closed conference**

Insert a new test block near the existing “published conference and linked grant” coverage:

```ts
  it('creates a medium opportunity set with three published conferences, one closed conference, and two published grants', async () => {
    const fixture = await ensureDemoBaseline(prisma);

    expect(fixture.conferences).toHaveLength(4);
    expect(fixture.grants).toHaveLength(2);

    expect(fixture.conferences.map((item) => item.slug)).toEqual(
      expect.arrayContaining([
        'integration-grant-conf-2026',
        'regional-topology-symposium-2026',
        'number-theory-collaboration-workshop-2026',
        'applied-pde-exchange-2025',
      ])
    );

    expect(fixture.conferences.filter((item) => item.status === 'published')).toHaveLength(3);
    expect(fixture.conferences.filter((item) => item.status === 'closed')).toHaveLength(1);

    expect(fixture.grants.map((item) => item.slug)).toEqual(
      expect.arrayContaining([
        'integration-grant-2026-travel-support',
        'number-theory-collaboration-travel-support-2026',
      ])
    );

    expect(fixture.grants.every((item) => item.status === 'published')).toBe(true);
  });
```

- [ ] **Step 2: Add a workflow test that keeps the clean applicant empty and seeds the showcase applicant with pre-existing records**

Insert a second test block:

```ts
  it('keeps the clean applicant empty and seeds the showcase applicant with under-review, accepted, and rejected workflow records', async () => {
    const fixture = await ensureDemoBaseline(prisma);
    const cleanApplicant = fixture.demoAccounts.find((account) => account.key === 'applicant');
    const showcaseApplicant = fixture.demoAccounts.find(
      (account) => account.key === 'showcaseApplicant'
    );

    expect(cleanApplicant).toBeDefined();
    expect(showcaseApplicant).toBeDefined();

    const cleanApplicantApplications = await prisma.application.findMany({
      where: { applicantUserId: cleanApplicant!.user.id },
    });

    expect(cleanApplicantApplications).toHaveLength(0);

    const showcaseApplications = await prisma.application.findMany({
      where: { applicantUserId: showcaseApplicant!.user.id },
      include: {
        conference: true,
        grant: true,
        decision: true,
        postVisitReport: true,
      },
      orderBy: [{ createdAt: 'asc' }],
    });

    expect(showcaseApplications).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          applicationType: 'conference_application',
          status: 'under_review',
          conference: expect.objectContaining({ slug: 'regional-topology-symposium-2026' }),
          decision: null,
        }),
        expect.objectContaining({
          applicationType: 'conference_application',
          status: 'decided',
          conference: expect.objectContaining({ slug: 'integration-grant-conf-2026' }),
          decision: expect.objectContaining({
            finalStatus: 'accepted',
            releaseStatus: 'released',
          }),
        }),
        expect.objectContaining({
          applicationType: 'conference_application',
          status: 'decided',
          conference: expect.objectContaining({ slug: 'applied-pde-exchange-2025' }),
          decision: expect.objectContaining({
            finalStatus: 'rejected',
            releaseStatus: 'released',
          }),
        }),
        expect.objectContaining({
          applicationType: 'grant_application',
          status: 'decided',
          grant: expect.objectContaining({ slug: 'integration-grant-2026-travel-support' }),
          decision: expect.objectContaining({
            finalStatus: 'accepted',
            releaseStatus: 'released',
          }),
          postVisitReport: expect.objectContaining({ status: 'submitted' }),
        }),
      ])
    );
  });
```

- [ ] **Step 3: Extend the summary assertions so the seed script output exposes the showcase account and count breakdown**

Augment the existing summary assertions:

```ts
    expect(summary.accounts).toEqual(
      expect.objectContaining({
        applicant: expect.objectContaining({
          email: DEMO_BASELINE_FIXTURE.applicantEmail,
        }),
        showcaseApplicant: expect.objectContaining({
          email: DEMO_BASELINE_FIXTURE.showcaseApplicantEmail,
          password: DEMO_BASELINE_FIXTURE.showcaseApplicantPassword,
          role: 'applicant',
        }),
      })
    );

    expect(summary.counts).toEqual({
      conferences: 4,
      publishedConferences: 3,
      closedConferences: 1,
      grants: 2,
    });
```

- [ ] **Step 4: Run the focused seed test and confirm it fails before implementation**

Run:

```bash
cd /Users/brenda/Projects/Asian-Mathematical-Network-demo-seed-breadth/backend
../node_modules/.bin/jest --runInBand tests/demoBaseline.test.ts
```

Expected failure shape:

```text
Expected length: 4
Received length: 1
```

and/or:

```text
Property 'showcaseApplicantEmail' does not exist on type ...
```

### Task 2: Expand the declarative demo accounts, conferences, grants, and summary counts

**Files:**
- Modify: `/Users/brenda/Projects/Asian-Mathematical-Network-demo-seed-breadth/backend/src/lib/demoBaseline.ts`
- Test: `/Users/brenda/Projects/Asian-Mathematical-Network-demo-seed-breadth/backend/tests/demoBaseline.test.ts`

- [ ] **Step 1: Add the showcase applicant and declarative opportunity fixtures to `DEMO_BASELINE_FIXTURE`**

Replace the single-opportunity-only fixture shape with explicit arrays:

```ts
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
  conferenceSlug: 'integration-grant-conf-2026',
  grantSlug: 'integration-grant-2026-travel-support',
  conferenceTitle: 'Integration Grant Conference 2026',
  grantTitle: 'Integration Grant 2026 Travel Support',
  demoAccounts: {
    organizer: { /* keep existing organizer fixture */ },
    reviewer: { /* keep existing reviewer fixture */ },
    applicant: { /* keep existing clean applicant fixture */ },
    showcaseApplicant: {
      label: 'Showcase applicant',
      email: 'demo.showcase.applicant@asiamath.org',
      slug: 'farah-iskandar',
      fullName: 'Farah Iskandar',
      title: 'Postdoctoral Fellow',
      institutionNameRaw: 'University of Indonesia',
      countryCode: 'ID',
      careerStage: 'postdoc',
      bio: 'Pre-seeded showcase applicant used to demonstrate a fuller application history without disturbing the clean first-run account.',
      personalWebsite: 'https://example.org/scholars/farah-iskandar',
      researchKeywords: ['topology', 'number theory', 'travel support'],
      mscCodes: [
        { code: '57R19', isPrimary: true },
        { code: '11M41', isPrimary: false },
      ],
      orcidId: '0000-0002-4400-5504',
      coiDeclarationText: 'Internal only: showcase applicant for pre-seeded workflow states.',
      isProfilePublic: true,
      verificationStatus: 'verified',
      verifiedAt: '2026-04-19T08:45:00.000Z',
      demoUse: 'Log in here to show pre-seeded applicant workflow states on /me/applications and application detail pages.',
    },
  },
  conferenceFixtures: [
    {
      key: 'primaryConference',
      slug: 'integration-grant-conf-2026',
      title: 'Integration Grant Conference 2026',
      shortName: 'AM2026',
      locationText: 'Singapore',
      startDate: '2026-08-10',
      endDate: '2026-08-14',
      description: 'Conference fixture used for the main real integration and grant storyline.',
      applicationDeadline: '2026-07-15T23:59:59Z',
      status: 'published',
      publishedAt: '2026-04-20T10:00:00Z',
      closedAt: null,
    },
    {
      key: 'topologyConference',
      slug: 'regional-topology-symposium-2026',
      title: 'Regional Topology Symposium 2026',
      shortName: 'RTS2026',
      locationText: 'Bangkok',
      startDate: '2026-09-18',
      endDate: '2026-09-21',
      description: 'Upcoming topology meeting used for the under-review applicant record.',
      applicationDeadline: '2026-08-22T23:59:59Z',
      status: 'published',
      publishedAt: '2026-04-24T11:00:00Z',
      closedAt: null,
    },
    {
      key: 'numberTheoryConference',
      slug: 'number-theory-collaboration-workshop-2026',
      title: 'Number Theory Collaboration Workshop 2026',
      shortName: 'NTCW2026',
      locationText: 'Seoul',
      startDate: '2026-10-05',
      endDate: '2026-10-09',
      description: 'Published second grant-bearing conference that makes the public opportunity rail feel less single-threaded.',
      applicationDeadline: '2026-09-10T23:59:59Z',
      status: 'published',
      publishedAt: '2026-04-26T09:30:00Z',
      closedAt: null,
    },
    {
      key: 'closedConference',
      slug: 'applied-pde-exchange-2025',
      title: 'Applied PDE Exchange 2025',
      shortName: 'APDE2025',
      locationText: 'Kuala Lumpur',
      startDate: '2025-11-12',
      endDate: '2025-11-15',
      description: 'Recently finished conference used to anchor a released rejection without changing public published-only queries.',
      applicationDeadline: '2025-10-05T23:59:59Z',
      status: 'closed',
      publishedAt: '2025-06-14T10:00:00Z',
      closedAt: '2025-11-16T12:00:00Z',
    },
  ],
  grantFixtures: [
    {
      key: 'primaryGrant',
      slug: 'integration-grant-2026-travel-support',
      title: 'Integration Grant 2026 Travel Support',
      linkedConferenceKey: 'primaryConference',
      applicationDeadline: '2026-06-05T23:59:59Z',
      description: 'Partial travel support for accepted participants.',
      eligibilitySummary: 'Open to eligible conference applicants.',
      coverageSummary: 'Partial airfare and accommodation support.',
      publishedAt: '2026-04-22T12:00:00Z',
    },
    {
      key: 'numberTheoryGrant',
      slug: 'number-theory-collaboration-travel-support-2026',
      title: 'Number Theory Collaboration Travel Support 2026',
      linkedConferenceKey: 'numberTheoryConference',
      applicationDeadline: '2026-08-28T23:59:59Z',
      description: 'Targeted mobility support for workshop speakers and early-career participants.',
      eligibilitySummary: 'Open to eligible workshop applicants and invited presenters.',
      coverageSummary: 'Travel, lodging, and registration support for selected participants.',
      publishedAt: '2026-04-27T15:00:00Z',
    },
  ],
  conferenceFormFields: [/* keep existing fields */],
  grantFormFields: [/* keep existing fields */],
} as const;
```

- [ ] **Step 2: Add typed helpers for conference/grant fixture keys and account results**

Add these type aliases immediately under the fixture declaration:

```ts
type DemoConferenceFixture = (typeof DEMO_BASELINE_FIXTURE.conferenceFixtures)[number];
type DemoConferenceKey = DemoConferenceFixture['key'];
type DemoGrantFixture = (typeof DEMO_BASELINE_FIXTURE.grantFixtures)[number];
type DemoGrantKey = DemoGrantFixture['key'];
type DemoAccountResult = Awaited<ReturnType<typeof upsertDemoAccount>>;
```

- [ ] **Step 3: Introduce reusable upsert helpers for conferences and grants**

Add helper functions above `ensureDemoBaseline`:

```ts
const upsertConferenceFixture = async ({
  prisma,
  creatorUserId,
  ownerUserId,
  fixture,
}: {
  prisma: PrismaClient;
  creatorUserId: string;
  ownerUserId: string;
  fixture: DemoConferenceFixture;
}) => {
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
      applicationFormSchemaJson: JSON.stringify({
        fields: DEMO_BASELINE_FIXTURE.conferenceFormFields,
      }),
      settingsJson: JSON.stringify({}),
      publishedAt: fixture.publishedAt ? new Date(fixture.publishedAt) : null,
      closedAt: fixture.closedAt ? new Date(fixture.closedAt) : null,
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
      applicationFormSchemaJson: JSON.stringify({
        fields: DEMO_BASELINE_FIXTURE.conferenceFormFields,
      }),
      settingsJson: JSON.stringify({}),
      publishedAt: fixture.publishedAt ? new Date(fixture.publishedAt) : null,
      closedAt: fixture.closedAt ? new Date(fixture.closedAt) : null,
      createdByUserId: creatorUserId,
    },
  });

  await prisma.conferenceStaff.upsert({
    where: {
      conferenceId_userId: {
        conferenceId: conference.id,
        userId: ownerUserId,
      },
    },
    update: { staffRole: 'owner' },
    create: {
      conferenceId: conference.id,
      userId: ownerUserId,
      staffRole: 'owner',
    },
  });

  return conference;
};

const upsertGrantFixture = async ({
  prisma,
  creatorUserId,
  fixture,
  linkedConferenceId,
}: {
  prisma: PrismaClient;
  creatorUserId: string;
  fixture: DemoGrantFixture;
  linkedConferenceId: string;
}) =>
  prisma.grantOpportunity.upsert({
    where: { slug: fixture.slug },
    update: {
      linkedConferenceId,
      title: fixture.title,
      grantType: 'conference_travel_grant',
      description: fixture.description,
      eligibilitySummary: fixture.eligibilitySummary,
      coverageSummary: fixture.coverageSummary,
      applicationDeadline: new Date(fixture.applicationDeadline),
      status: 'published',
      reportRequired: true,
      applicationFormSchemaJson: JSON.stringify({
        fields: DEMO_BASELINE_FIXTURE.grantFormFields,
      }),
      settingsJson: JSON.stringify({}),
      publishedAt: new Date(fixture.publishedAt),
      closedAt: null,
      createdByUserId: creatorUserId,
    },
    create: {
      linkedConferenceId,
      slug: fixture.slug,
      title: fixture.title,
      grantType: 'conference_travel_grant',
      description: fixture.description,
      eligibilitySummary: fixture.eligibilitySummary,
      coverageSummary: fixture.coverageSummary,
      applicationDeadline: new Date(fixture.applicationDeadline),
      status: 'published',
      reportRequired: true,
      applicationFormSchemaJson: JSON.stringify({
        fields: DEMO_BASELINE_FIXTURE.grantFormFields,
      }),
      settingsJson: JSON.stringify({}),
      publishedAt: new Date(fixture.publishedAt),
      createdByUserId: creatorUserId,
    },
  });
```

- [ ] **Step 4: Refactor `ensureDemoBaseline` to seed four demo accounts and preserve primary anchors**

Replace the single-record-only section with a data-driven flow:

```ts
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

  const conferenceRecords = await Promise.all(
    DEMO_BASELINE_FIXTURE.conferenceFixtures.map(async (fixture) => ({
      key: fixture.key,
      record: await upsertConferenceFixture({
        prisma,
        creatorUserId: organizerAccount.user.id,
        ownerUserId: organizerAccount.user.id,
        fixture,
      }),
    }))
  );

  const conferenceByKey = Object.fromEntries(
    conferenceRecords.map(({ key, record }) => [key, record])
  ) as Record<DemoConferenceKey, (typeof conferenceRecords)[number]['record']>;

  const grantRecords = await Promise.all(
    DEMO_BASELINE_FIXTURE.grantFixtures.map(async (fixture) => ({
      key: fixture.key,
      record: await upsertGrantFixture({
        prisma,
        creatorUserId: organizerAccount.user.id,
        fixture,
        linkedConferenceId: conferenceByKey[fixture.linkedConferenceKey].id,
      }),
    }))
  );

  const grantByKey = Object.fromEntries(
    grantRecords.map(({ key, record }) => [key, record])
  ) as Record<DemoGrantKey, (typeof grantRecords)[number]['record']>;
```

- [ ] **Step 5: Expand the return value and summary counts without breaking existing script callers**

Return both the primary anchors and the broader collections:

```ts
  return {
    creator: organizerAccount.user,
    reviewer: reviewerAccount.user,
    conference: conferenceByKey.primaryConference,
    conferences: conferenceRecords.map(({ record }) => record),
    grant: grantByKey.primaryGrant,
    grants: grantRecords.map(({ record }) => record),
    demoAccounts: [
      organizerAccount,
      reviewerAccount,
      applicantAccount,
      showcaseApplicantAccount,
    ],
    showcaseApplicant: showcaseApplicantAccount,
  };
```

Update `buildDemoBaselineSummary` so it adds:

```ts
    counts: {
      conferences: fixture.conferences.length,
      publishedConferences: fixture.conferences.filter((item) => item.status === 'published').length,
      closedConferences: fixture.conferences.filter((item) => item.status === 'closed').length,
      grants: fixture.grants.length,
    },
```

and:

```ts
      showcaseApplicant: {
        email: DEMO_BASELINE_FIXTURE.showcaseApplicantEmail,
        password: DEMO_BASELINE_FIXTURE.showcaseApplicantPassword,
        role: 'applicant',
      },
```

- [ ] **Step 6: Run the focused seed test again and confirm the breadth assertions still fail only on workflow records**

Run:

```bash
cd /Users/brenda/Projects/Asian-Mathematical-Network-demo-seed-breadth/backend
../node_modules/.bin/jest --runInBand tests/demoBaseline.test.ts
```

Expected:

```text
The breadth/count assertions pass, but the showcase workflow assertions still fail because no pre-seeded applications/decisions exist yet.
```

- [ ] **Step 7: Commit the breadth fixture refactor**

```bash
cd /Users/brenda/Projects/Asian-Mathematical-Network-demo-seed-breadth
git add backend/src/lib/demoBaseline.ts backend/tests/demoBaseline.test.ts
git commit -m "feat: expand seeded demo opportunity breadth"
```

### Task 3: Seed showcase applicant workflow records, decisions, and a stable accepted-grant result

**Files:**
- Modify: `/Users/brenda/Projects/Asian-Mathematical-Network-demo-seed-breadth/backend/src/lib/demoBaseline.ts`
- Test: `/Users/brenda/Projects/Asian-Mathematical-Network-demo-seed-breadth/backend/tests/demoBaseline.test.ts`

- [ ] **Step 1: Import the applicant snapshot helper and define showcase workflow fixtures**

Update imports:

```ts
import { buildApplicantProfileSnapshot } from './conference';
```

Add the workflow fixture array below the grant fixtures:

```ts
const DEMO_SHOWCASE_WORKFLOW_FIXTURES = [
  {
    key: 'underReviewConference',
    applicationType: 'conference_application',
    conferenceKey: 'topologyConference',
    sourceModule: 'M2',
    status: 'under_review',
    submittedAt: '2026-05-18T10:00:00Z',
    decidedAt: null,
    participationType: 'talk',
    statement: 'Seeking feedback on new topology results and regional collaboration pathways.',
    abstractTitle: 'Functorial Invariants In Low-Dimensional Topology',
    abstractText: 'We study how functorial invariants behave under diagrammatic moves across linked manifolds.',
    interestedInTravelSupport: true,
    extraAnswers: {},
    decision: null,
    postVisitReport: null,
    statusHistory: [
      { fromStatus: null, toStatus: 'draft', reason: 'Seeded showcase draft' },
      { fromStatus: 'draft', toStatus: 'submitted', reason: 'Seeded showcase submission' },
      { fromStatus: 'submitted', toStatus: 'under_review', reason: 'Seeded reviewer triage' },
    ],
  },
  {
    key: 'acceptedConference',
    applicationType: 'conference_application',
    conferenceKey: 'primaryConference',
    sourceModule: 'M2',
    status: 'decided',
    submittedAt: '2026-05-02T09:30:00Z',
    decidedAt: '2026-05-12T11:30:00Z',
    participationType: 'talk',
    statement: 'Presenting current joint work tied to the integration-grant collaboration track.',
    abstractTitle: 'Automorphic Cohomology Across Regional Research Networks',
    abstractText: 'The talk links modularity questions to multi-institution collaboration patterns across Asia.',
    interestedInTravelSupport: true,
    extraAnswers: {},
    decision: {
      finalStatus: 'accepted',
      noteExternal: 'We are pleased to inform you that your conference application has been accepted.',
      releasedAt: '2026-05-13T09:00:00Z',
    },
    postVisitReport: null,
    statusHistory: [
      { fromStatus: null, toStatus: 'draft', reason: 'Seeded showcase draft' },
      { fromStatus: 'draft', toStatus: 'submitted', reason: 'Seeded showcase submission' },
      { fromStatus: 'submitted', toStatus: 'under_review', reason: 'Seeded organizer review start' },
      { fromStatus: 'under_review', toStatus: 'decided', reason: 'Seeded released acceptance' },
    ],
  },
  {
    key: 'rejectedConference',
    applicationType: 'conference_application',
    conferenceKey: 'closedConference',
    sourceModule: 'M2',
    status: 'decided',
    submittedAt: '2025-09-18T14:00:00Z',
    decidedAt: '2025-10-22T15:30:00Z',
    participationType: 'participant',
    statement: 'Seeking exposure to the applied PDE programme and mentoring discussions.',
    abstractTitle: null,
    abstractText: null,
    interestedInTravelSupport: false,
    extraAnswers: {},
    decision: {
      finalStatus: 'rejected',
      noteExternal: 'Thank you for your application. We were not able to offer a place in this cycle.',
      releasedAt: '2025-10-23T09:15:00Z',
    },
    postVisitReport: null,
    statusHistory: [
      { fromStatus: null, toStatus: 'draft', reason: 'Seeded showcase draft' },
      { fromStatus: 'draft', toStatus: 'submitted', reason: 'Seeded showcase submission' },
      { fromStatus: 'submitted', toStatus: 'under_review', reason: 'Seeded review queue' },
      { fromStatus: 'under_review', toStatus: 'decided', reason: 'Seeded released rejection' },
    ],
  },
  {
    key: 'acceptedGrant',
    applicationType: 'grant_application',
    grantKey: 'primaryGrant',
    linkedConferenceApplicationKey: 'acceptedConference',
    sourceModule: 'M7',
    status: 'decided',
    submittedAt: '2026-05-15T08:45:00Z',
    decidedAt: '2026-05-25T12:00:00Z',
    statement: 'Requesting travel support for the accepted conference participation.',
    travelPlanSummary: 'Round-trip airfare from Jakarta and four nights of lodging.',
    fundingNeedSummary: 'Airfare support requested, with lodging co-funded by home department.',
    extraAnswers: {},
    decision: {
      finalStatus: 'accepted',
      noteExternal: 'Travel support has been awarded for the accepted conference participation.',
      releasedAt: '2026-05-26T09:30:00Z',
    },
    postVisitReport: {
      status: 'submitted',
      reportNarrative: 'Travel support enabled attendance, a contributed talk, and follow-up collaboration meetings after the conference.',
      attendanceConfirmed: true,
      submittedAt: '2026-09-03T10:00:00Z',
    },
    statusHistory: [
      { fromStatus: null, toStatus: 'draft', reason: 'Seeded showcase draft' },
      { fromStatus: 'draft', toStatus: 'submitted', reason: 'Seeded showcase submission' },
      { fromStatus: 'submitted', toStatus: 'under_review', reason: 'Seeded grant review queue' },
      { fromStatus: 'under_review', toStatus: 'decided', reason: 'Seeded released grant award' },
    ],
  },
] as const;
```

- [ ] **Step 2: Add application, decision, status-history, and post-visit-report seed helpers**

Add helper functions under `upsertGrantFixture`:

```ts
const upsertApplicationFixture = async ({
  prisma,
  existingId,
  data,
}: {
  prisma: PrismaClient;
  existingId: string | null;
  data: Prisma.ApplicationUncheckedCreateInput;
}) =>
  existingId
    ? prisma.application.update({
        where: { id: existingId },
        data,
      })
    : prisma.application.create({ data });

const replaceApplicationStatusHistory = async ({
  prisma,
  applicationId,
  changedByUserId,
  events,
}: {
  prisma: PrismaClient;
  applicationId: string;
  changedByUserId: string;
  events: ReadonlyArray<{ fromStatus: string | null; toStatus: string; reason: string }>;
}) => {
  await prisma.applicationStatusHistory.deleteMany({
    where: { applicationId },
  });

  await prisma.applicationStatusHistory.createMany({
    data: events.map((event, index) => ({
      applicationId,
      fromStatus: event.fromStatus,
      toStatus: event.toStatus,
      changedByUserId,
      reason: event.reason,
      createdAt: new Date(Date.UTC(2026, 3, 28, 8, 0, index)),
    })),
  });
};

const upsertReleasedDecision = async ({
  prisma,
  applicationId,
  applicationType,
  decidedByUserId,
  decidedAt,
  finalStatus,
  noteExternal,
  releasedAt,
}: {
  prisma: PrismaClient;
  applicationId: string;
  applicationType: string;
  decidedByUserId: string;
  decidedAt: string;
  finalStatus: 'accepted' | 'rejected';
  noteExternal: string;
  releasedAt: string;
}) =>
  prisma.decision.upsert({
    where: { applicationId },
    update: {
      decisionKind: applicationType === 'grant_application' ? 'travel_grant' : 'conference_admission',
      finalStatus,
      releaseStatus: 'released',
      noteInternal: 'Seeded demo outcome.',
      noteExternal,
      decidedByUserId,
      decidedAt: new Date(decidedAt),
      releasedAt: new Date(releasedAt),
    },
    create: {
      applicationId,
      decisionKind: applicationType === 'grant_application' ? 'travel_grant' : 'conference_admission',
      finalStatus,
      releaseStatus: 'released',
      noteInternal: 'Seeded demo outcome.',
      noteExternal,
      decidedByUserId,
      decidedAt: new Date(decidedAt),
      releasedAt: new Date(releasedAt),
    },
  });
```

- [ ] **Step 3: Seed the showcase applicant records in `ensureDemoBaseline` after conferences and grants exist**

Append this seeding block before the final `return`:

```ts
  const showcaseProfileSnapshot = JSON.stringify(
    buildApplicantProfileSnapshot(showcaseApplicantAccount.profile)
  );

  const acceptedConferenceRecord = await upsertApplicationFixture({
    prisma,
    existingId:
      (
        await prisma.application.findFirst({
          where: {
            conferenceId: conferenceByKey.primaryConference.id,
            applicantUserId: showcaseApplicantAccount.user.id,
            applicationType: 'conference_application',
          },
        })
      )?.id ?? null,
    data: {
      applicationType: 'conference_application',
      sourceModule: 'M2',
      conferenceId: conferenceByKey.primaryConference.id,
      applicantUserId: showcaseApplicantAccount.user.id,
      status: 'decided',
      participationType: 'talk',
      statement: 'Presenting current joint work tied to the integration-grant collaboration track.',
      abstractTitle: 'Automorphic Cohomology Across Regional Research Networks',
      abstractText: 'The talk links modularity questions to multi-institution collaboration patterns across Asia.',
      interestedInTravelSupport: true,
      extraAnswersJson: JSON.stringify({}),
      applicantProfileSnapshotJson: showcaseProfileSnapshot,
      submittedAt: new Date('2026-05-02T09:30:00Z'),
      decidedAt: new Date('2026-05-12T11:30:00Z'),
    },
  });

  const underReviewConferenceRecord = await upsertApplicationFixture({
    prisma,
    existingId:
      (
        await prisma.application.findFirst({
          where: {
            conferenceId: conferenceByKey.topologyConference.id,
            applicantUserId: showcaseApplicantAccount.user.id,
            applicationType: 'conference_application',
          },
        })
      )?.id ?? null,
    data: {
      applicationType: 'conference_application',
      sourceModule: 'M2',
      conferenceId: conferenceByKey.topologyConference.id,
      applicantUserId: showcaseApplicantAccount.user.id,
      status: 'under_review',
      participationType: 'talk',
      statement: 'Seeking feedback on new topology results and regional collaboration pathways.',
      abstractTitle: 'Functorial Invariants In Low-Dimensional Topology',
      abstractText: 'We study how functorial invariants behave under diagrammatic moves across linked manifolds.',
      interestedInTravelSupport: true,
      extraAnswersJson: JSON.stringify({}),
      applicantProfileSnapshotJson: showcaseProfileSnapshot,
      submittedAt: new Date('2026-05-18T10:00:00Z'),
      decidedAt: null,
    },
  });

  const rejectedConferenceRecord = await upsertApplicationFixture({
    prisma,
    existingId:
      (
        await prisma.application.findFirst({
          where: {
            conferenceId: conferenceByKey.closedConference.id,
            applicantUserId: showcaseApplicantAccount.user.id,
            applicationType: 'conference_application',
          },
        })
      )?.id ?? null,
    data: {
      applicationType: 'conference_application',
      sourceModule: 'M2',
      conferenceId: conferenceByKey.closedConference.id,
      applicantUserId: showcaseApplicantAccount.user.id,
      status: 'decided',
      participationType: 'participant',
      statement: 'Seeking exposure to the applied PDE programme and mentoring discussions.',
      abstractTitle: null,
      abstractText: null,
      interestedInTravelSupport: false,
      extraAnswersJson: JSON.stringify({}),
      applicantProfileSnapshotJson: showcaseProfileSnapshot,
      submittedAt: new Date('2025-09-18T14:00:00Z'),
      decidedAt: new Date('2025-10-22T15:30:00Z'),
    },
  });

  const acceptedGrantRecord = await upsertApplicationFixture({
    prisma,
    existingId:
      (
        await prisma.application.findFirst({
          where: {
            grantId: grantByKey.primaryGrant.id,
            applicantUserId: showcaseApplicantAccount.user.id,
            applicationType: 'grant_application',
          },
        })
      )?.id ?? null,
    data: {
      applicationType: 'grant_application',
      sourceModule: 'M7',
      grantId: grantByKey.primaryGrant.id,
      linkedConferenceId: conferenceByKey.primaryConference.id,
      linkedConferenceApplicationId: acceptedConferenceRecord.id,
      applicantUserId: showcaseApplicantAccount.user.id,
      status: 'decided',
      statement: 'Requesting travel support for the accepted conference participation.',
      travelPlanSummary: 'Round-trip airfare from Jakarta and four nights of lodging.',
      fundingNeedSummary: 'Airfare support requested, with lodging co-funded by home department.',
      extraAnswersJson: JSON.stringify({}),
      applicantProfileSnapshotJson: showcaseProfileSnapshot,
      submittedAt: new Date('2026-05-15T08:45:00Z'),
      decidedAt: new Date('2026-05-25T12:00:00Z'),
    },
  });
```

- [ ] **Step 4: Seed status history, released decisions, and the accepted grant post-visit report**

Continue in `ensureDemoBaseline` with explicit follow-up data:

```ts
  await replaceApplicationStatusHistory({
    prisma,
    applicationId: underReviewConferenceRecord.id,
    changedByUserId: organizerAccount.user.id,
    events: [
      { fromStatus: null, toStatus: 'draft', reason: 'Seeded showcase draft' },
      { fromStatus: 'draft', toStatus: 'submitted', reason: 'Seeded showcase submission' },
      { fromStatus: 'submitted', toStatus: 'under_review', reason: 'Seeded reviewer triage' },
    ],
  });

  await replaceApplicationStatusHistory({
    prisma,
    applicationId: acceptedConferenceRecord.id,
    changedByUserId: organizerAccount.user.id,
    events: [
      { fromStatus: null, toStatus: 'draft', reason: 'Seeded showcase draft' },
      { fromStatus: 'draft', toStatus: 'submitted', reason: 'Seeded showcase submission' },
      { fromStatus: 'submitted', toStatus: 'under_review', reason: 'Seeded organizer review start' },
      { fromStatus: 'under_review', toStatus: 'decided', reason: 'Seeded released acceptance' },
    ],
  });

  await replaceApplicationStatusHistory({
    prisma,
    applicationId: rejectedConferenceRecord.id,
    changedByUserId: organizerAccount.user.id,
    events: [
      { fromStatus: null, toStatus: 'draft', reason: 'Seeded showcase draft' },
      { fromStatus: 'draft', toStatus: 'submitted', reason: 'Seeded showcase submission' },
      { fromStatus: 'submitted', toStatus: 'under_review', reason: 'Seeded review queue' },
      { fromStatus: 'under_review', toStatus: 'decided', reason: 'Seeded released rejection' },
    ],
  });

  await replaceApplicationStatusHistory({
    prisma,
    applicationId: acceptedGrantRecord.id,
    changedByUserId: organizerAccount.user.id,
    events: [
      { fromStatus: null, toStatus: 'draft', reason: 'Seeded showcase draft' },
      { fromStatus: 'draft', toStatus: 'submitted', reason: 'Seeded showcase submission' },
      { fromStatus: 'submitted', toStatus: 'under_review', reason: 'Seeded grant review queue' },
      { fromStatus: 'under_review', toStatus: 'decided', reason: 'Seeded released grant award' },
    ],
  });

  await upsertReleasedDecision({
    prisma,
    applicationId: acceptedConferenceRecord.id,
    applicationType: 'conference_application',
    decidedByUserId: organizerAccount.user.id,
    decidedAt: '2026-05-12T11:30:00Z',
    finalStatus: 'accepted',
    noteExternal:
      'We are pleased to inform you that your conference application has been accepted.',
    releasedAt: '2026-05-13T09:00:00Z',
  });

  await upsertReleasedDecision({
    prisma,
    applicationId: rejectedConferenceRecord.id,
    applicationType: 'conference_application',
    decidedByUserId: organizerAccount.user.id,
    decidedAt: '2025-10-22T15:30:00Z',
    finalStatus: 'rejected',
    noteExternal:
      'Thank you for your application. We were not able to offer a place in this cycle.',
    releasedAt: '2025-10-23T09:15:00Z',
  });

  await upsertReleasedDecision({
    prisma,
    applicationId: acceptedGrantRecord.id,
    applicationType: 'grant_application',
    decidedByUserId: organizerAccount.user.id,
    decidedAt: '2026-05-25T12:00:00Z',
    finalStatus: 'accepted',
    noteExternal:
      'Travel support has been awarded for the accepted conference participation.',
    releasedAt: '2026-05-26T09:30:00Z',
  });

  await prisma.postVisitReport.upsert({
    where: { applicationId: acceptedGrantRecord.id },
    update: {
      status: 'submitted',
      reportNarrative:
        'Travel support enabled attendance, a contributed talk, and follow-up collaboration meetings after the conference.',
      attendanceConfirmed: true,
      submittedAt: new Date('2026-09-03T10:00:00Z'),
    },
    create: {
      applicationId: acceptedGrantRecord.id,
      status: 'submitted',
      reportNarrative:
        'Travel support enabled attendance, a contributed talk, and follow-up collaboration meetings after the conference.',
      attendanceConfirmed: true,
      submittedAt: new Date('2026-09-03T10:00:00Z'),
    },
  });
```

- [ ] **Step 5: Generalize cleanup so all new seeded slugs and accounts are removed deterministically**

Replace the single-slug cleanup logic with slug arrays:

```ts
  const demoEmails = DEMO_ACCOUNT_ENTRIES.map(([, account]) => account.email);
  const conferenceSlugs = DEMO_BASELINE_FIXTURE.conferenceFixtures.map((item) => item.slug);
  const grantSlugs = DEMO_BASELINE_FIXTURE.grantFixtures.map((item) => item.slug);

  await prisma.applicationStatusHistory.deleteMany({
    where: {
      application: {
        OR: [
          { conference: { slug: { in: conferenceSlugs } } },
          { grant: { slug: { in: grantSlugs } } },
          { applicant: { email: { in: demoEmails } } },
        ],
      },
    },
  });

  await prisma.application.deleteMany({
    where: {
      OR: [
        { conference: { slug: { in: conferenceSlugs } } },
        { grant: { slug: { in: grantSlugs } } },
        { applicant: { email: { in: demoEmails } } },
      ],
    },
  });

  await prisma.grantOpportunity.deleteMany({
    where: { slug: { in: grantSlugs } },
  });

  await prisma.conference.deleteMany({
    where: { slug: { in: conferenceSlugs } },
  });
```

- [ ] **Step 6: Run the focused seed test and confirm it passes green**

Run:

```bash
cd /Users/brenda/Projects/Asian-Mathematical-Network-demo-seed-breadth/backend
../node_modules/.bin/jest --runInBand tests/demoBaseline.test.ts
```

Expected:

```text
Test Suites: 1 passed, 1 total
```

- [ ] **Step 7: Commit the seeded workflow expansion**

```bash
cd /Users/brenda/Projects/Asian-Mathematical-Network-demo-seed-breadth
git add backend/src/lib/demoBaseline.ts backend/tests/demoBaseline.test.ts
git commit -m "feat: seed richer applicant demo workflows"
```

### Task 4: Verify the real seed locally and reseed the hosted backend before smoke testing

**Files:**
- Modify: none
- Verify: local PostgreSQL, Railway-hosted PostgreSQL, existing hosted preview frontend

- [ ] **Step 1: Run the local seed script and confirm the summary exposes the new account and count shape**

Run:

```bash
cd /Users/brenda/Projects/Asian-Mathematical-Network-demo-seed-breadth
zsh -lc 'set -a; source backend/.env; set +a; npm run seed:demo'
```

Expected summary fragments:

```json
{
  "counts": {
    "conferences": 4,
    "publishedConferences": 3,
    "closedConferences": 1,
    "grants": 2
  },
  "accounts": {
    "showcaseApplicant": {
      "email": "demo.showcase.applicant@asiamath.org"
    }
  }
}
```

- [ ] **Step 2: Run the full backend suite against PostgreSQL**

Run:

```bash
cd /Users/brenda/Projects/Asian-Mathematical-Network-demo-seed-breadth
zsh -lc 'set -a; source backend/.env; set +a; npm run test:backend'
```

Expected:

```text
Test Suites: 10 passed, 10 total
Tests:       52 passed, 52 total
```

- [ ] **Step 3: Reseed the Railway-hosted backend**

Run:

```bash
cd /Users/brenda/Projects/Asian-Mathematical-Network-demo-seed-breadth
railway run npm run seed:demo
```

Expected:

```text
Demo baseline ready
```

and a JSON summary showing the same `counts` and `showcaseApplicant` entry as the local run.

- [ ] **Step 4: Verify the live backend counts reflect published-only public visibility**

Run:

```bash
curl -sS https://backend-production-2d8c.up.railway.app/api/v1/conferences | jq '.meta.total'
curl -sS https://backend-production-2d8c.up.railway.app/api/v1/grants | jq '.meta.total'
```

Expected:

```text
3
2
```

Use `3` for conferences because public conference APIs intentionally exclude the seeded closed conference.

- [ ] **Step 5: Verify the latest hosted preview as both clean and showcase applicants**

Run:

```bash
vercel ls --scope feishus-projects
```

Then open the newest Preview URL for `asiamath-demo-d0-frontend-preview` and perform these checks:

1. Log in as `demo.applicant@asiamath.org` / `demo123456` and confirm `/me/applications` still shows the empty-state hints.
2. Log out, then log in as `demo.showcase.applicant@asiamath.org` / `demo123456`.
3. Confirm `/me/applications` shows:
   - one `Under review` conference record
   - one `Accepted` conference result
   - one `Rejected` conference result
   - one awarded grant record with a released result path
4. Open `/portal` and confirm the opportunity surfaces feel denser than the one-conference/one-grant baseline.

- [ ] **Step 6: Commit the verification-only changes only if you had to edit any repo files during verification**

No commit is required if verification only touched the database and hosted environments.

## Self-Review

- Spec coverage: this plan covers the medium seed expansion (`4` conferences, `2` grants, one showcase applicant, under-review + accepted + rejected workflow states, one closed conference, clean applicant preserved).
- Spec gap handled explicitly: the approved design asked for one closed conference to create time layering. Existing public APIs filter to `status=published`, so the plan keeps the closed conference for applicant/result realism and exposes its existence through seed counts rather than expanding public product scope.
- Placeholder scan: no `TODO`, `TBD`, “implement later”, or vague “add tests” placeholders remain.
- Type consistency: the plan uses `showcaseApplicant`, `conferenceFixtures`, `grantFixtures`, `counts.publishedConferences`, `counts.closedConferences`, and the existing `conference_application` / `grant_application` / `under_review` / `decided` / `accepted` / `rejected` contract consistently across tasks.

## Execution Handoff

Plan complete and saved to `/Users/brenda/Projects/Asian-Mathematical-Network/docs/superpowers/plans/2026-04-28-demo-seed-breadth-and-workflow-plan.md`.

Two execution options:

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

Which approach?
