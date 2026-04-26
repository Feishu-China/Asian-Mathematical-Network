# Account Menu And Auth Return Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Repair the clean-worktree account-menu baseline and finish the applicant account-navigation flow so public pages, workspace pages, and auth pages follow one coherent `Account` and `returnTo` model.

**Architecture:** Keep the change in the frontend and keep it narrow. Introduce one shared account-navigation definition and one small auth-return helper, then let `PublicPortalNav` and `WorkspaceShell` render that shared IA in shell-specific ways. Finish the rollout only across applicant-owned surfaces, leaving reviewer / organizer / admin menus out of scope.

**Tech Stack:** React 19, React Router 7, TypeScript, Vite, Vitest, React Testing Library, user-event, global CSS

---

## File Structure

- `frontend/src/features/navigation/accountMenu.ts`
  New shared account-navigation source of truth for applicant account destinations and logout action shape.
- `frontend/src/features/navigation/authReturn.ts`
  New helper for reading, preserving, and emitting `returnTo` state across login, register, and protected routes.
- `frontend/src/components/layout/WorkspaceShell.tsx`
  Commits and finalizes the optional workspace `accountMenu` contract expected by `Shell.test.tsx`.
- `frontend/src/components/layout/Shell.test.tsx`
  Locks the shared workspace account menu contract.
- `frontend/src/components/layout/PublicPortalNav.tsx`
  Switches public account links to the shared account IA and changes logout to stay on the current public route.
- `frontend/src/components/layout/PublicPortalNav.test.tsx`
  Locks the signed-in / signed-out public nav behavior.
- `frontend/src/styles/layout.css`
  Keeps the workspace account-menu styling in the shared shell layer.
- `frontend/src/pages/Login.tsx`
  Reads `returnTo` through the shared helper and preserves it when linking to register.
- `frontend/src/pages/Register.tsx`
  Reads `returnTo` through the shared helper and preserves it when linking to login.
- `frontend/src/pages/Login.test.tsx`
  Locks public-origin login return behavior.
- `frontend/src/pages/Register.test.tsx`
  Locks public-origin register return behavior.
- `frontend/src/pages/Dashboard.tsx`
  Uses the finalized workspace account menu and keeps workspace logout returning to `/portal`.
- `frontend/src/pages/Dashboard.test.tsx`
  Locks workspace logout through the shared menu.
- `frontend/src/pages/MyApplications.tsx`
  Uses the shared workspace account menu and redirects unauthenticated users to login with `returnTo`.
- `frontend/src/pages/MyApplications.test.tsx`
  Locks protected-route redirect behavior and existing page rendering.
- `frontend/src/pages/MyApplicationDetail.tsx`
  Uses the shared workspace account menu and redirects unauthenticated users to login with `returnTo`.
- `frontend/src/pages/MyApplicationDetail.test.tsx`
  Locks protected detail-route redirect behavior.
- `frontend/src/pages/MeProfile.tsx`
  Uses the shared workspace account menu and formalizes unauthenticated handling with `returnTo`.
- `frontend/src/pages/ConferenceApply.tsx`
  Reuses shared account menu for signed-in applicant mode and sends signed-out users to login with `returnTo`.
- `frontend/src/pages/ConferenceApply.test.tsx`
  Locks protected conference-apply auth entry behavior.
- `frontend/src/pages/GrantApply.tsx`
  Reuses shared account menu for signed-in applicant mode and sends signed-out users to login with `returnTo`.
- `frontend/src/pages/GrantApply.test.tsx`
  Locks protected grant-apply auth entry behavior.
- `PROGRESS.md`
  Records the finished baseline repair and rollout once implementation is complete.

## Task 1: Reproduce The Baseline Break And Lock The Desired Contracts

**Files:**
- Modify: `frontend/src/components/layout/Shell.test.tsx`
- Modify: `frontend/src/components/layout/PublicPortalNav.test.tsx`
- Test: `frontend/src/components/layout/Shell.test.tsx`
- Test: `frontend/src/components/layout/PublicPortalNav.test.tsx`

- [ ] **Step 1: Confirm the clean-worktree baseline failure in an isolated worktree**

Run:

```bash
cd frontend && npm run build
```

Expected:

