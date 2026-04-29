## Applicant And Reviewer Workspace Switcher

Date: 2026-04-29
Status: Draft for review
Type: Incremental authenticated workspace design

References:
- `frontend/src/pages/Dashboard.tsx`
- `frontend/src/pages/ReviewerAssignments.tsx`
- `frontend/src/pages/ReviewerAssignmentDetail.tsx`
- `frontend/src/pages/MyApplications.tsx`
- `frontend/src/pages/MyApplicationDetail.tsx`
- `frontend/src/pages/MeProfile.tsx`
- `frontend/src/components/layout/WorkspaceShell.tsx`
- `frontend/src/features/navigation/workspaceAccountMenu.ts`
- `backend/src/controllers/auth.ts`
- `packages/shared/src/models.ts`
- `docs/superpowers/specs/2026-04-29-navigation-contract-and-workspace-shell-unification-design.md`

## 1. Purpose

This slice defines how a single authenticated account should move between multiple workspaces without splitting identity across multiple logins.

The immediate goal is narrow:

- keep a single account model
- support both `Applicant` and `Reviewer` workspaces on the same account
- add a header-level workspace switcher only when the user truly has more than one available workspace
- remember the last workspace used
- stop treating `/dashboard` as a generic landing surface for every role

This is not a full multi-membership redesign. It is the smallest coherent step toward that model.

## 2. Problem Statement

The current frontend assumes a mostly singular workspace identity at a time.

Today:

- the dashboard derives one current role from `primary_role` or `role`
- applicant, reviewer, and organizer are treated as alternate versions of the same landing page
- reviewer access is represented as a role flag, not as one selectable workspace among several
- the page header has no concept of switching workspaces while staying in the same account

This creates two product-level problems:

- it encourages a mental model of "one account per role" even though the desired product model is "one account, multiple permissions"
- it makes reviewer/applicant coexistence awkward because there is no first-class workspace chooser

The result is that the site can express role-gated views, but not a clear multi-workspace identity model.

## 3. Approved Direction

The approved direction is:

- keep one unified account and login
- treat `Applicant` and `Reviewer` as available workspaces on that account
- show a workspace switcher only when multiple workspaces are available
- let reviewer access appear only when the account truly has reviewer permission
- remember the last workspace used and restore it on the next authenticated entry
- keep `Account` and `Workspace switcher` separate in the header
- defer reviewer-access application flows to a future slice

The current implementation slice only covers `Applicant` and `Reviewer`.

## 4. Core Product Model

### 4.1 Identity versus workspace

The product should distinguish between:

- `Identity`
  one account, one login, one profile, one authenticated session
- `Workspace`
  a user-facing operational context the account may enter, such as `Applicant` or `Reviewer`

This means a user should not register different accounts just to perform different platform roles.

### 4.2 Workspace availability rules

For this slice:

- every authenticated account is assumed to have `Applicant`
- `Reviewer` is optional
- `Reviewer` appears only when the backend confirms the account has reviewer permission

The switcher must not invent reviewer access from UI state alone.

### 4.3 Visibility rule

The workspace switcher should only render when the account has two or more available workspaces.

Therefore:

- `['applicant']` -> no switcher
- `['applicant', 'reviewer']` -> switcher shown

This avoids visual noise for single-workspace users.

## 5. Workspace Entry And Persistence

### 5.1 Default entry

The default authenticated root remains:

- `Applicant` -> `/dashboard`
- `Reviewer` -> `/reviewer`

### 5.2 Restore last workspace

After authentication, the system should restore the last workspace used when possible.

Rules:

- the selected workspace is stored locally, for example as `lastWorkspace`
- on the next authenticated entry, if the stored workspace is still included in `available_workspaces`, redirect to that workspace root
- if the stored workspace is missing or no longer permitted, fall back to `Applicant`
- first-time users with no saved workspace fall back to `Applicant`

### 5.3 Switching behavior

The switcher should always navigate to the selected workspace root.

For this slice:

- choosing `Applicant` sends the user to `/dashboard`
- choosing `Reviewer` sends the user to `/reviewer`

This is an actual route change, not a local title/text toggle inside the current page.

## 6. IA And Page Behavior

### 6.1 Applicant root

`/dashboard` should be treated as the applicant workspace root.

It should no longer behave as a reviewer landing surface once the switcher model is in place.

### 6.2 Reviewer root

`/reviewer` should be treated as the reviewer workspace root.

Reviewer detail pages remain nested under that root:

