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
  const updatingUser = {
    email: 'be.profile.update@example.com',
    password: 'password123',
    fullName: 'Kurt Godel',
  };
  const legacyUser = {
    email: 'legacy.user@example.com',
    password: 'password123',
  };
  const validationUser = {
    email: 'be.profile.validation@example.com',
    password: 'password123',
    fullName: 'Validation User',
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
          in: [
            registeredUser.email,
            updatingUser.email,
            legacyUser.email,
            validationUser.email,
            unicodeUser.email,
          ],
        },
      },
    });
    await prisma.mscCode.deleteMany({
      where: {
        code: {
          in: ['11B05', '35Q55'],
        },
      },
    });
  });

  afterAll(async () => {
    await prisma.user.deleteMany({
      where: {
        email: {
          in: [
            registeredUser.email,
            updatingUser.email,
            legacyUser.email,
            validationUser.email,
            unicodeUser.email,
          ],
        },
      },
    });
    await prisma.mscCode.deleteMany({
      where: {
        code: {
          in: ['11B05', '35Q55'],
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

  it('updates the current profile and persists MSC codes', async () => {
    await prisma.mscCode.upsert({
      where: { code: '11B05' },
      update: {},
      create: { code: '11B05' },
    });
    await prisma.mscCode.upsert({
      where: { code: '35Q55' },
      update: {},
      create: { code: '35Q55' },
    });

    const registerRes = await request(app)
      .post('/api/v1/auth/register')
      .send(updatingUser);

    expect(registerRes.status).toBe(201);

    const updateRes = await request(app)
      .put('/api/v1/profile/me')
      .set('Authorization', `Bearer ${registerRes.body.accessToken}`)
      .send({
        full_name: 'Kurt Godel',
        title: 'Professor',
        institution_name_raw: 'Institute for Advanced Study',
        country_code: 'US',
        career_stage: 'faculty',
        bio: 'Works on logic and foundations.',
        personal_website: 'https://example.com/kurt',
        research_keywords: ['logic', 'set theory'],
        msc_codes: [
          { code: '11B05', is_primary: true },
          { code: '35Q55', is_primary: false },
        ],
        orcid_id: '0000-0001-2345-6789',
        coi_declaration_text: 'No conflicts.',
        is_profile_public: true,
      });

    expect(updateRes.status).toBe(200);
    expect(updateRes.body.data.profile).toMatchObject({
      user_id: registerRes.body.user.id,
      slug: `kurt-godel-${registerRes.body.user.id.slice(0, 8)}`,
      full_name: 'Kurt Godel',
      title: 'Professor',
      institution_id: null,
      institution_name_raw: 'Institute for Advanced Study',
      country_code: 'US',
      career_stage: 'faculty',
      bio: 'Works on logic and foundations.',
      personal_website: 'https://example.com/kurt',
      research_keywords: ['logic', 'set theory'],
      msc_codes: [
        { code: '11B05', is_primary: true },
        { code: '35Q55', is_primary: false },
      ],
      orcid_id: '0000-0001-2345-6789',
      coi_declaration_text: 'No conflicts.',
      is_profile_public: true,
      verification_status: 'unverified',
      verified_at: null,
    });
    expect(updateRes.body.data.profile.created_at).toEqual(expect.any(String));
    expect(updateRes.body.data.profile.updated_at).toEqual(expect.any(String));

    const persistedProfile = await prisma.profile.findUnique({
      where: { userId: registerRes.body.user.id },
      include: {
        mscCodes: {
          orderBy: { mscCode: 'asc' },
        },
      },
    });

    expect(persistedProfile).not.toBeNull();
    expect(persistedProfile).toMatchObject({
      fullName: 'Kurt Godel',
      title: 'Professor',
      institutionId: null,
      institutionNameRaw: 'Institute for Advanced Study',
      countryCode: 'US',
      careerStage: 'faculty',
      bio: 'Works on logic and foundations.',
      personalWebsite: 'https://example.com/kurt',
      researchKeywordsJson: JSON.stringify(['logic', 'set theory']),
      orcidId: '0000-0001-2345-6789',
      coiDeclarationText: 'No conflicts.',
      isProfilePublic: true,
    });
    expect(persistedProfile?.mscCodes).toEqual([
      expect.objectContaining({ mscCode: '11B05', isPrimary: true }),
      expect.objectContaining({ mscCode: '35Q55', isPrimary: false }),
    ]);
  });

  it('rejects duplicate primary MSC codes and duplicate MSC codes', async () => {
    await prisma.mscCode.upsert({
      where: { code: '11B05' },
      update: {},
      create: { code: '11B05' },
    });
    await prisma.mscCode.upsert({
      where: { code: '35Q55' },
      update: {},
      create: { code: '35Q55' },
    });

    const registerRes = await request(app)
      .post('/api/v1/auth/register')
      .send(validationUser);

    expect(registerRes.status).toBe(201);

    const duplicatePrimaryRes = await request(app)
      .put('/api/v1/profile/me')
      .set('Authorization', `Bearer ${registerRes.body.accessToken}`)
      .send({
        full_name: 'Validation User',
        institution_name_raw: 'Example University',
        country_code: 'CN',
        career_stage: 'phd',
        msc_codes: [
          { code: '11B05', is_primary: true },
          { code: '35Q55', is_primary: true },
        ],
      });

    expect(duplicatePrimaryRes.status).toBe(400);
    expect(duplicatePrimaryRes.body).toEqual({
      message: 'msc_codes must not contain more than one primary code',
    });

    const duplicateCodeRes = await request(app)
      .put('/api/v1/profile/me')
      .set('Authorization', `Bearer ${registerRes.body.accessToken}`)
      .send({
        full_name: 'Validation User',
        institution_name_raw: 'Example University',
        country_code: 'CN',
        career_stage: 'phd',
        msc_codes: [
          { code: '11B05', is_primary: true },
          { code: '11B05', is_primary: false },
        ],
      });

    expect(duplicateCodeRes.status).toBe(400);
    expect(duplicateCodeRes.body).toEqual({
      message: 'msc_codes must not contain duplicate codes',
    });

    const persistedCodes = await prisma.profileMscCode.findMany({
      where: { userId: registerRes.body.user.id },
    });
    expect(persistedCodes).toEqual([]);
  });
});