- clean worktree fails because `Shell.test.tsx` already passes `accountMenu` to `WorkspaceShell`
- the committed `WorkspaceShell` contract does not yet accept that prop

- [ ] **Step 2: Add or refine failing tests for the final shell behavior**

Cover these expectations:

- `WorkspaceShell` accepts `accountMenu` and renders the trigger plus link/action items
- authenticated `PublicPortalNav` shows `Account` instead of `Sign in`
- logging out from the public nav keeps the visitor on the same public route and only flips the masthead back to signed-out state

- [ ] **Step 3: Run the targeted shell tests and verify the failure shape**

Run:

```bash
cd frontend && npm run test:run -- src/components/layout/Shell.test.tsx src/components/layout/PublicPortalNav.test.tsx
```

Expected:

- `Shell.test.tsx` fails against the missing `accountMenu` contract before implementation
- any new public-nav logout expectation fails because current logout still navigates to `/portal`

- [ ] **Step 4: Commit checkpoint after the tests are green later**

```bash
git add frontend/src/components/layout/Shell.test.tsx frontend/src/components/layout/PublicPortalNav.test.tsx
git commit -m "test: lock account menu shell contracts"
```

## Task 2: Introduce Shared Account And Auth-Return Helpers

**Files:**
- Create: `frontend/src/features/navigation/accountMenu.ts`
- Create: `frontend/src/features/navigation/authReturn.ts`
- Modify: `frontend/src/components/layout/WorkspaceShell.tsx`
- Modify: `frontend/src/components/layout/PublicPortalNav.tsx`
- Modify: `frontend/src/styles/layout.css`
- Modify: `frontend/src/pages/Login.tsx`
- Modify: `frontend/src/pages/Register.tsx`
- Test: `frontend/src/components/layout/Shell.test.tsx`
- Test: `frontend/src/components/layout/PublicPortalNav.test.tsx`
- Test: `frontend/src/pages/Login.test.tsx`
- Test: `frontend/src/pages/Register.test.tsx`

- [ ] **Step 1: Write failing auth-return tests before touching the implementation**

Cover these expectations:

- `Login` returns to the `returnTo` route supplied by location state
- `Register` returns to the `returnTo` route supplied by location state
- switching between login and register preserves `returnTo`

- [ ] **Step 2: Run the auth tests and verify they fail only where behavior is still missing**

Run:

```bash
cd frontend && npm run test:run -- src/pages/Login.test.tsx src/pages/Register.test.tsx
```

Expected:

- tests fail only on missing shared-hand-off behavior, not on unrelated runtime errors

- [ ] **Step 3: Create the shared account helper**

Implementation target:

- one exported applicant account link list
- one exported item builder that appends `Log out`
- one shared item type that both public nav and workspace shell can consume without importing types out of a layout component

- [ ] **Step 4: Create the shared auth-return helper**

Implementation target:

- a reader for `returnTo` from location state with a fallback
- a helper for emitting `{ returnTo }` state on auth-entry links
- no routing side effects in the helper itself

- [ ] **Step 5: Finalize the shell implementations**

Implementation target:

- `WorkspaceShell` accepts and renders the optional `accountMenu`
- `PublicPortalNav` consumes the shared applicant account items
- public-shell logout only clears session state, closes menus, and keeps the current public route
- `layout.css` remains the single place for workspace account-menu styling

- [ ] **Step 6: Switch `Login` and `Register` to the shared auth-return helper**

Implementation target:

- both pages read `returnTo` through one helper
- both footer cross-links preserve `returnTo`
- default fallback remains `/dashboard` unless a caller passed a more specific destination

- [ ] **Step 7: Re-run the focused tests and verify they pass**

Run:

```bash
cd frontend && npm run test:run -- src/components/layout/Shell.test.tsx src/components/layout/PublicPortalNav.test.tsx src/pages/Login.test.tsx src/pages/Register.test.tsx
```

Expected:

- all four files pass

- [ ] **Step 8: Commit**

