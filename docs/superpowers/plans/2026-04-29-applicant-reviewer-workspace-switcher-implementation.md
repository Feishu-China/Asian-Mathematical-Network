# Applicant Reviewer Workspace Switcher Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a single-account applicant/reviewer workspace switcher that appears only for multi-workspace users, remembers the last workspace used, and keeps reviewer access strictly permission-gated.

**Architecture:** Extend the backend auth payload with explicit `available_workspaces`, then add a small frontend workspace-navigation layer that owns workspace availability, root-route mapping, local preference storage, and a shared header switcher control. Roll the switcher into applicant and reviewer `WorkspaceShell` pages, update auth-entry routing to prefer the stored workspace when there is no explicit deep-link target, and preserve the existing organizer/admin behavior outside this slice.

**Tech Stack:** Express + Prisma backend, React 19 + React Router 7 frontend, Vitest + Testing Library frontend tests, Jest + Supertest backend tests, localStorage-backed client preference persistence.

---

## File Map

- Modify: `packages/shared/src/models.ts`
  Add a shared `WorkspaceKey` type so backend/frontend can speak the same availability vocabulary.
- Modify: `backend/src/lib/userRoles.ts`
  Add a helper that derives explicit workspaces from persisted roles.
- Modify: `backend/src/controllers/auth.ts`
  Include `available_workspaces` in `register`, `login`, and `getMe` payloads.
- Modify: `backend/tests/auth.test.ts`
  Lock applicant-only and applicant-plus-reviewer availability responses.
- Create: `frontend/src/features/navigation/workspaces.ts`
  Shared frontend helpers for workspace normalization, roots, visibility, and localStorage persistence.
- Create: `frontend/src/features/auth/authSession.ts`
  Minimal persisted auth-user reader/writer so applicant and reviewer pages can read `available_workspaces` without each page refetching `/auth/me`.
- Create: `frontend/src/features/navigation/WorkspaceSwitcher.tsx`
  Header dropdown control that renders workspace options, writes the last workspace key, and navigates to workspace roots.
- Modify: `frontend/src/components/layout/WorkspaceShell.tsx`
  Add a `workspaceSwitcher` slot parallel to `Account`.
- Modify: `frontend/src/components/layout/Shell.test.tsx`
  Verify workspace switcher rendering in the shell header.
- Modify: `frontend/src/styles/layout.css`
  Add switcher trigger/panel/item styles aligned with the existing account-menu grammar.
- Modify: `frontend/src/features/navigation/authReturn.ts`
  Add a post-auth destination resolver that prefers explicit `returnTo`, otherwise restores the last valid workspace root.
- Modify: `frontend/src/api/auth.ts`
  Add typed auth response shapes that include `available_workspaces`.
- Modify: `frontend/src/pages/Login.tsx`
  Route post-login users to the stored valid workspace root when no explicit return target exists.
- Modify: `frontend/src/pages/Register.tsx`
  Route post-registration users with the same resolver, while defaulting first-time accounts to applicant.
- Modify: `frontend/src/pages/Login.test.tsx`
  Lock explicit-return and stored-workspace behaviors.
- Modify: `frontend/src/pages/Register.test.tsx`
  Lock explicit-return and applicant-default behaviors.
- Modify: `frontend/src/pages/Dashboard.tsx`
  Treat `/dashboard` as applicant root for reviewer-enabled accounts, inject the switcher, and show `Browse opportunities` only for applicant context.
- Modify: `frontend/src/pages/Dashboard.test.tsx`
  Lock switcher visibility, reviewer-to-applicant IA, and applicant-only `Browse opportunities`.
- Modify: `frontend/src/pages/MyApplications.tsx`
  Inject the switcher into applicant workspace pages.
- Modify: `frontend/src/pages/MyApplications.test.tsx`
  Lock switcher presence on applicant list pages for multi-workspace users.
- Modify: `frontend/src/pages/MyApplicationDetail.tsx`
  Inject the switcher into applicant detail pages.
- Modify: `frontend/src/pages/MyApplicationDetail.test.tsx`
  Lock switcher presence on applicant detail pages for multi-workspace users.
- Modify: `frontend/src/pages/MeProfile.tsx`
  Inject the switcher into applicant profile pages.
- Modify: `frontend/src/pages/MeProfile.test.tsx`
  Lock switcher presence on applicant profile pages for multi-workspace users.
- Modify: `frontend/src/pages/ReviewerAssignments.tsx`
  Inject the switcher into reviewer root and ensure there is no `Browse opportunities` action.
- Modify: `frontend/src/pages/ReviewerAssignmentDetail.tsx`
  Inject the switcher into reviewer detail pages.
