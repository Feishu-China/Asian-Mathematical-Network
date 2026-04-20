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

type ParsedConferenceApplicationInput = {
  participationType: string;
  statement: string;
  abstractTitle: string | null;
  abstractText: string | null;
  interestedInTravelSupport: boolean;
  extraAnswersJson: string;
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

const parseBoolean = (value: unknown, defaultValue: boolean) => {
  if (value === undefined) {
    return defaultValue;
  }

  if (typeof value !== 'boolean') {
    throw new Error('INVALID_BOOLEAN');
  }

  return value;
};

export const parseConferenceApplicationInput = (
  body: Record<string, unknown>
): ParsedConferenceApplicationInput => {
  const fileIds = body.file_ids;
  if (Array.isArray(fileIds) && fileIds.length > 0) {
    throw new Error('FILES_NOT_SUPPORTED_YET');
  }

  if (fileIds !== undefined && !Array.isArray(fileIds)) {
    throw new Error('INVALID_FILE_IDS');
  }

  const extraAnswers =
    body.extra_answers === undefined
      ? {}
      : typeof body.extra_answers === 'object' &&
          body.extra_answers !== null &&
          !Array.isArray(body.extra_answers)
        ? body.extra_answers
        : (() => {
            throw new Error('INVALID_EXTRA_ANSWERS');
          })();

  return {
    participationType: parseRequiredString(body.participation_type, 'participation_type'),
    statement: parseRequiredString(body.statement, 'statement'),
    abstractTitle: parseNullableString(body.abstract_title),
    abstractText: parseNullableString(body.abstract_text),
    interestedInTravelSupport: parseBoolean(body.interested_in_travel_support, false),
    extraAnswersJson: JSON.stringify(extraAnswers),
  };
};

export const buildApplicantProfileSnapshot = (profile: {
  fullName: string;
  institutionNameRaw: string | null;
  countryCode: string | null;
  careerStage: string | null;
  researchKeywords: string[];
}) => ({
  full_name: profile.fullName,
  institution_name_raw: profile.institutionNameRaw,
  country_code: profile.countryCode,
  career_stage: profile.careerStage,
  research_keywords: profile.researchKeywords,
});
