import type { DashboardProvider, MyApplication } from './types';

const demoDashboardSeed: MyApplication[] = [
  {
    id: 'review-application-1',
    applicationType: 'conference_application',
    sourceModule: 'M2',
    sourceId: 'review-conf-001',
    sourceSlug: 'review-demo-conference-2026',
    sourceTitle: 'Review Demo Conference 2026',
    linkedConferenceTitle: null,
    viewerStatus: 'under_review',
    submittedAt: '2026-08-01T10:00:00.000Z',
    releasedDecision: null,
    nextAction: 'view_submission',
    postVisitReportStatus: null,
  },
];

let state: MyApplication[] = demoDashboardSeed.map((item) => structuredClone(item));

export const setDashboardFakeState = (items: MyApplication[]) => {
  state = items;
};

export const seedDashboardDemoState = () => {
  state = demoDashboardSeed.map((item) => structuredClone(item));
};

export const resetDashboardFakeState = () => {
  state = [];
};

export const fakeDashboardProvider: DashboardProvider = {
  async listMyApplications() {
    return state;
  },
};
