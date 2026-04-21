import { prisma } from './prisma';

type ParsedGrantApplicationInput = {
  linkedConferenceApplicationId: string;
  statement: string;
  travelPlanSummary: string;
  fundingNeedSummary: string;
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

export const parseGrantApplicationInput = (
  body: Record<string, unknown>
): ParsedGrantApplicationInput => {
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
    linkedConferenceApplicationId: parseRequiredString(
      body.linked_conference_application_id,
      'linked_conference_application_id'
    ),
    statement: parseRequiredString(body.statement, 'statement'),
    travelPlanSummary: parseRequiredString(body.travel_plan_summary, 'travel_plan_summary'),
    fundingNeedSummary: parseRequiredString(body.funding_need_summary, 'funding_need_summary'),
    extraAnswersJson: JSON.stringify(extraAnswers),
  };
};

export const requireEligibleLinkedConferenceApplication = async ({
  linkedConferenceApplicationId,
  applicantUserId,
  linkedConferenceId,
}: {
  linkedConferenceApplicationId: string;
  applicantUserId: string;
  linkedConferenceId: string;
}) => {
  const linkedApplication = await prisma.application.findUnique({
    where: { id: linkedConferenceApplicationId },
  });

  if (
    !linkedApplication ||
    linkedApplication.applicationType !== 'conference_application' ||
    linkedApplication.applicantUserId !== applicantUserId ||
    linkedApplication.conferenceId !== linkedConferenceId ||
    linkedApplication.status === 'draft'
  ) {
    throw new Error('GRANT_PREREQUISITE_REQUIRED');
  }

  return linkedApplication;
};
