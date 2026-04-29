# Account Menu And Auth Return Design

Date: 2026-04-27
Status: Draft for review
Type: Incremental addendum for workspace account navigation and auth return flow

References:
- `docs/superpowers/plans/2026-04-26-account-menu-implementation.md`
- `docs/superpowers/specs/2026-04-27-public-page-visual-unification-design.md`
- `frontend/src/components/layout/Shell.test.tsx`
- `frontend/src/components/layout/PublicPortalNav.tsx`
- `frontend/src/components/layout/WorkspaceShell.tsx`

## 1. Purpose

This addendum defines how the product should expose authenticated account navigation across the public shell and applicant workspace, and how login and registration should return users to the correct place.

It also resolves a current baseline problem:

- the committed shell test already expects `WorkspaceShell` to support `accountMenu`
- the matching implementation is still only present as local uncommitted work
- clean worktrees therefore fail before unrelated work can begin

The goal of this slice is not just to "make the build green again". It is to make the account-navigation model coherent enough to keep as a product pattern.

## 2. Current Problem

The current product state has three separate issues:

1. `PublicPortalNav` already has a signed-in `Account` dropdown for public pages.
2. `WorkspaceShell` does not have a committed shared account menu, even though `Shell.test.tsx` already expects it.
3. Login and registration now partially support `returnTo`, but the rules are not yet defined as a deliberate product behavior.

This creates two kinds of debt:

- **baseline engineering debt**
  Clean worktrees fail because the committed test contract and committed implementation are out of sync.
- **interaction debt**
  Public pages, workspace pages, and auth pages all touch account navigation, but they do not yet share one explicit information architecture.

## 3. Core Decision

The product should use **one shared account information architecture**, but **two shell-specific presentations**.

That means:

1. Public pages and applicant workspace pages should expose the same account destinations.
2. `PublicPortalNav` and `WorkspaceShell` should still render account access in ways that fit their own shells.
3. This slice should unify account structure and auth-return behavior, not force a single visual dropdown component across every shell.

This is the preferred middle path between:

- a narrow patch that merely commits the current local changes
- an over-designed global menu abstraction that tries to solve every future role and shell in one pass

## 4. In Scope

This slice covers three areas.

### 4.1 Shared account IA

The following destinations and session action are in scope for the authenticated applicant account menu:

- `My Applications`
- `My Profile`
- `Log out`

### 4.2 Applicant-owned authenticated surfaces

The account menu should be available across the applicant-facing workspace surfaces, not only on the dashboard:

- `/dashboard`
- `/me/applications`
- `/me/applications/:id`
- `/me/profile`
- `/conferences/:slug/apply`
- `/grants/:slug/apply`

These routes all represent the applicant's working context and should not each invent separate account access.

### 4.3 Auth return flow

This slice also covers:

- login opened from public pages
- registration opened from public pages
- auth prompts triggered by protected applicant routes
- the `Login` ⇄ `Register` handoff while preserving return destination

## 5. Out Of Scope

This addendum does not include:

- reviewer account menus
- organizer account menus
- admin account menus
- redesign of public masthead visuals
- redesign of workspace shell visuals
- backend auth contract changes
- broader public-page visual unification work

This is a navigation and flow-coherence slice, not a full auth-system redesign.

## 6. UX Rules

### 6.1 Shared account structure

When an applicant is signed in, both public and applicant-facing shells should expose the same three account outcomes:

- `My Applications`
- `My Profile`
- `Log out`

The wording should remain stable across shells so users do not have to re-learn where core account actions live.

### 6.2 Public-shell logout behavior

When a signed-in user logs out from a public page through `PublicPortalNav`, the product should:

- clear the session token
- remain on the current public route when possible
- re-render the public masthead in its signed-out state

The user should not be forcibly bounced to `/portal` just because they left a session while browsing a public route.

### 6.3 Workspace logout behavior

