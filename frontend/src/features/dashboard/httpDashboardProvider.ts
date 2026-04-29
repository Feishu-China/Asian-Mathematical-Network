import { fetchMyApplications } from '../../api/me';
import { fromTransportMyApplication } from './dashboardMappers';
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

export const httpDashboardProvider: DashboardProvider = {
  async listMyApplications() {
    const response = await fetchMyApplications(readToken());
    return response.data.items.map(fromTransportMyApplication);
  },
};
