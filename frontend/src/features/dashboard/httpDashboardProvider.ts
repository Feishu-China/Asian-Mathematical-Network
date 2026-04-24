import axios from 'axios';
import { fetchMyApplicationDetail, fetchMyApplications } from '../../api/me';
import {
  fromTransportMyApplication,
  fromTransportMyApplicationDetail,
} from './dashboardMappers';
import type { DashboardProvider } from './types';

const readToken = () => {
  const token = localStorage.getItem('token');

  if (!token) {
    const error = new Error('Missing auth token') as Error & { code: 'UNAUTHORIZED' };
    error.code = 'UNAUTHORIZED';
    throw error;
  }

  return token;
};

const hasStatus = (error: unknown, status: number) =>
  axios.isAxiosError(error) && error.response?.status === status;

export const httpDashboardProvider: DashboardProvider = {
  async listMyApplications() {
    const response = await fetchMyApplications(readToken());
    return response.data.items.map(fromTransportMyApplication);
  },

  async getMyApplication(applicationId) {
    try {
      const response = await fetchMyApplicationDetail(readToken(), applicationId);
      return fromTransportMyApplicationDetail(response.data.application);
    } catch (error) {
      if (hasStatus(error, 404)) {
        return null;
      }
      throw error;
    }
  },
};
