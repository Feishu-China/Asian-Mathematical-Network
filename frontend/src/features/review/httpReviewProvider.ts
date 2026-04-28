import axios from 'axios';
import {
  assignReviewerRequest,
  fetchMyApplicationDetail,
  fetchOrganizerApplicationDetail,
  fetchOrganizerConferenceApplications,
  fetchReviewerAssignmentDetail,
  fetchReviewerAssignments,
  fetchReviewerCandidates,
  releaseDecisionRequest,
  submitMyPostVisitReportRequest,
  submitReviewerReviewRequest,
  upsertDecisionRequest,
} from '../../api/review';
import {
  fromTransportApplicantApplicationDetail,
  fromTransportInternalDecision,
  fromTransportOrganizerApplicationDetail,
  fromTransportOrganizerApplicationListItem,
  fromTransportPostVisitReport,
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

type ReviewErrorCode = 'UNAUTHORIZED' | 'FORBIDDEN' | 'NOT_FOUND' | 'CONFLICT' | 'VALIDATION';
type CodedError = Error & { code?: ReviewErrorCode };

const readToken = () => {
  const token = localStorage.getItem('token');

  if (!token) {
    throw new Error('Missing auth token');
  }

  return token;
};

const getApiMessage = (error: unknown, fallback: string) => {
  if (axios.isAxiosError(error) && typeof error.response?.data?.message === 'string') {
    return error.response.data.message;
  }

  return fallback;
};

const rethrowCodedError = (
  error: unknown,
  statusMap: Partial<Record<number, ReviewErrorCode>>,
  fallback: string
): never => {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status;
    const code = status ? statusMap[status] : undefined;

    if (code) {
      const codedError = new Error(getApiMessage(error, fallback)) as CodedError;
      codedError.code = code;
      throw codedError;
    }
  }

  throw error;
};

export const httpReviewProvider: ReviewProvider = {
  async listOrganizerConferenceApplications(conferenceId) {
    try {
      const response = await fetchOrganizerConferenceApplications(readToken(), conferenceId);
      return response.data.items.map(fromTransportOrganizerApplicationListItem);
    } catch (error) {
      return rethrowCodedError(
        error,
        { 401: 'UNAUTHORIZED', 403: 'FORBIDDEN', 404: 'NOT_FOUND' },
        'We could not load the organizer queue.'
      );
    }
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
    try {
      const response = await fetchReviewerAssignments(readToken());
      return response.data.items.map(fromTransportReviewerQueueItem);
    } catch (error) {
      return rethrowCodedError(
        error,
        { 401: 'UNAUTHORIZED', 403: 'FORBIDDEN' },
        'We could not load reviewer assignments.'
      );
    }
  },

  async getReviewerAssignmentDetail(assignmentId) {
    try {
      const response = await fetchReviewerAssignmentDetail(readToken(), assignmentId);
      return fromTransportReviewerAssignmentDetail(response.data.assignment);
    } catch (error) {
      return rethrowCodedError(
        error,
        { 401: 'UNAUTHORIZED', 403: 'FORBIDDEN', 404: 'NOT_FOUND' },
        'Assignment not found.'
      );
    }
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
    try {
      const response = await fetchMyApplicationDetail(readToken(), applicationId);
      return fromTransportApplicantApplicationDetail(response.data.application);
    } catch (error) {
      return rethrowCodedError(
        error,
        { 401: 'UNAUTHORIZED', 404: 'NOT_FOUND' },
        'Application not found.'
      );
    }
  },

  async submitMyPostVisitReport(applicationId, values) {
    try {
      const response = await submitMyPostVisitReportRequest(readToken(), applicationId, {
        report_narrative: values.reportNarrative,
        attendance_confirmed: values.attendanceConfirmed,
      });
      const report = fromTransportPostVisitReport(response.data.post_visit_report);

      if (!report) {
        throw new Error('Backend returned no post-visit report');
      }

      return report;
    } catch (error) {
      return rethrowCodedError(
        error,
        {
          401: 'UNAUTHORIZED',
          404: 'NOT_FOUND',
          409: 'CONFLICT',
          422: 'VALIDATION',
        },
        'We could not submit the post-visit report.'
      );
    }
  },
};
