import { fakeDashboardProvider } from './fakeDashboardProvider';
import { httpDashboardProvider } from './httpDashboardProvider';
import { shouldUseFakeProvider } from '../providerMode';

export const dashboardProvider = shouldUseFakeProvider(import.meta.env)
  ? fakeDashboardProvider
  : httpDashboardProvider;
