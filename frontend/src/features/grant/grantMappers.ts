import type {
  GrantApplication,
  GrantApplicationValues,
  GrantDetail,
  GrantFormSchema,
  GrantListItem,
} from './types';

type TransportGrantListItem = {
  id: string;
  slug: string;
  title: string;
  grant_type: GrantListItem['grantType'];
  linked_conference_id: string;
  application_deadline: string | null;
  status: GrantListItem['status'];
  report_required: boolean;
  is_application_open: boolean;
};

type TransportGrantDetail = TransportGrantListItem & {
  description: string | null;
  eligibility_summary: string | null;
  coverage_summary: string | null;
  published_at: string | null;
};

type TransportGrantApplication = {
  id: string;
  application_type: GrantApplication['applicationType'];
  source_module: string;
  grant_id: string;
  grant_title: string;
  linked_conference_id: string;
  linked_conference_application_id: string;
  applicant_user_id: string;
  status: GrantApplication['status'];
  statement: string | null;
  travel_plan_summary: string | null;
  funding_need_summary: string | null;
  extra_answers: Record<string, string>;
  files: Array<{ id: string; name: string }>;
  submitted_at: string | null;
  decided_at: string | null;
  created_at: string;
  updated_at: string;
};

type TransportGrantApplicationForm = {
  grant_id: string;
  schema: GrantFormSchema;
};

export const fromTransportGrantListItem = (item: TransportGrantListItem): GrantListItem => ({
  id: item.id,
  slug: item.slug,
  title: item.title,
  grantType: item.grant_type,
  linkedConferenceId: item.linked_conference_id,
  applicationDeadline: item.application_deadline,
  status: item.status,
  reportRequired: item.report_required,
  isApplicationOpen: item.is_application_open,
});

export const fromTransportGrantDetail = (detail: TransportGrantDetail): GrantDetail => ({
  ...fromTransportGrantListItem(detail),
  description: detail.description,
  eligibilitySummary: detail.eligibility_summary,
  coverageSummary: detail.coverage_summary,
  publishedAt: detail.published_at,
});

export const fromTransportGrantApplication = (
  application: TransportGrantApplication
): GrantApplication => ({
  id: application.id,
  applicationType: application.application_type,
  sourceModule: application.source_module,
  grantId: application.grant_id,
  grantTitle: application.grant_title,
  linkedConferenceId: application.linked_conference_id,
  linkedConferenceApplicationId: application.linked_conference_application_id,
  applicantUserId: application.applicant_user_id,
  status: application.status,
  statement: application.statement,
  travelPlanSummary: application.travel_plan_summary,
  fundingNeedSummary: application.funding_need_summary,
  extraAnswers: application.extra_answers,
  files: application.files,
  submittedAt: application.submitted_at,
  decidedAt: application.decided_at,
  createdAt: application.created_at,
  updatedAt: application.updated_at,
});

export const fromTransportGrantApplicationForm = (
  form: TransportGrantApplicationForm
): GrantFormSchema => form.schema;

export const toTransportGrantApplicationPayload = (values: GrantApplicationValues) => ({
  linked_conference_application_id: values.linkedConferenceApplicationId,
  statement: values.statement.trim(),
  travel_plan_summary: values.travelPlanSummary.trim(),
  funding_need_summary: values.fundingNeedSummary.trim(),
  extra_answers: values.extraAnswers,
  file_ids: [],
});
