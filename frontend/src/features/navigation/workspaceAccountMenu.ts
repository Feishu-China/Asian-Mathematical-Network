import { buildApplicantAccountMenu, type AccountMenu } from './accountMenu';

export const buildWorkspaceAccountMenu = (onLogout: () => void): AccountMenu =>
  buildApplicantAccountMenu(onLogout);
