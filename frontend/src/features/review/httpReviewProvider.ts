import {
  assignReviewerRequest,
  fetchMyApplicationDetail,
  fetchOrganizerApplicationDetail,
  fetchOrganizerConferenceApplications,
  fetchReviewerAssignmentDetail,
  fetchReviewerAssignments,
  fetchReviewerCandidates,
  releaseDecisionRequest,
  submitReviewerReviewRequest,
  upsertDecisionRequest,
} from '../../api/review';
import {
  fromTransportApplicantApplicationDetail,
  fromTransportInternalDecision,
  fromTransportOrganizerApplicationDetail,
  fromTransportOrganizerApplicationListItem,
  fromTransportReviewAssignment,
  fromTransportReviewRecord,
  fromTransportReviewerAssignmentDetail,
  fromTransportReviewerCandidate,
  fromTransportReviewerQueueItem,
  toTransportAssignReviewerPayload,
  toTransportDecisionPayload,
  toTransportReviewPayload,
} from './reviewMappers';
import type { ReviewProvider } from './types';

const readToken = () => {
  const token = localStorage.getItem('token');

  if (!token) {
    throw new Error('Missing auth token');
  }

  return token;
};

export const httpReviewProvider: ReviewProvider = {
  async listOrganizerConferenceApplications(conferenceId) {
    const response = await fetchOrganizerConferenceApplications(readToken(), conferenceId);
    return response.data.items.map(fromTransportOrganizerApplicationListItem);
  },

  async getOrganizerApplicationDetail(applicationId) {
    const response = await fetchOrganizerApplicationDetail(readToken(), applicationId);
    return fromTransportOrganizerApplicationDetail(response.data.application);
  },

  async listReviewerCandidates(applicationId) {
    const response = await fetchReviewerCandidates(readToken(), applicationId);
    return response.data.items.map(fromTransportReviewerCandidate);
  },

  async assignReviewer(applicationId, values) {
    const response = await assignReviewerRequest(
      readToken(),
      applicationId,
      toTransportAssignReviewerPayload(values)
    );

    return {
      assignment: fromTransportReviewAssignment(response.data.assignment),
      applicationStatus: response.data.application_status,
    };
  },

  async upsertDecision(applicationId, values) {
    const response = await upsertDecisionRequest(
      readToken(),
      applicationId,
      toTransportDecisionPayload(values)
    );

    return {
      decision: fromTransportInternalDecision(response.data.decision),
      applicationStatus: response.data.application_status,
    };
  },

  async releaseDecision(applicationId) {
    const response = await releaseDecisionRequest(readToken(), applicationId);
    return fromTransportInternalDecision(response.data.decision);
  },

  async listReviewerAssignments() {
    const response = await fetchReviewerAssignments(readToken());
    return response.data.items.map(fromTransportReviewerQueueItem);
  },

  async getReviewerAssignmentDetail(assignmentId) {
    const response = await fetchReviewerAssignmentDetail(readToken(), assignmentId);
    return fromTransportReviewerAssignmentDetail(response.data.assignment);
  },

  async submitReviewerReview(assignmentId, values) {
    const response = await submitReviewerReviewRequest(
      readToken(),
      assignmentId,
      toTransportReviewPayload(values)
    );
    return fromTransportReviewRecord(response.data.review);
  },

  async getMyApplicationDetail(applicationId) {
    const response = await fetchMyApplicationDetail(readToken(), applicationId);
    return fromTransportApplicantApplicationDetail(response.data.application);
  },
};
