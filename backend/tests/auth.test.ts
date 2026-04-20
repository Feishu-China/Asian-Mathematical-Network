import request from 'supertest';
import app from '../src/app';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('Auth API', () => {
  let token: string;
  const testUser = {
    email: 'test_db_integration@example.com',
    password: 'password123',
    fullName: 'Test User'
  };

  beforeAll(async () => {
    // Clean up test user if it exists
    await prisma.user.deleteMany({ where: { email: testUser.email } });
  });

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { email: testUser.email } });
    await prisma.$disconnect();
  });

  it('should register a new user', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send(testUser);

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('accessToken');
    expect(res.body.user).toHaveProperty('email', testUser.email);
    expect(res.body.user.status).toBe('active');
  });

  it('should login an existing user', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: testUser.email, password: testUser.password });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('accessToken');
    expect(res.body.user).toHaveProperty('email', testUser.email);
    token = res.body.accessToken;
  });

  it('should return user details on /me with valid token', async () => {
    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('user');
    expect(res.body).toHaveProperty('profile');
    expect(res.body.user.email).toBe(testUser.email);
    expect(res.body.profile.fullName).toBe(testUser.fullName);
    expect(res.body.profile.slug).toMatch(/^test-user-/);
    expect(res.body.profile.slug).not.toBe('mock-slug');
    expect(res.body.profile.fullName).not.toBe('Mock User');
    expect(Array.isArray(res.body.profile.mscCodes)).toBe(true);
  });

  it('should reject unauthorized access to /me', async () => {
    const res = await request(app).get('/api/v1/auth/me');
    expect(res.status).toBe(401);
  });
});
