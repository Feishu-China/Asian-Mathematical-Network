export type ViewerStatus = 'draft' | 'under_review' | 'result_released';

export type NextAction =
  | 'continue_draft'
  | 'view_submission'
  | 'view_result'
  | 'submit_post_visit_report';

export type MyApplicationKind = 'conference_application' | 'grant_application';

export type ReleasedDecisionFinalStatus = 'accepted' | 'rejected' | 'waitlisted';

export type ReleasedDecision = {
  decisionKind: string;
  finalStatus: ReleasedDecisionFinalStatus;
  displayLabel: string;
  releasedAt: string | null;
};

export type ReleasedDecisionDetail = ReleasedDecision & {
  noteExternal: string | null;
};

export type MyApplication = {
  id: string;
  applicationType: MyApplicationKind;
  sourceModule: string;
  sourceId: string | null;
  sourceTitle: string | null;
  linkedConferenceTitle: string | null;
  viewerStatus: ViewerStatus;
  submittedAt: string | null;
  releasedDecision: ReleasedDecision | null;
  nextAction: NextAction;
  postVisitReportStatus: string | null;
};

export type ApplicantProfileSnapshot = {
  full_name?: string;
  institution_name_raw?: string | null;
  country_code?: string | null;
  career_stage?: string | null;
  research_keywords?: string[];
};

export type MyApplicationDetail = {
  id: string;
  applicationType: MyApplicationKind;
  sourceModule: string;
  conferenceId: string | null;
  conferenceTitle: string | null;
  grantId: string | null;
  grantTitle: string | null;
  linkedConferenceId: string | null;
  linkedConferenceTitle: string | null;
  linkedConferenceApplicationId: string | null;
  viewerStatus: ViewerStatus;
  statement: string | null;
  travelPlanSummary: string | null;
  fundingNeedSummary: string | null;
  extraAnswers: Record<string, unknown>;
  applicantProfileSnapshot: ApplicantProfileSnapshot;
  files: unknown[];
  submittedAt: string | null;
  releasedDecision: ReleasedDecisionDetail | null;
  postVisitReportStatus: string | null;
};

export type DashboardProvider = {
  listMyApplications(): Promise<MyApplication[]>;
  getMyApplication(applicationId: string): Promise<MyApplicationDetail | null>;
};

