import { fakeDashboardProvider } from './fakeDashboardProvider';
import { httpDashboardProvider } from './httpDashboardProvider';

const isTestEnv = import.meta.env.MODE === 'test' || import.meta.env.VITEST;

export const dashboardProvider = isTestEnv ? fakeDashboardProvider : httpDashboardProvider;