- Modify: `frontend/src/pages/ReviewWorkspaces.test.tsx`
  Lock switcher presence on reviewer pages and absence of `Browse opportunities`.
- Modify: `PROGRESS.md`
  Append the handoff note after implementation and verification.

### Task 1: Backend Workspace Availability Contract

**Files:**
- Modify: `packages/shared/src/models.ts`
- Modify: `backend/src/lib/userRoles.ts`
- Modify: `backend/src/controllers/auth.ts`
- Test: `backend/tests/auth.test.ts`

- [ ] **Step 1: Write the failing backend tests**

```ts
it('returns applicant as the only available workspace for a freshly registered user', async () => {
  const registerRes = await request(app).post('/api/v1/auth/register').send({
    email: 'workspace.single@example.com',
    password: 'password123',
    fullName: 'Single Workspace',
  });

  expect(registerRes.status).toBe(201);
  expect(registerRes.body.user.available_workspaces).toEqual(['applicant']);
});

it('returns reviewer in available_workspaces once reviewer permission is granted', async () => {
  const registerRes = await request(app).post('/api/v1/auth/register').send({
    email: 'workspace.reviewer@example.com',
    password: 'password123',
    fullName: 'Reviewer Workspace',
  });

  expect(registerRes.status).toBe(201);

  await prisma.userRole.create({
    data: {
      id: `role-${registerRes.body.user.id}-reviewer`,
      userId: registerRes.body.user.id,
      role: 'reviewer',
      isPrimary: false,
    },
  });

  const meRes = await request(app)
    .get('/api/v1/auth/me')
    .set('Authorization', `Bearer ${registerRes.body.accessToken}`);

  expect(meRes.status).toBe(200);
  expect(meRes.body.user.available_workspaces).toEqual(['applicant', 'reviewer']);
});
```

- [ ] **Step 2: Run the backend auth test to verify it fails**

Run:

```bash
cd backend && DATABASE_URL="$TEST_DATABASE_URL" ../node_modules/.bin/jest --runInBand tests/auth.test.ts
```

Expected: FAIL because `available_workspaces` is missing from the auth payload.

- [ ] **Step 3: Add the shared workspace type and backend helper**

```ts
// packages/shared/src/models.ts
export type WorkspaceKey = 'applicant' | 'reviewer' | 'organizer' | 'admin';
```

```ts
// backend/src/lib/userRoles.ts
import type { WorkspaceKey } from '@asiamath/shared';

const WORKSPACE_ROLE_ORDER: WorkspaceKey[] = ['applicant', 'reviewer', 'organizer', 'admin'];

export const listAvailableWorkspaces = async (
  userId: string,
  client: PrismaLike = prisma
): Promise<WorkspaceKey[]> => {
  const roles = await listUserRoles(userId, client);

  return WORKSPACE_ROLE_ORDER.filter((workspace) => roles.includes(workspace));
};
```

- [ ] **Step 4: Include `available_workspaces` in auth responses**

```ts
// backend/src/controllers/auth.ts
import { ensureUserRole, listAvailableWorkspaces, listUserRoles, readPrimaryRole } from '../lib/userRoles';

const roles = await listUserRoles(newUser.id);
const availableWorkspaces = await listAvailableWorkspaces(newUser.id);
const primaryRole = await readPrimaryRole(newUser.id);

res.status(201).json({
  accessToken: token,
  user: {
    id: newUser.id,
    email: newUser.email,
    status: newUser.status,
    role: primaryRole,
    roles,
    available_workspaces: availableWorkspaces,
    primary_role: primaryRole,
    createdAt: newUser.createdAt,
    updatedAt: newUser.updatedAt,
  },
});
```

Apply the same `available_workspaces` addition in `login` and `getMe`.

- [ ] **Step 5: Re-run the backend auth test to verify it passes**

Run:

```bash
cd backend && DATABASE_URL="$TEST_DATABASE_URL" ../node_modules/.bin/jest --runInBand tests/auth.test.ts
```

Expected: PASS with `available_workspaces` returned for applicant-only and reviewer-enabled users.

- [ ] **Step 6: Commit**

```bash
git add packages/shared/src/models.ts backend/src/lib/userRoles.ts backend/src/controllers/auth.ts backend/tests/auth.test.ts
git commit -m "feat: expose available workspaces in auth payloads"
```

### Task 2: Shared Frontend Workspace Switcher Foundation

**Files:**
- Create: `frontend/src/features/navigation/workspaces.ts`
- Create: `frontend/src/features/auth/authSession.ts`
- Create: `frontend/src/features/navigation/WorkspaceSwitcher.tsx`
- Modify: `frontend/src/components/layout/WorkspaceShell.tsx`
- Modify: `frontend/src/styles/layout.css`
- Test: `frontend/src/components/layout/Shell.test.tsx`

