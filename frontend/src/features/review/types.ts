export type ReviewAssignmentStatus = 'assigned' | 'review_submitted' | 'cancelled';
export type ReviewConflictState = 'clear' | 'flagged';
export type ReviewRecommendation = 'accept' | 'reject' | 'waitlist';
export type DecisionFinalStatus = 'accepted' | 'rejected' | 'waitlisted';
export type DecisionReleaseStatus = 'unreleased' | 'released';
export type ViewerStatus = 'draft' | 'under_review' | 'result_released';

export type ProfileSnapshot = {
  fullName?: string | null;
  institutionNameRaw?: string | null;
  countryCode?: string | null;
  careerStage?: string | null;
  researchKeywords?: string[];
};

export type OrganizerApplicationListItem = {
  id: string;
  applicationType: 'conference_application';
  applicantUserId: string;
  applicantName: string;
  status: 'submitted' | 'under_review' | 'decided';
  participationType: string | null;
  submittedAt: string | null;
  reviewAssignmentCount: number;
  completedReviewCount: number;
  decisionReleaseStatus: DecisionReleaseStatus | null;
};

export type ReviewerCandidate = {
  userId: string;
  profileSlug: string;
  fullName: string;
  institutionNameRaw: string | null;
  researchKeywords: string[];
  mscCodes: Array<{ code: string; isPrimary: boolean }>;
  eligibleForReview: boolean;
};

export type ReviewAssignment = {
  id: string;
  applicationId: string;
  applicationType: 'conference_application';
  reviewerUserId: string;
  reviewerName?: string;
  assignedByUserId: string;
  status: ReviewAssignmentStatus;
  conflictState: ReviewConflictState;
  conflictNote: string | null;
  dueAt: string | null;
  assignedAt: string;
  completedAt: string | null;
};

export type ReviewRecord = {
  id: string;
  assignmentId: string;
  score: number | null;
  recommendation: ReviewRecommendation;
  comment: string;
  submittedAt: string;
};

export type InternalDecision = {
  id: string;
  applicationId: string;
  applicationType: 'conference_application';
  decisionKind: 'conference_admission';
  finalStatus: DecisionFinalStatus;
  releaseStatus: DecisionReleaseStatus;
  noteInternal: string | null;
  noteExternal: string | null;
  decidedByUserId: string;
  decidedAt: string;
  releasedAt: string | null;
};

export type OrganizerApplicationDetail = {
  id: string;
  applicationType: 'conference_application';
  sourceModule: string;
  conferenceId: string;
  conferenceTitle: string;
  status: 'submitted' | 'under_review' | 'decided';
  participationType: string | null;
  statement: string | null;
  abstractTitle: string | null;
  abstractText: string | null;
  interestedInTravelSupport: boolean;
  extraAnswers: Record<string, unknown>;
  submittedAt: string | null;
  applicantProfileSnapshot: ProfileSnapshot;
  files: Array<{ id: string; fileRole?: string; originalName?: string }>;
  reviewAssignments: ReviewAssignment[];
  reviews: ReviewRecord[];
  decision: InternalDecision | null;
  decidedAt: string | null;
};

export type ReviewerQueueItem = {
  assignmentId: string;
  applicationId: string;
  applicationType: 'conference_application';
  sourceTitle: string;
  applicantName: string;
  status: ReviewAssignmentStatus;
  conflictState: ReviewConflictState;
  dueAt: string | null;
  assignedAt: string;
};

export type ReviewerAssignmentDetail = {
  id: string;
  status: ReviewAssignmentStatus;
  conflictState: ReviewConflictState;
  conflictNote: string | null;
  submissionBlocked: boolean;
  dueAt: string | null;
  application: {
    id: string;
    applicationType: 'conference_application';
    sourceTitle: string;
    participationType: string | null;
    statement: string | null;
    abstractTitle: string | null;
    abstractText: string | null;
    applicantProfileSnapshot: ProfileSnapshot;
    files: Array<{ id: string; fileRole?: string; originalName?: string }>;
  };
};

export type ApplicantApplicationDetail = {
  id: string;
  applicationType: 'conference_application' | 'grant_application';
  sourceModule: string;
  conferenceId: string | null;
  conferenceTitle: string | null;
  viewerStatus: ViewerStatus;
  releasedDecision: {
    decisionKind: string;
    finalStatus: DecisionFinalStatus;
    displayLabel: string;
    noteExternal: string | null;
    releasedAt: string | null;
  } | null;
};

export type AssignReviewerValues = {
  reviewerUserId: string;
  dueAt: string;
  conflictState: ReviewConflictState;
  conflictNote: string;
};

export type DecisionValues = {
  finalStatus: '' | DecisionFinalStatus;
  noteInternal: string;
  noteExternal: string;
};

export type ReviewSubmissionValues = {
  score: '' | number;
  recommendation: '' | ReviewRecommendation;
  comment: string;
};

export type ReviewProvider = {
  listOrganizerConferenceApplications(conferenceId: string): Promise<OrganizerApplicationListItem[]>;
  getOrganizerApplicationDetail(applicationId: string): Promise<OrganizerApplicationDetail>;
  listReviewerCandidates(applicationId: string): Promise<ReviewerCandidate[]>;
  assignReviewer(
    applicationId: string,
    values: AssignReviewerValues
  ): Promise<{ assignment: ReviewAssignment; applicationStatus: OrganizerApplicationDetail['status'] }>;
  upsertDecision(
    applicationId: string,
    values: DecisionValues
  ): Promise<{ decision: InternalDecision; applicationStatus: OrganizerApplicationDetail['status'] }>;
  releaseDecision(applicationId: string): Promise<InternalDecision>;
  listReviewerAssignments(): Promise<ReviewerQueueItem[]>;
  getReviewerAssignmentDetail(assignmentId: string): Promise<ReviewerAssignmentDetail>;
  submitReviewerReview(assignmentId: string, values: ReviewSubmissionValues): Promise<ReviewRecord>;
  getMyApplicationDetail(applicationId: string): Promise<ApplicantApplicationDetail>;
};
