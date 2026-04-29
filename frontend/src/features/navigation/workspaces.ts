import type { WorkspaceKey } from '@asiamath/shared/models';

export const LAST_WORKSPACE_STORAGE_KEY = 'asiamath.lastWorkspace';

const WORKSPACE_ORDER: WorkspaceKey[] = ['applicant', 'reviewer', 'organizer', 'admin'];
const APPLICANT_REVIEWER_WORKSPACE_ORDER: WorkspaceKey[] = ['applicant', 'reviewer'];

const WORKSPACE_ROOTS: Record<WorkspaceKey, string> = {
  applicant: '/dashboard',
  reviewer: '/reviewer',
  organizer: '/dashboard',
  admin: '/dashboard',
};

const WORKSPACE_LABELS: Record<WorkspaceKey, string> = {
  applicant: 'Applicant',
  reviewer: 'Reviewer',
  organizer: 'Organizer',
  admin: 'Admin',
};

export const isWorkspaceKey = (value: unknown): value is WorkspaceKey =>
  value === 'applicant' || value === 'reviewer' || value === 'organizer' || value === 'admin';

export const normalizeAvailableWorkspaces = (workspaces: readonly WorkspaceKey[] | null | undefined) => {
  if (!workspaces || workspaces.length === 0) {
    return ['applicant'] satisfies WorkspaceKey[];
  }

  const seen = new Set<WorkspaceKey>();

  for (const workspace of workspaces) {
    if (isWorkspaceKey(workspace)) {
      seen.add(workspace);
    }
  }

  const normalized = WORKSPACE_ORDER.filter((workspace) => seen.has(workspace));

  return normalized.length > 0 ? normalized : (['applicant'] satisfies WorkspaceKey[]);
};

export const shouldShowWorkspaceSwitcher = (workspaces: readonly WorkspaceKey[]) =>
  normalizeAvailableWorkspaces(workspaces).length > 1;

export const getWorkspaceRoot = (workspace: WorkspaceKey) => WORKSPACE_ROOTS[workspace];

export const getWorkspaceLabel = (workspace: WorkspaceKey) => WORKSPACE_LABELS[workspace];

export const readStoredWorkspace = (): WorkspaceKey | null => {
  const value = localStorage.getItem(LAST_WORKSPACE_STORAGE_KEY);
  return isWorkspaceKey(value) ? value : null;
};

export const writeStoredWorkspace = (workspace: WorkspaceKey) => {
  localStorage.setItem(LAST_WORKSPACE_STORAGE_KEY, workspace);
};

export const clearStoredWorkspace = () => {
  localStorage.removeItem(LAST_WORKSPACE_STORAGE_KEY);
};

export const resolvePreferredWorkspace = (
  availableWorkspaces: readonly WorkspaceKey[] | null | undefined,
  preferredWorkspace?: WorkspaceKey | null
): WorkspaceKey => {
  const normalized = normalizeAvailableWorkspaces(availableWorkspaces);

  if (preferredWorkspace && normalized.includes(preferredWorkspace)) {
    return preferredWorkspace;
  }

  return normalized[0] ?? 'applicant';
};

export const getApplicantReviewerWorkspaces = (
  availableWorkspaces: readonly WorkspaceKey[] | null | undefined
) => normalizeAvailableWorkspaces(availableWorkspaces).filter((workspace) =>
  APPLICANT_REVIEWER_WORKSPACE_ORDER.includes(workspace)
);
