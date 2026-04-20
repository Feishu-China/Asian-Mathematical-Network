import axios from 'axios';

const api = axios.create({
  baseURL: '/api/v1',
});

const withAuth = (token: string) => ({
  headers: { Authorization: `Bearer ${token}` },
});

export const fetchConferenceList = async () => {
  const response = await api.get('/conferences');
  return response.data;
};

export const fetchConferenceDetail = async (slug: string) => {
  const response = await api.get(`/conferences/${slug}`);
  return response.data;
};

export const fetchConferenceApplicationForm = async (conferenceId: string) => {
  const response = await api.get(`/conferences/${conferenceId}/application-form`);
  return response.data;
};

export const createOrganizerConferenceRequest = async (token: string, payload: unknown) => {
  const response = await api.post('/organizer/conferences', payload, withAuth(token));
  return response.data;
};

export const fetchOrganizerConference = async (token: string, conferenceId: string) => {
  const response = await api.get(`/organizer/conferences/${conferenceId}`, withAuth(token));
  return response.data;
};

export const updateOrganizerConferenceRequest = async (
  token: string,
  conferenceId: string,
  payload: unknown
) => {
  const response = await api.put(`/organizer/conferences/${conferenceId}`, payload, withAuth(token));
  return response.data;
};

export const publishOrganizerConferenceRequest = async (token: string, conferenceId: string) => {
  const response = await api.post(
    `/organizer/conferences/${conferenceId}/publish`,
    {},
    withAuth(token)
  );
  return response.data;
};

export const closeOrganizerConferenceRequest = async (token: string, conferenceId: string) => {
  const response = await api.post(
    `/organizer/conferences/${conferenceId}/close`,
    {},
    withAuth(token)
  );
  return response.data;
};

export const createConferenceApplicationRequest = async (
  token: string,
  conferenceId: string,
  payload: unknown
) => {
  const response = await api.post(`/conferences/${conferenceId}/applications`, payload, withAuth(token));
  return response.data;
};

export const updateMyConferenceApplicationDraftRequest = async (
  token: string,
  applicationId: string,
  payload: unknown
) => {
  const response = await api.put(`/me/applications/${applicationId}/draft`, payload, withAuth(token));
  return response.data;
};

export const submitMyConferenceApplicationRequest = async (token: string, applicationId: string) => {
  const response = await api.post(`/me/applications/${applicationId}/submit`, {}, withAuth(token));
  return response.data;
};
