import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import app from '../src/app';

const prisma = new PrismaClient();

describe('POST /api/v1/me/applications/:id/post-visit-report', () => {
  const ownerEmail = 'pvr.owner@example.com';
  const otherEmail = 'pvr.other@example.com';
  const trackedEmails = [ownerEmail, otherEmail];
  const conferenceSlug = 'pvr-conf-2026';
  const grantSlug = 'pvr-grant-2026';
  const optionalGrantSlug = 'pvr-grant-no-report-2026';

  let ownerToken = '';
  let ownerUserId = '';
  let otherToken = '';
  let creatorId = '';
  let conferenceId = '';
  let grantId = '';
  let optionalGrantId = '';
  let conferenceAppId = '';
  let acceptedGrantAppId = '';
  let rejectedGrantAppId = '';
  let optionalGrantAppId = '';

  const cleanup = async () => {
    await prisma.postVisitReport.deleteMany();
    await prisma.decision.deleteMany();
    await prisma.applicationStatusHistory.deleteMany();
    await prisma.application.deleteMany();
    await prisma.grantOpportunity.deleteMany({
      where: { slug: { in: [grantSlug, optionalGrantSlug] } },
    });
    await prisma.conferenceStaff.deleteMany();
    await prisma.conference.deleteMany({ where: { slug: conferenceSlug } });
    await prisma.user.deleteMany({
      where: { email: { in: [...trackedEmails, 'pvr.creator@example.com'] } },
    });
  };

  beforeAll(async () => {
    await cleanup();

    const creator = await prisma.user.create({
      data: { email: 'pvr.creator@example.com', passwordHash: 'hash', status: 'active' },
    });
    creatorId = creator.id;

    const conference = await prisma.conference.create({
      data: {
        slug: conferenceSlug,
        title: 'PVR Conference 2026',
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
        title: 'PVR Grant 2026',
        grantType: 'conference_travel_grant',
        status: 'published',
        reportRequired: true,
        applicationFormSchemaJson: JSON.stringify({ fields: [] }),
        settingsJson: JSON.stringify({}),
        publishedAt: new Date('2026-04-22T11:00:00Z'),
        createdByUserId: creator.id,
      },
    });
    grantId = grant.id;

    const optionalGrant = await prisma.grantOpportunity.create({
      data: {
        linkedConferenceId: conference.id,
        slug: optionalGrantSlug,
        title: 'PVR Grant No Report 2026',
        grantType: 'conference_travel_grant',
        status: 'published',
        reportRequired: false,
        applicationFormSchemaJson: JSON.stringify({ fields: [] }),
        settingsJson: JSON.stringify({}),
        publishedAt: new Date('2026-04-22T11:00:00Z'),
        createdByUserId: creator.id,
      },
    });
    optionalGrantId = optionalGrant.id;

    const ownerRegister = await request(app)
      .post('/api/v1/auth/register')
      .send({ email: ownerEmail, password: 'password123', fullName: 'PVR Owner' });
    ownerToken = ownerRegister.body.accessToken;
    ownerUserId = ownerRegister.body.user.id;

    const otherRegister = await request(app)
      .post('/api/v1/auth/register')
      .send({ email: otherEmail, password: 'password123', fullName: 'PVR Other' });
    otherToken = otherRegister.body.accessToken;

    const submittedAt = new Date('2026-05-01T09:00:00Z');
    const decidedAt = new Date('2026-05-10T09:00:00Z');
    const releasedAt = new Date('2026-05-11T09:00:00Z');

    const conferenceApp = await prisma.application.create({
      data: {
        applicationType: 'conference_application',
        sourceModule: 'M2',
        conferenceId: conference.id,
        applicantUserId: ownerUserId,
        status: 'decided',
        statement: 'I attended.',
        extraAnswersJson: JSON.stringify({}),
        submittedAt,
        decidedAt,
      },
    });
    conferenceAppId = conferenceApp.id;
    await prisma.decision.create({
      data: {
        applicationId: conferenceApp.id,
        decisionKind: 'conference_admission',
        finalStatus: 'accepted',
        releaseStatus: 'released',
        decidedByUserId: creatorId,
        decidedAt,
        releasedAt,
      },
    });

    const acceptedGrantApp = await prisma.application.create({
      data: {
        applicationType: 'grant_application',
        sourceModule: 'M7',
        grantId: grant.id,
        linkedConferenceId: conference.id,
        linkedConferenceApplicationId: conferenceApp.id,
        applicantUserId: ownerUserId,
        status: 'decided',
        statement: 'Travel funding.',
        travelPlanSummary: 'Round trip flights.',
        fundingNeedSummary: 'Airfare support.',
        extraAnswersJson: JSON.stringify({}),
        submittedAt,
        decidedAt,
      },
    });
    acceptedGrantAppId = acceptedGrantApp.id;
    await prisma.decision.create({
      data: {
        applicationId: acceptedGrantApp.id,
        decisionKind: 'travel_grant',
        finalStatus: 'accepted',
        releaseStatus: 'released',
        decidedByUserId: creatorId,
        decidedAt,
        releasedAt,
        noteExternal: 'Awarded.',
      },
    });

    const optionalGrantApp = await prisma.application.create({
      data: {
        applicationType: 'grant_application',
        sourceModule: 'M7',
        grantId: optionalGrant.id,
        linkedConferenceId: conference.id,
        linkedConferenceApplicationId: conferenceApp.id,
        applicantUserId: ownerUserId,
        status: 'decided',
        statement: 'Optional grant.',
        travelPlanSummary: 'Round trip flights.',
        fundingNeedSummary: 'Airfare support.',
        extraAnswersJson: JSON.stringify({}),
        submittedAt,
        decidedAt,
      },
    });
    optionalGrantAppId = optionalGrantApp.id;
    await prisma.decision.create({
      data: {
        applicationId: optionalGrantApp.id,
        decisionKind: 'travel_grant',
        finalStatus: 'accepted',
        releaseStatus: 'released',
        decidedByUserId: creatorId,
        decidedAt,
        releasedAt,
      },
    });

    const otherApplicantUserId = otherRegister.body.user.id;
    await prisma.application.create({
      data: {
        applicationType: 'conference_application',
        sourceModule: 'M2',
        conferenceId: conference.id,
        applicantUserId: otherApplicantUserId,
        status: 'submitted',
        statement: 'Other applicant.',
        extraAnswersJson: JSON.stringify({}),
        submittedAt,
      },
    });

    const rejectedGrantApp = await prisma.application.create({
      data: {
        applicationType: 'grant_application',
        sourceModule: 'M7',
        grantId: grant.id,
        linkedConferenceId: conference.id,
        linkedConferenceApplicationId: conferenceApp.id,
        applicantUserId: otherApplicantUserId,
        status: 'decided',
        statement: 'Other grant.',
        travelPlanSummary: 'Round trip flights.',
        fundingNeedSummary: 'Airfare support.',
        extraAnswersJson: JSON.stringify({}),
        submittedAt,
        decidedAt,
      },
    });
    rejectedGrantAppId = rejectedGrantApp.id;
    await prisma.decision.create({
      data: {
        applicationId: rejectedGrantApp.id,
        decisionKind: 'travel_grant',
        finalStatus: 'rejected',
        releaseStatus: 'released',
        decidedByUserId: creatorId,
        decidedAt,
        releasedAt,
      },
    });

  });

  afterAll(async () => {
    await cleanup();
    await prisma.$disconnect();
  });

  it('returns 401 without a Bearer token', async () => {
    const res = await request(app)
      .post(`/api/v1/me/applications/${acceptedGrantAppId}/post-visit-report`)
      .send({ report_narrative: 'I attended the workshop.' });
    expect(res.status).toBe(401);
  });

  it('returns 404 when the application is not owned by the requester', async () => {
    const res = await request(app)
      .post(`/api/v1/me/applications/${rejectedGrantAppId}/post-visit-report`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ report_narrative: 'Stolen attempt.' });
    expect(res.status).toBe(404);
  });

  it('returns 422 for a conference application', async () => {
    const res = await request(app)
      .post(`/api/v1/me/applications/${conferenceAppId}/post-visit-report`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ report_narrative: 'I attended the workshop.' });
    expect(res.status).toBe(422);
    expect(res.body.message).toMatch(/grant applications/i);
  });

  it('returns 422 when the grant decision was rejected rather than accepted', async () => {
    const rejectedRes = await request(app)
      .post(`/api/v1/me/applications/${rejectedGrantAppId}/post-visit-report`)
      .set('Authorization', `Bearer ${otherToken}`)
      .send({ report_narrative: 'Should not work.' });
    expect(rejectedRes.status).toBe(422);
    expect(rejectedRes.body.message).toMatch(/released accepted decision/i);
  });

  it('returns 422 when the grant does not require a report', async () => {
    const res = await request(app)
      .post(`/api/v1/me/applications/${optionalGrantAppId}/post-visit-report`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ report_narrative: 'Optional grant.' });
    expect(res.status).toBe(422);
    expect(res.body.message).toMatch(/does not require/i);
  });

  it('returns 422 when report_narrative is missing or empty', async () => {
    const res = await request(app)
      .post(`/api/v1/me/applications/${acceptedGrantAppId}/post-visit-report`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ report_narrative: '   ' });
    expect(res.status).toBe(422);
    expect(res.body.message).toMatch(/report_narrative/i);
  });

  it('returns 422 when attendance_confirmed is provided as a non-boolean', async () => {
    const res = await request(app)
      .post(`/api/v1/me/applications/${acceptedGrantAppId}/post-visit-report`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        report_narrative: 'Attended the workshop and gave a poster.',
        attendance_confirmed: 'true',
      });
    expect(res.status).toBe(422);
    expect(res.body.message).toMatch(/attendance_confirmed/i);
  });

  it('creates the report on the happy path and flips dashboard next_action to view_result', async () => {
    const res = await request(app)
      .post(`/api/v1/me/applications/${acceptedGrantAppId}/post-visit-report`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        report_narrative: 'I attended the workshop and presented a poster.',
        attendance_confirmed: true,
      });

    expect(res.status).toBe(201);
    expect(res.body.data.post_visit_report).toMatchObject({
      status: 'submitted',
      report_narrative: 'I attended the workshop and presented a poster.',
      attendance_confirmed: true,
    });
    expect(res.body.data.post_visit_report.id).toBeDefined();

    const dashboardRes = await request(app)
      .get('/api/v1/me/applications')
      .set('Authorization', `Bearer ${ownerToken}`);

    const dashboardItem = dashboardRes.body.data.items.find(
      (item: { id: string }) => item.id === acceptedGrantAppId
    );
    expect(dashboardItem.post_visit_report_status).toBe('submitted');
    expect(dashboardItem.next_action).toBe('view_result');

    const detailRes = await request(app)
      .get(`/api/v1/me/applications/${acceptedGrantAppId}`)
      .set('Authorization', `Bearer ${ownerToken}`);
    expect(detailRes.body.data.application.post_visit_report).toMatchObject({
      status: 'submitted',
      report_narrative: 'I attended the workshop and presented a poster.',
    });
    expect(detailRes.body.data.application.post_visit_report_status).toBe('submitted');
  });

  it('returns 409 when a report has already been submitted', async () => {
    const res = await request(app)
      .post(`/api/v1/me/applications/${acceptedGrantAppId}/post-visit-report`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ report_narrative: 'Second attempt.' });
    expect(res.status).toBe(409);
  });
});
