import { fakeConferenceProvider } from '../conference/fakeConferenceProvider';
import { buildSyntheticSchoolParticipation } from './linkedOpportunity';
import {
  fromTransportGrantApplication,
  fromTransportGrantApplicationForm,
  fromTransportGrantDetail,
  fromTransportGrantListItem,
} from './grantMappers';
import type { GrantApplication, GrantProvider } from './types';

type ConflictError = Error & { code: 'CONFLICT' };
type PrerequisiteError = Error & { code: 'PREREQUISITE' };
type UnauthorizedError = Error & { code: 'UNAUTHORIZED' };

const delay = async () => {
  await Promise.resolve();
};

const requireToken = () => {
  const token = localStorage.getItem('token');

  if (!token) {
    const error = new Error('Missing auth token') as UnauthorizedError;
    error.code = 'UNAUTHORIZED';
    throw error;
  }

  return token;
};

const now = () => new Date().toISOString();

type PublicGrantRecord = Parameters<typeof fromTransportGrantDetail>[0];

const publishedGrantSeed: PublicGrantRecord = {
  id: 'grant-published-001',
  slug: 'asiamath-2026-travel-grant',
  title: 'Asiamath 2026 Travel Grant',
  grant_type: 'conference_travel_grant',
  linked_conference_id: 'conf-published-001',
  linked_opportunity_type: 'conference',
  linked_opportunity_id: 'conf-published-001',
  linked_opportunity_title: 'Asiamath 2026 Workshop',
  description: 'Partial travel support for accepted participants.',
  eligibility_summary: 'Open to eligible conference applicants.',
  coverage_summary: 'Partial airfare and accommodation support.',
  application_deadline: '2026-06-05T23:59:59.000Z',
  status: 'published',
  report_required: true,
  published_at: '2026-04-22T12:00:00.000Z',
  is_application_open: true,
};

const publishedSchoolGrantSeed: PublicGrantRecord = {
  id: 'grant-school-001',
  slug: 'asia-pacific-research-school-mobility-grant-2026',
  title: 'Asia-Pacific Research School Mobility Grant 2026',
  grant_type: 'conference_travel_grant',
  linked_conference_id: null,
  linked_opportunity_type: 'school',
  linked_opportunity_id: 'school-001',
  linked_opportunity_title: 'Asia-Pacific Research School in Algebraic Geometry',
  description:
    'Mobility support for selected participants in the Asia-Pacific Research School in Algebraic Geometry.',
  eligibility_summary: 'Open to eligible school participants in the linked training program.',
  coverage_summary: 'Regional travel and accommodation support for the linked school cohort.',
  application_deadline: '2026-06-18T23:59:59.000Z',
  status: 'published',
  report_required: false,
  published_at: '2026-04-22T12:30:00.000Z',
  is_application_open: true,
};

const draftGrantSeed: PublicGrantRecord = {
  id: 'grant-draft-001',
  slug: 'asiamath-2026-draft-grant',
  title: 'Asiamath 2026 Draft Grant',
  grant_type: 'conference_travel_grant',
  linked_conference_id: 'conf-published-001',
  linked_opportunity_type: 'conference',
  linked_opportunity_id: 'conf-published-001',
  linked_opportunity_title: 'Asiamath 2026 Workshop',
  description: 'Draft grant should not appear on public pages.',
  eligibility_summary: 'Draft only.',
  coverage_summary: 'Draft only.',
  application_deadline: '2026-06-10T23:59:59.000Z',
  status: 'draft',
  report_required: true,
  published_at: null,
  is_application_open: false,
};

const grantSchema = fromTransportGrantApplicationForm({
  grant_id: publishedGrantSeed.id,
  schema: {
    fields: [
      { key: 'linked_opportunity_application_id', type: 'select', required: true },
      { key: 'statement', type: 'textarea', required: true },
      { key: 'travel_plan_summary', type: 'textarea', required: true },
      { key: 'funding_need_summary', type: 'textarea', required: true },
    ],
  },
});

let publicGrantState: PublicGrantRecord[] = [publishedGrantSeed, publishedSchoolGrantSeed, draftGrantSeed];
let applicationState: GrantApplication[] = [];

export const resetGrantFakeState = () => {
  publicGrantState = [publishedGrantSeed, publishedSchoolGrantSeed, draftGrantSeed];
  applicationState = [];
};

const findEligibleLinkedOpportunity = async (
  grant: PublicGrantRecord,
  linkedOpportunityApplicationId: string,
  userId: string
) => {
  if (grant.linked_opportunity_type === 'school') {
    const participation = buildSyntheticSchoolParticipation(
      grant.linked_opportunity_id ?? '',
      grant.linked_opportunity_title ?? null,
      userId
    );

    if (linkedOpportunityApplicationId && linkedOpportunityApplicationId !== participation.id) {
      const error = new Error(
        'A linked school participation is required before requesting travel support.'
      ) as PrerequisiteError;
      error.code = 'PREREQUISITE';
      throw error;
    }

    return participation;
  }

  const linkedConferenceApplication = await fakeConferenceProvider.getMyConferenceApplication(
    grant.linked_conference_id ?? ''
  );

  if (
    !linkedConferenceApplication ||
    linkedConferenceApplication.id !== linkedOpportunityApplicationId ||
    linkedConferenceApplication.status !== 'submitted'
  ) {
    const error = new Error(
      'A submitted linked conference application is required before requesting travel support.'
    ) as PrerequisiteError;
    error.code = 'PREREQUISITE';
    throw error;
  }

  return linkedConferenceApplication;
};

