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
