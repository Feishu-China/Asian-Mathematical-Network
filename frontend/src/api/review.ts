import { api } from './client';

const withAuth = (token: string) => ({
  headers: { Authorization: `Bearer ${token}` },
});

export const fetchOrganizerConferenceApplications = async (token: string, conferenceId: string) => {
  const response = await api.get(`/organizer/conferences/${conferenceId}/applications`, withAuth(token));
  return response.data;
};

export const fetchOrganizerApplicationDetail = async (token: string, applicationId: string) => {
  const response = await api.get(`/organizer/applications/${applicationId}`, withAuth(token));
  return response.data;
};

export const fetchReviewerCandidates = async (token: string, applicationId: string) => {
  const response = await api.get(
    `/organizer/applications/${applicationId}/reviewer-candidates`,
    withAuth(token)
  );
  return response.data;
};

export const assignReviewerRequest = async (token: string, applicationId: string, payload: unknown) => {
  const response = await api.post(
    `/organizer/applications/${applicationId}/assign-reviewer`,
    payload,
    withAuth(token)
  );
  return response.data;
};

export const upsertDecisionRequest = async (token: string, applicationId: string, payload: unknown) => {
  const response = await api.post(
    `/organizer/applications/${applicationId}/decision`,
    payload,
    withAuth(token)
  );
  return response.data;
};

export const releaseDecisionRequest = async (token: string, applicationId: string) => {
  const response = await api.post(
    `/organizer/applications/${applicationId}/release-decision`,
    {},
    withAuth(token)
  );
  return response.data;
};

export const fetchReviewerAssignments = async (token: string) => {
  const response = await api.get('/reviewer/assignments', withAuth(token));
  return response.data;
};

export const fetchReviewerAssignmentDetail = async (token: string, assignmentId: string) => {
  const response = await api.get(`/reviewer/assignments/${assignmentId}`, withAuth(token));
  return response.data;
};

export const submitReviewerReviewRequest = async (
  token: string,
  assignmentId: string,
  payload: unknown
) => {
  const response = await api.post(
    `/reviewer/assignments/${assignmentId}/review`,
    payload,
    withAuth(token)
  );
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
