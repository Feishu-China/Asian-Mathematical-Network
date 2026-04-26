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

export const fetchMyApplicationDetail = async (token: string, applicationId: string) => {
  const response = await api.get(`/me/applications/${applicationId}`, withAuth(token));
  return response.data;
};

export const submitMyPostVisitReportRequest = async (
  token: string,
  applicationId: string,
  payload: { report_narrative: string; attendance_confirmed: boolean }
) => {
  const response = await api.post(
    `/me/applications/${applicationId}/post-visit-report`,
    payload,
    withAuth(token)
  );
  return response.data;
};
