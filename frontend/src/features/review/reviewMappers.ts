import type {
  ApplicantApplicationDetail,
  AssignReviewerValues,
  DecisionValues,
  InternalDecision,
  OrganizerApplicationDetail,
  OrganizerApplicationListItem,
  ReviewAssignment,
  ReviewRecord,
  ReviewerAssignmentDetail,
  ReviewerCandidate,
  ReviewerQueueItem,
  ReviewSubmissionValues,
} from './types';

type TransportProfileSnapshot = {
  full_name?: string | null;
  institution_name_raw?: string | null;
  country_code?: string | null;
  career_stage?: string | null;
  research_keywords?: string[];
};

type TransportOrganizerApplicationListItem = {
  id: string;
  application_type: 'conference_application';
  applicant_user_id: string;
  applicant_name: string;
  status: OrganizerApplicationListItem['status'];
  participation_type: string | null;
  submitted_at: string | null;
  review_assignment_count: number;
  completed_review_count: number;
  decision_release_status: OrganizerApplicationListItem['decisionReleaseStatus'];
};

type TransportReviewerCandidate = {
  user_id: string;
  profile_slug: string;
  full_name: string;
  institution_name_raw: string | null;
  research_keywords: string[];
  msc_codes: Array<{ code: string; is_primary: boolean }>;
  eligible_for_review: boolean;
};

type TransportReviewAssignment = {
  id: string;
  application_id: string;
  application_type: 'conference_application';
  reviewer_user_id: string;
  reviewer_name?: string;
  assigned_by_user_id: string;
  status: ReviewAssignment['status'];
  conflict_state: ReviewAssignment['conflictState'];
  conflict_note: string | null;
  due_at: string | null;
  assigned_at: string;
  completed_at: string | null;
};

type TransportReviewRecord = {
  id: string;
  assignment_id: string;
  score: number | null;
  recommendation: ReviewRecord['recommendation'];
  comment: string;
  submitted_at: string;
};

type TransportInternalDecision = {
  id: string;
  application_id: string;
  application_type: 'conference_application';
  decision_kind: 'conference_admission';
  final_status: InternalDecision['finalStatus'];
  release_status: InternalDecision['releaseStatus'];
  note_internal: string | null;
  note_external: string | null;
  decided_by_user_id: string;
  decided_at: string;
  released_at: string | null;
};

type TransportOrganizerApplicationDetail = {
  id: string;
  application_type: 'conference_application';
  source_module: string;
  conference_id: string;
  conference_title: string;
  status: OrganizerApplicationDetail['status'];
  participation_type: string | null;
  statement: string | null;
  abstract_title: string | null;
  abstract_text: string | null;
  interested_in_travel_support: boolean;
  extra_answers: Record<string, unknown>;
  submitted_at: string | null;
  applicant_profile_snapshot: TransportProfileSnapshot;
  files: OrganizerApplicationDetail['files'];
  review_assignments: TransportReviewAssignment[];
  reviews: TransportReviewRecord[];
  decision: TransportInternalDecision | null;
  decided_at: string | null;
};

type TransportReviewerQueueItem = {
  assignment_id: string;
  application_id: string;
  application_type: 'conference_application';
  source_title: string;
  applicant_name: string;
  status: ReviewerQueueItem['status'];
  conflict_state: ReviewerQueueItem['conflictState'];
  due_at: string | null;
  assigned_at: string;
};

type TransportReviewerAssignmentDetail = {
  id: string;
  status: ReviewerAssignmentDetail['status'];
  conflict_state: ReviewerAssignmentDetail['conflictState'];
  conflict_note: string | null;
  submission_blocked: boolean;
  due_at: string | null;
  application: {
    id: string;
    application_type: 'conference_application';
    source_title: string;
    participation_type: string | null;
    statement: string | null;
    abstract_title: string | null;
    abstract_text: string | null;
    applicant_profile_snapshot: TransportProfileSnapshot;
    files: ReviewerAssignmentDetail['application']['files'];
  };
};

