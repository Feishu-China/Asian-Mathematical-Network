import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import app from '../src/app';

const prisma = new PrismaClient();

describe('Conference API', () => {
  const creatorEmail = 'conf.public.creator@example.com';
  const trackedEmails = [
    'conf.public.creator@example.com',
    'conf.organizer.owner@example.com',
    'conf.organizer.outsider@example.com',
    'conf.apply.organizer@example.com',
    'conf.apply.applicant@example.com',
  ];
  const conferenceSlugs = [
    'published-conf-2026',
    'draft-conf-2026',
    'organizer-conf-2026',
    'apply-conf-2026',
  ];
  const formFields = [
    { key: 'participation_type', type: 'select', required: true },
    { key: 'statement', type: 'textarea', required: true },
    { key: 'abstract_title', type: 'text', required: false },
  ];

  beforeAll(async () => {
    await prisma.applicationStatusHistory.deleteMany();
    await prisma.application.deleteMany();
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

    await prisma.conference.create({
      data: {
        slug: 'published-conf-2026',
        title: 'Published Conference 2026',
        shortName: 'PC2026',
        locationText: 'Singapore',
        startDate: '2026-08-10',
        endDate: '2026-08-14',
        description: 'Visible conference',
        applicationDeadline: new Date('2026-07-15T23:59:59Z'),
        status: 'published',
        applicationFormSchemaJson: JSON.stringify({ fields: formFields }),
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

    await prisma.conference.create({
      data: {
        slug: 'draft-conf-2026',
        title: 'Draft Conference 2026',
        shortName: 'DC2026',
        locationText: 'Beijing',
        startDate: '2026-09-01',
        endDate: '2026-09-05',
        description: 'Hidden draft conference',
        applicationDeadline: new Date('2026-08-01T23:59:59Z'),
        status: 'draft',
        applicationFormSchemaJson: JSON.stringify({ fields: formFields }),
        settingsJson: JSON.stringify({}),
        createdByUserId: creator.id,
        staff: {
          create: {
            userId: creator.id,
            staffRole: 'owner',
          },
        },
      },
    });
  });

  afterAll(async () => {
    await prisma.applicationStatusHistory.deleteMany();
    await prisma.application.deleteMany();
    await prisma.conferenceStaff.deleteMany();
    await prisma.conference.deleteMany({ where: { slug: { in: conferenceSlugs } } });
    await prisma.user.deleteMany({ where: { email: { in: trackedEmails } } });
    await prisma.$disconnect();
  });

  it('lists only published conferences and returns detail plus the application form', async () => {
    const listRes = await request(app).get('/api/v1/conferences').query({ q: 'Published Conference 2026' });

    expect(listRes.status).toBe(200);
    expect(listRes.body.data.items).toHaveLength(1);
    expect(listRes.body.data.items[0]).toMatchObject({
      slug: 'published-conf-2026',
      title: 'Published Conference 2026',
      short_name: 'PC2026',
      location_text: 'Singapore',
      status: 'published',
      related_grant_count: 0,
      is_application_open: true,
    });

    const conferenceId = listRes.body.data.items[0].id;

    const detailRes = await request(app).get('/api/v1/conferences/published-conf-2026');

    expect(detailRes.status).toBe(200);
    expect(detailRes.body.data.conference).toMatchObject({
      id: conferenceId,
      slug: 'published-conf-2026',
      title: 'Published Conference 2026',
      description: 'Visible conference',
      related_grants: [],
      is_application_open: true,
    });

    const formRes = await request(app).get(`/api/v1/conferences/${conferenceId}/application-form`);

    expect(formRes.status).toBe(200);
    expect(formRes.body.data).toEqual({
      conference_id: conferenceId,
      schema: {
        fields: formFields,
      },
    });

    const missingRes = await request(app).get('/api/v1/conferences/draft-conf-2026');
    expect(missingRes.status).toBe(404);
  });

  it('creates, updates, publishes, and closes an organizer-owned conference', async () => {
    const organizer = {
      email: 'conf.organizer.owner@example.com',
      password: 'password123',
      fullName: 'Conference Owner',
    };
    const outsider = {
      email: 'conf.organizer.outsider@example.com',
      password: 'password123',
      fullName: 'Conference Outsider',
    };

    await prisma.user.deleteMany({
      where: { email: { in: [organizer.email, outsider.email] } },
    });

    const organizerRes = await request(app).post('/api/v1/auth/register').send(organizer);
    const outsiderRes = await request(app).post('/api/v1/auth/register').send(outsider);

    const createRes = await request(app)
      .post('/api/v1/organizer/conferences')
      .set('Authorization', `Bearer ${organizerRes.body.accessToken}`)
      .send({
        slug: 'organizer-conf-2026',
        title: 'Organizer Conference 2026',
        short_name: 'OC2026',
        location_text: null,
        start_date: null,
        end_date: null,
        description: null,
        application_deadline: null,
        application_form_schema: {
          fields: [
            { key: 'participation_type', type: 'select', required: true },
            { key: 'statement', type: 'textarea', required: true },
          ],
        },
        settings: {},
      });

    expect(createRes.status).toBe(201);
    expect(createRes.body.data.conference).toMatchObject({
      slug: 'organizer-conf-2026',
      title: 'Organizer Conference 2026',
      status: 'draft',
    });

    const conferenceId = createRes.body.data.conference.id;

    const staffRow = await prisma.conferenceStaff.findUnique({
      where: {
        conferenceId_userId: {
          conferenceId,
          userId: organizerRes.body.user.id,
        },
      },
    });

    expect(staffRow?.staffRole).toBe('owner');

    const meRes = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${organizerRes.body.accessToken}`);

    expect(meRes.status).toBe(200);
    expect(meRes.body.user.role).toBe('organizer');
    expect(meRes.body.user.primary_role).toBe('organizer');
    expect(meRes.body.user.roles).toEqual(expect.arrayContaining(['applicant', 'organizer']));

    const updateRes = await request(app)
      .put(`/api/v1/organizer/conferences/${conferenceId}`)
      .set('Authorization', `Bearer ${organizerRes.body.accessToken}`)
      .send({
        slug: 'organizer-conf-2026',
        title: 'Organizer Conference 2026',
        short_name: 'OC2026',
        location_text: 'Seoul',
        start_date: '2026-10-11',
        end_date: '2026-10-15',
        description: 'Updated organizer conference',
        application_deadline: '2026-09-15T23:59:59Z',
        application_form_schema: {
          fields: [
            { key: 'participation_type', type: 'select', required: true },
            { key: 'statement', type: 'textarea', required: true },
          ],
        },
        settings: {},
      });

    expect(updateRes.status).toBe(200);
    expect(updateRes.body.data.conference.location_text).toBe('Seoul');

    const publishRes = await request(app)
      .post(`/api/v1/organizer/conferences/${conferenceId}/publish`)
      .set('Authorization', `Bearer ${organizerRes.body.accessToken}`)
      .send({});

    expect(publishRes.status).toBe(200);
    expect(publishRes.body.data.conference.status).toBe('published');

    const publicRes = await request(app).get('/api/v1/conferences/organizer-conf-2026');
    expect(publicRes.status).toBe(200);

    const forbiddenRes = await request(app)
      .put(`/api/v1/organizer/conferences/${conferenceId}`)
      .set('Authorization', `Bearer ${outsiderRes.body.accessToken}`)
      .send({
        slug: 'organizer-conf-2026',
        title: 'Hijacked Conference',
        short_name: 'HC2026',
        location_text: 'Shanghai',
        start_date: '2026-10-20',
        end_date: '2026-10-22',
        description: 'This update should be rejected',
        application_deadline: '2026-09-20T23:59:59Z',
        application_form_schema: { fields: [] },
        settings: {},
      });

    expect(forbiddenRes.status).toBe(403);

    const closeRes = await request(app)
      .post(`/api/v1/organizer/conferences/${conferenceId}/close`)
      .set('Authorization', `Bearer ${organizerRes.body.accessToken}`)
      .send({});

    expect(closeRes.status).toBe(200);
    expect(closeRes.body.data.conference.status).toBe('closed');
  });

  it('creates one draft conference application, allows draft edits, freezes a profile snapshot on submit, and rejects post-submit edits', async () => {
    const organizer = {
      email: 'conf.apply.organizer@example.com',
      password: 'password123',
      fullName: 'Apply Organizer',
    };
    const applicant = {
      email: 'conf.apply.applicant@example.com',
      password: 'password123',
      fullName: 'Apply Applicant',
    };

    await prisma.user.deleteMany({
      where: { email: { in: [organizer.email, applicant.email] } },
    });

    const organizerRes = await request(app).post('/api/v1/auth/register').send(organizer);
    const applicantRes = await request(app).post('/api/v1/auth/register').send(applicant);

    const createConferenceRes = await request(app)
      .post('/api/v1/organizer/conferences')
      .set('Authorization', `Bearer ${organizerRes.body.accessToken}`)
      .send({
        slug: 'apply-conf-2026',
        title: 'Apply Conference 2026',
        short_name: 'AC2026',
        location_text: 'Singapore',
        start_date: '2026-11-01',
        end_date: '2026-11-05',
        description: 'Conference open for applications',
        application_deadline: '2026-10-01T23:59:59Z',
        application_form_schema: {
          fields: [
            { key: 'participation_type', type: 'select', required: true },
            { key: 'statement', type: 'textarea', required: true },
          ],
        },
        settings: {},
      });

    const conferenceId = createConferenceRes.body.data.conference.id;

    await request(app)
      .post(`/api/v1/organizer/conferences/${conferenceId}/publish`)
      .set('Authorization', `Bearer ${organizerRes.body.accessToken}`)
      .send({});

    await request(app)
      .put('/api/v1/profile/me')
      .set('Authorization', `Bearer ${applicantRes.body.accessToken}`)
      .send({
        full_name: 'Apply Applicant',
        title: null,
        institution_id: null,
        institution_name_raw: 'National University of Singapore',
        country_code: 'SG',
        career_stage: 'phd',
        bio: 'Working on representation theory.',
        personal_website: 'https://example.com/apply-applicant',
        research_keywords: ['representation theory'],
        msc_codes: [],
        orcid_id: null,
        coi_declaration_text: '',
        is_profile_public: false,
      });

    const createDraftRes = await request(app)
      .post(`/api/v1/conferences/${conferenceId}/applications`)
      .set('Authorization', `Bearer ${applicantRes.body.accessToken}`)
      .send({
        participation_type: 'talk',
        statement: 'I would like to present.',
        abstract_title: 'Arithmetic Dynamics',
        abstract_text: 'A short abstract.',
        interested_in_travel_support: true,
        extra_answers: {},
        file_ids: [],
      });

    expect(createDraftRes.status).toBe(201);
    expect(createDraftRes.body.data.application).toMatchObject({
      application_type: 'conference_application',
      source_module: 'M2',
      conference_id: conferenceId,
      status: 'draft',
    });

    const applicationId = createDraftRes.body.data.application.id;

    const duplicateDraftRes = await request(app)
      .post(`/api/v1/conferences/${conferenceId}/applications`)
      .set('Authorization', `Bearer ${applicantRes.body.accessToken}`)
      .send({
        participation_type: 'talk',
        statement: 'A duplicate draft should be rejected.',
        abstract_title: 'Duplicate',
        abstract_text: 'Duplicate',
        interested_in_travel_support: false,
        extra_answers: {},
        file_ids: [],
      });

    expect(duplicateDraftRes.status).toBe(409);

    const readDraftRes = await request(app)
      .get(`/api/v1/conferences/${conferenceId}/applications/me`)
      .set('Authorization', `Bearer ${applicantRes.body.accessToken}`);

    expect(readDraftRes.status).toBe(200);
    expect(readDraftRes.body.data.application).toMatchObject({
      id: applicationId,
      conference_id: conferenceId,
      status: 'draft',
      statement: 'I would like to present.',
      abstract_title: 'Arithmetic Dynamics',
    });

    const updateDraftRes = await request(app)
      .put(`/api/v1/me/applications/${applicationId}/draft`)
      .set('Authorization', `Bearer ${applicantRes.body.accessToken}`)
      .send({
        participation_type: 'talk',
        statement: 'Updated draft statement.',
        abstract_title: 'Arithmetic Dynamics Revised',
        abstract_text: 'Revised abstract.',
        interested_in_travel_support: false,
        extra_answers: { audience: 'graduate students' },
        file_ids: [],
      });

    expect(updateDraftRes.status).toBe(200);
    expect(updateDraftRes.body.data.application.statement).toBe('Updated draft statement.');

    const readUpdatedDraftRes = await request(app)
      .get(`/api/v1/conferences/${conferenceId}/applications/me`)
      .set('Authorization', `Bearer ${applicantRes.body.accessToken}`);

    expect(readUpdatedDraftRes.status).toBe(200);
    expect(readUpdatedDraftRes.body.data.application).toMatchObject({
      id: applicationId,
      conference_id: conferenceId,
      status: 'draft',
      statement: 'Updated draft statement.',
      abstract_title: 'Arithmetic Dynamics Revised',
      interested_in_travel_support: false,
      extra_answers: { audience: 'graduate students' },
    });

    const submitRes = await request(app)
      .post(`/api/v1/me/applications/${applicationId}/submit`)
      .set('Authorization', `Bearer ${applicantRes.body.accessToken}`)
      .send({});

    expect(submitRes.status).toBe(200);
    expect(submitRes.body.data.application.status).toBe('submitted');

    const applicantDetailRes = await request(app)
      .get(`/api/v1/me/applications/${applicationId}`)
      .set('Authorization', `Bearer ${applicantRes.body.accessToken}`);

    expect(applicantDetailRes.status).toBe(200);
    expect(applicantDetailRes.body.data.application).toMatchObject({
      id: applicationId,
      application_type: 'conference_application',
      conference_id: conferenceId,
      conference_title: 'Apply Conference 2026',
      viewer_status: 'under_review',
      statement: 'Updated draft statement.',
      submitted_at: expect.any(String),
      released_decision: null,
    });

    const storedApplication = await prisma.application.findUnique({
      where: { id: applicationId },
    });

    expect(storedApplication?.status).toBe('submitted');
    expect(JSON.parse(storedApplication?.applicantProfileSnapshotJson ?? '{}')).toMatchObject({
      full_name: 'Apply Applicant',
      institution_name_raw: 'National University of Singapore',
      country_code: 'SG',
      career_stage: 'phd',
      research_keywords: ['representation theory'],
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
      .set('Authorization', `Bearer ${applicantRes.body.accessToken}`)
      .send({
        participation_type: 'talk',
        statement: 'This edit must be rejected.',
        abstract_title: 'Nope',
        abstract_text: 'Nope',
        interested_in_travel_support: false,
        extra_answers: {},
        file_ids: [],
      });

    expect(rejectedUpdateRes.status).toBe(409);
  });
});
