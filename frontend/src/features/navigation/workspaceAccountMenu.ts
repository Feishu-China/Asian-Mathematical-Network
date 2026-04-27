import { applicantAccountLinks, type AccountMenu } from './accountMenu';

export const buildWorkspaceAccountMenu = (onLogout: () => void): AccountMenu => ({
  label: 'Account',
  items: [
    {
      kind: 'link',
      to: '/dashboard',
      label: 'My Dashboard',
    },
    ...applicantAccountLinks,
    {
      kind: 'action',
      label: 'Log out',
      onSelect: onLogout,
    },
  ],
});