type TransportApplicantApplicationDetail = {
  id: string;
  application_type: ApplicantApplicationDetail['applicationType'];
  source_module: string;
  conference_id: string | null;
  conference_title: string | null;
  grant_id: string | null;
  grant_title: string | null;
  linked_conference_id: string | null;
  linked_conference_title: string | null;
  linked_conference_application_id: string | null;
  viewer_status: ApplicantApplicationDetail['viewerStatus'];
  statement: string | null;
  travel_plan_summary: string | null;
  funding_need_summary: string | null;
  extra_answers: Record<string, unknown>;
  applicant_profile_snapshot: TransportProfileSnapshot;
  files: ApplicantApplicationDetail['files'];
  submitted_at: string | null;
  released_decision: {
    decision_kind: string;
    final_status: InternalDecision['finalStatus'];
    display_label: string;
    note_external: string | null;
    released_at: string | null;
  } | null;
  post_visit_report_status: string | null;
};

const fromTransportProfileSnapshot = (
  snapshot: TransportProfileSnapshot
): OrganizerApplicationDetail['applicantProfileSnapshot'] => ({
  fullName: snapshot.full_name ?? null,
  institutionNameRaw: snapshot.institution_name_raw ?? null,
  countryCode: snapshot.country_code ?? null,
  careerStage: snapshot.career_stage ?? null,
  researchKeywords: snapshot.research_keywords ?? [],
});

export const fromTransportOrganizerApplicationListItem = (
  item: TransportOrganizerApplicationListItem
): OrganizerApplicationListItem => ({
  id: item.id,
  applicationType: item.application_type,
  applicantUserId: item.applicant_user_id,
  applicantName: item.applicant_name,
  status: item.status,
  participationType: item.participation_type,
  submittedAt: item.submitted_at,
  reviewAssignmentCount: item.review_assignment_count,
  completedReviewCount: item.completed_review_count,
  decisionReleaseStatus: item.decision_release_status,
});

export const fromTransportReviewerCandidate = (
  candidate: TransportReviewerCandidate
): ReviewerCandidate => ({
  userId: candidate.user_id,
  profileSlug: candidate.profile_slug,
  fullName: candidate.full_name,
  institutionNameRaw: candidate.institution_name_raw,
  researchKeywords: candidate.research_keywords,
  mscCodes: candidate.msc_codes.map((item) => ({
    code: item.code,
    isPrimary: item.is_primary,
  })),
  eligibleForReview: candidate.eligible_for_review,
});

export const fromTransportReviewAssignment = (
  assignment: TransportReviewAssignment
): ReviewAssignment => ({
  id: assignment.id,
  applicationId: assignment.application_id,
  applicationType: assignment.application_type,
  reviewerUserId: assignment.reviewer_user_id,
  reviewerName: assignment.reviewer_name,
  assignedByUserId: assignment.assigned_by_user_id,
  status: assignment.status,
  conflictState: assignment.conflict_state,
  conflictNote: assignment.conflict_note,
  dueAt: assignment.due_at,
  assignedAt: assignment.assigned_at,
  completedAt: assignment.completed_at,
});

export const fromTransportReviewRecord = (review: TransportReviewRecord): ReviewRecord => ({
  id: review.id,
  assignmentId: review.assignment_id,
  score: review.score,
  recommendation: review.recommendation,
  comment: review.comment,
  submittedAt: review.submitted_at,
});

export const fromTransportInternalDecision = (
  decision: TransportInternalDecision
): InternalDecision => ({
  id: decision.id,
  applicationId: decision.application_id,
  applicationType: decision.application_type,
  decisionKind: decision.decision_kind,
  finalStatus: decision.final_status,
  releaseStatus: decision.release_status,
  noteInternal: decision.note_internal,
  noteExternal: decision.note_external,
  decidedByUserId: decision.decided_by_user_id,
  decidedAt: decision.decided_at,
  releasedAt: decision.released_at,
});

