import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import app from '../src/app';

const prisma = new PrismaClient();

describe('GET /api/v1/me/applications', () => {
  const ownerEmail = 'me-apps.owner@example.com';
  const otherEmail = 'me-apps.other@example.com';
  const noAppsEmail = 'me-apps.empty@example.com';
  const trackedEmails = [ownerEmail, otherEmail, noAppsEmail];
  const conferenceSlug = 'me-apps-conf-2026';
  const decidedConferenceSlug = 'me-apps-decided-conf-2026';
  const grantSlug = 'me-apps-grant-2026';

  let ownerToken = '';
  let ownerUserId = '';
  let otherToken = '';
  let otherUserId = '';
  let noAppsToken = '';
  let conferenceId = '';
  let grantId = '';
  let conferenceApplicationId = '';
  let grantApplicationId = '';
  let decidedConferenceApplicationId = '';

  const cleanup = async () => {
    await prisma.applicationStatusHistory.deleteMany();
    await prisma.application.deleteMany();
    await prisma.grantOpportunity.deleteMany({ where: { slug: grantSlug } });
    await prisma.conferenceStaff.deleteMany();
    await prisma.conference.deleteMany({ where: { slug: { in: [conferenceSlug, decidedConferenceSlug] } } });
    await prisma.user.deleteMany({ where: { email: { in: trackedEmails } } });
  };

  beforeAll(async () => {
    await cleanup();

    const creator = await prisma.user.create({
      data: {
        email: 'me-apps.creator@example.com',
        passwordHash: 'hash',
        status: 'active',
      },
    });
    trackedEmails.push(creator.email);

    const conference = await prisma.conference.create({
      data: {
        slug: conferenceSlug,
        title: 'Me Applications Conference 2026',
        shortName: 'MAC2026',
        locationText: 'Tokyo',
        startDate: '2026-09-01',
        endDate: '2026-09-05',
        applicationDeadline: new Date('2026-07-01T23:59:59Z'),
        status: 'published',
        applicationFormSchemaJson: JSON.stringify({ fields: [] }),
        settingsJson: JSON.stringify({}),
        publishedAt: new Date('2026-04-22T10:00:00Z'),
        createdByUserId: creator.id,
      },
    });
    conferenceId = conference.id;

    const grant = await prisma.grantOpportunity.create({
      data: {
        linkedConferenceId: conference.id,
        slug: grantSlug,
        title: 'Me Applications Grant 2026',
        grantType: 'conference_travel_grant',
        applicationDeadline: new Date('2026-06-15T23:59:59Z'),
        status: 'published',
        reportRequired: false,
        applicationFormSchemaJson: JSON.stringify({ fields: [] }),
        settingsJson: JSON.stringify({}),
        publishedAt: new Date('2026-04-22T11:00:00Z'),
        createdByUserId: creator.id,
      },
    });
    grantId = grant.id;

    const ownerRegister = await request(app)
      .post('/api/v1/auth/register')
      .send({ email: ownerEmail, password: 'password123', fullName: 'Me Apps Owner' });
    ownerToken = ownerRegister.body.accessToken;
    ownerUserId = ownerRegister.body.user.id;

    const otherRegister = await request(app)
      .post('/api/v1/auth/register')
      .send({ email: otherEmail, password: 'password123', fullName: 'Me Apps Other' });
    otherToken = otherRegister.body.accessToken;
    otherUserId = otherRegister.body.user.id;

    const noAppsRegister = await request(app)
      .post('/api/v1/auth/register')
      .send({ email: noAppsEmail, password: 'password123', fullName: 'Me Apps Empty' });
    noAppsToken = noAppsRegister.body.accessToken;

    const ownerConferenceApp = await prisma.application.create({
      data: {
        applicationType: 'conference_application',
        sourceModule: 'M2',
        conferenceId: conference.id,
        applicantUserId: ownerUserId,
        status: 'submitted',
        statement: 'I would like to attend.',
        extraAnswersJson: JSON.stringify({}),
        submittedAt: new Date('2026-05-01T09:00:00Z'),
        updatedAt: new Date('2026-05-01T09:00:00Z'),
      },
    });
    conferenceApplicationId = ownerConferenceApp.id;

    const ownerGrantApp = await prisma.application.create({
      data: {
        applicationType: 'grant_application',
        sourceModule: 'M7',
        grantId: grant.id,
        linkedConferenceId: conference.id,
        linkedConferenceApplicationId: ownerConferenceApp.id,
        applicantUserId: ownerUserId,
        status: 'draft',
        statement: 'Travel funding request.',
        travelPlanSummary: 'Round trip flights.',
        fundingNeedSummary: 'Airfare support.',
        extraAnswersJson: JSON.stringify({}),
        updatedAt: new Date('2026-05-02T09:00:00Z'),
      },
    });
    grantApplicationId = ownerGrantApp.id;

    const decidedConference = await prisma.conference.create({
      data: {
        slug: decidedConferenceSlug,
        title: 'Me Applications Decided Conference 2026',
        applicationDeadline: new Date('2026-03-01T23:59:59Z'),
        status: 'published',
        applicationFormSchemaJson: JSON.stringify({ fields: [] }),
        settingsJson: JSON.stringify({}),
        publishedAt: new Date('2026-01-01T10:00:00Z'),
        createdByUserId: creator.id,
      },
    });

    const decidedApp = await prisma.application.create({
      data: {
        applicationType: 'conference_application',
        sourceModule: 'M2',
        conferenceId: decidedConference.id,
        applicantUserId: ownerUserId,
        status: 'decided',
        participationType: 'talk',
        statement: 'Decided application example.',
        extraAnswersJson: JSON.stringify({}),
        submittedAt: new Date('2026-04-15T09:00:00Z'),
        decidedAt: new Date('2026-04-28T10:00:00Z'),
        updatedAt: new Date('2026-04-28T10:00:00Z'),
      },
    });
    decidedConferenceApplicationId = decidedApp.id;

    await prisma.application.create({
      data: {
        applicationType: 'conference_application',
        sourceModule: 'M2',
        conferenceId: conference.id,
        applicantUserId: otherUserId,
        status: 'submitted',
        statement: 'Other user application.',
        extraAnswersJson: JSON.stringify({}),
        submittedAt: new Date('2026-05-03T09:00:00Z'),
      },
    });
  });

  afterAll(async () => {
    await cleanup();
    await prisma.user.deleteMany({ where: { email: 'me-apps.creator@example.com' } });
    await prisma.$disconnect();
  });

  it('returns 401 when no Bearer token is provided', async () => {
    const res = await request(app).get('/api/v1/me/applications');
    expect(res.status).toBe(401);
  });

  it('returns an empty list when the user has no applications', async () => {
    const res = await request(app)
      .get('/api/v1/me/applications')
      .set('Authorization', `Bearer ${noAppsToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.items).toEqual([]);
    expect(res.body.meta.total).toBe(0);
  });

  it('returns only the requesting user applications, sorted by updatedAt desc', async () => {
    const res = await request(app)
      .get('/api/v1/me/applications')
      .set('Authorization', `Bearer ${ownerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.meta.total).toBe(3);
    const ids = res.body.data.items.map((item: { id: string }) => item.id);
    expect(ids).toEqual([
      grantApplicationId,
      conferenceApplicationId,
      decidedConferenceApplicationId,
    ]);
  });

  it('serializes a conference application with conference context populated', async () => {
    const res = await request(app)
      .get('/api/v1/me/applications')
      .set('Authorization', `Bearer ${ownerToken}`);

    const item = res.body.data.items.find(
      (i: { id: string }) => i.id === conferenceApplicationId
    );
    expect(item).toMatchObject({
      application_type: 'conference_application',
      source_module: 'M2',
      status: 'submitted',
      conference_id: conferenceId,
      conference_slug: conferenceSlug,
      conference_title: 'Me Applications Conference 2026',
      grant_id: null,
      grant_slug: null,
      grant_title: null,
      linked_conference_application_id: null,
      decision: null,
    });
    expect(item.submitted_at).toBe('2026-05-01T09:00:00.000Z');
  });

  it('serializes a grant application with grant context and linked conference application id', async () => {
    const res = await request(app)
      .get('/api/v1/me/applications')
      .set('Authorization', `Bearer ${ownerToken}`);

    const item = res.body.data.items.find(
      (i: { id: string }) => i.id === grantApplicationId
    );
    expect(item).toMatchObject({
      application_type: 'grant_application',
      source_module: 'M7',
      status: 'draft',
      conference_id: null,
      conference_slug: null,
      conference_title: null,
      grant_id: grantId,
      grant_slug: grantSlug,
      grant_title: 'Me Applications Grant 2026',
      linked_conference_id: conferenceId,
      linked_conference_application_id: conferenceApplicationId,
      submitted_at: null,
      decision: null,
    });
  });

  it('keeps decision null even for decided applications until release semantics land', async () => {
    const res = await request(app)
      .get('/api/v1/me/applications')
      .set('Authorization', `Bearer ${ownerToken}`);

    const decided = res.body.data.items.find(
      (i: { id: string }) => i.id === decidedConferenceApplicationId
    );
    expect(decided.status).toBe('decided');
    expect(decided.decision).toBeNull();
  });
});
