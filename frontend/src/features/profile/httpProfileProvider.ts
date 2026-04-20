import axios from 'axios';
import {
  fetchMyProfile,
  fetchScholarProfile,
  updateMyProfileRequest,
} from '../../api/profile';
import {
  fromTransportProfile,
  fromTransportPublicProfile,
  toTransportUpdatePayload,
} from './profileMappers';
import type { ProfileProvider } from './types';

const readToken = () => {
  const token = localStorage.getItem('token');

  if (!token) {
    throw new Error('Missing auth token');
  }

  return token;
};

export const httpProfileProvider: ProfileProvider = {
  async getMyProfile() {
    const response = await fetchMyProfile(readToken());
    return fromTransportProfile(response.data.profile);
  },

  async updateMyProfile(values) {
    const response = await updateMyProfileRequest(readToken(), toTransportUpdatePayload(values));
    return fromTransportProfile(response.data.profile);
  },

  async getScholarProfile(slug) {
    try {
      const response = await fetchScholarProfile(slug);
      return fromTransportPublicProfile(response.data.profile);
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        return null;
      }

      throw error;
    }
  },
};