```bash
git add frontend/src/features/navigation/accountMenu.ts frontend/src/features/navigation/authReturn.ts frontend/src/components/layout/WorkspaceShell.tsx frontend/src/components/layout/PublicPortalNav.tsx frontend/src/styles/layout.css frontend/src/pages/Login.tsx frontend/src/pages/Register.tsx frontend/src/pages/Login.test.tsx frontend/src/pages/Register.test.tsx
git commit -m "feat: unify account menu and auth return helpers"
```

## Task 3: Roll The Shared Account Menu Across Applicant Workspace Surfaces

**Files:**
- Modify: `frontend/src/pages/Dashboard.tsx`
- Modify: `frontend/src/pages/MyApplications.tsx`
- Modify: `frontend/src/pages/MyApplicationDetail.tsx`
- Modify: `frontend/src/pages/MeProfile.tsx`
- Modify: `frontend/src/pages/ConferenceApply.tsx`
- Modify: `frontend/src/pages/GrantApply.tsx`
- Modify: `frontend/src/features/navigation/workspaceAccountMenu.ts`
- Modify: `frontend/src/styles/components.css`
- Test: `frontend/src/pages/Dashboard.test.tsx`
- Test: `frontend/src/pages/MyApplications.test.tsx`
- Test: `frontend/src/pages/MyApplicationDetail.test.tsx`
- Test: `frontend/src/pages/ConferenceApply.test.tsx`
- Test: `frontend/src/pages/GrantApply.test.tsx`

- [ ] **Step 1: Add failing tests for applicant-surface account access and protected auth entry**

Minimum expectations:

- workspace logout from `Dashboard` clears the token and lands on `/portal`
- unauthenticated `MyApplications` redirects to `Login` with `returnTo`
- unauthenticated `MyApplicationDetail` redirects to `Login` with `returnTo`
- signed-out `ConferenceApply` and `GrantApply` render login CTA links that include `returnTo`

- [ ] **Step 2: Run the applicant-surface tests and verify the current gaps**

Run:

```bash
cd frontend && npm run test:run -- src/pages/Dashboard.test.tsx src/pages/MyApplications.test.tsx src/pages/MyApplicationDetail.test.tsx src/pages/ConferenceApply.test.tsx src/pages/GrantApply.test.tsx
```

Expected:

- at least the new auth-entry assertions fail before implementation

- [ ] **Step 3: Refine the applicant workspace account-menu builder**

Implementation target:

- `workspaceAccountMenu.ts` becomes a thin adapter over the shared applicant account items
- applicant pages stop hardcoding their own account links

- [ ] **Step 4: Attach the shared workspace account menu to all applicant-owned `WorkspaceShell` pages**

Implementation target:

- `Dashboard`
- `MyApplications`
- `MyApplicationDetail`
- `MeProfile`
- signed-in `ConferenceApply`
- signed-in `GrantApply`

- [ ] **Step 5: Remove remaining page-local logout affordances**

Implementation target:

- keep logout reachable only through the shared workspace account menu on applicant pages
- remove any stale dashboard-only button styling that becomes unused

- [ ] **Step 6: Re-run the applicant-surface tests and verify they pass**

Run:

```bash
cd frontend && npm run test:run -- src/pages/Dashboard.test.tsx src/pages/MyApplications.test.tsx src/pages/MyApplicationDetail.test.tsx src/pages/ConferenceApply.test.tsx src/pages/GrantApply.test.tsx
```

Expected:

- all targeted applicant-route tests pass

- [ ] **Step 7: Commit**

```bash
git add frontend/src/pages/Dashboard.tsx frontend/src/pages/MyApplications.tsx frontend/src/pages/MyApplicationDetail.tsx frontend/src/pages/MeProfile.tsx frontend/src/pages/ConferenceApply.tsx frontend/src/pages/GrantApply.tsx frontend/src/features/navigation/workspaceAccountMenu.ts frontend/src/styles/components.css frontend/src/pages/Dashboard.test.tsx frontend/src/pages/MyApplications.test.tsx frontend/src/pages/MyApplicationDetail.test.tsx frontend/src/pages/ConferenceApply.test.tsx frontend/src/pages/GrantApply.test.tsx
git commit -m "feat: extend applicant account menu across workspace routes"
```

## Task 4: Formalize Protected-Route ReturnTo Handling

