## Navigation Contract And Workspace Shell Unification

Date: 2026-04-29
Status: Draft for review
Type: Incremental workflow and navigation design

References:
- `frontend/src/features/navigation/returnContext.ts`
- `frontend/src/features/demo/demoWalkthrough.ts`
- `frontend/src/pages/Dashboard.tsx`
- `frontend/src/pages/OrganizerConferenceApplications.tsx`
- `frontend/src/pages/OrganizerApplicationDetail.tsx`
- `frontend/src/pages/ReviewerAssignments.tsx`
- `frontend/src/pages/ReviewerAssignmentDetail.tsx`
- `docs/superpowers/specs/2026-04-26-portal-homepage-fidelity-and-return-context-design.md`
- `docs/superpowers/specs/2026-04-27-account-menu-and-auth-return-design.md`

## 1. Purpose

This slice addresses a recurring workflow failure in the frontend: newly added pages, especially role-specific workspace pages, often strand the user because their return path is missing or inconsistent.

The immediate trigger is the organizer dashboard path. The newly added organizer workspace entry reaches queue and detail pages, but those pages do not consistently preserve a usable return chain back to the dashboard or portal.

The goal is not to patch isolated pages one by one. The goal is to define a small shared contract so that:

- public browse flows and authenticated workspace flows use the same return-state model
- reviewer and organizer pages align with the applicant workspace shell pattern
- new pages are less likely to ship without coherent navigation
- tests fail when critical return links are omitted

## 2. Problem Statement

The repository already contains a valid `returnContext` pattern, and some public pages already use it correctly. The problem is that the contract is optional in practice, so newer pages can bypass it.

Current failure modes include:

- a new page links deeper into a flow without passing chained return state
- a detail page hardcodes a local back link but loses the upstream chain
- role-specific pages do not inherit the same shell behavior as the applicant workspace
- reviewer and organizer pages expose inconsistent header actions and account access
- regressions are only discovered through manual clicking after implementation

This makes the site fragile for both demos and real usage. The failure is process-level, not just page-level.

## 3. Approved Direction

The approved direction is:

- keep the existing `returnContext.ts` model
- add a thin shared navigation helper layer on top of it for workspace pages
- treat applicant dashboard behavior as the shell standard for authenticated role pages
- give every non-root page a logical parent return
- provide a stable `Back to portal` escape on workspace pages
- enforce the contract with focused tests and a fixed prompt checklist for future generation work

This is intentionally narrower than a full route registry or navigation schema rewrite.

## 4. Navigation Contract

The application should treat return navigation as a structured UI contract rather than a best-effort convenience.

### 4.1 Core rules

The following rules apply across public and authenticated flows:

- every list page, detail page, form page, and role-specific workflow page must define a logical parent
- primary return actions must point to the logical parent, not to browser history
- child routes should receive chained `returnContext` state when entered from a parent route
- pages must prefer incoming `returnContext` over their local fallback
- when incoming `returnContext` is missing, pages must use an explicit page-level fallback
- `navigate(-1)` is not the default return model for this product

### 4.2 Two return layers

Pages may expose two separate navigation actions:

1. `Primary return`
   This returns the user to the logical parent in the current workflow.

2. `Portal escape`
   This provides a stable restart point at `/portal` and does not replace the primary return.

The primary return is workflow-specific. The portal escape is cross-workflow and demo-safe.

### 4.3 Fallback behavior by page type

Fallbacks should be deterministic:

- public list pages fall back to `/portal`
- public detail pages fall back to their public list page
- applicant workspace secondary pages fall back to `/dashboard` or the immediate applicant list page, depending on depth
- reviewer queue pages fall back to `/dashboard`
- reviewer detail pages fall back to `/reviewer`
- organizer queue pages fall back to `/dashboard`
- organizer detail pages fall back to the relevant organizer conference queue

This preserves the user expectation of "go up one logical level" instead of sending every page to the same destination.

### 4.4 Chain preservation

When a page has both a local parent and an upstream parent, the chain should be preserved rather than flattened.

Examples:

- `dashboard -> organizer queue -> organizer application detail`
- `dashboard -> reviewer queue -> reviewer assignment detail`
- `portal -> conferences -> conference detail`
- `portal -> schools -> school detail -> publications`

In these cases:

- the current page should show the most immediate useful return label
- the upstream chain should remain nested inside state
- deeper pages should not discard prior context just because they introduce a more local parent

## 5. Workspace Shell Standard

Reviewer and organizer pages should align with the applicant dashboard shell behavior, not only visually but structurally.

### 5.1 Standardized workspace shell requirements

