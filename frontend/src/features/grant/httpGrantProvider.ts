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
import {
  fromTransportGrantApplication,
  fromTransportGrantApplicationForm,
  fromTransportGrantDetail,
  fromTransportGrantListItem,
  toTransportGrantApplicationPayload,
} from './grantMappers';
import type { GrantProvider } from './types';

type CodedError = Error & { code?: 'CONFLICT' | 'PREREQUISITE' };

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

export const httpGrantProvider: GrantProvider = {
  async listPublicGrants() {
    const response = await fetchGrantList();
    return response.data.items.map(fromTransportGrantListItem);
  },

  async getGrantBySlug(slug) {
    try {
      const response = await fetchGrantDetail(slug);
      return fromTransportGrantDetail(response.data.grant);
    } catch (error) {
      if (hasStatus(error, 404)) {
        return null;
      }

      throw error;
    }
  },

  async getGrantApplicationForm(grantId) {
    const response = await fetchGrantApplicationForm(grantId);
    return fromTransportGrantApplicationForm(response.data);
  },

  async getMyGrantApplication(grantId) {
    try {
      const response = await fetchMyGrantApplication(readToken(), grantId);
      return fromTransportGrantApplication(response.data.application);
    } catch (error) {
      if (hasStatus(error, 404)) {
        return null;
      }

      throw error;
    }
  },

  async createGrantApplication(grantId, values) {
    try {
      const response = await createGrantApplicationRequest(
        readToken(),
        grantId,
        toTransportGrantApplicationPayload(values)
      );
      return fromTransportGrantApplication(response.data.application);
    } catch (error) {
      if (hasStatus(error, 409)) {
        const conflict = new Error(
          getApiMessage(error, 'Application already exists for this grant')
        ) as CodedError;
        conflict.code = 'CONFLICT';
        throw conflict;
      }

      if (hasStatus(error, 422)) {
        const prerequisite = new Error(
          getApiMessage(error, 'A submitted linked conference application is required')
        ) as CodedError;
        prerequisite.code = 'PREREQUISITE';
        throw prerequisite;
      }

      throw error;
    }
  },

  async updateGrantApplication(applicationId, values) {
    try {
      const response = await updateMyGrantApplicationDraftRequest(
        readToken(),
        applicationId,
        toTransportGrantApplicationPayload(values)
      );
      return fromTransportGrantApplication(response.data.application);
    } catch (error) {
      if (hasStatus(error, 422)) {
        const prerequisite = new Error(
          getApiMessage(error, 'A submitted linked conference application is required')
        ) as CodedError;
        prerequisite.code = 'PREREQUISITE';
        throw prerequisite;
      }

      throw error;
    }
  },

  async submitGrantApplication(applicationId) {
    try {
      const response = await submitMyGrantApplicationRequest(readToken(), applicationId);
      return fromTransportGrantApplication(response.data.application);
    } catch (error) {
      if (hasStatus(error, 422)) {
        const prerequisite = new Error(
          getApiMessage(error, 'A submitted linked conference application is required')
        ) as CodedError;
        prerequisite.code = 'PREREQUISITE';
        throw prerequisite;
      }

      throw error;
    }
  },
};
