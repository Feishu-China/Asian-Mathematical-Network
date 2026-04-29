import { api } from './client';

const withAuth = (token: string) => ({
  headers: { Authorization: `Bearer ${token}` },
});

export const fetchMyProfile = async (token: string) => {
  const response = await api.get('/profile/me', withAuth(token));
  return response.data;
};

export const updateMyProfileRequest = async (token: string, payload: unknown) => {
  const response = await api.put('/profile/me', payload, withAuth(token));
  return response.data;
};

export const fetchScholarProfile = async (slug: string) => {
  const response = await api.get(`/scholars/${slug}`);
  return response.data;
};

export const fetchScholarDirectory = async () => {
  const response = await api.get('/scholars');
  return response.data;
};