export const fakeGrantProvider: GrantProvider = {
  async listPublicGrants() {
    await delay();
    return publicGrantState
      .filter((item) => item.status === 'published')
      .map(fromTransportGrantListItem);
  },

  async getGrantBySlug(slug) {
    await delay();
    const grant = publicGrantState.find((item) => item.slug === slug && item.status === 'published');
    return grant ? fromTransportGrantDetail(grant) : null;
  },

  async getGrantApplicationForm(grantId) {
    await delay();

    const grant = publicGrantState.find((item) => item.id === grantId);
    if (!grant) {
      throw new Error('Grant form not found');
    }

    return {
      ...grantSchema,
    };
  },

  async getMyGrantApplication(grantId) {
    const userId = requireToken();
    await delay();

    return (
      applicationState.find((item) => item.grantId === grantId && item.applicantUserId === userId) ??
      null
    );
  },

  async createGrantApplication(grantId, values) {
    const userId = requireToken();
    await delay();

    const existing = applicationState.find(
      (item) => item.grantId === grantId && item.applicantUserId === userId
    );

    if (existing) {
      const error = new Error('Application already exists for this grant') as ConflictError;
      error.code = 'CONFLICT';
      throw error;
    }

    const grant = publicGrantState.find((item) => item.id === grantId && item.status === 'published');
    if (!grant) {
      throw new Error('Grant not found');
    }

    await findEligibleLinkedOpportunity(grant, values.linkedOpportunityApplicationId, userId);

    const created = fromTransportGrantApplication({
      id: `grant-application-${applicationState.length + 1}`,
      application_type: 'grant_application',
      source_module: 'M7',
      grant_id: grant.id,
      grant_title: grant.title,
      linked_conference_id: grant.linked_conference_id,
      linked_conference_application_id:
        grant.linked_opportunity_type === 'conference'
          ? values.linkedOpportunityApplicationId
          : null,
      linked_opportunity_type: grant.linked_opportunity_type,
      linked_opportunity_id: grant.linked_opportunity_id,
      linked_opportunity_title: grant.linked_opportunity_title,
      linked_opportunity_application_id: values.linkedOpportunityApplicationId,
      applicant_user_id: userId,
      status: 'draft',
      statement: values.statement,
      travel_plan_summary: values.travelPlanSummary,
      funding_need_summary: values.fundingNeedSummary,
      extra_answers: values.extraAnswers,
      files: [],
      submitted_at: null,
      decided_at: null,
      created_at: now(),
      updated_at: now(),
    });

    applicationState = [...applicationState, created];
    return created;
  },

  async updateGrantApplication(applicationId, values) {
    const userId = requireToken();
    await delay();

    const existing = applicationState.find(
      (item) => item.id === applicationId && item.applicantUserId === userId
    );

    if (!existing) {
      throw new Error('Application not found');
    }

    if (existing.status !== 'draft') {
      throw new Error('Only draft applications can be edited');
    }

    const grant = publicGrantState.find((item) => item.id === existing.grantId);

    if (!grant) {
      throw new Error('Grant not found');
    }

    await findEligibleLinkedOpportunity(grant, values.linkedOpportunityApplicationId, userId);

    applicationState = applicationState.map((item) =>
      item.id === applicationId
        ? {
            ...item,
            linkedOpportunityApplicationId: values.linkedOpportunityApplicationId,
            statement: values.statement,
            travelPlanSummary: values.travelPlanSummary,
            fundingNeedSummary: values.fundingNeedSummary,
            extraAnswers: values.extraAnswers,
            updatedAt: now(),
          }
        : item
    );

    const updated = applicationState.find((item) => item.id === applicationId);
    if (!updated) {
      throw new Error('Application not found');
    }

    return updated;
  },

  async submitGrantApplication(applicationId) {
    const userId = requireToken();
    await delay();

    const existing = applicationState.find(
      (item) => item.id === applicationId && item.applicantUserId === userId
    );

    if (!existing) {
      throw new Error('Application not found');
    }

    if (existing.status !== 'draft') {
      throw new Error('Only draft applications can be submitted');
    }

    const grant = publicGrantState.find((item) => item.id === existing.grantId);

    if (!grant) {
      throw new Error('Grant not found');
    }

    await findEligibleLinkedOpportunity(grant, existing.linkedOpportunityApplicationId, userId);

    applicationState = applicationState.map((item) =>
      item.id === applicationId
        ? {
            ...item,
            status: 'submitted',
            submittedAt: now(),
            updatedAt: now(),
          }
        : item
    );

    const submitted = applicationState.find((item) => item.id === applicationId);
    if (!submitted) {
      throw new Error('Application not found');
    }

    return submitted;
  },
};
