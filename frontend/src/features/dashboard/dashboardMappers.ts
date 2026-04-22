import type { MyApplication, MyApplicationKind, MyApplicationStatus } from './types';

type TransportMyApplication = {
  id: string;
  application_type: MyApplicationKind;
  source_module: string;
  status: MyApplicationStatus;
  conference_id: string | null;
  conference_slug: string | null;
  conference_title: string | null;
  grant_id: string | null;
  grant_slug: string | null;
  grant_title: string | null;
  linked_conference_id: string | null;
  linked_conference_application_id: string | null;
  submitted_at: string | null;
  decision: null;
  created_at: string;
  updated_at: string;
};

export const fromTransportMyApplication = (item: TransportMyApplication): MyApplication => ({
  id: item.id,
  applicationType: item.application_type,
  sourceModule: item.source_module,
  status: item.status,
  conferenceId: item.conference_id,
  conferenceSlug: item.conference_slug,
  conferenceTitle: item.conference_title,
  grantId: item.grant_id,
  grantSlug: item.grant_slug,
  grantTitle: item.grant_title,
  linkedConferenceId: item.linked_conference_id,
  linkedConferenceApplicationId: item.linked_conference_application_id,
  submittedAt: item.submitted_at,
  decision: item.decision,
  createdAt: item.created_at,
  updatedAt: item.updated_at,
});
