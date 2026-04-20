type ParsedConferenceInput = {
  slug: string;
  title: string;
  shortName: string | null;
  locationText: string | null;
  startDate: string | null;
  endDate: string | null;
  description: string | null;
  applicationDeadline: Date | null;
  applicationFormSchemaJson: string;
  settingsJson: string;
};

const parseNullableString = (value: unknown) => {
  if (value === undefined || value === null) {
    return null;
  }

  if (typeof value !== 'string') {
    throw new Error('INVALID_STRING');
  }

  const trimmed = value.trim();
  return trimmed ? trimmed : null;
};

const parseRequiredString = (value: unknown, fieldName: string) => {
  const parsed = parseNullableString(value);
  if (!parsed) {
    throw new Error(`${fieldName.toUpperCase()}_REQUIRED`);
  }

  return parsed;
};

const parseJsonObject = (value: unknown, fallback: Record<string, unknown>) => {
  if (value === undefined || value === null) {
    return JSON.stringify(fallback);
  }

  if (typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('INVALID_JSON_OBJECT');
  }

  return JSON.stringify(value);
};

export const parseConferenceInput = (body: Record<string, unknown>): ParsedConferenceInput => ({
  slug: parseRequiredString(body.slug, 'slug'),
  title: parseRequiredString(body.title, 'title'),
  shortName: parseNullableString(body.short_name),
  locationText: parseNullableString(body.location_text),
  startDate: parseNullableString(body.start_date),
  endDate: parseNullableString(body.end_date),
  description: parseNullableString(body.description),
  applicationDeadline:
    body.application_deadline && typeof body.application_deadline === 'string'
      ? new Date(body.application_deadline)
      : null,
  applicationFormSchemaJson: parseJsonObject(body.application_form_schema, { fields: [] }),
  settingsJson: parseJsonObject(body.settings, {}),
});

export const canPublishConference = (conference: {
  slug: string;
  title: string;
  locationText: string | null;
  startDate: string | null;
  endDate: string | null;
  description: string | null;
  applicationDeadline: Date | null;
}) =>
  Boolean(
    conference.slug &&
      conference.title &&
      conference.locationText &&
      conference.startDate &&
      conference.endDate &&
      conference.description &&
      conference.applicationDeadline
  );
