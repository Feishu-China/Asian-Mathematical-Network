import { api } from './client';

const withAuth = (token: string) => ({
  headers: { Authorization: `Bearer ${token}` },
});

export const fetchGrantList = async () => {
  const response = await api.get('/grants');
  return response.data;
};

export const fetchGrantDetail = async (slug: string) => {
  const response = await api.get(`/grants/${slug}`);
  return response.data;
};

export const fetchGrantApplicationForm = async (grantId: string) => {
  const response = await api.get(`/grants/${grantId}/application-form`);
  return response.data;
};

export const fetchMyGrantApplication = async (token: string, grantId: string) => {
  const response = await api.get(`/grants/${grantId}/applications/me`, withAuth(token));
  return response.data;
};

export const createGrantApplicationRequest = async (
  token: string,
  grantId: string,
  payload: unknown
) => {
  const response = await api.post(`/grants/${grantId}/applications`, payload, withAuth(token));
  return response.data;
};

export const updateMyGrantApplicationDraftRequest = async (
  token: string,
  applicationId: string,
  payload: unknown
) => {
  const response = await api.put(`/me/applications/${applicationId}/draft`, payload, withAuth(token));
  return response.data;
};

export const submitMyGrantApplicationRequest = async (token: string, applicationId: string) => {
  const response = await api.post(`/me/applications/${applicationId}/submit`, {}, withAuth(token));
  return response.data;
};
