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
});
