import type {
  DashboardProvider,
  MyApplication,
  MyApplicationDetail,
  PostVisitReport,
} from './types';

let state: MyApplication[] = [];
let detailState: MyApplicationDetail[] = [];
let nextReportFailure: (Error & { code?: string }) | null = null;

export const setDashboardFakeState = (items: MyApplication[]) => {
  state = items;
};

export const setDashboardDetailFakeState = (items: MyApplicationDetail[]) => {
  detailState = items;
};

export const setNextPostVisitReportFailure = (error: (Error & { code?: string }) | null) => {
  nextReportFailure = error;
};

export const resetDashboardFakeState = () => {
  state = [];
  detailState = [];
  nextReportFailure = null;
};

export const fakeDashboardProvider: DashboardProvider = {
  async listMyApplications() {
    return state;
  },

  async getMyApplication(applicationId) {
    return detailState.find((item) => item.id === applicationId) ?? null;
  },

  async submitPostVisitReport(applicationId, values) {
    if (nextReportFailure) {
      const failure = nextReportFailure;
      nextReportFailure = null;
      throw failure;
    }

    const target = detailState.find((item) => item.id === applicationId);
    if (!target) {
      throw new Error('Application not found');
    }
    if (target.postVisitReport) {
      throw new Error('A post-visit report has already been submitted');
    }

    const report: PostVisitReport = {
      id: `report-${applicationId}`,
      status: 'submitted',
      reportNarrative: values.reportNarrative,
      attendanceConfirmed: values.attendanceConfirmed,
      submittedAt: new Date().toISOString(),
    };

    detailState = detailState.map((item) =>
      item.id === applicationId
        ? { ...item, postVisitReport: report, postVisitReportStatus: 'submitted' }
        : item
    );

    return report;
  },
};
