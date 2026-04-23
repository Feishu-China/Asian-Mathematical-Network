import { parseJson, getApplicantViewerStatus, getReleasedDecisionDisplayLabel } from '../lib/workflow';

type ProfileSnapshot = {
  full_name?: string | null;
  institution_name_raw?: string | null;
  country_code?: string | null;
  career_stage?: string | null;
  research_keywords?: string[];
};

type InternalDecisionRecord = {
  id: string;
  applicationId: string;
  decisionKind: string;
  finalStatus: string;
  releaseStatus: string;
  noteInternal: string | null;
  noteExternal: string | null;
  decidedByUserId: string;
  decidedAt: Date;
  releasedAt: Date | null;
};

type ReviewRecord = {
  id: string;
  assignmentId: string;
  score: number | null;
  recommendation: string;
  comment: string;
  submittedAt: Date;
};

type AssignmentRecord = {
  id: string;
  applicationId: string;
  reviewerUserId: string;
  assignedByUserId: string;
  status: string;
  conflictState: string;
  conflictNote: string | null;
  dueAt: Date | null;
  assignedAt: Date;
  completedAt: Date | null;
  review?: ReviewRecord | null;
  reviewer?: {
    profile?: {
      fullName: string;
    } | null;
  } | null;
};

const readProfileSnapshot = (value: string | null | undefined) =>
  parseJson<ProfileSnapshot>(value, {});

const readApplicantName = (
  applicantProfileSnapshotJson: string | null | undefined,
  fallbackName?: string | null
) =>
  readProfileSnapshot(applicantProfileSnapshotJson).full_name ??
  fallbackName ??
  'Applicant';

export const serializeInternalDecision = (
  decision: InternalDecisionRecord,
  applicationType: string
) => ({
  id: decision.id,
  application_id: decision.applicationId,
  application_type: applicationType,
  decision_kind: decision.decisionKind,
  final_status: decision.finalStatus,
  release_status: decision.releaseStatus,
  note_internal: decision.noteInternal,
  note_external: decision.noteExternal,
  decided_by_user_id: decision.decidedByUserId,
  decided_at: decision.decidedAt.toISOString(),
  released_at: decision.releasedAt?.toISOString() ?? null,
});

export const serializeReviewAssignment = (
  assignment: AssignmentRecord,
  applicationType: string
) => ({
  id: assignment.id,
  application_id: assignment.applicationId,
  application_type: applicationType,
  reviewer_user_id: assignment.reviewerUserId,
  assigned_by_user_id: assignment.assignedByUserId,
  status: assignment.status,
  conflict_state: assignment.conflictState,
  conflict_note: assignment.conflictNote,
  due_at: assignment.dueAt?.toISOString() ?? null,
  assigned_at: assignment.assignedAt.toISOString(),
  completed_at: assignment.completedAt?.toISOString() ?? null,
});

export const serializeReview = (review: ReviewRecord) => ({
  id: review.id,
  assignment_id: review.assignmentId,
  score: review.score,
  recommendation: review.recommendation,
  comment: review.comment,
  submitted_at: review.submittedAt.toISOString(),
});

export const serializeOrganizerApplicationListItem = (application: {
  id: string;
  applicationType: string;
  applicantUserId: string;
  status: string;
  participationType: string | null;
  submittedAt: Date | null;
  applicantProfileSnapshotJson: string | null;
  applicant: { profile: { fullName: string } | null };
  reviewAssignments: Array<{ status: string }>;
  decision: { releaseStatus: string } | null;
}) => ({
  id: application.id,
  application_type: application.applicationType,
  applicant_user_id: application.applicantUserId,
  applicant_name: readApplicantName(
    application.applicantProfileSnapshotJson,
    application.applicant.profile?.fullName
  ),
  status: application.status,
  participation_type: application.participationType,
  submitted_at: application.submittedAt?.toISOString() ?? null,
  review_assignment_count: application.reviewAssignments.filter(
    (item) => item.status !== 'cancelled'
  ).length,
  completed_review_count: application.reviewAssignments.filter(
    (item) => item.status === 'review_submitted'
  ).length,
  decision_release_status: application.decision?.releaseStatus ?? null,
});

export const serializeReviewerCandidate = (profile: {
  userId: string;
  slug: string;
  fullName: string;
  institutionNameRaw: string | null;
  researchKeywordsJson: string;
  mscCodes: Array<{ mscCode: string; isPrimary: boolean }>;
}) => ({
  user_id: profile.userId,
  profile_slug: profile.slug,
  full_name: profile.fullName,
  institution_name_raw: profile.institutionNameRaw,
  research_keywords: parseJson<string[]>(profile.researchKeywordsJson, []),
  msc_codes: profile.mscCodes.map((item) => ({
    code: item.mscCode,
    is_primary: item.isPrimary,
  })),
  eligible_for_review: true,
});

