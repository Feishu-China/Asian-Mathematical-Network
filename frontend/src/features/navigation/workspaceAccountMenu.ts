import { applicantAccountLinks, type AccountMenu } from './accountMenu';

export type WorkspaceAccountMenuRole = 'applicant' | 'reviewer' | 'organizer' | 'admin';

type WorkspaceAccountMenuConfig = {
  role?: WorkspaceAccountMenuRole;
  onLogout: () => void;
  primaryConferenceId?: string | null;
};

const buildRoleLinks = (
  role: WorkspaceAccountMenuRole,
  primaryConferenceId: string | null
) => {
  if (role === 'reviewer') {
    return [
      {
        kind: 'link' as const,
        to: '/reviewer',
        label: 'Reviewer Queue',
      },
      {
        kind: 'link' as const,
        to: '/me/profile',
        label: 'My Profile',
      },
    ];
  }

  if (role === 'organizer') {
    return [
      {
        kind: 'link' as const,
        to: primaryConferenceId
          ? `/organizer/conferences/${primaryConferenceId}/applications`
          : '/organizer/conferences/new',
        label: primaryConferenceId ? 'Conference Workspace' : 'Create Conference',
      },
      {
        kind: 'link' as const,
        to: '/me/profile',
        label: 'My Profile',
      },
    ];
  }

  if (role === 'admin') {
    return [
      {
        kind: 'link' as const,
        to: '/me/profile',
        label: 'My Profile',
      },
    ];
  }

  return applicantAccountLinks;
};

export const buildWorkspaceAccountMenu = (
  input: WorkspaceAccountMenuConfig | (() => void)
): AccountMenu => {
  const config: WorkspaceAccountMenuConfig =
    typeof input === 'function'
      ? {
          role: 'applicant',
          onLogout: input,
          primaryConferenceId: null,
        }
      : {
          role: input.role ?? 'applicant',
          onLogout: input.onLogout,
          primaryConferenceId: input.primaryConferenceId ?? null,
        };

  return {
    label: 'Account',
    items: [
      {
        kind: 'link',
        to: '/dashboard',
        label: 'My Dashboard',
      },
      ...buildRoleLinks(config.role ?? 'applicant', config.primaryConferenceId ?? null),
      {
        kind: 'action',
        label: 'Log out',
        onSelect: config.onLogout,
      },
    ],
  };
};
