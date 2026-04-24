import type { DashboardProvider, MyApplication, MyApplicationDetail } from './types';

let state: MyApplication[] = [];
let detailState: MyApplicationDetail[] = [];

export const setDashboardFakeState = (items: MyApplication[]) => {
  state = items;
};

export const setDashboardDetailFakeState = (items: MyApplicationDetail[]) => {
  detailState = items;
};

export const resetDashboardFakeState = () => {
  state = [];
  detailState = [];
};

export const fakeDashboardProvider: DashboardProvider = {
  async listMyApplications() {
    return state;
  },

  async getMyApplication(applicationId) {
    return detailState.find((item) => item.id === applicationId) ?? null;
  },
};
