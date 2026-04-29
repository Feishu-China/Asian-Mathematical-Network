import { buildConferenceFormSchema, readConferenceFormToggles } from './conferenceFields';
import {
  fromTransportConferenceApplication,
  fromTransportConferenceDetail,
  fromTransportConferenceListItem,
  fromTransportOrganizerConference,
} from './conferenceMappers';
import type {
  ConferenceApplication,
  ConferenceEditorValues,
  ConferenceProvider,
  OrganizerConference,
} from './types';

type ConflictError = Error & { code: 'CONFLICT' };
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

const isPublishReady = (values: ConferenceEditorValues) =>
  Boolean(
    values.slug.trim() &&
      values.title.trim() &&
      values.locationText.trim() &&
      values.startDate &&
      values.endDate &&
      values.description.trim() &&
      values.applicationDeadline
  );

type PublicConferenceRecord = Parameters<typeof fromTransportConferenceDetail>[0];
type OrganizerConferenceRecord = Parameters<typeof fromTransportOrganizerConference>[0];

const publishedSeed: PublicConferenceRecord = {
  id: 'conf-published-001',
  slug: 'asiamath-2026-workshop',
  title: 'Asiamath 2026 Workshop',
  short_name: 'AM2026',
  location_text: 'Singapore',
  start_date: '2026-08-10',
  end_date: '2026-08-14',
  application_deadline: '2026-07-15T23:59:59.000Z',
  status: 'published' as const,
  is_application_open: true,
  related_grant_count: 0,
  description: 'An MVP conference entry for algebra and geometry researchers.',
  published_at: '2026-04-20T10:00:00.000Z',
  related_grants: [],
};

const publishedUpcomingSeed: PublicConferenceRecord = {
  id: 'conf-published-002',
  slug: 'seoul-number-theory-forum-2026',
  title: 'Seoul Number Theory Forum 2026',
  short_name: 'SNTF2026',
  location_text: 'Seoul',
  start_date: '2026-10-02',
  end_date: '2026-10-05',
  application_deadline: '2026-09-01T23:59:59.000Z',
  status: 'published' as const,
  is_application_open: false,
  related_grant_count: 0,
  description: 'A regional forum linking number theory seminars, mentor exchanges, and new collaborations.',
  published_at: '2026-04-24T10:00:00.000Z',
  related_grants: [],
};

const organizerSeed: OrganizerConferenceRecord = {
  id: 'conf-draft-001',
  slug: 'organizer-draft-2026',
  title: 'Organizer Draft 2026',
  short_name: 'OD2026',
  location_text: '',
  start_date: '',
  end_date: '',
  application_deadline: '',
  status: 'draft' as const,
  description: '',
  published_at: null,
  application_form_schema: buildConferenceFormSchema({
    includeAbstractFields: false,
    includeTravelSupportQuestion: true,
  }),
  settings: {},
  closed_at: null,
  staff: [{ user_id: 'organizer-1', staff_role: 'owner' }],
};

let publicConferenceState: PublicConferenceRecord[] = [publishedSeed, publishedUpcomingSeed];
let organizerConferenceState: OrganizerConferenceRecord[] = [organizerSeed];
let applicationState: ConferenceApplication[] = [];

export const resetConferenceFakeState = () => {
  publicConferenceState = [publishedSeed, publishedUpcomingSeed];
  organizerConferenceState = [organizerSeed];
  applicationState = [];
};

const toOrganizerDomain = (conference: (typeof organizerConferenceState)[number]) =>
  fromTransportOrganizerConference(conference).conference;

const readOrganizerConference = (id: string, userId: string): OrganizerConference => {
  const conference = organizerConferenceState.find((item) => item.id === id);

  if (!conference || !conference.staff.some((member) => member.user_id === userId)) {
    throw new Error('Forbidden');
  }

  return toOrganizerDomain(conference);
};

