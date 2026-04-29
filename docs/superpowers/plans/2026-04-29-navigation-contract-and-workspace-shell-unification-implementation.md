# Navigation Contract And Workspace Shell Unification Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make reviewer and organizer flows follow the same stable return-navigation and workspace-shell contract as the applicant flow, while locking at least one representative public browse chain and codifying the navigation checklist for future AI-generated pages.

**Architecture:** Keep the change inside the frontend plus one harness doc update. Reuse the existing `returnContext.ts` primitives, add a small workspace-navigation helper for role flows, move role-aware account-menu construction into shared navigation code, then retrofit the reviewer and organizer pages to consume that shared contract through `WorkspaceShell` header actions instead of page-local back links.

**Tech Stack:** React 19, React Router 7, TypeScript, Vite, Vitest, React Testing Library, user-event, global CSS, Markdown docs

---

## Scope Check

This spec stays within one coherent subsystem: frontend navigation and workspace-shell behavior. The prompt-checklist documentation update in `AGENT_HARNESS.md` is tightly coupled to the same contract, so it belongs in the same plan rather than a separate doc-only plan.

## Preflight

- Read:
  - `AGENT_HARNESS.md`
  - `PROGRESS.md`
  - `docs/superpowers/specs/2026-04-29-navigation-contract-and-workspace-shell-unification-design.md`
  - `docs/superpowers/specs/2026-04-27-account-menu-and-auth-return-design.md`
- Before code changes, run:

```bash
cd frontend && npm run test:run -- \
  src/pages/Dashboard.test.tsx \
  src/pages/ReviewWorkspaces.test.tsx \
  src/pages/Conferences.test.tsx
```

Expected: PASS on the current baseline.

- Also run:

```bash
cd frontend && npm run build
```

Expected: PASS.

## File Structure

- `frontend/src/features/navigation/workspaceNavigation.ts`
  New shared helper for workspace return resolution and child-state propagation. Owns role-flow fallback contexts such as reviewer queue and organizer conference queue.
- `frontend/src/features/navigation/workspaceAccountMenu.ts`
  Expand from applicant-only builder into a shared role-aware workspace account-menu factory so dashboard, reviewer, and organizer pages stop inventing their own menu shapes.
- `frontend/src/pages/Dashboard.tsx`
  Remove the page-local account-menu builder, switch reviewer/organizer entry links to shared chained return state, and keep the applicant dashboard behavior intact.
- `frontend/src/pages/Dashboard.test.tsx`
  Lock reviewer and organizer entry behavior and the shared workspace action pattern.
- `frontend/src/pages/OrganizerConferenceApplications.tsx`
  Resolve incoming workspace return context, show header-level primary return plus `Back to portal`, attach shared organizer account menu, and pass chained state to application-detail links.
- `frontend/src/pages/OrganizerApplicationDetail.tsx`
  Replace the aside-local back link with shared header actions, attach shared organizer account menu, and preserve the queue chain.
- `frontend/src/pages/ReviewerAssignments.tsx`
  Resolve workspace return context, show shared header actions, attach shared reviewer account menu, and pass chained state to assignment-detail links.
- `frontend/src/pages/ReviewerAssignmentDetail.tsx`
  Replace the aside-local queue link with shared header actions, attach shared reviewer account menu, and preserve the queue chain.
- `frontend/src/pages/ReviewWorkspaces.test.tsx`
  Lock organizer/reviewer queue/detail return actions, portal escape, account menu presence, and at least one dashboard-origin chain.
- `frontend/src/pages/Conferences.test.tsx`
  Add a representative public chain test proving portal-origin state survives `conferences -> conference detail -> back to conferences`.
- `AGENT_HARNESS.md`
  Add a required navigation checklist for AI-generated pages so future prompts explicitly declare parent route, primary return label, portal escape, and chained `returnContext`.
- `PROGRESS.md`
  Record completion and testing evidence after implementation is verified.

## Task 1: Lock The Navigation Contract With Failing Tests

**Files:**
- Modify: `frontend/src/pages/Dashboard.test.tsx`
- Modify: `frontend/src/pages/ReviewWorkspaces.test.tsx`
- Modify: `frontend/src/pages/Conferences.test.tsx`

