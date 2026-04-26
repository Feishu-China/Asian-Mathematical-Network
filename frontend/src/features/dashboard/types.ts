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

export type MyApplication = {
  id: string;
  applicationType: MyApplicationKind;
  sourceModule: string;
  sourceId: string | null;
  sourceSlug: string | null;
  sourceTitle: string | null;
  linkedConferenceTitle: string | null;
  viewerStatus: ViewerStatus;
  submittedAt: string | null;
  releasedDecision: ReleasedDecision | null;
  nextAction: NextAction;
  postVisitReportStatus: string | null;
};

export type DashboardProvider = {
  listMyApplications(): Promise<MyApplication[]>;
};
