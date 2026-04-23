import type { DashboardProvider, MyApplication } from './types';

let state: MyApplication[] = [];

export const setDashboardFakeState = (items: MyApplication[]) => {
  state = items;
};

export const resetDashboardFakeState = () => {
  state = [];
};

export const fakeDashboardProvider: DashboardProvider = {
  async listMyApplications() {
    return state;
  },
};