- [ ] **Step 1: Write failing shell tests for the new switcher slot**

```tsx
it('renders a workspace switcher alongside account actions in the workspace shell header', async () => {
  const user = userEvent.setup();

  render(
    <MemoryRouter>
      <WorkspaceShell
        title="Dashboard"
        workspaceSwitcher={<button type="button">Workspace</button>}
        accountMenu={{
          label: 'Account',
          items: [{ kind: 'action', label: 'Log out', onSelect: () => undefined }],
        }}
      >
        <div>Workspace body</div>
      </WorkspaceShell>
    </MemoryRouter>
  );

  expect(screen.getByRole('button', { name: 'Workspace' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Account' })).toBeInTheDocument();
});

it('defines switcher trigger styling in layout.css', () => {
  const css = readFileSync(resolve(process.cwd(), 'src/styles/layout.css'), 'utf8');

  expect(css).toMatch(/\.workspace-switcher__trigger\s*\{/);
  expect(css).toMatch(/\.workspace-switcher__panel\s*\{/);
});
```

- [ ] **Step 2: Run the shell test to verify it fails**

Run:

```bash
cd frontend && npm run test:run -- src/components/layout/Shell.test.tsx
```

Expected: FAIL because `WorkspaceShell` does not accept or render `workspaceSwitcher`, and the CSS classes do not exist.

- [ ] **Step 3: Add workspace helpers and switcher component**

```ts
// frontend/src/features/navigation/workspaces.ts
import type { WorkspaceKey } from '@asiamath/shared';

export const LAST_WORKSPACE_STORAGE_KEY = 'asiamath.lastWorkspace';

export const WORKSPACE_ROOTS: Record<'applicant' | 'reviewer', string> = {
  applicant: '/dashboard',
  reviewer: '/reviewer',
};

export const normalizeAvailableWorkspaces = (value: unknown): Array<'applicant' | 'reviewer'> => {
  if (!Array.isArray(value)) {
    return ['applicant'];
  }

  const normalized = value.filter(
    (item): item is 'applicant' | 'reviewer' => item === 'applicant' || item === 'reviewer'
  );

  return normalized.length > 0 ? normalized : ['applicant'];
};

export const readLastWorkspace = (): 'applicant' | 'reviewer' | null => {
  const value = localStorage.getItem(LAST_WORKSPACE_STORAGE_KEY);
  return value === 'applicant' || value === 'reviewer' ? value : null;
};

export const writeLastWorkspace = (workspace: 'applicant' | 'reviewer') => {
  localStorage.setItem(LAST_WORKSPACE_STORAGE_KEY, workspace);
};

export const resolvePreferredWorkspace = (
  availableWorkspaces: Array<'applicant' | 'reviewer'>
): 'applicant' | 'reviewer' => {
  const stored = readLastWorkspace();
  return stored && availableWorkspaces.includes(stored) ? stored : 'applicant';
};

export const shouldShowWorkspaceSwitcher = (
  availableWorkspaces: Array<'applicant' | 'reviewer'>
) => availableWorkspaces.length > 1;
```

```ts
// frontend/src/features/auth/authSession.ts
type StoredAuthUser = {
  email?: string;
  primary_role?: string | null;
  available_workspaces?: Array<'applicant' | 'reviewer'>;
};

const AUTH_USER_STORAGE_KEY = 'asiamath.authUser';

export const readStoredAuthUser = (): StoredAuthUser | null => {
  const raw = localStorage.getItem(AUTH_USER_STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as StoredAuthUser;
  } catch {
    localStorage.removeItem(AUTH_USER_STORAGE_KEY);
    return null;
  }
};

export const writeStoredAuthUser = (user: StoredAuthUser) => {
  localStorage.setItem(AUTH_USER_STORAGE_KEY, JSON.stringify(user));
};

export const clearStoredAuthUser = () => {
  localStorage.removeItem(AUTH_USER_STORAGE_KEY);
};
```