When a signed-in user logs out from an applicant workspace surface, the product should:

- clear the session token
- exit the authenticated workspace
- land on `/portal`

This gives a stable public landing point after leaving a protected work surface.

### 6.4 Protected-route auth entry

When an unauthenticated user attempts to enter an applicant-owned protected route, the product should redirect to `Login` and preserve the intended destination through `returnTo`.

This should apply to:

- dashboard entry
- my-applications entry
- my-application-detail entry
- profile entry
- applicant flow re-entry from conference or grant application pages

The success path after login should return the user to the protected target, not always to `/dashboard`.

### 6.5 Public-shell auth entry

When a user opens `Login` or `Register` from a public page, successful authentication should return them to the originating public route.

Examples:

- `/portal` -> `Login` -> `/portal`
- `/schools` -> `Login` -> `/schools`
- `/grants/example` -> `Register` -> `/grants/example`

This allows public browsing and applicant onboarding to stay continuous.

### 6.6 Login/register handoff

When a user switches between `Login` and `Register`, the `returnTo` destination must be preserved.

The auth pair should behave like one small flow, not two disconnected pages that lose context when the user changes their mind.

## 7. Shell Strategy

The account menu should be unified at the **information architecture layer**, not at the **visual component layer**.

### 7.1 Public shell

`PublicPortalNav` should keep its own presentation:

- branded masthead placement
- public-nav dropdown styling
- signed-in versus signed-out masthead states

It should consume shared account destinations and session behavior, but it does not need to look like the workspace utility menu.

### 7.2 Workspace shell

`WorkspaceShell` should gain an optional shared account menu contract that applicant pages can pass in.

This menu should behave like a workspace utility control:

- compact
- stable
- available from applicant-owned work surfaces

It should not recreate dashboard-local logout buttons or page-specific account affordances.

## 8. Implementation Direction

The preferred implementation direction is:

1. Commit and refine `WorkspaceShell` account-menu support so the shell-level contract matches the committed tests.
2. Move account destinations into a shared navigation helper so `PublicPortalNav` and applicant workspace pages do not each hardcode their own `My Applications / My Profile / Log out` list.
3. Add a small shared auth-navigation helper for `returnTo` parsing and fallback rules, instead of leaving `Login`, `Register`, and protected pages to each duplicate the logic.
4. Extend applicant pages that already use `WorkspaceShell` so the menu is consistently available on applicant-owned surfaces.

This should be implemented narrowly enough to solve the current baseline blocker, but broadly enough that the result reads as an intentional product rule.

## 9. Testing Requirements

This slice is only complete when the product contract is locked by tests.

Minimum required coverage:

1. `Shell.test.tsx`
   `WorkspaceShell` renders an account menu when configured.

2. `PublicPortalNav.test.tsx`
   Signed-in public users see `Account` instead of `Sign in`, and public-shell logout returns to the signed-out masthead state without breaking route context.

3. `Login.test.tsx` and `Register.test.tsx`
   Public-origin auth returns to the originating public route.

4. At least one protected applicant-route test
   Unauthenticated access redirects to `Login` with `returnTo` preserved.

5. Applicant workspace logout test
   Logging out through the shared account menu clears the token and returns to `/portal`.

6. Full frontend build
   `tsc -b && vite build` must pass in a clean worktree.

## 10. Success Criteria

This slice is successful when:

- clean worktrees no longer fail because `Shell.test.tsx` and `WorkspaceShell` disagree
- account navigation means the same thing in public and applicant shells
- applicant workspace pages no longer rely on dashboard-local logout affordances
- login and registration consistently return users to the route they actually meant to reach
- public browsing is not unnecessarily interrupted by logout

## 11. Non-Goals

This addendum does not require:

- one universal dropdown component for every shell in the product
- role-aware account menus for reviewer, organizer, and admin in the same pass
- redesigning login/register visuals
- redesigning protected workspace IA beyond applicant account access
