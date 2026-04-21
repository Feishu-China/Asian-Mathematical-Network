import { beforeEach, describe, expect, it, vi } from 'vitest';
import axios from 'axios';
import {
  createConferenceApplicationRequest,
  createOrganizerConferenceRequest,
  fetchConferenceApplicationForm,
  fetchConferenceDetail,
  fetchConferenceList,
  fetchMyConferenceApplication,
} from '../../api/conference';
import type { ConferenceEditorValues } from './types';
import { httpConferenceProvider } from './httpConferenceProvider';

vi.mock('../../api/conference', () => ({
  fetchConferenceList: vi.fn(),
  fetchConferenceDetail: vi.fn(),
  fetchConferenceApplicationForm: vi.fn(),
  fetchMyConferenceApplication: vi.fn(),
  createOrganizerConferenceRequest: vi.fn(),
  fetchOrganizerConference: vi.fn(),
  updateOrganizerConferenceRequest: vi.fn(),
  publishOrganizerConferenceRequest: vi.fn(),
  closeOrganizerConferenceRequest: vi.fn(),
  createConferenceApplicationRequest: vi.fn(),
  updateMyConferenceApplicationDraftRequest: vi.fn(),
  submitMyConferenceApplicationRequest: vi.fn(),
}));

const organizerDraftValues: ConferenceEditorValues = {
  slug: 'organizer-conf-2026',
  title: 'Organizer Conference 2026',
  shortName: 'OC2026',
  locationText: 'Seoul',
  startDate: '2026-10-11',
  endDate: '2026-10-15',
  description: 'Updated organizer conference',
  applicationDeadline: '2026-09-15T23:59:59.000Z',
  includeAbstractFields: true,
  includeTravelSupportQuestion: true,
};

