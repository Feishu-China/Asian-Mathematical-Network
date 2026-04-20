type ConferenceRecord = {
  id: string;
  slug: string;
  title: string;
  shortName: string | null;
  locationText: string | null;
  startDate: string | null;
  endDate: string | null;
  description: string | null;
  applicationDeadline: Date | null;
  status: string;
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

const isApplicationOpen = (conference: Pick<ConferenceRecord, 'status' | 'applicationDeadline'>) =>
  conference.status === 'published' &&
  (!conference.applicationDeadline || conference.applicationDeadline.getTime() >= Date.now());

export const serializeConferenceListItem = (conference: ConferenceRecord) => ({
  id: conference.id,
  slug: conference.slug,
  title: conference.title,
  short_name: conference.shortName,
  location_text: conference.locationText,
  start_date: conference.startDate,
  end_date: conference.endDate,
  application_deadline: conference.applicationDeadline?.toISOString() ?? null,
  status: conference.status,
  is_application_open: isApplicationOpen(conference),
  related_grant_count: 0,
});

export const serializeConferenceDetail = (conference: ConferenceRecord) => ({
  id: conference.id,
  slug: conference.slug,
  title: conference.title,
  short_name: conference.shortName,
  location_text: conference.locationText,
  start_date: conference.startDate,
  end_date: conference.endDate,
  description: conference.description,
  application_deadline: conference.applicationDeadline?.toISOString() ?? null,
  status: conference.status,
  published_at: conference.publishedAt?.toISOString() ?? null,
  is_application_open: isApplicationOpen(conference),
  related_grants: [],
});

export const serializeConferenceApplicationForm = (conference: ConferenceRecord) => ({
  conference_id: conference.id,
  schema: parseJson(conference.applicationFormSchemaJson, { fields: [] }),
});

export const serializeOrganizerConference = (
  conference: ConferenceRecord & {
    settingsJson: string;
    closedAt: Date | null;
    staff: Array<{ userId: string; staffRole: string }>;
  }
) => ({
  id: conference.id,
  slug: conference.slug,
  title: conference.title,
  short_name: conference.shortName,
  location_text: conference.locationText,
  start_date: conference.startDate,
  end_date: conference.endDate,
  description: conference.description,
  application_deadline: conference.applicationDeadline?.toISOString() ?? null,
  status: conference.status,
  application_form_schema: parseJson(conference.applicationFormSchemaJson, { fields: [] }),
  settings: parseJson(conference.settingsJson, {}),
  published_at: conference.publishedAt?.toISOString() ?? null,
  closed_at: conference.closedAt?.toISOString() ?? null,
  staff: conference.staff.map((member) => ({
    user_id: member.userId,
    staff_role: member.staffRole,
  })),
});

type ApplicationRecord = {
  id: string;
  applicationType: string;
  sourceModule: string;
  conferenceId: string | null;
  applicantUserId: string;
  status: string;
  participationType: string | null;
  statement: string | null;
  abstractTitle: string | null;
  abstractText: string | null;
  interestedInTravelSupport: boolean;
  extraAnswersJson: string;
  submittedAt: Date | null;
  decidedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export const serializeConferenceApplication = (
  application: ApplicationRecord & { conferenceTitle: string }
) => ({
  id: application.id,
  application_type: application.applicationType,
  source_module: application.sourceModule,
  conference_id: application.conferenceId,
  conference_title: application.conferenceTitle,
  applicant_user_id: application.applicantUserId,
  status: application.status,
  participation_type: application.participationType,
  statement: application.statement,
  abstract_title: application.abstractTitle,
  abstract_text: application.abstractText,
  interested_in_travel_support: application.interestedInTravelSupport,
  extra_answers: parseJson(application.extraAnswersJson, {}),
  files: [],
  submitted_at: application.submittedAt?.toISOString() ?? null,
  decided_at: application.decidedAt?.toISOString() ?? null,
  decision: null,
  created_at: application.createdAt.toISOString(),
  updated_at: application.updatedAt.toISOString(),
});