```tsx
// frontend/src/features/navigation/WorkspaceSwitcher.tsx
import { useId, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';
import {
  WORKSPACE_ROOTS,
  writeLastWorkspace,
  type WorkspaceKey,
} from './workspaces';

type Props = {
  currentWorkspace: 'applicant' | 'reviewer';
  availableWorkspaces: Array<'applicant' | 'reviewer'>;
};

export function WorkspaceSwitcher({ currentWorkspace, availableWorkspaces }: Props) {
  const navigate = useNavigate();
  const menuId = useId();
  const [open, setOpen] = useState(false);

  return (
    <div className="workspace-switcher">
      <button
        type="button"
        className="workspace-switcher__trigger"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((value) => !value)}
      >
        Workspace
        <ChevronDown size={18} aria-hidden="true" />
      </button>
      {open ? (
        <div id={menuId} className="workspace-switcher__panel" role="menu">
          {availableWorkspaces.map((workspace) => (
            <button
              key={workspace}
              type="button"
              className="workspace-switcher__item"
              data-current={workspace === currentWorkspace}
              onClick={() => {
                writeLastWorkspace(workspace);
                setOpen(false);
                navigate(WORKSPACE_ROOTS[workspace]);
              }}
            >
              {workspace === 'applicant' ? 'Applicant' : 'Reviewer'}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
```

- [ ] **Step 4: Add the shell slot and layout styles**

```tsx
// frontend/src/components/layout/WorkspaceShell.tsx
type Props = {
  eyebrow?: string;
  title?: ReactNode;
  description?: ReactNode;
  badges?: ReactNode;
  actions?: ReactNode;
  workspaceSwitcher?: ReactNode;
  accountMenu?: AccountMenu;
  aside?: ReactNode;
  children: ReactNode;
};

// inside render
{actions || workspaceSwitcher || accountMenu ? (
  <div className="page-shell__actions">
    {actions}
    {workspaceSwitcher}
    {accountMenu ? <WorkspaceAccountMenu menu={accountMenu} /> : null}
  </div>
) : null}
```

```css
/* frontend/src/styles/layout.css */
.workspace-switcher {
  position: relative;
}

.workspace-switcher__trigger {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  min-height: 2.75rem;
  padding: 0.7rem 1rem;
  border: 1px solid var(--border-strong);
  border-radius: var(--radius-pill);
  background: rgba(255, 255, 255, 0.72);
  color: var(--color-navy-900);
  font-weight: 600;
}

.workspace-switcher__panel {
  position: absolute;
  top: calc(100% + 0.6rem);
  right: 0;
  z-index: 20;
  display: grid;
  min-width: 12rem;
  padding: 0.45rem;
  border: 1px solid var(--border-strong);
  border-radius: var(--radius-md);
  background: var(--surface-panel-strong);
  box-shadow: var(--shadow-md);
}

.workspace-switcher__item {
  display: flex;
  align-items: center;
  min-height: 2.6rem;
  border-radius: calc(var(--radius-md) - 6px);
  background: transparent;
  color: var(--color-text);
}
```

- [ ] **Step 5: Re-run the shell test to verify it passes**

Run:

```bash
cd frontend && npm run test:run -- src/components/layout/Shell.test.tsx
```

Expected: PASS with `WorkspaceShell` rendering both switcher and account controls.

- [ ] **Step 6: Commit**

```bash
git add frontend/src/features/navigation/workspaces.ts frontend/src/features/auth/authSession.ts frontend/src/features/navigation/WorkspaceSwitcher.tsx frontend/src/components/layout/WorkspaceShell.tsx frontend/src/styles/layout.css frontend/src/components/layout/Shell.test.tsx
git commit -m "feat: add shared workspace switcher foundation"
```

### Task 3: Auth Entry Restore And Typed Auth Payload

**Files:**
- Modify: `frontend/src/api/auth.ts`
- Modify: `frontend/src/features/navigation/authReturn.ts`
- Modify: `frontend/src/pages/Login.tsx`
- Modify: `frontend/src/pages/Register.tsx`
- Test: `frontend/src/pages/Login.test.tsx`
- Test: `frontend/src/pages/Register.test.tsx`

- [ ] **Step 1: Write failing auth-entry tests**

```tsx
it('routes sign-in to the stored reviewer workspace when no explicit deep-link return is provided', async () => {
  const user = userEvent.setup();
  localStorage.setItem('asiamath.lastWorkspace', 'reviewer');
  loginMock.mockResolvedValue({
    accessToken: 'token-1',
    user: { available_workspaces: ['applicant', 'reviewer'] },
  });

  render(
    <MemoryRouter initialEntries={['/login']}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/reviewer" element={<DestinationProbe label="Reviewer destination" />} />
      </Routes>
    </MemoryRouter>
  );

  await user.type(screen.getByPlaceholderText('Email Address'), 'reviewer@example.com');
  await user.type(screen.getByPlaceholderText('Password'), 'secret123');
  await user.click(screen.getByRole('button', { name: 'Sign In' }));

  expect(await screen.findByText('Reviewer destination')).toBeInTheDocument();
});

it('keeps an explicit protected-route return target ahead of the stored workspace', async () => {
  const user = userEvent.setup();
  localStorage.setItem('asiamath.lastWorkspace', 'reviewer');
  loginMock.mockResolvedValue({
    accessToken: 'token-1',
    user: { available_workspaces: ['applicant', 'reviewer'] },
  });

  render(
    <MemoryRouter initialEntries={[{ pathname: '/login', state: { returnTo: '/me/profile' } }]}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/me/profile" element={<DestinationProbe label="Profile destination" />} />
      </Routes>
    </MemoryRouter>
  );

  await user.type(screen.getByPlaceholderText('Email Address'), 'reviewer@example.com');
  await user.type(screen.getByPlaceholderText('Password'), 'secret123');
  await user.click(screen.getByRole('button', { name: 'Sign In' }));

  expect(await screen.findByText('Profile destination')).toBeInTheDocument();
});
```

