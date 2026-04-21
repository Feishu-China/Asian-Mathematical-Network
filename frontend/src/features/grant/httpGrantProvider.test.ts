import { beforeEach, describe, expect, it, vi } from 'vitest';
import axios from 'axios';
import {
  createGrantApplicationRequest,
  fetchGrantApplicationForm,
  fetchGrantDetail,
  fetchGrantList,
  fetchMyGrantApplication,
  submitMyGrantApplicationRequest,
  updateMyGrantApplicationDraftRequest,
} from '../../api/grant';
import { httpGrantProvider } from './httpGrantProvider';

vi.mock('../../api/grant', () => ({
  fetchGrantList: vi.fn(),
  fetchGrantDetail: vi.fn(),
  fetchGrantApplicationForm: vi.fn(),
  fetchMyGrantApplication: vi.fn(),
  createGrantApplicationRequest: vi.fn(),
  updateMyGrantApplicationDraftRequest: vi.fn(),
  submitMyGrantApplicationRequest: vi.fn(),
}));

describe('httpGrantProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.restoreAllMocks();
    localStorage.clear();
    localStorage.setItem('token', 'grant-token');
  });

  it('maps public list, detail, and application-form payloads from the real API', async () => {
    vi.mocked(fetchGrantList).mockResolvedValue({
      data: {
        items: [
          {
            id: 'grant-1',
            slug: 'asiamath-2026-travel-grant',
            title: 'Asiamath 2026 Travel Grant',
            grant_type: 'conference_travel_grant',
            linked_conference_id: 'conf-1',
            application_deadline: '2026-06-05T23:59:59.000Z',
            status: 'published',
            report_required: true,
            is_application_open: true,
          },
        ],
      },
    });

    vi.mocked(fetchGrantDetail).mockResolvedValue({
      data: {
        grant: {
          id: 'grant-1',
          slug: 'asiamath-2026-travel-grant',
          title: 'Asiamath 2026 Travel Grant',
          grant_type: 'conference_travel_grant',
          linked_conference_id: 'conf-1',
          description: 'Partial travel support for accepted participants.',
          eligibility_summary: 'Open to eligible conference applicants.',
          coverage_summary: 'Partial airfare and accommodation support.',
          application_deadline: '2026-06-05T23:59:59.000Z',
          status: 'published',
          report_required: true,
          published_at: '2026-04-22T12:00:00.000Z',
          is_application_open: true,
        },
      },
    });

    vi.mocked(fetchGrantApplicationForm).mockResolvedValue({
      data: {
        grant_id: 'grant-1',
        schema: {
          fields: [
            { key: 'linked_conference_application_id', type: 'select', required: true },
            { key: 'statement', type: 'textarea', required: true },
            { key: 'travel_plan_summary', type: 'textarea', required: true },
            { key: 'funding_need_summary', type: 'textarea', required: true },
          ],
        },
      },
    });

    await expect(httpGrantProvider.listPublicGrants()).resolves.toEqual([
      {
        id: 'grant-1',
        slug: 'asiamath-2026-travel-grant',
        title: 'Asiamath 2026 Travel Grant',
        grantType: 'conference_travel_grant',
        linkedConferenceId: 'conf-1',
        applicationDeadline: '2026-06-05T23:59:59.000Z',
        status: 'published',
        reportRequired: true,
        isApplicationOpen: true,
      },
    ]);

    await expect(httpGrantProvider.getGrantBySlug('asiamath-2026-travel-grant')).resolves.toEqual({
      id: 'grant-1',
      slug: 'asiamath-2026-travel-grant',
      title: 'Asiamath 2026 Travel Grant',
      grantType: 'conference_travel_grant',
      linkedConferenceId: 'conf-1',
      description: 'Partial travel support for accepted participants.',
      eligibilitySummary: 'Open to eligible conference applicants.',
      coverageSummary: 'Partial airfare and accommodation support.',
      applicationDeadline: '2026-06-05T23:59:59.000Z',
      status: 'published',
      reportRequired: true,
      publishedAt: '2026-04-22T12:00:00.000Z',
      isApplicationOpen: true,
    });

    await expect(httpGrantProvider.getGrantApplicationForm('grant-1')).resolves.toEqual({
      fields: [
        { key: 'linked_conference_application_id', type: 'select', required: true },
        { key: 'statement', type: 'textarea', required: true },
        { key: 'travel_plan_summary', type: 'textarea', required: true },
        { key: 'funding_need_summary', type: 'textarea', required: true },
      ],
    });
  });

  it('returns the existing application for the current user and maps 404 to null', async () => {
    vi.mocked(fetchMyGrantApplication).mockResolvedValueOnce({
      data: {
        application: {
          id: 'application-1',
          application_type: 'grant_application',
          source_module: 'M7',
          grant_id: 'grant-1',
          grant_title: 'Asiamath 2026 Travel Grant',
          linked_conference_id: 'conf-1',
          linked_conference_application_id: 'conf-app-1',
          applicant_user_id: 'grant-token',
          status: 'draft',
          statement: 'Saved funding request',
          travel_plan_summary: 'Saved travel plan',
          funding_need_summary: 'Saved funding need',
          extra_answers: {},
          files: [],
          submitted_at: null,
          decided_at: null,
          created_at: '2026-04-22T12:00:00.000Z',
          updated_at: '2026-04-22T12:00:00.000Z',
        },
      },
    });

    await expect(httpGrantProvider.getMyGrantApplication('grant-1')).resolves.toMatchObject({
      id: 'application-1',
      grantId: 'grant-1',
      linkedConferenceApplicationId: 'conf-app-1',
      status: 'draft',
      statement: 'Saved funding request',
    });

    const notFoundError = {
      response: {
        status: 404,
      },
    };

    vi.spyOn(axios, 'isAxiosError').mockImplementation(
      (error): error is typeof notFoundError => error === notFoundError
    );
    vi.mocked(fetchMyGrantApplication).mockRejectedValueOnce(notFoundError);

    await expect(httpGrantProvider.getMyGrantApplication('grant-1')).resolves.toBeNull();
  });

  it('maps create errors into grant-specific coded errors', async () => {
    const conflictError = {
      response: {
        status: 409,
        data: { message: 'Application already exists for this grant' },
      },
    };

    vi.spyOn(axios, 'isAxiosError').mockImplementation(
      (error): error is typeof conflictError => error === conflictError
    );
    vi.mocked(createGrantApplicationRequest).mockRejectedValueOnce(conflictError);

    await expect(
      httpGrantProvider.createGrantApplication('grant-1', {
        linkedConferenceApplicationId: 'conf-app-1',
        statement: 'Duplicate draft',
        travelPlanSummary: 'Duplicate plan',
        fundingNeedSummary: 'Duplicate funding',
        extraAnswers: {},
      })
    ).rejects.toMatchObject({
      code: 'CONFLICT',
      message: 'Application already exists for this grant',
    });

    const prerequisiteError = {
      response: {
        status: 422,
        data: { message: 'A submitted linked conference application is required' },
      },
    };

    vi.spyOn(axios, 'isAxiosError').mockImplementation(
      (error): error is typeof prerequisiteError => error === prerequisiteError
    );
    vi.mocked(createGrantApplicationRequest).mockRejectedValueOnce(prerequisiteError);

    await expect(
      httpGrantProvider.createGrantApplication('grant-1', {
        linkedConferenceApplicationId: 'conf-app-1',
        statement: 'Needs prerequisite',
        travelPlanSummary: 'Plan',
        fundingNeedSummary: 'Funding',
        extraAnswers: {},
      })
    ).rejects.toMatchObject({
      code: 'PREREQUISITE',
      message: 'A submitted linked conference application is required',
    });
  });

  it('unwraps successful create, update, and submit responses from the real API', async () => {
    vi.mocked(createGrantApplicationRequest).mockResolvedValueOnce({
      data: {
        application: {
          id: 'application-1',
          application_type: 'grant_application',
          source_module: 'M7',
          grant_id: 'grant-1',
          grant_title: 'Asiamath 2026 Travel Grant',
          linked_conference_id: 'conf-1',
          linked_conference_application_id: 'conf-app-1',
          applicant_user_id: 'grant-token',
          status: 'draft',
          statement: 'New funding request',
          travel_plan_summary: 'Travel plan',
          funding_need_summary: 'Funding need',
          extra_answers: {},
          files: [],
          submitted_at: null,
          decided_at: null,
          created_at: '2026-04-22T12:00:00.000Z',
          updated_at: '2026-04-22T12:00:00.000Z',
        },
      },
    });

    vi.mocked(updateMyGrantApplicationDraftRequest).mockResolvedValueOnce({
      data: {
        application: {
          id: 'application-1',
          application_type: 'grant_application',
          source_module: 'M7',
          grant_id: 'grant-1',
          grant_title: 'Asiamath 2026 Travel Grant',
          linked_conference_id: 'conf-1',
          linked_conference_application_id: 'conf-app-1',
          applicant_user_id: 'grant-token',
          status: 'draft',
          statement: 'Updated funding request',
          travel_plan_summary: 'Updated travel plan',
          funding_need_summary: 'Updated funding need',
          extra_answers: {},
          files: [],
          submitted_at: null,
          decided_at: null,
          created_at: '2026-04-22T12:00:00.000Z',
          updated_at: '2026-04-22T12:30:00.000Z',
        },
      },
    });

    vi.mocked(submitMyGrantApplicationRequest).mockResolvedValueOnce({
      data: {
        application: {
          id: 'application-1',
          application_type: 'grant_application',
          source_module: 'M7',
          grant_id: 'grant-1',
          grant_title: 'Asiamath 2026 Travel Grant',
          linked_conference_id: 'conf-1',
          linked_conference_application_id: 'conf-app-1',
          applicant_user_id: 'grant-token',
          status: 'submitted',
          statement: 'Updated funding request',
          travel_plan_summary: 'Updated travel plan',
          funding_need_summary: 'Updated funding need',
          extra_answers: {},
          files: [],
          submitted_at: '2026-04-22T13:00:00.000Z',
          decided_at: null,
          created_at: '2026-04-22T12:00:00.000Z',
          updated_at: '2026-04-22T13:00:00.000Z',
        },
      },
    });

    await expect(
      httpGrantProvider.createGrantApplication('grant-1', {
        linkedConferenceApplicationId: 'conf-app-1',
        statement: 'New funding request',
        travelPlanSummary: 'Travel plan',
        fundingNeedSummary: 'Funding need',
        extraAnswers: {},
      })
    ).resolves.toMatchObject({
      id: 'application-1',
      status: 'draft',
      statement: 'New funding request',
    });

    await expect(
      httpGrantProvider.updateGrantApplication('application-1', {
        linkedConferenceApplicationId: 'conf-app-1',
        statement: 'Updated funding request',
        travelPlanSummary: 'Updated travel plan',
        fundingNeedSummary: 'Updated funding need',
        extraAnswers: {},
      })
    ).resolves.toMatchObject({
      id: 'application-1',
      status: 'draft',
      statement: 'Updated funding request',
    });

    await expect(httpGrantProvider.submitGrantApplication('application-1')).resolves.toMatchObject({
      id: 'application-1',
      status: 'submitted',
      submittedAt: '2026-04-22T13:00:00.000Z',
    });
  });
});
