import { beforeEach, describe, expect, it, vi } from 'vitest';
import axios from 'axios';
import { fetchMyApplicationDetail } from '../../api/review';
import { httpReviewProvider } from './httpReviewProvider';

vi.mock('../../api/review', () => ({
  fetchOrganizerConferenceApplications: vi.fn(),
  fetchOrganizerApplicationDetail: vi.fn(),
  fetchReviewerCandidates: vi.fn(),
  assignReviewerRequest: vi.fn(),
  upsertDecisionRequest: vi.fn(),
  releaseDecisionRequest: vi.fn(),
  fetchReviewerAssignments: vi.fn(),
  fetchReviewerAssignmentDetail: vi.fn(),
  submitReviewerReviewRequest: vi.fn(),
  fetchMyApplicationDetail: vi.fn(),
}));

describe('httpReviewProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.restoreAllMocks();
    localStorage.clear();
    localStorage.setItem('token', 'review-token');
  });

  it('maps the applicant-facing application detail payload from the real API', async () => {
    vi.mocked(fetchMyApplicationDetail).mockResolvedValueOnce({
      data: {
        application: {
          id: 'application-1',
          application_type: 'conference_application',
          source_module: 'M2',
          conference_id: 'conf-1',
          conference_title: 'Published Conference 2026',
          grant_id: null,
          grant_title: null,
          linked_conference_id: null,
          linked_conference_title: null,
          linked_conference_application_id: null,
          viewer_status: 'under_review',
          participation_type: 'talk',
          statement: 'Saved statement',
          abstract_title: 'Saved abstract title',
          abstract_text: 'Saved abstract text',
          interested_in_travel_support: true,
          travel_plan_summary: null,
          funding_need_summary: null,
          extra_answers: {},
          applicant_profile_snapshot: {
            full_name: 'Review Applicant',
            institution_name_raw: 'National University of Singapore',
            country_code: 'SG',
            career_stage: 'phd',
            research_keywords: ['algebraic geometry'],
          },
          files: [],
          submitted_at: '2026-04-20T10:00:00.000Z',
          released_decision: null,
          post_visit_report_status: null,
        },
      },
    });

    await expect(httpReviewProvider.getMyApplicationDetail('application-1')).resolves.toEqual({
      id: 'application-1',
      applicationType: 'conference_application',
      sourceModule: 'M2',
      conferenceId: 'conf-1',
      conferenceTitle: 'Published Conference 2026',
      grantId: null,
      grantTitle: null,
      linkedConferenceId: null,
      linkedConferenceTitle: null,
      linkedConferenceApplicationId: null,
      viewerStatus: 'under_review',
      participationType: 'talk',
      statement: 'Saved statement',
      abstractTitle: 'Saved abstract title',
      abstractText: 'Saved abstract text',
      interestedInTravelSupport: true,
      travelPlanSummary: null,
      fundingNeedSummary: null,
      extraAnswers: {},
      applicantProfileSnapshot: {
        fullName: 'Review Applicant',
        institutionNameRaw: 'National University of Singapore',
        countryCode: 'SG',
        careerStage: 'phd',
        researchKeywords: ['algebraic geometry'],
      },
      files: [],
      submittedAt: '2026-04-20T10:00:00.000Z',
      releasedDecision: null,
      postVisitReportStatus: null,
    });
  });

  it('maps a 401 detail response into an unauthorized coded error', async () => {
    const unauthorizedError = {
      response: {
        status: 401,
        data: { message: 'Unauthorized' },
      },
    };

    vi.spyOn(axios, 'isAxiosError').mockImplementation(
      (error): error is typeof unauthorizedError => error === unauthorizedError
    );
    vi.mocked(fetchMyApplicationDetail).mockRejectedValueOnce(unauthorizedError);

    await expect(httpReviewProvider.getMyApplicationDetail('application-1')).rejects.toMatchObject({
      code: 'UNAUTHORIZED',
      message: 'Unauthorized',
    });
  });

  it('maps a 404 detail response into a not-found coded error', async () => {
    const notFoundError = {
      response: {
        status: 404,
        data: { message: 'Application not found' },
      },
    };

    vi.spyOn(axios, 'isAxiosError').mockImplementation(
      (error): error is typeof notFoundError => error === notFoundError
    );
    vi.mocked(fetchMyApplicationDetail).mockRejectedValueOnce(notFoundError);

    await expect(httpReviewProvider.getMyApplicationDetail('missing-application')).rejects.toMatchObject({
      code: 'NOT_FOUND',
      message: 'Application not found',
    });
  });
});