- [ ] **Step 2: Run the auth page tests to verify they fail**

Run:

```bash
cd frontend && npm run test:run -- src/pages/Login.test.tsx src/pages/Register.test.tsx
```

Expected: FAIL because login/register do not inspect `available_workspaces` and always navigate to the plain `returnTo` fallback.

- [ ] **Step 3: Add typed auth payloads and destination resolver**

```ts
// frontend/src/api/auth.ts
export type AuthWorkspace = 'applicant' | 'reviewer';

export type AuthUser = {
  id?: string;
  email: string;
  status?: string;
  available_workspaces?: AuthWorkspace[];
};

export type AuthResponse = {
  accessToken: string;
  user: AuthUser;
};

export const login = async (data: { email: string; password: string }): Promise<AuthResponse> => {
  const response = await api.post('/auth/login', data);
  return response.data;
};
```

```ts
// frontend/src/features/navigation/authReturn.ts
import {
  WORKSPACE_ROOTS,
  normalizeAvailableWorkspaces,
  resolvePreferredWorkspace,
} from './workspaces';

export const resolvePostAuthDestination = (
  state: unknown,
  availableWorkspacesInput: unknown
) => {
  const requested = readReturnTo(state);
  if (requested !== DEFAULT_AUTH_RETURN_TO) {
    return requested;
  }

  const availableWorkspaces = normalizeAvailableWorkspaces(availableWorkspacesInput);
  const preferredWorkspace = resolvePreferredWorkspace(availableWorkspaces);
  return WORKSPACE_ROOTS[preferredWorkspace];
};
```

- [ ] **Step 4: Persist the auth user and use the resolver in Login and Register**

```tsx
// frontend/src/pages/Login.tsx
import { writeStoredAuthUser } from '../features/auth/authSession';

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setError('');
  setLoading(true);

  try {
    const data = await login({ email, password });
    localStorage.setItem('token', data.accessToken);
    writeStoredAuthUser(data.user);
    navigate(resolvePostAuthDestination(location.state, data.user.available_workspaces));
  } catch (err: any) {
    setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
  } finally {
    setLoading(false);
  }
};
```

Apply the same `writeStoredAuthUser` call and destination resolver in `Register.tsx`.

- [ ] **Step 5: Re-run the auth page tests to verify they pass**

Run:

```bash
cd frontend && npm run test:run -- src/pages/Login.test.tsx src/pages/Register.test.tsx
```

Expected: PASS with explicit return targets preserved, generic auth entry restoring the last valid workspace, and the auth user cached locally.

- [ ] **Step 6: Commit**

```bash
git add frontend/src/api/auth.ts frontend/src/features/navigation/authReturn.ts frontend/src/pages/Login.tsx frontend/src/pages/Register.tsx frontend/src/pages/Login.test.tsx frontend/src/pages/Register.test.tsx
git commit -m "feat: restore last workspace after auth"
```

### Task 4: Applicant Workspace Rollout

**Files:**
- Modify: `frontend/src/pages/Dashboard.tsx`
- Modify: `frontend/src/pages/MyApplications.tsx`
- Modify: `frontend/src/pages/MyApplicationDetail.tsx`
- Modify: `frontend/src/pages/MeProfile.tsx`
- Test: `frontend/src/pages/Dashboard.test.tsx`
- Test: `frontend/src/pages/MyApplications.test.tsx`
- Test: `frontend/src/pages/MyApplicationDetail.test.tsx`
- Test: `frontend/src/pages/MeProfile.test.tsx`

- [ ] **Step 1: Write failing applicant-workspace tests**

