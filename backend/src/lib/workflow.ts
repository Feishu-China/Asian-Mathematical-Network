const parseDate = (value: unknown) => {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  if (typeof value !== 'string') {
    throw new Error('INVALID_DATE');
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error('INVALID_DATE');
  }

  return parsed;
};

const parseStringOrNull = (value: unknown) => {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  if (typeof value !== 'string') {
    throw new Error('INVALID_STRING');
  }

  return value.trim() || null;
};

export const parseReviewAssignmentInput = (body: Record<string, unknown>) => {
  const reviewerUserId = typeof body.reviewer_user_id === 'string' ? body.reviewer_user_id : null;
  if (!reviewerUserId) {
    throw new Error('INVALID_REVIEW_ASSIGNMENT');
  }

  const conflictState =
    body.conflict_state === 'clear' || body.conflict_state === 'flagged'
      ? body.conflict_state
      : null;
  if (!conflictState) {
    throw new Error('INVALID_REVIEW_ASSIGNMENT');
  }

  return {
    reviewerUserId,
    dueAt: parseDate(body.due_at),
    conflictState,
    conflictNote: parseStringOrNull(body.conflict_note),
  };
};

export const parseReviewInput = (body: Record<string, unknown>) => {
  const score = body.score === null || body.score === undefined ? null : Number(body.score);
  if (score !== null && (!Number.isInteger(score) || score < 1 || score > 5)) {
    throw new Error('INVALID_REVIEW');
  }

  const recommendation =
    body.recommendation === 'accept' ||
    body.recommendation === 'reject' ||
    body.recommendation === 'waitlist'
      ? body.recommendation
      : null;

  const comment = typeof body.comment === 'string' ? body.comment.trim() : '';

  if (!recommendation || !comment) {
    throw new Error('INVALID_REVIEW');
  }

  return {
    score,
    recommendation,
    comment,
  };
};

export const parseDecisionInput = (body: Record<string, unknown>) => {
  const finalStatus =
    body.final_status === 'accepted' ||
    body.final_status === 'rejected' ||
    body.final_status === 'waitlisted'
      ? body.final_status
      : null;

  if (!finalStatus) {
    throw new Error('INVALID_DECISION');
  }

  return {
    finalStatus,
    noteInternal: parseStringOrNull(body.note_internal),
    noteExternal: parseStringOrNull(body.note_external),
  };
};

export const getDecisionKind = (applicationType: string) =>
  applicationType === 'grant_application' ? 'travel_grant' : 'conference_admission';

export const getReleasedDecisionDisplayLabel = (
  applicationType: string,
  finalStatus: string
) => {
  if (applicationType === 'grant_application') {
    if (finalStatus === 'accepted') {
      return 'Awarded';
    }

    if (finalStatus === 'waitlisted') {
      return 'Waitlisted';
    }

    return 'Not awarded';
  }

  if (finalStatus === 'accepted') {
    return 'Accepted';
  }

  if (finalStatus === 'waitlisted') {
    return 'Waitlisted';
  }

  return 'Rejected';
};

export const getApplicantViewerStatus = (
  applicationStatus: string,
  releaseStatus: string | null | undefined
) => {
  if (applicationStatus === 'draft') {
    return 'draft';
  }

  if (releaseStatus === 'released') {
    return 'result_released';
  }

  return 'under_review';
};

export const parseJson = <T>(value: string | null | undefined, fallback: T): T => {
  if (!value) {
    return fallback;
  }

  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
};
