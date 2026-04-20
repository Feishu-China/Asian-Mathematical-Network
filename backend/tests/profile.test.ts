import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import app from '../src/app';

const prisma = new PrismaClient();

describe('Profile API', () => {
  const registeredUser = {
    email: 'be.profile.read@example.com',
    password: 'password123',
    fullName: 'Ada Lovelace',
  };
  const legacyUser = {
    email: 'legacy.user@example.com',
    password: 'password123',
  };
  const unicodeUser = {
    email: 'be.profile.unicode@example.com',
    password: 'password123',
    fullName: '张伟',
  };

  beforeAll(async () => {
    await prisma.user.deleteMany({
      where: {
        email: {
          in: [registeredUser.email, legacyUser.email, unicodeUser.email],
        },
      },
    });
  });

  afterAll(async () => {
    await prisma.user.deleteMany({
      where: {
        email: {
          in: [registeredUser.email, legacyUser.email, unicodeUser.email],
        },
      },
    });
    await prisma.$disconnect();
  });

  it('returns the starter profile for a newly registered user', async () => {
    const registerRes = await request(app)
      .post('/api/v1/auth/register')
      .send(registeredUser);

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
          full_name: registeredUser.fullName,
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

    const persistedProfile = await prisma.profile.findUnique({ where: { userId } });
    expect(persistedProfile).not.toBeNull();
    expect(persistedProfile?.fullName).toBe(registeredUser.fullName);
  });

  it('bootstraps and persists a starter profile for a legacy user without one', async () => {
    const passwordHash = await bcrypt.hash(legacyUser.password, 10);
    const user = await prisma.user.create({
      data: {
        email: legacyUser.email,
        passwordHash,
        status: 'active',
      },
    });

    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: legacyUser.email, password: legacyUser.password });

    expect(loginRes.status).toBe(200);
    expect(await prisma.profile.findUnique({ where: { userId: user.id } })).toBeNull();

    const profileRes = await request(app)
      .get('/api/v1/profile/me')
      .set('Authorization', `Bearer ${loginRes.body.accessToken}`);

    expect(profileRes.status).toBe(200);
    expect(profileRes.body.data.profile.full_name).toBe('legacy.user');
    expect(profileRes.body.data.profile.slug).toContain('legacy-user');
    expect(profileRes.body.data.profile.msc_codes).toEqual([]);

    const persistedProfile = await prisma.profile.findUnique({ where: { userId: user.id } });
    expect(persistedProfile).not.toBeNull();
    expect(persistedProfile?.fullName).toBe('legacy.user');
  });

  it('creates a Unicode-safe starter slug for Asian names', async () => {
    const registerRes = await request(app)
      .post('/api/v1/auth/register')
      .send(unicodeUser);

    expect(registerRes.status).toBe(201);

    const profileRes = await request(app)
      .get('/api/v1/profile/me')
      .set('Authorization', `Bearer ${registerRes.body.accessToken}`);

    expect(profileRes.status).toBe(200);
    expect(profileRes.body.data.profile.full_name).toBe(unicodeUser.fullName);
    expect(profileRes.body.data.profile.slug).toBe(
      `${unicodeUser.fullName}-${registerRes.body.user.id.slice(0, 8)}`
    );
  });
});
