import axios from 'axios';
import {
  closeOrganizerConferenceRequest,
  createConferenceApplicationRequest,
  createOrganizerConferenceRequest,
  fetchConferenceApplicationForm,
  fetchConferenceDetail,
  fetchConferenceList,
  fetchOrganizerConference,
  publishOrganizerConferenceRequest,
  submitMyConferenceApplicationRequest,
  updateMyConferenceApplicationDraftRequest,
  updateOrganizerConferenceRequest,
} from '../../api/conference';
import {
  fromTransportConferenceApplication,
  fromTransportConferenceApplicationForm,
  fromTransportConferenceDetail,
  fromTransportConferenceListItem,
  fromTransportOrganizerConference,
  toTransportConferenceApplicationPayload,
  toTransportConferencePayload,
} from './conferenceMappers';
import type { ConferenceProvider } from './types';

type CodedError = Error & { code?: 'CONFLICT' };

const readToken = () => {
  const token = localStorage.getItem('token');

  if (!token) {
    throw new Error('Missing auth token');
  }

  return token;
};

const hasStatus = (error: unknown, status: number) =>
  axios.isAxiosError(error) && error.response?.status === status;

const getApiMessage = (error: unknown, fallback: string) => {
  if (axios.isAxiosError(error) && typeof error.response?.data?.message === 'string') {
    return error.response.data.message;
  }

  return fallback;
};

export const httpConferenceProvider: ConferenceProvider = {
  async listPublicConferences() {
    const response = await fetchConferenceList();
    return response.data.items.map(fromTransportConferenceListItem);
  },

  async getConferenceBySlug(slug) {
    try {
      const response = await fetchConferenceDetail(slug);
      return fromTransportConferenceDetail(response.data.conference);
    } catch (error) {
      if (hasStatus(error, 404)) {
        return null;
      }

      throw error;
    }
  },

  async getConferenceApplicationForm(conferenceId) {
    const response = await fetchConferenceApplicationForm(conferenceId);
    return fromTransportConferenceApplicationForm(response.data);
  },

  async createOrganizerConference(values) {
    const response = await createOrganizerConferenceRequest(
      readToken(),
      toTransportConferencePayload(values)
    );
    return fromTransportOrganizerConference(response.data.conference).conference;
  },

  async getOrganizerConference(id) {
    const response = await fetchOrganizerConference(readToken(), id);
    return fromTransportOrganizerConference(response.data.conference).conference;
  },

  async updateOrganizerConference(id, values) {
    const response = await updateOrganizerConferenceRequest(
      readToken(),
      id,
      toTransportConferencePayload(values)
    );
    return fromTransportOrganizerConference(response.data.conference).conference;
  },

  async publishOrganizerConference(id) {
    const response = await publishOrganizerConferenceRequest(readToken(), id);
    return fromTransportOrganizerConference(response.data.conference).conference;
  },

  async closeOrganizerConference(id) {
    const response = await closeOrganizerConferenceRequest(readToken(), id);
    return fromTransportOrganizerConference(response.data.conference).conference;
  },

  async createConferenceApplication(conferenceId, values) {
    try {
      const response = await createConferenceApplicationRequest(
        readToken(),
        conferenceId,
        toTransportConferenceApplicationPayload(values)
      );
      return fromTransportConferenceApplication(response.data.application);
    } catch (error) {
      if (hasStatus(error, 409)) {
        const conflict = new Error(
          getApiMessage(error, 'Application already exists for this conference')
        ) as CodedError;
        conflict.code = 'CONFLICT';
        throw conflict;
      }

      throw error;
    }
  },

  async updateConferenceApplication(applicationId, values) {
    const response = await updateMyConferenceApplicationDraftRequest(
      readToken(),
      applicationId,
      toTransportConferenceApplicationPayload(values)
    );
    return fromTransportConferenceApplication(response.data.application);
  },

  async submitConferenceApplication(applicationId) {
    const response = await submitMyConferenceApplicationRequest(readToken(), applicationId);
    return fromTransportConferenceApplication(response.data.application);
  },
};