Authenticated workflow pages should use the same shell conventions:

- `WorkspaceShell` for page framing
- `Account` dropdown in the header area
- a header-level primary return action
- a header-level `Back to portal` action
- role, mode, and status badges in the same top structure

This standard applies to reviewer and organizer queue/detail pages, not just to the top-level dashboard.

### 5.2 Specific reviewer and organizer expectations

The immediate alignment targets are:

- `Dashboard.tsx`
  reviewer and organizer entry links should pass dashboard return context into the next page
- `OrganizerConferenceApplications.tsx`
  should expose header-level primary return and portal escape actions
- `OrganizerApplicationDetail.tsx`
  should stop relying on a local inline back link inside the aside and instead use shared header actions
- `ReviewerAssignments.tsx`
  should expose the same standardized header actions
- `ReviewerAssignmentDetail.tsx`
  should expose the same standardized header actions

The standard should match the user-facing expectations already established by the applicant workspace:

- the role page feels part of the same site
- the account menu is always available
- the user can either move back up one level or restart from portal without guessing

## 6. Public Flow Alignment

Public pages should remain on the same return-state system rather than drifting into a separate browsing model.

### 6.1 Public contract

The public flow should continue to work as:

- `/portal` as the public root
- list pages receive `Back to portal` when entered from portal navigation
- detail pages preserve the list-page return
- adjacent browse/detail hops preserve upstream state

### 6.2 Scope of public changes

This slice should not redesign public pages. It should only:

- fill return-state gaps
- ensure explicit fallbacks exist
- confirm that representative list-to-detail chains remain intact

The public side is included to avoid solving the same class of problem twice with different rules.

## 7. Shared Helper Layer

The implementation should add a small shared helper layer under `frontend/src/features/navigation/` rather than embedding return logic into each page.

That helper layer should be responsible for:

- reading incoming `returnContext`
- resolving a page-specific primary fallback
- emitting chained state for child links
- providing a stable portal action contract for workspace pages

This should extend the current navigation utilities, not replace them.

The design intentionally avoids a full route metadata registry because that would be a larger architectural change than this problem requires.

## 8. Prompting And Generation Guardrails

Prompt improvements are useful, but only as a supplement to code and tests.

For all future page-generation prompts, the model should be required to explicitly answer a fixed navigation checklist before implementation:

1. What is this page's logical parent route?
2. What is the primary back label shown to users?
3. Should this page expose a `Back to portal` action?
4. When this page links deeper, what chained `returnContext` does it pass?

The prompt should also state:

- do not use browser history as the default return mechanism
- follow the applicant workspace shell pattern for authenticated role pages
- put return actions in the page header, not as scattered local links unless there is a strong local reason
- if a new page introduces a new workflow depth, add or update tests for its return chain

This does not guarantee correctness by itself, but it materially reduces omission risk.

## 9. Testing Expectations

The test strategy should focus on high-signal workflow assertions rather than snapshots.

### 9.1 Dashboard tests

`Dashboard.test.tsx` should verify:

- reviewer entry links use the expected role-specific destination
- organizer entry links use the expected role-specific destination
- reviewer and organizer flows continue to expose applicant-style workspace actions where applicable

### 9.2 Review workspace tests

`ReviewWorkspaces.test.tsx` should verify:

- organizer queue page shows a primary return action
- organizer queue page shows `Back to portal`
- organizer detail page shows a primary return action
- organizer detail page shows `Back to portal`
- reviewer queue page shows a primary return action
- reviewer queue page shows `Back to portal`
- reviewer detail page shows a primary return action
- reviewer detail page shows `Back to portal`
- at least one dashboard-origin chained-state path survives into a detail page correctly

### 9.3 Public flow tests

At least one or two representative public chains should be locked with tests, for example:

- `portal -> conferences -> conference detail`
- `portal -> scholars -> scholar profile`

These tests should assert visible actions and link targets, not CSS snapshots.

## 10. Non-Goals

This slice does not require:

- a full route registry system
- a global breadcrumb framework
- replacing all existing page actions with a new component in one pass
- a redesign of public layouts
- changes to unrelated in-progress frontend work

## 11. Success Criteria

This slice is successful when:

- reviewer and organizer workflow pages feel structurally aligned with the applicant workspace
- organizer and reviewer flows preserve logical parent returns instead of stranding the user
- workspace pages expose a stable `Back to portal` escape
- representative public browse flows still preserve chained return state
- new navigation regressions are caught by tests rather than only by manual clicking
- future prompts for new pages have a concrete navigation checklist instead of vague wording
