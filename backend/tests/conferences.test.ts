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
    const listRes = await request(app).get('/api/v1/conferences');

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
});
