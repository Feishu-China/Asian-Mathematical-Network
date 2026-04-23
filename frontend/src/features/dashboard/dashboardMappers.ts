import type {
  MyApplication,
  MyApplicationKind,
  NextAction,
  ReleasedDecision,
  ReleasedDecisionFinalStatus,
  ViewerStatus,
} from './types';

type TransportReleasedDecision = {
  decision_kind: string;
  final_status: ReleasedDecisionFinalStatus;
  display_label: string;
  released_at: string | null;
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
