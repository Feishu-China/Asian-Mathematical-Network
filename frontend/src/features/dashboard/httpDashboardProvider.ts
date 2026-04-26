import axios from 'axios';
import {
  fetchMyApplicationDetail,
  fetchMyApplications,
  submitMyPostVisitReportRequest,
} from '../../api/me';
import {
  fromTransportMyApplication,
  fromTransportMyApplicationDetail,
  fromTransportPostVisitReport,
} from './dashboardMappers';
import type { DashboardProvider, PostVisitReport } from './types';

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

  async submitPostVisitReport(applicationId, values) {
    const response = await submitMyPostVisitReportRequest(readToken(), applicationId, {
      report_narrative: values.reportNarrative,
      attendance_confirmed: values.attendanceConfirmed,
    });
    const report = fromTransportPostVisitReport(response.data.post_visit_report);
    if (!report) {
      throw new Error('Backend returned no post_visit_report');
    }
    return report as PostVisitReport;
  },
};
