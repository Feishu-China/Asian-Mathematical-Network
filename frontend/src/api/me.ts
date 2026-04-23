import axios from 'axios';

const api = axios.create({
  baseURL: '/api/v1',
});

const withAuth = (token: string) => ({
  headers: { Authorization: `Bearer ${token}` },
});

export const fetchMyApplications = async (token: string) => {
  const response = await api.get('/me/applications', withAuth(token));
  return response.data;
};