describe('httpConferenceProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.restoreAllMocks();
    localStorage.clear();
    localStorage.setItem('token', 'integration-token');
  });

  it('maps public list, detail, and application-form payloads from the real API', async () => {
    vi.mocked(fetchConferenceList).mockResolvedValue({
      data: {
        items: [
          {
            id: 'conf-1',
            slug: 'published-conf-2026',
            title: 'Published Conference 2026',
            short_name: 'PC2026',
            location_text: 'Singapore',
            start_date: '2026-08-10',
            end_date: '2026-08-14',
            application_deadline: '2026-07-15T23:59:59.000Z',
            status: 'published',
            is_application_open: true,
            related_grant_count: 0,
          },
        ],
      },
    });

    vi.mocked(fetchConferenceDetail).mockResolvedValue({
      data: {
        conference: {
          id: 'conf-1',
          slug: 'published-conf-2026',
          title: 'Published Conference 2026',
          short_name: 'PC2026',
          location_text: 'Singapore',
          start_date: '2026-08-10',
          end_date: '2026-08-14',
          description: 'Visible conference',
          application_deadline: '2026-07-15T23:59:59.000Z',
          status: 'published',
          published_at: '2026-04-20T10:00:00.000Z',
          is_application_open: true,
          related_grants: [],
        },
      },
    });

    vi.mocked(fetchConferenceApplicationForm).mockResolvedValue({
      data: {
        conference_id: 'conf-1',
        schema: {
          fields: [
            { key: 'participation_type', type: 'select', required: true },
            { key: 'statement', type: 'textarea', required: true },
            { key: 'abstract_title', type: 'text', required: false },
          ],
        },
      },
    });

    await expect(httpConferenceProvider.listPublicConferences()).resolves.toEqual([
      {
        id: 'conf-1',
        slug: 'published-conf-2026',
        title: 'Published Conference 2026',
        shortName: 'PC2026',
        locationText: 'Singapore',
        startDate: '2026-08-10',
        endDate: '2026-08-14',
        applicationDeadline: '2026-07-15T23:59:59.000Z',
        status: 'published',
        isApplicationOpen: true,
        relatedGrantCount: 0,
      },
    ]);

    await expect(
      httpConferenceProvider.getConferenceBySlug('published-conf-2026')
    ).resolves.toMatchObject({
      slug: 'published-conf-2026',
      description: 'Visible conference',
      publishedAt: '2026-04-20T10:00:00.000Z',
    });

    await expect(httpConferenceProvider.getConferenceApplicationForm('conf-1')).resolves.toEqual({
      fields: [
        { key: 'participation_type', type: 'select', required: true },
        { key: 'statement', type: 'textarea', required: true },
        { key: 'abstract_title', type: 'text', required: false },
      ],
    });
  });

  it('maps organizer writes and translates duplicate draft conflicts into a coded error', async () => {
    vi.mocked(createOrganizerConferenceRequest).mockResolvedValue({
      data: {
        conference: {
          id: 'conf-organizer-1',
          slug: 'organizer-conf-2026',
          title: 'Organizer Conference 2026',
          short_name: 'OC2026',
          location_text: 'Seoul',
          start_date: '2026-10-11',
          end_date: '2026-10-15',
          description: 'Updated organizer conference',
          application_deadline: '2026-09-15T23:59:59.000Z',
          status: 'draft',
          application_form_schema: {
            fields: [
              {
                key: 'participation_type',
                type: 'select',
                required: true,
                options: ['talk', 'poster', 'participant'],
              },
              { key: 'statement', type: 'textarea', required: true },
              { key: 'abstract_title', type: 'text', required: false },
              { key: 'abstract_text', type: 'textarea', required: false },
              { key: 'interested_in_travel_support', type: 'checkbox', required: false },
            ],
          },
          settings: {},
          published_at: null,
          closed_at: null,
          staff: [{ user_id: 'integration-token', staff_role: 'owner' }],
        },
      },
    });

    const created = await httpConferenceProvider.createOrganizerConference(organizerDraftValues);

    expect(created).toMatchObject({
      id: 'conf-organizer-1',
      slug: 'organizer-conf-2026',
      title: 'Organizer Conference 2026',
      status: 'draft',
      shortName: 'OC2026',
    });

    const conflictError = {
      response: {
        status: 409,
        data: { message: 'Application already exists for this conference' },
      },
    };

    vi.spyOn(axios, 'isAxiosError').mockImplementation(
      (error): error is typeof conflictError => error === conflictError
    );
    vi.mocked(createConferenceApplicationRequest).mockRejectedValueOnce(conflictError);

    await expect(
      httpConferenceProvider.createConferenceApplication('conf-1', {
        participationType: 'talk',
        statement: 'Duplicate draft',
        abstractTitle: 'Duplicate',
        abstractText: 'Duplicate',
        interestedInTravelSupport: false,
        extraAnswers: {},
      })
    ).rejects.toMatchObject({
      code: 'CONFLICT',
      message: 'Application already exists for this conference',
    });
  });

  it('returns the existing application for the current user and maps 404 to null', async () => {
    vi.mocked(fetchMyConferenceApplication).mockResolvedValueOnce({
      data: {
        application: {
          id: 'application-1',
          application_type: 'conference_application',
          source_module: 'M2',
          conference_id: 'conf-1',
          conference_title: 'Published Conference 2026',
          applicant_user_id: 'integration-token',
          status: 'draft',
          participation_type: 'talk',
          statement: 'Saved statement',
          abstract_title: 'Saved abstract title',
          abstract_text: 'Saved abstract text',
          interested_in_travel_support: true,
          extra_answers: {},
          files: [],
          submitted_at: null,
          decided_at: null,
          created_at: '2026-04-20T10:00:00.000Z',
          updated_at: '2026-04-20T10:00:00.000Z',
        },
      },
    });

    await expect(httpConferenceProvider.getMyConferenceApplication('conf-1')).resolves.toMatchObject({
      id: 'application-1',
      conferenceId: 'conf-1',
      status: 'draft',
      statement: 'Saved statement',
    });

    const notFoundError = {
      response: {
        status: 404,
      },
    };

    vi.spyOn(axios, 'isAxiosError').mockImplementation(
      (error): error is typeof notFoundError => error === notFoundError
    );
    vi.mocked(fetchMyConferenceApplication).mockRejectedValueOnce(notFoundError);

    await expect(httpConferenceProvider.getMyConferenceApplication('conf-1')).resolves.toBeNull();
  });
});
