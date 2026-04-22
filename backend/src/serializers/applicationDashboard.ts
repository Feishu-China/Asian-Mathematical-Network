type ConferenceContext = {
  id: string;
  slug: string;
  title: string;
} | null;

type GrantContext = {
  id: string;
  slug: string;
  title: string;
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
};

export const serializeMyApplicationItem = (application: DashboardApplicationRecord) => ({
  id: application.id,
  application_type: application.applicationType,
  source_module: application.sourceModule,
  status: application.status,
  conference_id: application.conferenceId,
  conference_slug: application.conference?.slug ?? null,
  conference_title: application.conference?.title ?? null,
  grant_id: application.grantId,
  grant_slug: application.grant?.slug ?? null,
  grant_title: application.grant?.title ?? null,
  linked_conference_id: application.linkedConferenceId,
  linked_conference_application_id: application.linkedConferenceApplicationId,
  submitted_at: application.submittedAt?.toISOString() ?? null,
  decision: null,
  created_at: application.createdAt.toISOString(),
  updated_at: application.updatedAt.toISOString(),
});
