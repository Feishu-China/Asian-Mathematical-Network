import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import app from '../src/app';

const prisma = new PrismaClient();

describe('Profile API', () => {
  const testUser = {
    email: 'be.profile.read@example.com',
    password: 'password123',
    fullName: 'Ada Lovelace',
  };

  beforeAll(async () => {
    await prisma.user.deleteMany({ where: { email: testUser.email } });
  });

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { email: testUser.email } });
    await prisma.$disconnect();
  });

  it('returns the starter profile for a newly registered user', async () => {
    const registerRes = await request(app)
      .post('/api/v1/auth/register')
      .send(testUser);

    expect(registerRes.status).toBe(201);

    const token = registerRes.body.accessToken;
    const userId = registerRes.body.user.id;

    const profileRes = await request(app)
      .get('/api/v1/profile/me')
      .set('Authorization', `Bearer ${token}`);

    expect(profileRes.status).toBe(200);
    expect(profileRes.body).toEqual({
      data: {
        profile: {
          user_id: userId,
          slug: `ada-lovelace-${userId.slice(0, 8)}`,
          full_name: testUser.fullName,
          title: null,
          institution_id: null,
          institution_name_raw: null,
          country_code: null,
          career_stage: null,
          bio: null,
          personal_website: null,
          research_keywords: [],
          msc_codes: [],
          orcid_id: null,
          coi_declaration_text: '',
          is_profile_public: false,
          verification_status: 'unverified',
          verified_at: null,
          created_at: expect.any(String),
          updated_at: expect.any(String),
        },
      },
    });
  });
});
