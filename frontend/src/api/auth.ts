import axios from 'axios';

const api = axios.create({
  baseURL: '/api/v1',
});

export const login = async (data: any) => {
  const response = await api.post('/auth/login', data);
  return response.data;
};

export const register = async (data: any) => {
  const response = await api.post('/auth/register', data);
  return response.data;
};

export const getMe = async (token: string) => {
  const response = await api.get('/auth/me', {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};