type GrantRecord = {
  id: string;
  slug: string;
  title: string;
  grantType: string;
  linkedConferenceId: string;
  description: string | null;
  eligibilitySummary: string | null;
  coverageSummary: string | null;
  applicationDeadline: Date | null;
  status: string;
  reportRequired: boolean;
  applicationFormSchemaJson: string;
  publishedAt: Date | null;
};

const parseJson = <T>(value: string, fallback: T): T => {
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
};

const isApplicationOpen = (grant: Pick<GrantRecord, 'status' | 'applicationDeadline'>) =>
  grant.status === 'published' &&
  (!grant.applicationDeadline || grant.applicationDeadline.getTime() >= Date.now());

export const serializeGrantListItem = (grant: GrantRecord) => ({
  id: grant.id,
  slug: grant.slug,
  title: grant.title,
  grant_type: grant.grantType,
  linked_conference_id: grant.linkedConferenceId,
  application_deadline: grant.applicationDeadline?.toISOString() ?? null,
  status: grant.status,
  report_required: grant.reportRequired,
  is_application_open: isApplicationOpen(grant),
});

export const serializeGrantDetail = (grant: GrantRecord) => ({
  id: grant.id,
  slug: grant.slug,
  title: grant.title,
  grant_type: grant.grantType,
  linked_conference_id: grant.linkedConferenceId,
  description: grant.description,
  eligibility_summary: grant.eligibilitySummary,
  coverage_summary: grant.coverageSummary,
  application_deadline: grant.applicationDeadline?.toISOString() ?? null,
  status: grant.status,
  report_required: grant.reportRequired,
  published_at: grant.publishedAt?.toISOString() ?? null,
  is_application_open: isApplicationOpen(grant),
});

export const serializeGrantApplicationForm = (grant: GrantRecord) => ({
  grant_id: grant.id,
  schema: parseJson(grant.applicationFormSchemaJson, { fields: [] }),
});

type GrantApplicationRecord = {
  id: string;
  applicationType: string;
  sourceModule: string;
  grantId: string | null;
  linkedConferenceId: string | null;
  linkedConferenceApplicationId: string | null;
  applicantUserId: string;
  status: string;
  statement: string | null;
  travelPlanSummary: string | null;
  fundingNeedSummary: string | null;
  extraAnswersJson: string;
  submittedAt: Date | null;
  decidedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export const serializeGrantApplication = (
  application: GrantApplicationRecord & { grantTitle: string }
) => ({
  id: application.id,
  application_type: application.applicationType,
  source_module: application.sourceModule,
  grant_id: application.grantId,
  grant_title: application.grantTitle,
  linked_conference_id: application.linkedConferenceId,
  linked_conference_application_id: application.linkedConferenceApplicationId,
  applicant_user_id: application.applicantUserId,
  status: application.status,
  statement: application.statement,
  travel_plan_summary: application.travelPlanSummary,
  funding_need_summary: application.fundingNeedSummary,
  extra_answers: parseJson(application.extraAnswersJson, {}),
  files: [],
  submitted_at: application.submittedAt?.toISOString() ?? null,
  decided_at: application.decidedAt?.toISOString() ?? null,
  decision: null,
  created_at: application.createdAt.toISOString(),
  updated_at: application.updatedAt.toISOString(),
});
