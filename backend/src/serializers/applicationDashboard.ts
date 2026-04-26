import {
  getApplicantViewerStatus,
  getReleasedDecisionDisplayLabel,
} from '../lib/workflow';

type ConferenceContext = {
  id: string;
  slug: string;
  title: string;
} | null;

type GrantContext = {
  id: string;
  slug: string;
  title: string;
  linkedConference: {
    title: string;
  } | null;
  reportRequired: boolean;
} | null;

type DecisionContext = {
  decisionKind: string;
  finalStatus: string;
  releaseStatus: string;
  releasedAt: Date | null;
} | null;

export type DashboardApplicationRecord = {
  id: string;
  applicationType: string;
  sourceModule: string;
  status: string;
  conferenceId: string | null;
  grantId: string | null;
  linkedConferenceId: string | null;
  linkedConferenceApplicationId: string | null;
  submittedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  conference: ConferenceContext;
  grant: GrantContext;
  decision: DecisionContext;
};

export const serializeMyApplicationItem = (application: DashboardApplicationRecord) => {
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
          released_at: application.decision.releasedAt?.toISOString() ?? null,
        }
      : null;
  const nextAction =
    viewerStatus === 'draft'
      ? 'continue_draft'
      : viewerStatus === 'result_released'
        ? application.applicationType === 'grant_application' &&
          releasedDecision?.final_status === 'accepted' &&
          application.grant?.reportRequired
          ? 'submit_post_visit_report'
          : 'view_result'
        : 'view_submission';

  return {
    id: application.id,
    application_type: application.applicationType,
    source_module: application.sourceModule,
    source_id: application.conferenceId ?? application.grantId,
    source_slug: application.conference?.slug ?? application.grant?.slug ?? null,
    source_title: application.conference?.title ?? application.grant?.title ?? null,
    linked_conference_title: application.grant?.linkedConference?.title ?? null,
    viewer_status: viewerStatus,
    submitted_at: application.submittedAt?.toISOString() ?? null,
    released_decision: releasedDecision,
    next_action: nextAction,
    post_visit_report_status: null,
  };
};