```tsx
it('shows a workspace switcher on the dashboard when applicant and reviewer workspaces are both available', async () => {
  localStorage.setItem('token', 'dashboard-token');
  mockedGetMe.mockResolvedValue({
    user: {
      email: 'demo.reviewer@asiamath.org',
      status: 'active',
      role: 'reviewer',
      primary_role: 'reviewer',
      available_workspaces: ['applicant', 'reviewer'],
    },
  });

  renderWithRouter(<Dashboard />, '/dashboard', '/dashboard');

  expect(await screen.findByRole('button', { name: 'Workspace' })).toBeInTheDocument();
  expect(screen.getByRole('link', { name: /browse opportunities/i })).toHaveAttribute(
    'href',
    '/opportunities'
  );
  expect(screen.queryByRole('link', { name: /open reviewer queue/i })).not.toBeInTheDocument();
});
```

```tsx
it('shows the workspace switcher on applicant secondary pages for multi-workspace users', async () => {
  localStorage.setItem('token', 'dashboard-token');
  localStorage.setItem(
    'asiamath.authUser',
    JSON.stringify({ available_workspaces: ['applicant', 'reviewer'] })
  );
  renderWithRouter(<MyApplications />, '/me/applications', '/me/applications');

  expect(await screen.findByRole('button', { name: 'Workspace' })).toBeInTheDocument();
});
```

- [ ] **Step 2: Run the applicant page tests to verify they fail**

Run:

```bash
cd frontend && npm run test:run -- src/pages/Dashboard.test.tsx src/pages/MyApplications.test.tsx src/pages/MyApplicationDetail.test.tsx src/pages/MeProfile.test.tsx
```

Expected: FAIL because applicant pages do not yet receive or render a workspace switcher, and dashboard still shows reviewer landing content when `primary_role` is reviewer.

- [ ] **Step 3: Inject workspace availability and applicant-root behavior**

```tsx
// frontend/src/pages/Dashboard.tsx
import { WorkspaceSwitcher } from '../features/navigation/WorkspaceSwitcher';
import {
  normalizeAvailableWorkspaces,
  shouldShowWorkspaceSwitcher,
} from '../features/navigation/workspaces';

type DashboardData = {
  user?: {
    email?: string | null;
    status?: string | null;
    role?: WorkspaceRole | null;
    primary_role?: WorkspaceRole | null;
    conference_staff_memberships?: Array<{
      conference_id?: string | null;
      staff_role?: string | null;
    }> | null;
    available_workspaces?: Array<'applicant' | 'reviewer'> | null;
  };
};

const availableWorkspaces = normalizeAvailableWorkspaces(userData?.user?.available_workspaces);
const shouldRenderWorkspaceSwitcher = shouldShowWorkspaceSwitcher(availableWorkspaces);
const shellWorkspace =
  shouldRenderWorkspaceSwitcher && availableWorkspaces.includes('applicant')
    ? 'applicant'
    : readWorkspaceRole(userData?.user);

const workspaceSwitcher = shouldRenderWorkspaceSwitcher ? (
  <WorkspaceSwitcher currentWorkspace="applicant" availableWorkspaces={availableWorkspaces} />
) : null;
```

Use `shellWorkspace` instead of blindly treating a reviewer-enabled account as a reviewer landing when rendering `/dashboard`. Keep the existing organizer/admin branches unchanged.

Also refresh the stored auth user after `getMe` succeeds:

```tsx
// frontend/src/pages/Dashboard.tsx
import { writeStoredAuthUser } from '../features/auth/authSession';

const meResult = await getMe(token);
writeStoredAuthUser(meResult.user);
setUserData(meResult);
```

```tsx
// frontend/src/pages/MyApplications.tsx
import { readStoredAuthUser } from '../features/auth/authSession';

const storedAuthUser = readStoredAuthUser();
const availableWorkspaces = normalizeAvailableWorkspaces(storedAuthUser?.available_workspaces);
const workspaceSwitcher = shouldShowWorkspaceSwitcher(availableWorkspaces) ? (
  <WorkspaceSwitcher currentWorkspace="applicant" availableWorkspaces={availableWorkspaces} />
) : null;

<WorkspaceShell
  eyebrow="Applicant workspace"
  title="My applications"
  description="Conference and travel grant applications you've started or submitted."
  workspaceSwitcher={workspaceSwitcher}
  accountMenu={accountMenu}
/>
```

Apply the same switcher injection to `MyApplicationDetail.tsx` and `MeProfile.tsx`, always with `currentWorkspace="applicant"`.

Update applicant-page logout and unauthorized cleanup at the same time:

```tsx
import { clearStoredAuthUser } from '../features/auth/authSession';

const accountMenu = buildWorkspaceAccountMenu(() => {
  clearStoredAuthUser();
  localStorage.removeItem('token');
  navigate('/portal');
});

if (isUnauthorizedSessionError(error)) {
  clearStoredAuthUser();
  localStorage.removeItem('token');
  navigate('/login', { state: toReturnToState(location.pathname) });
  return;
}
```