- [ ] **Step 1: Add a dashboard-origin organizer-chain test**

Extend [`frontend/src/pages/Dashboard.test.tsx`](/Users/brenda/Projects/Asian-Mathematical-Network/frontend/src/pages/Dashboard.test.tsx) with a router-backed integration test that:

- renders `Dashboard`, `OrganizerConferenceApplications`, and a `location.state` probe in one `MemoryRouter`
- signs in as the seeded organizer account
- clicks `Open conference workspace`
- asserts the destination route is `/organizer/conferences/conf-draft-001/applications`
- asserts the location state contains `to: "/dashboard"` and `label: "Back to dashboard"`

- [ ] **Step 2: Add failing reviewer/organizer shell-contract tests**

Extend [`frontend/src/pages/ReviewWorkspaces.test.tsx`](/Users/brenda/Projects/Asian-Mathematical-Network/frontend/src/pages/ReviewWorkspaces.test.tsx) with assertions that currently fail:

- organizer queue entered with dashboard state shows `Back to dashboard` and `Back to portal`
- organizer detail entered with queue-origin state shows `Back to conference queue` and `Back to portal`
- reviewer queue entered with dashboard state shows `Back to dashboard` and `Back to portal`
- reviewer detail entered with queue-origin state shows `Back to reviewer queue` and `Back to portal`
- organizer queue/detail pages expose an `Account` trigger
- reviewer queue/detail pages expose an `Account` trigger

- [ ] **Step 3: Add a representative public-chain regression test**

Extend [`frontend/src/pages/Conferences.test.tsx`](/Users/brenda/Projects/Asian-Mathematical-Network/frontend/src/pages/Conferences.test.tsx) with a `MemoryRouter` test that:

- starts at `/conferences` with `returnContext: { to: "/portal", label: "Back to portal" }`
- clicks `View details`
- asserts the conference detail header shows `Back to conferences`
- clicks `Back to conferences`
- asserts the conference list header still shows `Back to portal`

- [ ] **Step 4: Run the targeted tests and confirm the failure shape**

Run:

```bash
cd frontend && npm run test:run -- \
  src/pages/Dashboard.test.tsx \
  src/pages/ReviewWorkspaces.test.tsx \
  src/pages/Conferences.test.tsx
```

Expected:

- the new organizer dashboard-origin state assertion fails because the dashboard does not pass chained state into organizer or reviewer entry links
- the new review-workspace assertions fail because queue/detail pages do not render shared header actions or account menus
- the representative conference-chain test may already pass; if so, keep it as a green contract and do not widen scope

- [ ] **Step 5: Commit checkpoint after the tests pass later**

```bash
git add frontend/src/pages/Dashboard.test.tsx frontend/src/pages/ReviewWorkspaces.test.tsx frontend/src/pages/Conferences.test.tsx
git commit -m "test: lock workspace navigation contract"
```

## Task 2: Introduce Shared Workspace Navigation And Role-Aware Account Menus

**Files:**
- Create: `frontend/src/features/navigation/workspaceNavigation.ts`
- Modify: `frontend/src/features/navigation/workspaceAccountMenu.ts`
- Modify: `frontend/src/pages/Dashboard.tsx`
- Test: `frontend/src/pages/Dashboard.test.tsx`

- [ ] **Step 1: Create the new workspace-navigation helper**

In [`frontend/src/features/navigation/workspaceNavigation.ts`](/Users/brenda/Projects/Asian-Mathematical-Network/frontend/src/features/navigation/workspaceNavigation.ts), define a narrow helper layer that:

- reuses `resolveReturnContext`, `toReturnContextState`, and `buildChainedReturnState`
- exports a reviewer-queue return constant
- exports an organizer-queue return factory that accepts `conferenceId`
- exports one resolver for incoming workspace return state with an explicit fallback
- exports one helper for producing child-link state from a local parent plus the resolved upstream return

Keep this file data-oriented. It should return `ReturnContext` / `ReturnContextState`, not JSX.

