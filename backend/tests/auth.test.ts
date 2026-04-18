import request from 'supertest';
import app from '../src/app';

describe('Auth API', () => {
  let token: string;
  const testUser = {
    email: 'test@example.com',
    password: 'password123',
    fullName: 'Test User'
  };

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
  });

  it('should reject unauthorized access to /me', async () => {
    const res = await request(app).get('/api/v1/auth/me');
    expect(res.status).toBe(401);
  });
});