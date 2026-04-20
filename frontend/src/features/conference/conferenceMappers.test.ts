import { beforeEach, describe, expect, it } from 'vitest';
import {
  fromTransportOrganizerConference,
  toTransportConferenceApplicationPayload,
  toTransportConferencePayload,
} from './conferenceMappers';
import {
  fakeConferenceProvider,
  resetConferenceFakeState,
} from './fakeConferenceProvider';

describe('conference foundations', () => {
  beforeEach(() => {
    localStorage.clear();
    resetConferenceFakeState();
  });

  it('maps organizer transport payloads into editor values and serializes them back to snake_case', () => {
    const organizerConference = fromTransportOrganizerConference({
      id: 'conf-draft-001',
      slug: 'organizer-draft-2026',
      title: 'Organizer Draft 2026',
      short_name: 'OD2026',
      location_text: 'Seoul',
      start_date: '2026-10-11',
      end_date: '2026-10-15',
      description: 'Draft conference',
      application_deadline: '2026-09-15T23:59:59.000Z',
      status: 'draft',
      application_form_schema: {
        fields: [
          { key: 'participation_type', type: 'select', required: true },
          { key: 'statement', type: 'textarea', required: true },
          { key: 'abstract_title', type: 'text', required: false },
          { key: 'abstract_text', type: 'textarea', required: false },
          { key: 'interested_in_travel_support', type: 'checkbox', required: false },
        ],
      },
      settings: {},
      published_at: null,
      closed_at: null,
      staff: [{ user_id: 'organizer-1', staff_role: 'owner' }],
    });

    expect(organizerConference.values).toMatchObject({
      slug: 'organizer-draft-2026',
      title: 'Organizer Draft 2026',
      includeAbstractFields: true,
      includeTravelSupportQuestion: true,
    });

    expect(toTransportConferencePayload(organizerConference.values)).toEqual({
      slug: 'organizer-draft-2026',
      title: 'Organizer Draft 2026',
      short_name: 'OD2026',
      location_text: 'Seoul',
      start_date: '2026-10-11',
      end_date: '2026-10-15',
      description: 'Draft conference',
      application_deadline: '2026-09-15T23:59:59.000Z',
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
    });

    expect(
      toTransportConferenceApplicationPayload({
        participationType: 'talk',
        statement: 'I would like to present recent work.',
        abstractTitle: 'Recent Work',
        abstractText: 'A short abstract.',
        interestedInTravelSupport: true,
        extraAnswers: {},
      })
    ).toEqual({
      participation_type: 'talk',
      statement: 'I would like to present recent work.',
      abstract_title: 'Recent Work',
      abstract_text: 'A short abstract.',
      interested_in_travel_support: true,
      extra_answers: {},
      file_ids: [],
    });
  });

  it('allows only one draft application per conference for the current fake user', async () => {
    localStorage.setItem('token', 'applicant-1');

    const first = await fakeConferenceProvider.createConferenceApplication('conf-published-001', {
      participationType: 'talk',
      statement: 'First draft',
      abstractTitle: 'Draft one',
      abstractText: 'Abstract one',
      interestedInTravelSupport: true,
      extraAnswers: {},
    });

    expect(first.status).toBe('draft');

    await expect(
      fakeConferenceProvider.createConferenceApplication('conf-published-001', {
        participationType: 'participant',
        statement: 'Second draft should fail',
        abstractTitle: '',
        abstractText: '',
        interestedInTravelSupport: false,
        extraAnswers: {},
      })
    ).rejects.toMatchObject({ code: 'CONFLICT' });
  });
});