- [ ] **Step 2: Expand the shared workspace account-menu builder**

In [`frontend/src/features/navigation/workspaceAccountMenu.ts`](/Users/brenda/Projects/Asian-Mathematical-Network/frontend/src/features/navigation/workspaceAccountMenu.ts):

- preserve the applicant builder used by existing applicant pages
- add a role-aware builder that can generate menus for `reviewer`, `organizer`, and `admin`
- move the dashboard’s local organizer/reviewer menu logic into this shared file
- keep the output on the existing `AccountMenu` type so `WorkspaceShell` does not need a new prop contract

- [ ] **Step 3: Refactor dashboard to consume the shared helpers**

In [`frontend/src/pages/Dashboard.tsx`](/Users/brenda/Projects/Asian-Mathematical-Network/frontend/src/pages/Dashboard.tsx):

- delete the page-local `buildDashboardAccountMenu`
- replace it with the shared role-aware builder
- build reviewer entry-link state from `DASHBOARD_RETURN_CONTEXT`
- build organizer entry-link state from `DASHBOARD_RETURN_CONTEXT`
- pass the same state through the reviewer/organizer shortcut-panel links
- keep applicant behavior unchanged

- [ ] **Step 4: Re-run the dashboard tests and verify they pass**

Run:

```bash
cd frontend && npm run test:run -- src/pages/Dashboard.test.tsx
```

Expected: PASS, including the new dashboard-origin organizer-chain assertion.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/features/navigation/workspaceNavigation.ts frontend/src/features/navigation/workspaceAccountMenu.ts frontend/src/pages/Dashboard.tsx frontend/src/pages/Dashboard.test.tsx
git commit -m "feat: share workspace navigation helpers"
```

## Task 3: Retrofit Organizer Pages To The Shared Workspace Shell Contract

**Files:**
- Modify: `frontend/src/pages/OrganizerConferenceApplications.tsx`
- Modify: `frontend/src/pages/OrganizerApplicationDetail.tsx`
- Modify: `frontend/src/pages/ReviewWorkspaces.test.tsx`

- [ ] **Step 1: Wire organizer queue page to shared header actions**

In [`frontend/src/pages/OrganizerConferenceApplications.tsx`](/Users/brenda/Projects/Asian-Mathematical-Network/frontend/src/pages/OrganizerConferenceApplications.tsx):

- add `useLocation` and `useNavigate`
- build an organizer account menu with the current queue conference id
- resolve the primary return with dashboard as fallback
- render header actions as two links:
  - primary return from resolved context
  - stable `/portal` escape
- build child-link state for `Open application` so the detail page receives `Back to conference queue` plus the upstream dashboard chain

- [ ] **Step 2: Wire organizer detail page to shared header actions**

In [`frontend/src/pages/OrganizerApplicationDetail.tsx`](/Users/brenda/Projects/Asian-Mathematical-Network/frontend/src/pages/OrganizerApplicationDetail.tsx):

- add `useLocation` and `useNavigate`
- build organizer account menu from `application.conferenceId` once loaded
- resolve the primary return with organizer-queue fallback
- move the existing `Back to conference queue` behavior out of the aside and into the header actions area
- add the stable `Back to portal` header action
- keep the aside focused on status/context, not navigation

- [ ] **Step 3: Run organizer workspace tests and verify they pass**

Run:

```bash
cd frontend && npm run test:run -- src/pages/ReviewWorkspaces.test.tsx
```

Expected:

- organizer queue/detail tests pass
- reviewer-specific assertions may still fail until Task 4 is complete

- [ ] **Step 4: Commit**

```bash
git add frontend/src/pages/OrganizerConferenceApplications.tsx frontend/src/pages/OrganizerApplicationDetail.tsx frontend/src/pages/ReviewWorkspaces.test.tsx
git commit -m "feat: unify organizer workspace navigation"
```

## Task 4: Retrofit Reviewer Pages To The Shared Workspace Shell Contract

**Files:**
- Modify: `frontend/src/pages/ReviewerAssignments.tsx`
- Modify: `frontend/src/pages/ReviewerAssignmentDetail.tsx`
- Modify: `frontend/src/pages/ReviewWorkspaces.test.tsx`

- [ ] **Step 1: Wire reviewer queue page to shared header actions**

In [`frontend/src/pages/ReviewerAssignments.tsx`](/Users/brenda/Projects/Asian-Mathematical-Network/frontend/src/pages/ReviewerAssignments.tsx):

- add `useLocation` and `useNavigate`
- build reviewer account menu from the shared role-aware builder
- resolve the primary return with dashboard as fallback
- render header actions as `Back to dashboard` plus `Back to portal` when entered from dashboard state
- build child-link state for `Open assignment` so the detail page receives `Back to reviewer queue` plus the upstream dashboard chain

- [ ] **Step 2: Wire reviewer detail page to shared header actions**

In [`frontend/src/pages/ReviewerAssignmentDetail.tsx`](/Users/brenda/Projects/Asian-Mathematical-Network/frontend/src/pages/ReviewerAssignmentDetail.tsx):

- add `useLocation` and `useNavigate`
- build reviewer account menu from the shared builder
- resolve the primary return with reviewer-queue fallback
- move the existing `Back to reviewer queue` behavior out of the aside and into the header actions area
- add the stable `Back to portal` header action

- [ ] **Step 3: Re-run review workspace tests and verify they pass**

Run:

```bash
cd frontend && npm run test:run -- src/pages/ReviewWorkspaces.test.tsx
```

Expected: PASS for organizer and reviewer queue/detail navigation, portal escape, account-menu, and dashboard-origin chain assertions.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/pages/ReviewerAssignments.tsx frontend/src/pages/ReviewerAssignmentDetail.tsx frontend/src/pages/ReviewWorkspaces.test.tsx
git commit -m "feat: unify reviewer workspace navigation"
```