- [ ] **Step 4: Re-run the applicant page tests to verify they pass**

Run:

```bash
cd frontend && npm run test:run -- src/pages/Dashboard.test.tsx src/pages/MyApplications.test.tsx src/pages/MyApplicationDetail.test.tsx src/pages/MeProfile.test.tsx
```

Expected: PASS with applicant pages showing the switcher for multi-workspace users and dashboard preserving applicant-specific IA such as `Browse opportunities`.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/pages/Dashboard.tsx frontend/src/pages/MyApplications.tsx frontend/src/pages/MyApplicationDetail.tsx frontend/src/pages/MeProfile.tsx frontend/src/pages/Dashboard.test.tsx frontend/src/pages/MyApplications.test.tsx frontend/src/pages/MyApplicationDetail.test.tsx frontend/src/pages/MeProfile.test.tsx
git commit -m "feat: add workspace switcher to applicant pages"
```

### Task 5: Reviewer Workspace Rollout

**Files:**
- Modify: `frontend/src/pages/ReviewerAssignments.tsx`
- Modify: `frontend/src/pages/ReviewerAssignmentDetail.tsx`
- Test: `frontend/src/pages/ReviewWorkspaces.test.tsx`

- [ ] **Step 1: Write failing reviewer-workspace tests**

```tsx
it('shows the workspace switcher on the reviewer queue for multi-workspace users', async () => {
  localStorage.setItem('token', 'reviewer-1');
  localStorage.setItem(
    'asiamath.authUser',
    JSON.stringify({ available_workspaces: ['applicant', 'reviewer'] })
  );

  render(
    <MemoryRouter initialEntries={[{ pathname: '/reviewer', state: { returnContext: { to: '/dashboard', label: 'Back to dashboard' } } }]}>
      <Routes>
        <Route path="/reviewer" element={<ReviewerAssignments />} />
      </Routes>
    </MemoryRouter>
  );

  expect(await screen.findByRole('button', { name: 'Workspace' })).toBeInTheDocument();
  expect(screen.queryByRole('link', { name: /browse opportunities/i })).not.toBeInTheDocument();
});

it('shows the workspace switcher on reviewer detail pages', async () => {
  localStorage.setItem('token', 'reviewer-1');
  localStorage.setItem(
    'asiamath.authUser',
    JSON.stringify({ available_workspaces: ['applicant', 'reviewer'] })
  );
  const assignmentId = seedReviewAssignment({
    applicationId: 'review-application-1',
    reviewerUserId: 'reviewer-1',
    conflictState: 'clear',
  });

  render(
    <MemoryRouter initialEntries={[{ pathname: `/reviewer/assignments/${assignmentId}`, state: { returnContext: { to: '/reviewer', label: 'Back to reviewer queue' } } }]}>
      <Routes>
        <Route path="/reviewer/assignments/:id" element={<ReviewerAssignmentDetail />} />
      </Routes>
    </MemoryRouter>
  );

  expect(await screen.findByRole('button', { name: 'Workspace' })).toBeInTheDocument();
});
```

- [ ] **Step 2: Run the reviewer workspace test to verify it fails**

Run:

```bash
cd frontend && npm run test:run -- src/pages/ReviewWorkspaces.test.tsx
```

Expected: FAIL because reviewer pages do not yet render a workspace switcher.

- [ ] **Step 3: Inject the switcher into reviewer root and detail pages**

```tsx
// frontend/src/pages/ReviewerAssignments.tsx
import { WorkspaceSwitcher } from '../features/navigation/WorkspaceSwitcher';
import {
  normalizeAvailableWorkspaces,
  shouldShowWorkspaceSwitcher,
} from '../features/navigation/workspaces';
import { readStoredAuthUser } from '../features/auth/authSession';

const storedAuthUser = readStoredAuthUser();
const availableWorkspaces = normalizeAvailableWorkspaces(storedAuthUser?.available_workspaces);
const workspaceSwitcher = shouldShowWorkspaceSwitcher(availableWorkspaces) ? (
  <WorkspaceSwitcher currentWorkspace="reviewer" availableWorkspaces={availableWorkspaces} />
) : null;

<WorkspaceShell
  eyebrow="Reviewer workspace"
  title="Reviewer queue"
  description="Assigned tasks only. Conflict-flagged tasks remain visible but blocked from submission."
  workspaceSwitcher={workspaceSwitcher}
  accountMenu={accountMenu}
/>
```

Update reviewer-page logout cleanup in the same step:

```tsx
import { clearStoredAuthUser } from '../features/auth/authSession';