export const fakeConferenceProvider: ConferenceProvider = {
  async listPublicConferences() {
    await delay();
    return publicConferenceState
      .filter((item) => item.status === 'published')
      .map(fromTransportConferenceListItem);
  },

  async getConferenceBySlug(slug) {
    await delay();
    const conference = publicConferenceState.find(
      (item) => item.slug === slug && item.status === 'published'
    );
    return conference ? fromTransportConferenceDetail(conference) : null;
  },

  async getConferenceApplicationForm(conferenceId) {
    await delay();

    const publicConference = publicConferenceState.find((item) => item.id === conferenceId);
    if (publicConference?.status === 'published' && publicConference.id === 'conf-published-001') {
      return buildConferenceFormSchema({
        includeAbstractFields: true,
        includeTravelSupportQuestion: true,
      });
    }

    const organizerConference = organizerConferenceState.find((item) => item.id === conferenceId);
    if (organizerConference) {
      return organizerConference.application_form_schema;
    }

    throw new Error('Conference form not found');
  },

  async getMyConferenceApplication(conferenceId) {
    const userId = requireToken();
    await delay();

    return (
      applicationState.find(
        (item) => item.conferenceId === conferenceId && item.applicantUserId === userId
      ) ?? null
    );
  },

  async createOrganizerConference(values) {
    const userId = requireToken();
    await delay();

    const created = {
      id: `conf-created-${organizerConferenceState.length + 1}`,
      slug: values.slug.trim(),
      title: values.title.trim(),
      short_name: values.shortName.trim() || null,
      location_text: values.locationText.trim() || null,
      start_date: values.startDate || null,
      end_date: values.endDate || null,
      application_deadline: values.applicationDeadline || null,
      status: 'draft' as const,
      description: values.description.trim() || null,
      published_at: null,
      application_form_schema: buildConferenceFormSchema(values),
      settings: {},
      closed_at: null,
      staff: [{ user_id: userId, staff_role: 'owner' }],
    };

    organizerConferenceState = [...organizerConferenceState, created];
    return toOrganizerDomain(created);
  },

  async getOrganizerConference(id) {
    const userId = requireToken();
    await delay();
    return readOrganizerConference(id, userId);
  },

  async updateOrganizerConference(id, values) {
    const userId = requireToken();
    await delay();
    const existing = readOrganizerConference(id, userId);

    if (existing.status === 'closed') {
      throw new Error('Closed conferences cannot be edited');
    }

    organizerConferenceState = organizerConferenceState.map((item) =>
      item.id === id
        ? {
            ...item,
            slug: values.slug.trim(),
            title: values.title.trim(),
            short_name: values.shortName.trim() || null,
            location_text: values.locationText.trim() || null,
            start_date: values.startDate || null,
            end_date: values.endDate || null,
            description: values.description.trim() || null,
            application_deadline: values.applicationDeadline || null,
            application_form_schema: buildConferenceFormSchema(values),
          }
        : item
    );

    return readOrganizerConference(id, userId);
  },

  async publishOrganizerConference(id) {
    const userId = requireToken();
    await delay();
    const existing = readOrganizerConference(id, userId);

    const toggles = readConferenceFormToggles(existing.applicationFormSchema);
    const values: ConferenceEditorValues = {
      slug: existing.slug,
      title: existing.title,
      shortName: existing.shortName ?? '',
      locationText: existing.locationText ?? '',
      startDate: existing.startDate ?? '',
      endDate: existing.endDate ?? '',
      description: existing.description ?? '',
      applicationDeadline: existing.applicationDeadline ?? '',
      includeAbstractFields: toggles.includeAbstractFields,
      includeTravelSupportQuestion: toggles.includeTravelSupportQuestion,
    };

    if (!isPublishReady(values)) {
      throw new Error('Conference is not ready to publish');
    }

    organizerConferenceState = organizerConferenceState.map((item) =>
      item.id === id
        ? {
            ...item,
            status: 'published',
            published_at: now(),
          }
        : item
    );

    const published = organizerConferenceState.find((item) => item.id === id);
    if (published) {
      publicConferenceState = [
        ...publicConferenceState.filter((item) => item.id !== id),
        {
          id: published.id,
          slug: published.slug,
          title: published.title,
          short_name: published.short_name,
          location_text: published.location_text,
          start_date: published.start_date,
          end_date: published.end_date,
          application_deadline: published.application_deadline,
          status: 'published',
          is_application_open: true,
          related_grant_count: 0,
          description: published.description,
          published_at: published.published_at,
          related_grants: [],
        },
      ];
    }

    return readOrganizerConference(id, userId);
  },

  async closeOrganizerConference(id) {
    const userId = requireToken();
    await delay();
    readOrganizerConference(id, userId);

    organizerConferenceState = organizerConferenceState.map((item) =>
      item.id === id
        ? {
            ...item,
            status: 'closed',
            closed_at: now(),
          }
        : item
    );

    publicConferenceState = publicConferenceState.map((item) =>
      item.id === id
        ? {
            ...item,
            status: 'closed',
            is_application_open: false,
          }
        : item
    );

    return readOrganizerConference(id, userId);
  },

  async createConferenceApplication(conferenceId, values) {
    const userId = requireToken();
    await delay();

    const conflict = applicationState.find(
      (item) => item.conferenceId === conferenceId && item.applicantUserId === userId
    );

    if (conflict) {
      const error = new Error('Application already exists') as ConflictError;
      error.code = 'CONFLICT';
      throw error;
    }

    const conference = publicConferenceState.find((item) => item.id === conferenceId);

    if (!conference) {
      throw new Error('Conference not found');
    }

    const created = fromTransportConferenceApplication({
      id: `application-${applicationState.length + 1}`,
      application_type: 'conference_application',
      source_module: 'M2',
      conference_id: conference.id,
      conference_title: conference.title,
      applicant_user_id: userId,
      status: 'draft',
      participation_type: values.participationType,
      statement: values.statement,
      abstract_title: values.abstractTitle || null,
      abstract_text: values.abstractText || null,
      interested_in_travel_support: values.interestedInTravelSupport,
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

  async updateConferenceApplication(applicationId, values) {
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

    applicationState = applicationState.map((item) =>
      item.id === applicationId
        ? {
            ...item,
            participationType: values.participationType,
            statement: values.statement,
            abstractTitle: values.abstractTitle || null,
            abstractText: values.abstractText || null,
            interestedInTravelSupport: values.interestedInTravelSupport,
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

  async submitConferenceApplication(applicationId) {
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
