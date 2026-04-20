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
  const replacementUser = {
    email: 'be.profile.replace@example.com',
    password: 'password123',
    fullName: 'Replacement User',
  };
  const publicScholarUser = {
    email: 'be.profile.public-scholar@example.com',
    password: 'password123',
    fullName: 'Public Scholar',
  };
  const hiddenScholarUser = {
    email: 'be.profile.hidden-scholar@example.com',
    password: 'password123',
    fullName: 'Hidden Scholar',
  };
  const strictValidationUser = {
    email: 'be.profile.strict@example.com',
    password: 'password123',
    fullName: 'Strict Validation User',
  };
  const unknownMscUser = {
    email: 'be.profile.unknown-msc@example.com',
    password: 'password123',
    fullName: 'Unknown Msc User',
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
            replacementUser.email,
            publicScholarUser.email,
            hiddenScholarUser.email,
            strictValidationUser.email,
            unknownMscUser.email,
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
            replacementUser.email,
            publicScholarUser.email,
            hiddenScholarUser.email,
            strictValidationUser.email,
            unknownMscUser.email,
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

  it('rejects optional fields with invalid types', async () => {
    const registerRes = await request(app)
      .post('/api/v1/auth/register')
      .send(strictValidationUser);

    expect(registerRes.status).toBe(201);

    const invalidTitleRes = await request(app)
      .put('/api/v1/profile/me')
      .set('Authorization', `Bearer ${registerRes.body.accessToken}`)
      .send({
        full_name: 'Strict Validation User',
        institution_name_raw: 'Example University',
        country_code: 'CN',
        career_stage: 'phd',
        title: 123,
      });

    expect(invalidTitleRes.status).toBe(400);
    expect(invalidTitleRes.body).toEqual({
      message: 'title must be a string',
    });

    const invalidBooleanRes = await request(app)
      .put('/api/v1/profile/me')
      .set('Authorization', `Bearer ${registerRes.body.accessToken}`)
      .send({
        full_name: 'Strict Validation User',
        institution_name_raw: 'Example University',
        country_code: 'CN',
        career_stage: 'phd',
        is_profile_public: 'yes',
      });

    expect(invalidBooleanRes.status).toBe(400);
    expect(invalidBooleanRes.body).toEqual({
      message: 'is_profile_public must be a boolean',
    });

    const invalidKeywordsRes = await request(app)
      .put('/api/v1/profile/me')
      .set('Authorization', `Bearer ${registerRes.body.accessToken}`)
      .send({
        full_name: 'Strict Validation User',
        institution_name_raw: 'Example University',
        country_code: 'CN',
        career_stage: 'phd',
        research_keywords: ['algebra', 42],
      });

    expect(invalidKeywordsRes.status).toBe(400);
    expect(invalidKeywordsRes.body).toEqual({
      message: 'research_keywords must be an array of strings',
    });

    const invalidMscShapeRes = await request(app)
      .put('/api/v1/profile/me')
      .set('Authorization', `Bearer ${registerRes.body.accessToken}`)
      .send({
        full_name: 'Strict Validation User',
        institution_name_raw: 'Example University',
        country_code: 'CN',
        career_stage: 'phd',
        msc_codes: [{ code: '11B05' }],
      });

    expect(invalidMscShapeRes.status).toBe(400);
    expect(invalidMscShapeRes.body).toEqual({
      message: 'msc_codes items must include code and is_primary',
    });
  });

  it('replaces stale MSC associations on a second update and returns deterministic ordering', async () => {
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
      .send(replacementUser);

    expect(registerRes.status).toBe(201);

    const firstUpdateRes = await request(app)
      .put('/api/v1/profile/me')
      .set('Authorization', `Bearer ${registerRes.body.accessToken}`)
      .send({
        full_name: 'Replacement User',
        institution_name_raw: 'Example University',
        country_code: 'CN',
        career_stage: 'phd',
        msc_codes: [
          { code: '11B05', is_primary: true },
          { code: '35Q55', is_primary: false },
        ],
      });

    expect(firstUpdateRes.status).toBe(200);

    const secondUpdateRes = await request(app)
      .put('/api/v1/profile/me')
      .set('Authorization', `Bearer ${registerRes.body.accessToken}`)
      .send({
        full_name: 'Replacement User',
        institution_name_raw: 'Example University',
        country_code: 'CN',
        career_stage: 'phd',
        msc_codes: [
          { code: '11B05', is_primary: false },
          { code: '35Q55', is_primary: true },
        ],
      });

    expect(secondUpdateRes.status).toBe(200);
    expect(secondUpdateRes.body.data.profile.msc_codes).toEqual([
      { code: '35Q55', is_primary: true },
      { code: '11B05', is_primary: false },
    ]);

    const persistedCodes = await prisma.profileMscCode.findMany({
      where: { userId: registerRes.body.user.id },
      orderBy: { mscCode: 'asc' },
    });

    expect(persistedCodes).toEqual([
      expect.objectContaining({ mscCode: '11B05', isPrimary: false }),
      expect.objectContaining({ mscCode: '35Q55', isPrimary: true }),
    ]);
  });

  it('returns the public scholar profile when visibility is enabled', async () => {
    await prisma.mscCode.upsert({
      where: { code: '11B05' },
      update: {},
      create: { code: '11B05' },
    });

    const registerRes = await request(app)
      .post('/api/v1/auth/register')
      .send(publicScholarUser);

    expect(registerRes.status).toBe(201);

    const updateRes = await request(app)
      .put('/api/v1/profile/me')
      .set('Authorization', `Bearer ${registerRes.body.accessToken}`)
      .send({
        full_name: 'Public Scholar',
        title: 'Professor',
        institution_name_raw: 'Example University',
        country_code: 'CN',
        career_stage: 'faculty',
        bio: 'Studies number theory.',
        personal_website: 'https://example.com/public-scholar',
        research_keywords: ['number theory', 'combinatorics'],
        msc_codes: [{ code: '11B05', is_primary: true }],
        orcid_id: '0000-0002-1111-2222',
        coi_declaration_text: 'Internal only text',
        is_profile_public: true,
      });

    expect(updateRes.status).toBe(200);

    const scholarRes = await request(app).get(
      `/api/v1/scholars/${updateRes.body.data.profile.slug}`
    );

    expect(scholarRes.status).toBe(200);
    expect(scholarRes.body).toEqual({
      data: {
        profile: {
          slug: updateRes.body.data.profile.slug,
          full_name: 'Public Scholar',
          title: 'Professor',
          institution_name_raw: 'Example University',
          country_code: 'CN',
          career_stage: 'faculty',
          bio: 'Studies number theory.',
          personal_website: 'https://example.com/public-scholar',
          research_keywords: ['number theory', 'combinatorics'],
          msc_codes: [{ code: '11B05', is_primary: true }],
          orcid_id: '0000-0002-1111-2222',
          updated_at: expect.any(String),
        },
      },
    });
  });

  it('returns 404 for a hidden scholar profile', async () => {
    const registerRes = await request(app)
      .post('/api/v1/auth/register')
      .send(hiddenScholarUser);

    expect(registerRes.status).toBe(201);

    const myProfileRes = await request(app)
      .get('/api/v1/profile/me')
      .set('Authorization', `Bearer ${registerRes.body.accessToken}`);

    expect(myProfileRes.status).toBe(200);

    const scholarRes = await request(app).get(
      `/api/v1/scholars/${myProfileRes.body.data.profile.slug}`
    );

    expect(scholarRes.status).toBe(404);
    expect(scholarRes.body).toEqual({ message: 'Profile not found' });
  });

  it('rejects unknown MSC codes with a client error status', async () => {
    const registerRes = await request(app)
      .post('/api/v1/auth/register')
      .send(unknownMscUser);

    expect(registerRes.status).toBe(201);

    const updateRes = await request(app)
      .put('/api/v1/profile/me')
      .set('Authorization', `Bearer ${registerRes.body.accessToken}`)
      .send({
        full_name: 'Unknown Msc User',
        institution_name_raw: 'Example University',
        country_code: 'CN',
        career_stage: 'phd',
        msc_codes: [{ code: '99Z99', is_primary: true }],
      });

    expect(updateRes.status).toBe(400);
    expect(updateRes.body).toEqual({
      message: 'msc_codes contains unknown codes',
    });
  });
});