- `/reviewer`
- `/reviewer/assignments/:id`

### 6.3 Header behavior

The header should keep three different responsibilities distinct:

- `Workspace switcher`
  current operational context
- `Back to portal`
  public escape hatch
- `Account`
  identity-level actions and profile/logout access

The workspace switcher must not live inside the `Account` dropdown.

### 6.4 Browse opportunities rule

The top-level applicant and reviewer headers should diverge here:

- `Applicant` pages may show `Browse opportunities`
- `Reviewer` pages should not show `Browse opportunities`

The reasoning is structural, not cosmetic:

- applicant work naturally includes browsing and submission
- reviewer work is a role-scoped operational queue, not a public opportunity browsing surface

Both workspaces should still keep `Back to portal`.

## 7. Scope Of Header Rollout

The switcher should appear across both applicant and reviewer workspace surfaces so the user does not need to retreat to a root page before switching.

This slice should cover:

- `/dashboard`
- `/me/applications`
- `/me/applications/:id`
- `/me/profile`
- `/reviewer`
- `/reviewer/assignments/:id`

This is intentionally broader than dashboard-only rollout, because dashboard-only switching would still leave users stranded once they moved deeper into a workspace.

## 8. Data Contract

### 8.1 Backend response shape

The backend authenticated user payload should expose explicit workspace availability.

A minimal shape for this slice is:

- `available_workspaces: ['applicant']`
- `available_workspaces: ['applicant', 'reviewer']`

This should be treated as the source of truth for whether the switcher renders and which entries it contains.

### 8.2 Relationship to existing role fields

Existing `role` and `primary_role` fields may still exist for compatibility, but they should not remain the sole determinant of workspace availability.

For this slice:

- `Dashboard` should stop assuming one singular active role from those fields alone
- frontend workspace selection should derive from `available_workspaces`

This keeps the model extensible for future organizer/admin or conference-scoped workspaces.

## 9. UI Shape

### 9.1 Switcher form

This slice should use a header-level dropdown switcher, not tabs and not account-menu nesting.

Reasons:

- it fits the existing `WorkspaceShell` action area
- it scales better once organizer or conference-scoped reviewer workspaces are added
- it keeps `Account` focused on identity actions rather than operational context

### 9.2 Future scalability

The naming should favor `workspace switcher`, not `role switcher`, because future entries may become more specific than raw roles.

Likely future examples:

- `Applicant`
- `Reviewer`
- `Organizer · Conference A`
- `Organizer · Conference B`

This slice only implements the first two, but the label and component intent should already reflect that future direction.

## 10. Deferred Reviewer Access Flow

Reviewer access acquisition is intentionally out of scope for this implementation.

For now:

- all users still register through the same unified registration flow
- reviewer access is enabled by administrative action
- only approved reviewer accounts receive `reviewer` in `available_workspaces`

Future design direction to record now:

- unified registration remains the only registration flow
- a user may later request reviewer access
- reviewer workspace appears only after approval

This future request-and-approval flow should be documented as a deferred follow-up, not mixed into this implementation.

## 11. Testing Expectations

### 11.1 Auth and availability tests

Tests should verify:

- accounts without reviewer permission receive only `Applicant`
- accounts with reviewer permission receive both `Applicant` and `Reviewer`

### 11.2 Switcher behavior tests

Tests should verify:

- switcher is hidden for single-workspace users
- switcher is visible for multi-workspace users
- selecting `Reviewer` navigates to `/reviewer`
- selecting `Applicant` navigates to `/dashboard`
- last selected workspace is persisted locally
- invalid persisted workspace falls back to `Applicant`

### 11.3 Page-level IA tests

Tests should verify:

- applicant pages still expose `Browse opportunities`
- reviewer pages do not expose `Browse opportunities`
- applicant and reviewer pages both preserve `Back to portal`
- applicant and reviewer detail pages both keep switcher access in the header

## 12. Non-Goals

This slice does not include:

- organizer workspace switching
- conference-scoped workspace switching
- reviewer access self-service application
- backend membership schema overhaul
- replacing all role semantics across the entire product
- a fake in-place switch that changes copy without changing route

## 13. Success Criteria

This slice is successful when:

- one account can cleanly expose both applicant and reviewer workspaces
- reviewer workspace only appears for authorized accounts
- the switcher stays hidden for single-workspace accounts
- the product restores the last valid workspace used
- applicant pages and reviewer pages present different, role-appropriate header actions
- reviewer navigation no longer depends on `/dashboard` being a generic multi-role landing page

