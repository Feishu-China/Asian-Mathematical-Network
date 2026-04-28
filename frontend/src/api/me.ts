import { api } from './client';

const withAuth = (token: string) => ({
  headers: { Authorization: `Bearer ${token}` },
});

export const fetchMyApplications = async (token: string) => {
  const response = await api.get('/me/applications', withAuth(token));
  return response.data;
};