**Files:**
- Modify: `frontend/src/pages/Dashboard.tsx`
- Modify: `frontend/src/pages/MyApplications.tsx`
- Modify: `frontend/src/pages/MyApplicationDetail.tsx`
- Modify: `frontend/src/pages/MeProfile.tsx`
- Modify: `frontend/src/pages/ConferenceApply.tsx`
- Modify: `frontend/src/pages/GrantApply.tsx`
- Test: `frontend/src/pages/MyApplications.test.tsx`
- Test: `frontend/src/pages/MyApplicationDetail.test.tsx`
- Test: `frontend/src/pages/ConferenceApply.test.tsx`
- Test: `frontend/src/pages/GrantApply.test.tsx`

- [ ] **Step 1: Replace raw `/login` redirects and links with shared `returnTo` helpers**

Implementation target:

- protected route redirects should use the current pathname as the destination fallback
- apply-page login CTA links should preserve the full target route
- workspace routes should stop calling `navigate('/login')` without state

- [ ] **Step 2: Add the missing profile-route protection if needed**

Implementation target:

- `MeProfile` should behave like a protected applicant route
- unauthenticated entry should not silently proceed into provider load failures when a deterministic login redirect is possible

- [ ] **Step 3: Run the protected-route regression suite**

Run:

```bash
cd frontend && npm run test:run -- src/pages/Login.test.tsx src/pages/Register.test.tsx src/pages/MyApplications.test.tsx src/pages/MyApplicationDetail.test.tsx src/pages/ConferenceApply.test.tsx src/pages/GrantApply.test.tsx
```

Expected:

- public-origin auth returns still pass
- protected applicant routes now preserve `returnTo`

- [ ] **Step 4: Commit**

```bash
git add frontend/src/pages/Dashboard.tsx frontend/src/pages/MyApplications.tsx frontend/src/pages/MyApplicationDetail.tsx frontend/src/pages/MeProfile.tsx frontend/src/pages/ConferenceApply.tsx frontend/src/pages/GrantApply.tsx
git commit -m "feat: preserve return targets across applicant auth entry"
```

## Task 5: Full Verification And Handoff

**Files:**
- Modify: `PROGRESS.md`

- [ ] **Step 1: Run the full targeted frontend regression for this slice**

Run:

```bash
cd frontend && npm run test:run -- src/components/layout/Shell.test.tsx src/components/layout/PublicPortalNav.test.tsx src/pages/Login.test.tsx src/pages/Register.test.tsx src/pages/Dashboard.test.tsx src/pages/MyApplications.test.tsx src/pages/MyApplicationDetail.test.tsx src/pages/ConferenceApply.test.tsx src/pages/GrantApply.test.tsx
```

Expected:

- all targeted tests pass

- [ ] **Step 2: Run build verification in the clean worktree**

Run:

```bash
cd frontend && npm run build
```

Expected:

- `tsc -b && vite build` passes
- the previous clean-worktree `WorkspaceShell/accountMenu` blocker is gone

- [ ] **Step 3: Run browser-level acceptance for the critical flows**

Check at minimum:

- signed-in public route shows `Account` and logout keeps the user on the current public page
- signed-out public route shows `Sign in`
- workspace `Account` menu appears on `Dashboard` and `My Applications`
- logging out from workspace lands on `/portal`
- public `Login` and `Register` still return to the originating route

- [ ] **Step 4: Update `PROGRESS.md`**

Record:

- the baseline blocker that was fixed
- the shared account IA decision
- the applicant-route rollout
- the verification commands and browser checks

- [ ] **Step 5: Commit**

```bash
git add PROGRESS.md
git commit -m "docs: record account menu auth return completion"
```

## Self-Review

- Spec coverage check:
  - shared account IA is covered by Tasks 2 and 3
  - public-shell logout behavior is covered by Tasks 1, 2, and 5
  - workspace logout behavior is covered by Tasks 3 and 5
  - protected-route `returnTo` handling is covered by Task 4
  - clean-worktree build recovery is covered by Tasks 1 and 5
- Placeholder scan:
  - no `TODO` / `TBD` placeholders remain
  - every task names exact files and concrete verification commands
- Type consistency:
  - shared item types are defined in the feature layer before shell consumers are updated
  - auth-return parsing is centralized before page-level redirects and links are rewritten
