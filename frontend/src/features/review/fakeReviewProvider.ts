import {
  fromTransportApplicantApplicationDetail,
  fromTransportOrganizerApplicationDetail,
  fromTransportOrganizerApplicationListItem,
  fromTransportInternalDecision,
  fromTransportReviewAssignment,
  fromTransportReviewRecord,
  fromTransportReviewerAssignmentDetail,
  fromTransportReviewerCandidate,
  fromTransportReviewerQueueItem,
} from './reviewMappers';
import type {
  ReviewConflictState,
  ReviewProvider,
} from './types';

type UnauthorizedError = Error & { code: 'UNAUTHORIZED' };
type ForbiddenError = Error & { code: 'FORBIDDEN' };
type NotFoundError = Error & { code: 'NOT_FOUND' };

const delay = async () => {
  await Promise.resolve();
};

const requireToken = () => {
  const token = localStorage.getItem('token');

  if (!token) {
    const error = new Error('Missing auth token') as UnauthorizedError;
    error.code = 'UNAUTHORIZED';
    throw error;
  }

  return token;
};

const createForbiddenError = (message: string) => {
  const error = new Error(message) as ForbiddenError;
  error.code = 'FORBIDDEN';
  return error;
};

const createNotFoundError = (message: string) => {
  const error = new Error(message) as NotFoundError;
  error.code = 'NOT_FOUND';
  return error;
};

const hasOrganizerAccess = (token: string) => token === 'organizer-1' || token === 'admin-1';
const hasReviewerAccess = (token: string) => token === 'reviewer-1' || token === 'admin-1';

const now = () => new Date().toISOString();

type OrganizerApplicationDetailRecord = Parameters<typeof fromTransportOrganizerApplicationDetail>[0];
type ReviewerCandidateRecord = Parameters<typeof fromTransportReviewerCandidate>[0];
type InternalDecisionRecord = Parameters<typeof fromTransportInternalDecision>[0];
type ReviewRecord = Parameters<typeof fromTransportReviewRecord>[0];

const applicationSeed: OrganizerApplicationDetailRecord = {
  id: 'review-application-1',
  application_type: 'conference_application',
  source_module: 'M2',
  conference_id: 'review-conf-001',
  conference_title: 'Review Demo Conference 2026',
  status: 'submitted',
  participation_type: 'talk',
  statement: 'I would like to present new work on birational geometry.',
  abstract_title: 'A note on birational geometry',
  abstract_text: 'This talk discusses a compactness result.',
  interested_in_travel_support: true,
  extra_answers: {},
  submitted_at: '2026-08-01T10:00:00.000Z',
  applicant_profile_snapshot: {
    full_name: 'Ada Lovelace',
    institution_name_raw: 'National University of Singapore',
    country_code: 'SG',
    career_stage: 'phd',
    research_keywords: ['algebraic geometry'],
  },
  files: [],
  review_assignments: [],
  reviews: [],
  decision: null,
  decided_at: null,
};

const reviewerCandidateSeed: ReviewerCandidateRecord = {
  user_id: 'reviewer-1',
  profile_slug: 'prof-reviewer',
  full_name: 'Prof Reviewer',
  institution_name_raw: 'University of Tokyo',
  research_keywords: ['algebraic geometry', 'moduli'],
  msc_codes: [{ code: '14D20', is_primary: true }],
  eligible_for_review: true,
};

let applicationState: OrganizerApplicationDetailRecord[] = [applicationSeed];
let reviewerCandidateState: ReviewerCandidateRecord[] = [reviewerCandidateSeed];
let assignmentCount = 1;
let reviewCount = 1;
let decisionCount = 1;

export const resetReviewFakeState = () => {
  applicationState = [structuredClone(applicationSeed)];
  reviewerCandidateState = [structuredClone(reviewerCandidateSeed)];
  assignmentCount = 1;
  reviewCount = 1;
  decisionCount = 1;
};

const findApplication = (applicationId: string) => {
  const application = applicationState.find((item) => item.id === applicationId);
  if (!application) {
    throw new Error('Application not found');
  }

  return application;
};

const createAssignmentRecord = ({
  applicationId,
  reviewerUserId,
  conflictState,
  conflictNote,
  dueAt,
}: {
  applicationId: string;
  reviewerUserId: string;
  conflictState: ReviewConflictState;
  conflictNote?: string | null;
  dueAt?: string | null;
}) => ({
  id: `review-assignment-${assignmentCount++}`,
  application_id: applicationId,
  application_type: 'conference_application' as const,
  reviewer_user_id: reviewerUserId,
  reviewer_name:
    reviewerCandidateState.find((candidate) => candidate.user_id === reviewerUserId)?.full_name ??
    'Reviewer',
  assigned_by_user_id: 'organizer-1',
  status: 'assigned' as const,
  conflict_state: conflictState,
  conflict_note: conflictNote ?? null,
  due_at: dueAt ?? null,
  assigned_at: now(),
  completed_at: null,
});

