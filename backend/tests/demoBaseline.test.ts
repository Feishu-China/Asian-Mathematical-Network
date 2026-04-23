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

  it('creates stable demo accounts, public/private scholar-profile baselines, and role-capable organizer/reviewer accounts', async () => {
    const fixture = await ensureDemoBaseline(prisma);

    expect(fixture.demoAccounts.map((account) => account.key)).toEqual([
      'organizer',
      'reviewer',
      'applicant',
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
          open: '/scholars/ravi-iyer',
          loginRequired: false,
        }),
      ])
    );
  });
});
