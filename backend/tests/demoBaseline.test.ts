import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import {
  buildDemoBaselineSummary,
  cleanupDemoBaseline,
  DEMO_BASELINE_FIXTURE,
  ensureDemoBaseline,
} from '../src/lib/demoBaseline';

const prisma = new PrismaClient();

describe('demo baseline fixture', () => {
  beforeAll(async () => {
    await cleanupDemoBaseline(prisma);
  });

  afterAll(async () => {
    await cleanupDemoBaseline(prisma);
    await prisma.$disconnect();
  });

  it('creates a published conference and a published linked grant deterministically', async () => {
    const first = await ensureDemoBaseline(prisma);
    const second = await ensureDemoBaseline(prisma);

    expect(first.conference.slug).toBe('integration-grant-conf-2026');
    expect(first.conference.status).toBe('published');
    expect(first.grant.slug).toBe('integration-grant-2026-travel-support');
    expect(first.grant.status).toBe('published');
    expect(first.grant.linkedConferenceId).toBe(first.conference.id);

    expect(second.conference.id).toBe(first.conference.id);
    expect(second.grant.id).toBe(first.grant.id);

    const publishedGrant = await prisma.grantOpportunity.findUnique({
      where: { slug: 'integration-grant-2026-travel-support' },
    });

    expect(publishedGrant?.status).toBe('published');
  });

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

  it('keeps the clean applicant empty, seeds one reviewer applicant record, and preserves the showcase workflow set', async () => {
    const fixture = await ensureDemoBaseline(prisma);
    const cleanApplicant = fixture.demoAccounts.find((account) => account.key === 'applicant');
    const reviewer = fixture.demoAccounts.find((account) => account.key === 'reviewer');
    const showcaseApplicant = fixture.demoAccounts.find(
      (account) => account.key === 'showcaseApplicant'
    );

    expect(cleanApplicant).toBeDefined();
    expect(reviewer).toBeDefined();
    expect(showcaseApplicant).toBeDefined();

    const cleanApplicantApplications = await prisma.application.findMany({
      where: { applicantUserId: cleanApplicant!.user.id },
    });

    expect(cleanApplicantApplications).toHaveLength(0);

    const reviewerApplications = await prisma.application.findMany({
      where: { applicantUserId: reviewer!.user.id },
      include: {
        conference: true,
        decision: true,
      },
      orderBy: [{ createdAt: 'asc' }],
    });

    expect(reviewerApplications).toEqual([
      expect.objectContaining({
        applicationType: 'conference_application',
        status: 'under_review',
        conference: expect.objectContaining({ slug: 'regional-topology-symposium-2026' }),
        decision: null,
      }),
    ]);

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
          conference: expect.objectContaining({ slug: 'number-theory-collaboration-workshop-2026' }),
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
          grant: expect.objectContaining({ slug: 'number-theory-collaboration-travel-support-2026' }),
          decision: expect.objectContaining({
            finalStatus: 'accepted',
            releaseStatus: 'released',
          }),
          postVisitReport: expect.objectContaining({ status: 'submitted' }),
        }),
      ])
    );
  });

  it('seeds at least one reviewer assignment that matches the showcase under-review contract', async () => {
    const fixture = await ensureDemoBaseline(prisma);
    const organizer = fixture.demoAccounts.find((account) => account.key === 'organizer');
    const reviewer = fixture.demoAccounts.find((account) => account.key === 'reviewer');
    const showcaseApplicant = fixture.demoAccounts.find(
      (account) => account.key === 'showcaseApplicant'
    );

    expect(organizer).toBeDefined();
    expect(reviewer).toBeDefined();
    expect(showcaseApplicant).toBeDefined();

    const reviewerAssignments = await prisma.reviewAssignment.findMany({
      where: { reviewerUserId: reviewer!.user.id },
      include: {
        application: {
          include: {
            conference: true,
            grant: true,
          },
        },
      },
      orderBy: [{ assignedAt: 'desc' }],
    });

    expect(reviewerAssignments.length).toBeGreaterThanOrEqual(1);
    expect(reviewerAssignments).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          reviewerUserId: reviewer!.user.id,
          assignedByUserId: organizer!.user.id,
          status: 'assigned',
          conflictState: 'clear',
          application: expect.objectContaining({
            applicantUserId: showcaseApplicant!.user.id,
            applicationType: 'conference_application',
            status: 'under_review',
            conference: expect.objectContaining({ slug: 'regional-topology-symposium-2026' }),
            grant: null,
          }),
        }),
      ])
    );
  });

  it('creates stable demo accounts, public/private scholar-profile baselines, and role-capable organizer/reviewer accounts', async () => {
    const fixture = await ensureDemoBaseline(prisma);

    expect(fixture.demoAccounts.map((account) => account.key)).toEqual([
      'organizer',
      'reviewer',
      'applicant',
      'showcaseApplicant',
    ]);

    expect(fixture.demoAccounts).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: 'organizer',
          email: DEMO_BASELINE_FIXTURE.demoAccounts.organizer.email,
          profile: expect.objectContaining({
            slug: DEMO_BASELINE_FIXTURE.demoAccounts.organizer.slug,
            isProfilePublic: false,
          }),
        }),
        expect.objectContaining({
          key: 'reviewer',
          email: DEMO_BASELINE_FIXTURE.demoAccounts.reviewer.email,
          profile: expect.objectContaining({
            slug: DEMO_BASELINE_FIXTURE.demoAccounts.reviewer.slug,
            isProfilePublic: true,
          }),
        }),
        expect.objectContaining({
          key: 'applicant',
          email: DEMO_BASELINE_FIXTURE.demoAccounts.applicant.email,
          profile: expect.objectContaining({
            slug: DEMO_BASELINE_FIXTURE.demoAccounts.applicant.slug,
            isProfilePublic: true,
          }),
        }),
        expect.objectContaining({
          key: 'showcaseApplicant',
          email: DEMO_BASELINE_FIXTURE.demoAccounts.showcaseApplicant.email,
          profile: expect.objectContaining({
            slug: DEMO_BASELINE_FIXTURE.demoAccounts.showcaseApplicant.slug,
            isProfilePublic: true,
          }),
        }),
      ])
    );

    const organizer = fixture.demoAccounts.find((account) => account.key === 'organizer');
    const reviewer = fixture.demoAccounts.find((account) => account.key === 'reviewer');
    const applicant = fixture.demoAccounts.find((account) => account.key === 'applicant');

    expect(organizer).toBeDefined();
    expect(reviewer).toBeDefined();
    expect(applicant).toBeDefined();

    const organizerUser = await prisma.user.findUnique({
      where: { id: organizer!.user.id },
      include: {
        profile: true,
        userRoles: true,
      },
    });

    const reviewerUser = await prisma.user.findUnique({
      where: { id: reviewer!.user.id },
      include: {
        profile: true,
        userRoles: true,
      },
    });

    expect(organizerUser?.profile?.fullName).toBe(DEMO_BASELINE_FIXTURE.creatorFullName);
    expect(organizerUser?.userRoles.map((item) => item.role)).toEqual(
      expect.arrayContaining(['applicant', 'organizer'])
    );

    expect(reviewerUser?.profile?.fullName).toBe(DEMO_BASELINE_FIXTURE.reviewerFullName);
    expect(reviewerUser?.userRoles.map((item) => item.role)).toEqual(
      expect.arrayContaining(['applicant', 'reviewer'])
    );

    const organizerStaff = await prisma.conferenceStaff.findUnique({
      where: {
        conferenceId_userId: {
          conferenceId: fixture.conference.id,
          userId: organizer!.user.id,
        },
      },
    });

    expect(organizerStaff?.staffRole).toBe('owner');

    const reviewerProfileRecord = await prisma.profile.findUnique({
      where: { userId: reviewer!.user.id },
    });

    expect(reviewerProfileRecord?.slug).toBe(DEMO_BASELINE_FIXTURE.demoAccounts.reviewer.slug);
    expect(reviewerProfileRecord?.isProfilePublic).toBe(true);

    const passwordMatches = await bcrypt.compare(
      DEMO_BASELINE_FIXTURE.demoPassword,
      applicant!.user.passwordHash
    );

    expect(passwordMatches).toBe(true);
    expect(applicant?.email).toBe(DEMO_BASELINE_FIXTURE.demoAccounts.applicant.email);

    const summary = buildDemoBaselineSummary(fixture);
    expect(summary.accounts.applicant).toEqual(
      expect.objectContaining({
        email: DEMO_BASELINE_FIXTURE.applicantEmail,
        password: DEMO_BASELINE_FIXTURE.applicantPassword,
        role: 'applicant',
      })
    );
    expect(summary.accounts.showcaseApplicant).toEqual(
      expect.objectContaining({
        email: DEMO_BASELINE_FIXTURE.showcaseApplicantEmail,
        password: DEMO_BASELINE_FIXTURE.showcaseApplicantPassword,
        role: 'applicant',
      })
    );
    expect(summary.counts).toEqual({
      conferences: 4,
      publishedConferences: 3,
      closedConferences: 1,
      grants: 2,
    });
    expect(summary.routes).toEqual(
      expect.objectContaining({
        applicantPrivateProfile: '/me/profile',
        applicantPublicScholar: '/scholars/aisha-rahman',
        reviewerPublicScholar: '/scholars/ravi-iyer',
        organizerPrivateProfile: '/me/profile',
        organizerPublicScholar: null,
      })
    );
    expect(summary.quickStart).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          step: 1,
          account: 'applicant',
          open: '/me/profile',
          loginRequired: true,
        }),
        expect.objectContaining({
          step: 3,
          account: 'reviewer',
          open: '/dashboard',
          loginRequired: true,
        }),
      ])
    );
    expect(summary.demoAccounts).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: 'reviewer',
          start_here: '/dashboard',
        }),
      ])
    );
    expect(summary.walkthrough).toEqual(
      expect.arrayContaining([expect.stringContaining('workspace switcher')])
    );
  });
});