export const seedReviewAssignment = ({
  applicationId,
  reviewerUserId,
  conflictState,
  conflictNote,
}: {
  applicationId: string;
  reviewerUserId: string;
  conflictState: ReviewConflictState;
  conflictNote?: string;
}) => {
  const application = findApplication(applicationId);
  const assignment = createAssignmentRecord({
    applicationId,
    reviewerUserId,
    conflictState,
    conflictNote,
  });

  application.review_assignments = [assignment, ...application.review_assignments];
  if (application.status === 'submitted') {
    application.status = 'under_review';
  }

  return assignment.id;
};

const readViewerStatus = (application: OrganizerApplicationDetailRecord) => {
  if (application.status === 'submitted' || application.status === 'under_review' || application.status === 'decided') {
    return application.decision?.release_status === 'released' ? 'result_released' : 'under_review';
  }

  return 'draft';
};

const toReleasedDecision = (decision: InternalDecisionRecord | null) =>
  decision?.release_status === 'released'
    ? {
        decision_kind: decision.decision_kind,
        final_status: decision.final_status,
        display_label:
          decision.final_status === 'accepted'
            ? 'Accepted'
            : decision.final_status === 'waitlisted'
              ? 'Waitlisted'
              : 'Rejected',
        note_external: decision.note_external,
        released_at: decision.released_at,
      }
    : null;

const toOrganizerListItem = (application: OrganizerApplicationDetailRecord) =>
  fromTransportOrganizerApplicationListItem({
    id: application.id,
    application_type: application.application_type,
    applicant_user_id: 'applicant-1',
    applicant_name: application.applicant_profile_snapshot.full_name ?? 'Applicant',
    status: application.status,
    participation_type: application.participation_type,
    submitted_at: application.submitted_at,
    review_assignment_count: application.review_assignments.filter(
      (assignment) => assignment.status !== 'cancelled'
    ).length,
    completed_review_count: application.review_assignments.filter(
      (assignment) => assignment.status === 'review_submitted'
    ).length,
    decision_release_status: application.decision?.release_status ?? null,
  });

const toReviewerQueueItem = (
  application: OrganizerApplicationDetailRecord,
  assignment: OrganizerApplicationDetailRecord['review_assignments'][number]
) =>
  fromTransportReviewerQueueItem({
    assignment_id: assignment.id,
    application_id: application.id,
    application_type: application.application_type,
    source_title: application.conference_title,
    applicant_name: application.applicant_profile_snapshot.full_name ?? 'Applicant',
    status: assignment.status,
    conflict_state: assignment.conflict_state,
    due_at: assignment.due_at,
    assigned_at: assignment.assigned_at,
  });

const toReviewerAssignmentDetail = (
  application: OrganizerApplicationDetailRecord,
  assignment: OrganizerApplicationDetailRecord['review_assignments'][number]
) =>
  fromTransportReviewerAssignmentDetail({
    id: assignment.id,
    status: assignment.status,
    conflict_state: assignment.conflict_state,
    conflict_note: assignment.conflict_note,
    submission_blocked:
      assignment.conflict_state === 'flagged' || assignment.status !== 'assigned',
    due_at: assignment.due_at,
    application: {
      id: application.id,
      application_type: application.application_type,
      source_title: application.conference_title,
      participation_type: application.participation_type,
      statement: application.statement,
      abstract_title: application.abstract_title,
      abstract_text: application.abstract_text,
      applicant_profile_snapshot: application.applicant_profile_snapshot,
      files: application.files,
    },
  });