export const serializeOrganizerApplicationDetail = (application: {
  id: string;
  applicationType: string;
  sourceModule: string;
  conferenceId: string | null;
  applicantUserId: string;
  status: string;
  participationType: string | null;
  statement: string | null;
  abstractTitle: string | null;
  abstractText: string | null;
  interestedInTravelSupport: boolean;
  extraAnswersJson: string;
  applicantProfileSnapshotJson: string | null;
  submittedAt: Date | null;
  decidedAt: Date | null;
  conference?: { title: string } | null;
  reviewAssignments: AssignmentRecord[];
  decision: InternalDecisionRecord | null;
}) => ({
  id: application.id,
  application_type: application.applicationType,
  source_module: application.sourceModule,
  conference_id: application.conferenceId,
  conference_title: application.conference?.title ?? null,
  status: application.status,
  participation_type: application.participationType,
  statement: application.statement,
  abstract_title: application.abstractTitle,
  abstract_text: application.abstractText,
  interested_in_travel_support: application.interestedInTravelSupport,
  extra_answers: parseJson<Record<string, unknown>>(application.extraAnswersJson, {}),
  submitted_at: application.submittedAt?.toISOString() ?? null,
  applicant_profile_snapshot: readProfileSnapshot(application.applicantProfileSnapshotJson),
  files: [],
  review_assignments: application.reviewAssignments.map((assignment) => ({
    ...serializeReviewAssignment(assignment, application.applicationType),
    reviewer_name: assignment.reviewer?.profile?.fullName ?? 'Reviewer',
  })),
  reviews: application.reviewAssignments
    .filter((assignment) => assignment.review)
    .map((assignment) => serializeReview(assignment.review as ReviewRecord)),
  decision: application.decision
    ? serializeInternalDecision(application.decision, application.applicationType)
    : null,
  decided_at: application.decidedAt?.toISOString() ?? null,
});

export const serializeReviewerAssignmentListItem = (assignment: {
  id: string;
  status: string;
  conflictState: string;
  dueAt: Date | null;
  assignedAt: Date;
  application: {
    id: string;
    applicationType: string;
    applicantProfileSnapshotJson: string | null;
    applicant: { profile: { fullName: string } | null };
    conference?: { title: string } | null;
    grant?: { title: string } | null;
  };
}) => ({
  assignment_id: assignment.id,
  application_id: assignment.application.id,
  application_type: assignment.application.applicationType,
  source_title:
    assignment.application.conference?.title ?? assignment.application.grant?.title ?? 'Application',
  applicant_name: readApplicantName(
    assignment.application.applicantProfileSnapshotJson,
    assignment.application.applicant.profile?.fullName
  ),
  status: assignment.status,
  conflict_state: assignment.conflictState,
  due_at: assignment.dueAt?.toISOString() ?? null,
  assigned_at: assignment.assignedAt.toISOString(),
});

export const serializeReviewerAssignmentDetail = (assignment: {
  id: string;
  status: string;
  conflictState: string;
  conflictNote: string | null;
  dueAt: Date | null;
  application: {
    id: string;
    applicationType: string;
    statement: string | null;
    participationType: string | null;
    abstractTitle: string | null;
    abstractText: string | null;
    applicantProfileSnapshotJson: string | null;
    conference?: { title: string } | null;
    grant?: { title: string } | null;
  };
}) => ({
  id: assignment.id,
  status: assignment.status,
  conflict_state: assignment.conflictState,
  conflict_note: assignment.conflictNote,
  submission_blocked: assignment.conflictState === 'flagged' || assignment.status !== 'assigned',
  due_at: assignment.dueAt?.toISOString() ?? null,
  application: {
    id: assignment.application.id,
    application_type: assignment.application.applicationType,
    source_title:
      assignment.application.conference?.title ?? assignment.application.grant?.title ?? 'Application',
    participation_type: assignment.application.participationType,
    statement: assignment.application.statement,
    abstract_title: assignment.application.abstractTitle,
    abstract_text: assignment.application.abstractText,
    applicant_profile_snapshot: readProfileSnapshot(
      assignment.application.applicantProfileSnapshotJson
    ),
    files: [],
  },
});

export const serializeApplicantApplicationDetail = (application: {
  id: string;
  applicationType: string;
  sourceModule: string;
  conferenceId: string | null;
  grantId: string | null;
  linkedConferenceId: string | null;
  linkedConferenceApplicationId: string | null;
  status: string;
  statement: string | null;
  travelPlanSummary: string | null;
  fundingNeedSummary: string | null;
  extraAnswersJson: string;
  applicantProfileSnapshotJson: string | null;
  submittedAt: Date | null;
  conference?: { title: string } | null;
  grant?: { title: string; linkedConference?: { title: string } | null } | null;
  decision: InternalDecisionRecord | null;
}) => {
  const viewerStatus = getApplicantViewerStatus(
    application.status,
    application.decision?.releaseStatus
  );
  const releasedDecision =
    application.decision?.releaseStatus === 'released'
      ? {
          decision_kind: application.decision.decisionKind,
          final_status: application.decision.finalStatus,
          display_label: getReleasedDecisionDisplayLabel(
            application.applicationType,
            application.decision.finalStatus
          ),
          note_external: application.decision.noteExternal,
          released_at: application.decision.releasedAt?.toISOString() ?? null,
        }
      : null;

  return {
    id: application.id,
    application_type: application.applicationType,
    source_module: application.sourceModule,
    conference_id: application.conferenceId,
    conference_title: application.conference?.title ?? null,
    grant_id: application.grantId,
    grant_title: application.grant?.title ?? null,
    linked_conference_id: application.linkedConferenceId,
    linked_conference_title: application.grant?.linkedConference?.title ?? null,
    linked_conference_application_id: application.linkedConferenceApplicationId,
    viewer_status: viewerStatus,
    statement: application.statement,
    travel_plan_summary: application.travelPlanSummary,
    funding_need_summary: application.fundingNeedSummary,
    extra_answers: parseJson<Record<string, unknown>>(application.extraAnswersJson, {}),
    applicant_profile_snapshot: readProfileSnapshot(application.applicantProfileSnapshotJson),
    files: [],
    submitted_at: application.submittedAt?.toISOString() ?? null,
    released_decision: releasedDecision,
    post_visit_report_status: null,
  };
};
