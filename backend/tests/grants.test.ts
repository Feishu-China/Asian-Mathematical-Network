import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import app from '../src/app';

const prisma = new PrismaClient();

describe('Grant API', () => {
  const creatorEmail = 'grant.public.creator@example.com';
  const applicantWithoutPrereq = {
    email: 'grant.no-prereq@example.com',
    password: 'password123',
    fullName: 'Grant No Prereq',
  };
  const applicantWithPrereq = {
    email: 'grant.with-prereq@example.com',
    password: 'password123',
    fullName: 'Grant With Prereq',
  };
  const applicantForSubmit = {
    email: 'grant.submit@example.com',
    password: 'password123',
    fullName: 'Grant Submit User',
  };
  const trackedEmails = [
    creatorEmail,
    applicantWithoutPrereq.email,
    applicantWithPrereq.email,
    applicantForSubmit.email,
  ];
  const conferenceSlugs = ['grant-linked-conf-2026'];
  const grantSlugs = ['asiamath-2026-travel-grant', 'asiamath-2026-draft-grant'];
  const formFields = [
    { key: 'linked_conference_application_id', type: 'select', required: true },
    { key: 'statement', type: 'textarea', required: true },
    { key: 'travel_plan_summary', type: 'textarea', required: true },
    { key: 'funding_need_summary', type: 'textarea', required: true },
  ];
  let linkedConferenceId = '';
  let publishedGrantId = '';
  let submittedConferenceApplicationId = '';
  let noPrereqToken = '';
  let withPrereqToken = '';
  let withPrereqUserId = '';
  let submitToken = '';
  let submitUserId = '';
  let submitConferenceApplicationId = '';

  beforeAll(async () => {
    await prisma.applicationStatusHistory.deleteMany();
    await prisma.application.deleteMany();
    await prisma.grantOpportunity.deleteMany({ where: { slug: { in: grantSlugs } } });
    await prisma.conferenceStaff.deleteMany();
    await prisma.conference.deleteMany({ where: { slug: { in: conferenceSlugs } } });
    await prisma.user.deleteMany({ where: { email: { in: trackedEmails } } });

    const creator = await prisma.user.create({
      data: {
        email: creatorEmail,
        passwordHash: 'hash',
        status: 'active',
      },
    });

    const conference = await prisma.conference.create({
      data: {
        slug: 'grant-linked-conf-2026',
        title: 'Grant Linked Conference 2026',
        shortName: 'GLC2026',
        locationText: 'Seoul',
        startDate: '2026-08-10',
        endDate: '2026-08-14',
        description: 'Conference linked to grants',
        applicationDeadline: new Date('2026-06-10T23:59:59Z'),
        status: 'published',
        applicationFormSchemaJson: JSON.stringify({ fields: [] }),
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

    linkedConferenceId = conference.id;

    const publishedGrant = await prisma.grantOpportunity.create({
      data: {
        linkedConferenceId: conference.id,
        slug: 'asiamath-2026-travel-grant',
        title: 'Asiamath 2026 Travel Grant',
        grantType: 'conference_travel_grant',
        description: 'Partial travel support for accepted participants.',
        eligibilitySummary: 'Open to eligible conference applicants.',
        coverageSummary: 'Partial airfare and accommodation support.',
        applicationDeadline: new Date('2026-06-05T23:59:59Z'),
        status: 'published',
        reportRequired: true,
        applicationFormSchemaJson: JSON.stringify({ fields: formFields }),
        settingsJson: JSON.stringify({}),
        publishedAt: new Date('2026-04-22T12:00:00Z'),
        createdByUserId: creator.id,
      },
    });

    publishedGrantId = publishedGrant.id;

    await prisma.grantOpportunity.create({
      data: {
        linkedConferenceId: conference.id,
        slug: 'asiamath-2026-draft-grant',
        title: 'Draft Travel Grant',
        grantType: 'conference_travel_grant',
        description: 'Draft grant that should stay hidden.',
        eligibilitySummary: 'Hidden',
        coverageSummary: 'Hidden',
        applicationDeadline: new Date('2026-06-01T23:59:59Z'),
        status: 'draft',
        reportRequired: false,
        applicationFormSchemaJson: JSON.stringify({ fields: formFields }),
        settingsJson: JSON.stringify({}),
        createdByUserId: creator.id,
      },
    });

    const noPrereqRegisterRes = await request(app)
      .post('/api/v1/auth/register')
      .send(applicantWithoutPrereq);
    noPrereqToken = noPrereqRegisterRes.body.accessToken;

    const withPrereqRegisterRes = await request(app)
      .post('/api/v1/auth/register')
      .send(applicantWithPrereq);
    withPrereqToken = withPrereqRegisterRes.body.accessToken;
    withPrereqUserId = withPrereqRegisterRes.body.user.id;

    const prerequisiteApplication = await prisma.application.create({
      data: {
        applicationType: 'conference_application',
        sourceModule: 'M2',
        conferenceId: conference.id,
        applicantUserId: withPrereqUserId,
        status: 'submitted',
        participationType: 'talk',
        statement: 'I would like to present my work.',
        abstractTitle: 'A Note on Grants',
        abstractText: 'Abstract for prerequisite conference application.',
        interestedInTravelSupport: true,
        extraAnswersJson: JSON.stringify({}),
        submittedAt: new Date('2026-04-30T09:00:00Z'),
      },
    });

    submittedConferenceApplicationId = prerequisiteApplication.id;

    const submitRegisterRes = await request(app).post('/api/v1/auth/register').send(applicantForSubmit);
    submitToken = submitRegisterRes.body.accessToken;
    submitUserId = submitRegisterRes.body.user.id;

    const submitPrerequisiteApplication = await prisma.application.create({
      data: {
        applicationType: 'conference_application',
        sourceModule: 'M2',
        conferenceId: conference.id,
        applicantUserId: submitUserId,
        status: 'submitted',
        participationType: 'participant',
        statement: 'I plan to attend and request funding.',
        interestedInTravelSupport: true,
        extraAnswersJson: JSON.stringify({}),
        submittedAt: new Date('2026-05-01T09:00:00Z'),
      },
    });

    submitConferenceApplicationId = submitPrerequisiteApplication.id;
  });

  afterAll(async () => {
    await prisma.applicationStatusHistory.deleteMany();
    await prisma.application.deleteMany();
    await prisma.grantOpportunity.deleteMany({ where: { slug: { in: grantSlugs } } });
    await prisma.conferenceStaff.deleteMany();
    await prisma.conference.deleteMany({ where: { slug: { in: conferenceSlugs } } });
    await prisma.user.deleteMany({ where: { email: { in: trackedEmails } } });
    await prisma.$disconnect();
  });

  it('lists only published grants and returns detail plus the application form', async () => {
    const listRes = await request(app).get('/api/v1/grants');

    expect(listRes.status).toBe(200);
    expect(listRes.body.data.items).toHaveLength(1);
    expect(listRes.body.data.items[0]).toMatchObject({
      slug: 'asiamath-2026-travel-grant',
      title: 'Asiamath 2026 Travel Grant',
      grant_type: 'conference_travel_grant',
      status: 'published',
      report_required: true,
      is_application_open: true,
    });

    const grantId = listRes.body.data.items[0].id;
    const linkedConferenceId = listRes.body.data.items[0].linked_conference_id;

    const detailRes = await request(app).get('/api/v1/grants/asiamath-2026-travel-grant');

    expect(detailRes.status).toBe(200);
    expect(detailRes.body.data.grant).toMatchObject({
      id: grantId,
      slug: 'asiamath-2026-travel-grant',
      title: 'Asiamath 2026 Travel Grant',
      linked_conference_id: linkedConferenceId,
      description: 'Partial travel support for accepted participants.',
      eligibility_summary: 'Open to eligible conference applicants.',
      coverage_summary: 'Partial airfare and accommodation support.',
      report_required: true,
      is_application_open: true,
    });

    const formRes = await request(app).get(`/api/v1/grants/${grantId}/application-form`);

    expect(formRes.status).toBe(200);
    expect(formRes.body.data).toEqual({
      grant_id: grantId,
      schema: {
        fields: formFields,
      },
    });

    const missingRes = await request(app).get('/api/v1/grants/asiamath-2026-draft-grant');
    expect(missingRes.status).toBe(404);
  });

  it('creates a grant draft only when a submitted linked conference application exists', async () => {
    const emptyReadRes = await request(app)
      .get(`/api/v1/grants/${publishedGrantId}/applications/me`)
      .set('Authorization', `Bearer ${withPrereqToken}`);
    expect(emptyReadRes.status).toBe(404);

    const unauthorizedRes = await request(app)
      .post(`/api/v1/grants/${publishedGrantId}/applications`)
      .send({
        linked_conference_application_id: submittedConferenceApplicationId,
        statement: 'I am requesting travel support to attend the workshop.',
        travel_plan_summary: 'Round trip from Singapore to Seoul with 4 nights lodging.',
        funding_need_summary: 'Airfare support requested; accommodation partially self-funded.',
        extra_answers: {},
        file_ids: [],
      });
    expect(unauthorizedRes.status).toBe(401);

    const missingPrereqRes = await request(app)
      .post(`/api/v1/grants/${publishedGrantId}/applications`)
      .set('Authorization', `Bearer ${noPrereqToken}`)
      .send({
        linked_conference_application_id: submittedConferenceApplicationId,
        statement: 'I am requesting travel support to attend the workshop.',
        travel_plan_summary: 'Round trip from Singapore to Seoul with 4 nights lodging.',
        funding_need_summary: 'Airfare support requested; accommodation partially self-funded.',
        extra_answers: {},
        file_ids: [],
      });
    expect(missingPrereqRes.status).toBe(422);

    const createRes = await request(app)
      .post(`/api/v1/grants/${publishedGrantId}/applications`)
      .set('Authorization', `Bearer ${withPrereqToken}`)
      .send({
        linked_conference_application_id: submittedConferenceApplicationId,
        statement: 'I am requesting travel support to attend the workshop.',
        travel_plan_summary: 'Round trip from Singapore to Seoul with 4 nights lodging.',
        funding_need_summary: 'Airfare support requested; accommodation partially self-funded.',
        extra_answers: {},
        file_ids: [],
      });

    expect(createRes.status).toBe(201);
    expect(createRes.body.data.application).toMatchObject({
      application_type: 'grant_application',
      grant_id: publishedGrantId,
      linked_conference_id: linkedConferenceId,
      linked_conference_application_id: submittedConferenceApplicationId,
      applicant_user_id: withPrereqUserId,
      status: 'draft',
      statement: 'I am requesting travel support to attend the workshop.',
      travel_plan_summary: 'Round trip from Singapore to Seoul with 4 nights lodging.',
      funding_need_summary: 'Airfare support requested; accommodation partially self-funded.',
      extra_answers: {},
    });

    const duplicateRes = await request(app)
      .post(`/api/v1/grants/${publishedGrantId}/applications`)
      .set('Authorization', `Bearer ${withPrereqToken}`)
      .send({
        linked_conference_application_id: submittedConferenceApplicationId,
        statement: 'I am requesting travel support to attend the workshop.',
        travel_plan_summary: 'Round trip from Singapore to Seoul with 4 nights lodging.',
        funding_need_summary: 'Airfare support requested; accommodation partially self-funded.',
        extra_answers: {},
        file_ids: [],
      });
    expect(duplicateRes.status).toBe(409);

    const readDraftRes = await request(app)
      .get(`/api/v1/grants/${publishedGrantId}/applications/me`)
      .set('Authorization', `Bearer ${withPrereqToken}`);

    expect(readDraftRes.status).toBe(200);
    expect(readDraftRes.body.data.application).toMatchObject({
      application_type: 'grant_application',
      grant_id: publishedGrantId,
      linked_conference_application_id: submittedConferenceApplicationId,
      applicant_user_id: withPrereqUserId,
      status: 'draft',
    });
  });

  it('updates and submits a grant draft while preserving linked conference rules', async () => {
    const createRes = await request(app)
      .post(`/api/v1/grants/${publishedGrantId}/applications`)
      .set('Authorization', `Bearer ${submitToken}`)
      .send({
        linked_conference_application_id: submitConferenceApplicationId,
        statement: 'Initial funding request statement.',
        travel_plan_summary: 'Initial travel plan.',
        funding_need_summary: 'Initial funding need.',
        extra_answers: {},
        file_ids: [],
      });

    expect(createRes.status).toBe(201);
    const applicationId = createRes.body.data.application.id;

    const updateRes = await request(app)
      .put(`/api/v1/me/applications/${applicationId}/draft`)
      .set('Authorization', `Bearer ${submitToken}`)
      .send({
        linked_conference_application_id: submitConferenceApplicationId,
        statement: 'Updated funding request statement.',
        travel_plan_summary: 'Updated travel plan.',
        funding_need_summary: 'Updated funding need.',
        extra_answers: { lodging: 'shared room' },
        file_ids: [],
      });

    expect(updateRes.status).toBe(200);
    expect(updateRes.body.data.application).toMatchObject({
      id: applicationId,
      application_type: 'grant_application',
      statement: 'Updated funding request statement.',
      travel_plan_summary: 'Updated travel plan.',
      funding_need_summary: 'Updated funding need.',
      extra_answers: { lodging: 'shared room' },
    });

    const submitRes = await request(app)
      .post(`/api/v1/me/applications/${applicationId}/submit`)
      .set('Authorization', `Bearer ${submitToken}`)
      .send({});

    expect(submitRes.status).toBe(200);
    expect(submitRes.body.data.application).toMatchObject({
      id: applicationId,
      application_type: 'grant_application',
      status: 'submitted',
    });

    const storedApplication = await prisma.application.findUnique({
      where: { id: applicationId },
    });

    expect(storedApplication?.status).toBe('submitted');
    expect(JSON.parse(storedApplication?.applicantProfileSnapshotJson ?? '{}')).toMatchObject({
      full_name: applicantForSubmit.fullName,
    });

    const historyRows = await prisma.applicationStatusHistory.findMany({
      where: { applicationId },
      orderBy: { createdAt: 'asc' },
    });

    expect(historyRows.at(-1)).toMatchObject({
      fromStatus: 'draft',
      toStatus: 'submitted',
    });

    const rejectedUpdateRes = await request(app)
      .put(`/api/v1/me/applications/${applicationId}/draft`)
      .set('Authorization', `Bearer ${submitToken}`)
      .send({
        linked_conference_application_id: submitConferenceApplicationId,
        statement: 'This edit must be rejected.',
        travel_plan_summary: 'Rejected travel plan.',
        funding_need_summary: 'Rejected funding need.',
        extra_answers: {},
        file_ids: [],
      });

    expect(rejectedUpdateRes.status).toBe(409);
  });
});