export const fakeReviewProvider: ReviewProvider = {
  async listOrganizerConferenceApplications(conferenceId) {
    const token = requireToken();
    await delay();

    if (!hasOrganizerAccess(token)) {
      throw createForbiddenError('Organizer access required');
    }

    if (!applicationState.some((application) => application.conference_id === conferenceId)) {
      throw createNotFoundError('Conference not found');
    }

    return applicationState
      .filter((application) => application.conference_id === conferenceId)
      .map(toOrganizerListItem);
  },

  async getOrganizerApplicationDetail(applicationId) {
    const token = requireToken();
    await delay();

    if (!hasOrganizerAccess(token)) {
      throw createForbiddenError('Organizer access required');
    }

    return fromTransportOrganizerApplicationDetail(findApplication(applicationId));
  },

  async listReviewerCandidates() {
    const token = requireToken();
    await delay();

    if (!hasOrganizerAccess(token)) {
      throw createForbiddenError('Organizer access required');
    }

    return reviewerCandidateState.map(fromTransportReviewerCandidate);
  },

  async assignReviewer(applicationId, values) {
    const token = requireToken();
    await delay();

    if (!hasOrganizerAccess(token)) {
      throw createForbiddenError('Organizer access required');
    }

    const application = findApplication(applicationId);
    const assignment = createAssignmentRecord({
      applicationId,
      reviewerUserId: values.reviewerUserId,
      conflictState: values.conflictState,
      conflictNote: values.conflictNote,
      dueAt: values.dueAt || null,
    });

    application.review_assignments = [assignment, ...application.review_assignments];
    if (application.status === 'submitted') {
      application.status = 'under_review';
    }

    return {
      assignment: fromTransportReviewAssignment(assignment),
      applicationStatus: application.status,
    };
  },

  async upsertDecision(applicationId, values) {
    const token = requireToken();
    await delay();

    if (!hasOrganizerAccess(token)) {
      throw createForbiddenError('Organizer access required');
    }

    const application = findApplication(applicationId);
    const decision: InternalDecisionRecord = {
      id: application.decision?.id ?? `review-decision-${decisionCount++}`,
      application_id: applicationId,
      application_type: 'conference_application',
      decision_kind: 'conference_admission',
      final_status: (values.finalStatus || 'accepted') as InternalDecisionRecord['final_status'],
      release_status: 'unreleased',
      note_internal: values.noteInternal.trim() || null,
      note_external: values.noteExternal.trim() || null,
      decided_by_user_id: 'organizer-1',
      decided_at: now(),
      released_at: null,
    };

    application.decision = decision;
    application.status = 'decided';
    application.decided_at = decision.decided_at;

    return {
      decision: fromTransportInternalDecision(decision),
      applicationStatus: application.status,
    };
  },

  async releaseDecision(applicationId) {
    const token = requireToken();
    await delay();

    if (!hasOrganizerAccess(token)) {
      throw createForbiddenError('Organizer access required');
    }

    const application = findApplication(applicationId);
    if (!application.decision) {
      throw new Error('Internal decision missing');
    }

    application.decision = {
      ...application.decision,
      release_status: 'released',
      released_at: now(),
    };

    return fromTransportInternalDecision(application.decision);
  },

  async listReviewerAssignments() {
    const reviewerUserId = requireToken();
    await delay();

    if (!hasReviewerAccess(reviewerUserId)) {
      throw createForbiddenError('Reviewer role required');
    }

    return applicationState.flatMap((application) =>
      application.review_assignments
        .filter((assignment) => assignment.reviewer_user_id === reviewerUserId)
        .map((assignment) => toReviewerQueueItem(application, assignment))
    );
  },

  async getReviewerAssignmentDetail(assignmentId) {
    const reviewerUserId = requireToken();
    await delay();

    if (!hasReviewerAccess(reviewerUserId)) {
      throw createForbiddenError('Reviewer role required');
    }

    for (const application of applicationState) {
      const assignment = application.review_assignments.find(
        (item) => item.id === assignmentId && item.reviewer_user_id === reviewerUserId
      );

      if (assignment) {
        return toReviewerAssignmentDetail(application, assignment);
      }
    }

    throw new Error('Assignment not found');
  },

  async submitReviewerReview(assignmentId, values) {
    const reviewerUserId = requireToken();
    await delay();

    if (!hasReviewerAccess(reviewerUserId)) {
      throw createForbiddenError('Reviewer role required');
    }

    for (const application of applicationState) {
      const assignment = application.review_assignments.find(
        (item) => item.id === assignmentId && item.reviewer_user_id === reviewerUserId
      );

      if (!assignment) {
        continue;
      }

      if (assignment.conflict_state === 'flagged' || assignment.status !== 'assigned') {
        throw new Error('Submission blocked');
      }

      const review: ReviewRecord = {
        id: `review-${reviewCount++}`,
        assignment_id: assignmentId,
        score: typeof values.score === 'number' ? values.score : null,
        recommendation: (values.recommendation || 'accept') as ReviewRecord['recommendation'],
        comment: values.comment.trim(),
        submitted_at: now(),
      };

      assignment.status = 'review_submitted';
      assignment.completed_at = review.submitted_at;
      application.reviews = [review, ...application.reviews];

      return fromTransportReviewRecord(review);
    }

    throw new Error('Assignment not found');
  },

  async getMyApplicationDetail(applicationId) {
    requireToken();
    await delay();
    const application = findApplication(applicationId);

    return fromTransportApplicantApplicationDetail({
      id: application.id,
      application_type: application.application_type,
      source_module: application.source_module,
      conference_id: application.conference_id,
      conference_title: application.conference_title,
      viewer_status: readViewerStatus(application),
      released_decision: toReleasedDecision(application.decision),
    });
  },
};

resetReviewFakeState();
