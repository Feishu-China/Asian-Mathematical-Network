export type AccountMenuLinkItem = {
  kind: 'link';
  to: string;
  label: string;
};

export type AccountMenuActionItem = {
  kind: 'action';
  label: string;
  onSelect: () => void;
};

export type AccountMenuItem = AccountMenuLinkItem | AccountMenuActionItem;

export type AccountMenu = {
  label: string;
  items: AccountMenuItem[];
};

export const applicantAccountLinks = [
  {
    kind: 'link',
    to: '/me/applications',
    label: 'My Applications',
  },
  {
    kind: 'link',
    to: '/me/profile',
    label: 'My Profile',
  },
 ] as const;

export const buildApplicantAccountMenu = (onLogout: () => void): AccountMenu => ({
  label: 'Account',
  items: [
    ...applicantAccountLinks,
    {
      kind: 'action',
      label: 'Log out',
      onSelect: onLogout,
    },
  ],
});