const accountMenu = buildWorkspaceAccountMenu({
  role: 'reviewer',
  onLogout: () => {
    clearStoredAuthUser();
    localStorage.removeItem('token');
    navigate('/portal');
  },
});
```

```tsx
// frontend/src/pages/ReviewerAssignmentDetail.tsx
const storedAuthUser = readStoredAuthUser();
const availableWorkspaces = normalizeAvailableWorkspaces(storedAuthUser?.available_workspaces);
const workspaceSwitcher = shouldShowWorkspaceSwitcher(availableWorkspaces) ? (
  <WorkspaceSwitcher currentWorkspace="reviewer" availableWorkspaces={availableWorkspaces} />
) : null;

<WorkspaceShell
  eyebrow="Reviewer workspace"
  title="Review assignment"
  description="Reviewer scope only includes assigned materials and the review action allowed by conflict state."
  workspaceSwitcher={workspaceSwitcher}
  accountMenu={accountMenu}
/>
```

- [ ] **Step 4: Re-run the reviewer workspace test to verify it passes**

Run:

```bash
cd frontend && npm run test:run -- src/pages/ReviewWorkspaces.test.tsx
```

Expected: PASS with switcher access on reviewer root and reviewer detail pages, and no `Browse opportunities` action.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/pages/ReviewerAssignments.tsx frontend/src/pages/ReviewerAssignmentDetail.tsx frontend/src/pages/ReviewWorkspaces.test.tsx
git commit -m "feat: add workspace switcher to reviewer pages"
```

### Task 6: Final Regression And Handoff

**Files:**
- Modify: `PROGRESS.md`
- Test: `backend/tests/auth.test.ts`
- Test: `frontend/src/components/layout/Shell.test.tsx`
- Test: `frontend/src/pages/Login.test.tsx`
- Test: `frontend/src/pages/Register.test.tsx`
- Test: `frontend/src/pages/Dashboard.test.tsx`
- Test: `frontend/src/pages/MyApplications.test.tsx`
- Test: `frontend/src/pages/MyApplicationDetail.test.tsx`
- Test: `frontend/src/pages/MeProfile.test.tsx`
- Test: `frontend/src/pages/ReviewWorkspaces.test.tsx`

- [ ] **Step 1: Append the progress log entry**

```md
### 2026-04-29 (Session 47)
*   **Agent 角色**: Coding Agent (applicant/reviewer workspace switcher rollout)
*   **变更记录**:
    *   auth payloads now include `available_workspaces`
    *   login/register now restore the last valid workspace
    *   applicant/reviewer pages now expose a shared header workspace switcher when the account has both workspaces
    *   applicant keeps `Browse opportunities`; reviewer does not
*   **验证记录**:
    *   backend auth contract test
    *   frontend shell/auth/dashboard/applicant/reviewer targeted regressions
    *   frontend build
```

- [ ] **Step 2: Run backend auth regression**

Run:

```bash
cd backend && DATABASE_URL="$TEST_DATABASE_URL" ../node_modules/.bin/jest --runInBand tests/auth.test.ts
```

Expected: PASS

- [ ] **Step 3: Run focused frontend regression**

Run:

```bash
cd frontend && npm run test:run -- src/components/layout/Shell.test.tsx src/pages/Login.test.tsx src/pages/Register.test.tsx src/pages/Dashboard.test.tsx src/pages/MyApplications.test.tsx src/pages/MyApplicationDetail.test.tsx src/pages/MeProfile.test.tsx src/pages/ReviewWorkspaces.test.tsx
```

Expected: PASS

- [ ] **Step 4: Run the frontend build**

Run:

```bash
cd frontend && npm run build
```

Expected: PASS, with only the pre-existing chunk-size warning if it is still present.

- [ ] **Step 5: Commit**

```bash
git add PROGRESS.md
git commit -m "docs: record workspace switcher rollout"
```

## Self-Review

- Spec coverage:
  - backend `available_workspaces` contract is covered in Task 1
  - shared switcher slot and helper layer are covered in Task 2
  - post-auth last-workspace restore is covered in Task 3
  - applicant root behavior and applicant-only `Browse opportunities` are covered in Task 4
  - reviewer header rollout and reviewer-no-browse IA are covered in Task 5
  - handoff logging and verification are covered in Task 6
- Placeholder scan:
  - no `TODO` / `TBD` placeholders remain
  - each task has explicit files, test snippets, commands, and expected results
- Type consistency:
  - workspace values stay limited to `'applicant' | 'reviewer'` throughout the implementation tasks
  - the shared localStorage key and root-route mapping are introduced once in `workspaces.ts` and reused elsewhere
