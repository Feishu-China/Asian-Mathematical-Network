import type {
  ApplicantProfileSnapshot,
  MyApplication,
  MyApplicationDetail,
  MyApplicationKind,
  NextAction,
  PostVisitReport,
  ReleasedDecision,
  ReleasedDecisionDetail,
  ReleasedDecisionFinalStatus,
  ViewerStatus,
} from './types';

type TransportPostVisitReport = {
  id: string;
  status: string;
  report_narrative: string;
  attendance_confirmed: boolean;
  submitted_at: string | null;
};

export const fromTransportPostVisitReport = (
  report: TransportPostVisitReport | null
): PostVisitReport | null =>
  report
    ? {
        id: report.id,
        status: report.status,
        reportNarrative: report.report_narrative,
        attendanceConfirmed: report.attendance_confirmed,
        submittedAt: report.submitted_at,
      }
    : null;

type TransportReleasedDecision = {
  decision_kind: string;
  final_status: ReleasedDecisionFinalStatus;
  display_label: string;
  released_at: string | null;
};

type TransportReleasedDecisionDetail = TransportReleasedDecision & {
  note_external: string | null;
};

type TransportMyApplication = {
  id: string;
  application_type: MyApplicationKind;
  source_module: string;
  source_id: string | null;
  source_title: string | null;
  linked_conference_title: string | null;
  viewer_status: ViewerStatus;
  submitted_at: string | null;
  released_decision: TransportReleasedDecision | null;
  next_action: NextAction;
  post_visit_report_status: string | null;
};

type TransportMyApplicationDetail = {
  id: string;
  application_type: MyApplicationKind;
  source_module: string;
  conference_id: string | null;
  conference_title: string | null;
  grant_id: string | null;
  grant_title: string | null;
  linked_conference_id: string | null;
  linked_conference_title: string | null;
  linked_conference_application_id: string | null;
  viewer_status: ViewerStatus;
  statement: string | null;
  travel_plan_summary: string | null;
  funding_need_summary: string | null;
  extra_answers: Record<string, unknown>;
  applicant_profile_snapshot: ApplicantProfileSnapshot;
  files: unknown[];
  submitted_at: string | null;
  released_decision: TransportReleasedDecisionDetail | null;
  post_visit_report?: TransportPostVisitReport | null;
  post_visit_report_status: string | null;
};

const fromTransportReleasedDecision = (
  decision: TransportReleasedDecision | null
): ReleasedDecision | null =>
  decision
    ? {
        decisionKind: decision.decision_kind,
        finalStatus: decision.final_status,
        displayLabel: decision.display_label,
        releasedAt: decision.released_at,
      }
    : null;

const fromTransportReleasedDecisionDetail = (
  decision: TransportReleasedDecisionDetail | null
): ReleasedDecisionDetail | null =>
  decision
    ? {
        decisionKind: decision.decision_kind,
        finalStatus: decision.final_status,
        displayLabel: decision.display_label,
        releasedAt: decision.released_at,
        noteExternal: decision.note_external,
      }
    : null;

export const fromTransportMyApplication = (item: TransportMyApplication): MyApplication => ({
  id: item.id,
  applicationType: item.application_type,
  sourceModule: item.source_module,
  sourceId: item.source_id,
  sourceTitle: item.source_title,
  linkedConferenceTitle: item.linked_conference_title,
  viewerStatus: item.viewer_status,
  submittedAt: item.submitted_at,
  releasedDecision: fromTransportReleasedDecision(item.released_decision),
  nextAction: item.next_action,
  postVisitReportStatus: item.post_visit_report_status,
});

export const fromTransportMyApplicationDetail = (
  item: TransportMyApplicationDetail
): MyApplicationDetail => ({
  id: item.id,
  applicationType: item.application_type,
  sourceModule: item.source_module,
  conferenceId: item.conference_id,
  conferenceTitle: item.conference_title,
  grantId: item.grant_id,
  grantTitle: item.grant_title,
  linkedConferenceId: item.linked_conference_id,
  linkedConferenceTitle: item.linked_conference_title,
  linkedConferenceApplicationId: item.linked_conference_application_id,
  viewerStatus: item.viewer_status,
  statement: item.statement,
  travelPlanSummary: item.travel_plan_summary,
  fundingNeedSummary: item.funding_need_summary,
  extraAnswers: item.extra_answers,
  applicantProfileSnapshot: item.applicant_profile_snapshot ?? {},
  files: item.files,
  submittedAt: item.submitted_at,
  releasedDecision: fromTransportReleasedDecisionDetail(item.released_decision),
  postVisitReport: fromTransportPostVisitReport(item.post_visit_report ?? null),
  postVisitReportStatus: item.post_visit_report_status,
});

