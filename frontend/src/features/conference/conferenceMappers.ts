import { buildConferenceFormSchema, readConferenceFormToggles } from './conferenceFields';
import type {
  ConferenceApplication,
  ConferenceApplicationValues,
  ConferenceDetail,
  ConferenceEditorValues,
  ConferenceFormSchema,
  ConferenceListItem,
  OrganizerConference,
} from './types';

type TransportConferenceListItem = {
  id: string;
  slug: string;
  title: string;
  short_name: string | null;
  location_text: string | null;
  start_date: string | null;
  end_date: string | null;
  application_deadline: string | null;
  status: ConferenceListItem['status'];
  is_application_open: boolean;
  related_grant_count: number;
};

type TransportConferenceDetail = TransportConferenceListItem & {
  description: string | null;
  published_at: string | null;
  related_grants: Array<{ id: string; title: string; slug: string }>;
};

type TransportOrganizerConference = {
  id: string;
  slug: string;
  title: string;
  short_name: string | null;
  location_text: string | null;
  start_date: string | null;
  end_date: string | null;
  description: string | null;
  application_deadline: string | null;
  status: OrganizerConference['status'];
  application_form_schema: ConferenceFormSchema;
  settings: Record<string, unknown>;
  published_at: string | null;
  closed_at: string | null;
  staff: Array<{ user_id: string; staff_role: string }>;
};

type TransportConferenceApplication = {
  id: string;
  application_type: 'conference_application';
  source_module: string;
  conference_id: string;
  conference_title: string;
  applicant_user_id: string;
  status: ConferenceApplication['status'];
  participation_type: string | null;
  statement: string | null;
  abstract_title: string | null;
  abstract_text: string | null;
  interested_in_travel_support: boolean;
  extra_answers: Record<string, string>;
  files: Array<{ id: string; name: string }>;
  submitted_at: string | null;
  decided_at: string | null;
  created_at: string;
  updated_at: string;
};

type TransportConferenceApplicationForm = {
  conference_id: string;
  schema: ConferenceFormSchema;
};

const isApplicationOpen = (status: OrganizerConference['status'], applicationDeadline: string | null) =>
  status === 'published' &&
  (!applicationDeadline || new Date(applicationDeadline).getTime() >= Date.now());

export const fromTransportConferenceListItem = (
  item: TransportConferenceListItem
): ConferenceListItem => ({
  id: item.id,
  slug: item.slug,
  title: item.title,
  shortName: item.short_name,
  locationText: item.location_text,
  startDate: item.start_date,
  endDate: item.end_date,
  applicationDeadline: item.application_deadline,
  status: item.status,
  isApplicationOpen: item.is_application_open,
  relatedGrantCount: item.related_grant_count,
});

export const fromTransportConferenceDetail = (
  detail: TransportConferenceDetail
): ConferenceDetail => ({
  ...fromTransportConferenceListItem(detail),
  description: detail.description,
  publishedAt: detail.published_at,
  relatedGrants: detail.related_grants,
});

export const fromTransportOrganizerConference = (conference: TransportOrganizerConference) => {
  const domain: OrganizerConference = {
    id: conference.id,
    slug: conference.slug,
    title: conference.title,
    shortName: conference.short_name,
    locationText: conference.location_text,
    startDate: conference.start_date,
    endDate: conference.end_date,
    applicationDeadline: conference.application_deadline,
    status: conference.status,
    isApplicationOpen: isApplicationOpen(conference.status, conference.application_deadline),
    relatedGrantCount: 0,
    description: conference.description,
    publishedAt: conference.published_at,
    relatedGrants: [],
    applicationFormSchema: conference.application_form_schema,
    settings: conference.settings,
    closedAt: conference.closed_at,
    staff: conference.staff.map((member) => ({
      userId: member.user_id,
      staffRole: member.staff_role,
    })),
  };

  const toggles = readConferenceFormToggles(conference.application_form_schema);

  const values: ConferenceEditorValues = {
    slug: conference.slug,
    title: conference.title,
    shortName: conference.short_name ?? '',
    locationText: conference.location_text ?? '',
    startDate: conference.start_date ?? '',
    endDate: conference.end_date ?? '',
    description: conference.description ?? '',
    applicationDeadline: conference.application_deadline ?? '',
    includeAbstractFields: toggles.includeAbstractFields,
    includeTravelSupportQuestion: toggles.includeTravelSupportQuestion,
  };

  return { conference: domain, values };
};

export const fromTransportConferenceApplication = (
  application: TransportConferenceApplication
): ConferenceApplication => ({
  id: application.id,
  applicationType: application.application_type,
  sourceModule: application.source_module,
  conferenceId: application.conference_id,
  conferenceTitle: application.conference_title,
  applicantUserId: application.applicant_user_id,
  status: application.status,
  participationType: application.participation_type,
  statement: application.statement,
  abstractTitle: application.abstract_title,
  abstractText: application.abstract_text,
  interestedInTravelSupport: application.interested_in_travel_support,
  extraAnswers: application.extra_answers,
  files: application.files,
  submittedAt: application.submitted_at,
  decidedAt: application.decided_at,
  createdAt: application.created_at,
  updatedAt: application.updated_at,
});

export const fromTransportConferenceApplicationForm = (
  form: TransportConferenceApplicationForm
): ConferenceFormSchema => form.schema;

export const toTransportConferencePayload = (values: ConferenceEditorValues) => ({
  slug: values.slug.trim(),
  title: values.title.trim(),
  short_name: values.shortName.trim() || null,
  location_text: values.locationText.trim() || null,
  start_date: values.startDate || null,
  end_date: values.endDate || null,
  description: values.description.trim() || null,
  application_deadline: values.applicationDeadline || null,
  application_form_schema: buildConferenceFormSchema(values),
  settings: {},
});

export const toTransportConferenceApplicationPayload = (
  values: ConferenceApplicationValues
) => ({
  participation_type: values.participationType,
  statement: values.statement.trim(),
  abstract_title: values.abstractTitle.trim() || null,
  abstract_text: values.abstractText.trim() || null,
  interested_in_travel_support: values.interestedInTravelSupport,
  extra_answers: values.extraAnswers,
  file_ids: [],
});