## Task 5: Codify The Navigation Checklist And Finish Verification

**Files:**
- Modify: `AGENT_HARNESS.md`
- Modify: `PROGRESS.md`
- Modify: `frontend/src/pages/Conferences.test.tsx`

- [ ] **Step 1: Add the AI navigation checklist to the harness**

Update [`AGENT_HARNESS.md`](/Users/brenda/Projects/Asian-Mathematical-Network/AGENT_HARNESS.md) so the Coding Agent rules explicitly require every new page prompt or implementation handoff to answer:

- parent route
- primary back label
- whether `Back to portal` is required
- what chained `returnContext` is passed to child routes

Keep the wording short and procedural so it reads like a harness rule, not a long design note.

- [ ] **Step 2: Re-run the targeted navigation regression suite**

Run:

```bash
cd frontend && npm run test:run -- \
  src/pages/Dashboard.test.tsx \
  src/pages/ReviewWorkspaces.test.tsx \
  src/pages/Conferences.test.tsx
```

Expected: PASS.

- [ ] **Step 3: Run the broader frontend safety check**

Run:

```bash
cd frontend && npm run build
```

Expected: PASS.

- [ ] **Step 4: Record completion in progress tracking**

Update [`PROGRESS.md`](/Users/brenda/Projects/Asian-Mathematical-Network/PROGRESS.md) with:

- the new shared workspace-navigation helper
- reviewer/organizer shell unification
- the targeted test command that passed
- the successful frontend build

- [ ] **Step 5: Commit**

```bash
git add AGENT_HARNESS.md PROGRESS.md frontend/src/pages/Conferences.test.tsx
git commit -m "docs: codify navigation checklist"
```

## Self-Review

- Spec coverage:
  - shared return contract is implemented in Tasks 2 through 4
  - reviewer/organizer shell alignment is implemented in Tasks 2 through 4
  - representative public-chain coverage is locked in Tasks 1 and 5
  - prompt checklist codification is implemented in Task 5
- Placeholder scan:
  - no `TBD`, `TODO`, or “similar to Task N” shortcuts remain
  - every task names exact files and exact verification commands
- Type consistency:
  - shared return helpers stay on the existing `ReturnContext` / `ReturnContextState` types
  - role-aware account menus stay on the existing `AccountMenu` contract already consumed by `WorkspaceShell`