export const fromTransportOrganizerApplicationDetail = (
  detail: TransportOrganizerApplicationDetail
): OrganizerApplicationDetail => ({
  id: detail.id,
  applicationType: detail.application_type,
  sourceModule: detail.source_module,
  conferenceId: detail.conference_id,
  conferenceTitle: detail.conference_title,
  status: detail.status,
  participationType: detail.participation_type,
  statement: detail.statement,
  abstractTitle: detail.abstract_title,
  abstractText: detail.abstract_text,
  interestedInTravelSupport: detail.interested_in_travel_support,
  extraAnswers: detail.extra_answers,
  submittedAt: detail.submitted_at,
  applicantProfileSnapshot: fromTransportProfileSnapshot(detail.applicant_profile_snapshot),
  files: detail.files,
  reviewAssignments: detail.review_assignments.map(fromTransportReviewAssignment),
  reviews: detail.reviews.map(fromTransportReviewRecord),
  decision: detail.decision ? fromTransportInternalDecision(detail.decision) : null,
  decidedAt: detail.decided_at,
});

export const fromTransportReviewerQueueItem = (
  item: TransportReviewerQueueItem
): ReviewerQueueItem => ({
  assignmentId: item.assignment_id,
  applicationId: item.application_id,
  applicationType: item.application_type,
  sourceTitle: item.source_title,
  applicantName: item.applicant_name,
  status: item.status,
  conflictState: item.conflict_state,
  dueAt: item.due_at,
  assignedAt: item.assigned_at,
});

export const fromTransportReviewerAssignmentDetail = (
  detail: TransportReviewerAssignmentDetail
): ReviewerAssignmentDetail => ({
  id: detail.id,
  status: detail.status,
  conflictState: detail.conflict_state,
  conflictNote: detail.conflict_note,
  submissionBlocked: detail.submission_blocked,
  dueAt: detail.due_at,
  application: {
    id: detail.application.id,
    applicationType: detail.application.application_type,
    sourceTitle: detail.application.source_title,
    participationType: detail.application.participation_type,
    statement: detail.application.statement,
    abstractTitle: detail.application.abstract_title,
    abstractText: detail.application.abstract_text,
    applicantProfileSnapshot: fromTransportProfileSnapshot(
      detail.application.applicant_profile_snapshot
    ),
    files: detail.application.files,
  },
});

export const fromTransportApplicantApplicationDetail = (
  detail: TransportApplicantApplicationDetail
): ApplicantApplicationDetail => ({
  id: detail.id,
  applicationType: detail.application_type,
  sourceModule: detail.source_module,
  conferenceId: detail.conference_id,
  conferenceTitle: detail.conference_title,
  grantId: detail.grant_id,
  grantTitle: detail.grant_title,
  linkedConferenceId: detail.linked_conference_id,
  linkedConferenceTitle: detail.linked_conference_title,
  linkedConferenceApplicationId: detail.linked_conference_application_id,
  viewerStatus: detail.viewer_status,
  statement: detail.statement,
  travelPlanSummary: detail.travel_plan_summary,
  fundingNeedSummary: detail.funding_need_summary,
  extraAnswers: detail.extra_answers,
  applicantProfileSnapshot: fromTransportProfileSnapshot(detail.applicant_profile_snapshot),
  files: detail.files,
  submittedAt: detail.submitted_at,
  releasedDecision: detail.released_decision
    ? {
        decisionKind: detail.released_decision.decision_kind,
        finalStatus: detail.released_decision.final_status,
        displayLabel: detail.released_decision.display_label,
        noteExternal: detail.released_decision.note_external,
        releasedAt: detail.released_decision.released_at,
      }
    : null,
  postVisitReportStatus: detail.post_visit_report_status,
});

export const toTransportAssignReviewerPayload = (values: AssignReviewerValues) => ({
  reviewer_user_id: values.reviewerUserId,
  due_at: values.dueAt || null,
  conflict_state: values.conflictState,
  conflict_note: values.conflictNote.trim() || null,
});

export const toTransportDecisionPayload = (values: DecisionValues) => ({
  final_status: values.finalStatus,
  note_internal: values.noteInternal.trim() || null,
  note_external: values.noteExternal.trim() || null,
});

export const toTransportReviewPayload = (values: ReviewSubmissionValues) => ({
  score: typeof values.score === 'number' ? values.score : null,
  recommendation: values.recommendation,
  comment: values.comment.trim(),
});
