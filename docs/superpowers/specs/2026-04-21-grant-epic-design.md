# GRANT Epic Design

Date: 2026-04-21
Branch: `feature/grant-epic`
Status: Draft for review before feature-level planning

## 1. Context

`AUTH`, `PROFILE`, and `CONF` are complete on `main`. The next planned epic is `GRANT`, with feature-list entries `FE-GRANT-001`, `BE-GRANT-001`, and `INT-GRANT-001`.

The current repository already contains:

- a shared contract for `GrantOpportunity` and `grant_application` in `src/types/models.ts`
- reusable conference/application patterns in the frontend and backend
- a working real API flow for `conference_application`

The current repository does **not** yet contain:

- a real `GrantOpportunity` persistence model or API
- a frontend `grant` feature module or grant pages
- a real decision-release workflow
- a real post-visit-report workflow

Therefore `GRANT` is not a small extension of `CONF`. It is a new vertical slice built on top of the existing application backbone.

## 2. Working Constraints

This epic design follows the current session rules:

- only one Feature is implemented at a time
- epic-level design must be written before feature implementation plans
- `docs/planning/` and `docs/product/` are read-only references
- `docs/superpowers/plans/` is not a default deliverable target
- no opportunistic cleanup of `PROFILE` / `CONF`
- the known `CONF` stale `Draft saved.` banner issue is explicitly out of scope

## 3. Epic Goal

Deliver the minimum viable `GRANT` slice for conference-linked travel grants:

- applicant can discover a published grant opportunity
- applicant can open a dedicated grant detail / apply flow
- applicant can create, edit, and submit a **separate** `grant_application`
- the backend enforces the prerequisite that a grant application depends on an already submitted conference application for the linked conference

The most important product rule is preserved throughout the epic:

`conference_application` and `grant_application` remain separate records, even if they share layout, workflow stages, or storage infrastructure.

## 4. Proposed Feature Order

Recommended order:

1. `BE-GRANT-001`
2. `FE-GRANT-001`
3. `INT-GRANT-001`

### Why this order

`GRANT` currently has no real backend object layer. The frontend cannot safely define routes, provider contracts, or form states until the grant opportunity read model and grant application write model are fixed.

In the current repo, the frontend does not develop against a runtime mock server by default. Outside tests, providers call real HTTP APIs. That makes backend-first sequencing the lowest-risk path for this epic.

Integration must remain last because the critical business rule is cross-feature:

- grant application must link to the correct conference
- the applicant must already own a submitted conference application for that conference
- `CONF` behavior must stay unchanged while grant support is added

## 5. Scope Boundaries

### 5.1 In Scope for the Epic

- public grant discovery read APIs needed by frontend grant pages
- applicant grant apply flow
- applicant grant draft edit / submit flow
- prerequisite validation against conference application state
- frontend grant feature module and pages
- integration coverage for the conference-to-grant dependency rule

### 5.2 Explicitly Out of Scope

- `CONF` bug cleanup unrelated to grant prerequisite handling
- organizer-side grant CRUD UI
- reviewer assignment, scoring, and decision workflows
- released decision UX
- applicant dashboard consolidation across conference and grant records
- broad refactors of existing `conference` modules unless required by grant support

### 5.3 Deferred Inside the GRANT Epic

`post-visit report` is **not** a first-feature deliverable.

Reason:

- product semantics require grant acceptance and released results before report submission
- the current repo does not yet implement `Decision` / release-state persistence or APIs
- forcing report implementation into the first grant slice would create fake gating rules or premature review-workflow design

For this epic, the report workflow should be treated as a deferred sub-slice unless a later approved design explicitly expands scope.

## 6. Domain Decisions

### 6.1 Grant Opportunity

`GrantOpportunity` becomes the public source object for M7-lite.

Minimum real fields required by this epic:

- `id`
- `slug`
- `title`
- `grantType`
- `linkedConferenceId`
- `description`
- `eligibilitySummary`
- `coverageSummary`
- `applicationDeadline`
- `status`
- `reportRequired`
- `applicationFormSchemaJson`
- `publishedAt`

This object must exist as a real backend model before frontend grant pages are planned in detail.

### 6.2 Grant Application

`grant_application` remains stored as a separate row in the shared `Application` backbone.

Minimum grant-owned fields already suggested by the repo schema should be used instead of inventing a parallel table first:

- `grantId`
- `linkedConferenceId`
- `linkedConferenceApplicationId`
- `travelPlanSummary`
- `fundingNeedSummary`
- `extraAnswersJson`
- common application fields such as `status`, `submittedAt`, and snapshot data

### 6.3 Conference Prerequisite

The prerequisite rule for this epic is:

1. the grant opportunity must point to one linked conference
2. the current applicant must already have a `submitted` conference application for that linked conference
3. the linked conference application must belong to the same applicant as the grant application

This rule must be enforced in backend validation and made explicit in frontend copy. It must not be hidden as a generic 400 without context.

## 7. API / Routing Decisions

### 7.1 Required New Grant Read Surface

Even though the feature list highlights application write paths, the frontend cannot function without a grant read surface. The minimum required read surface is:

- `GET /api/v1/grants`
- `GET /api/v1/grants/:slug`
- `GET /api/v1/grants/:id/application-form`
- `GET /api/v1/grants/:id/applications/me`

### 7.2 Required Grant Write Surface

- `POST /api/v1/grants/:id/applications`

The existing applicant-owned mutation routes should be generalized, not duplicated:

- `PUT /api/v1/me/applications/:id/draft`
- `POST /api/v1/me/applications/:id/submit`

These routes currently assume `conference_application`. `BE-GRANT-001` should extend them so they dispatch by application type while preserving all existing `CONF` behavior.

### 7.3 Page / Route Surface

The minimum new frontend routes expected by this epic are:

- `/grants`
- `/grants/:slug`
- `/grants/:slug/apply`

No applicant dashboard or organizer grant-management routes are included in the first grant slice.

## 8. Frontend Design Boundaries

The frontend should get a new `frontend/src/features/grant` module instead of overloading `frontend/src/features/conference`.

Allowed reuse:

- form layout conventions
- transport/domain mapper patterns
- provider structure
- success/error state handling patterns

Not allowed:

- presenting grant pages as conference pages with renamed copy
- merging grant and conference application records into one UI object
- expanding `conference` feature files until they become a mixed conference/grant module

The grant apply page should display prerequisite state explicitly:

- no linked conference submission found
- linked conference submission exists and grant draft can be started
- grant draft already exists
- grant application submitted

## 9. Testing Strategy

### 9.1 `BE-GRANT-001`

Backend tests should prove:

- grant list / detail / form reads work
- creating a grant draft fails when no submitted conference application exists
- creating a grant draft succeeds when the applicant owns the required submitted conference application
- draft edit / submit continues to work for conference applications
- draft edit / submit also works for grant applications without regressing conference behavior

### 9.2 `FE-GRANT-001`

Frontend tests should prove:

- grant detail and apply pages load the expected data contract
- prerequisite messaging is correct for each state
- grant draft creation and updates use the new provider contract
- grant-specific pages remain visually and semantically distinct from conference pages

### 9.3 `INT-GRANT-001`

Integration validation should prove:

- real frontend grant pages work against real backend APIs
- a submitted conference application is required before grant draft creation
- grant submission does not break existing conference submit / hydrate behavior

## 10. Risks and Mitigations

### Risk 1

The feature list under-specifies the read-side grant APIs required by the frontend.

Mitigation:

Treat the grant read surface as part of `BE-GRANT-001`, not as optional follow-up work.

### Risk 2

Generalizing `/me/applications/:id/draft` and `/submit` can accidentally regress `CONF`.

Mitigation:

Extend behavior by application type and add regression coverage against the existing conference workflow before merging.

### Risk 3

The current repo lacks real decision / release objects, which blocks honest post-visit-report implementation.

Mitigation:

Keep report workflow out of the first-feature plan and only revisit it after a later approved scope decision.

## 11. Feature-Level Planning Sequence

After this epic design is approved, write plans in this order:

1. `BE-GRANT-001`
   Focus: real grant object layer, public read endpoints, applicant grant create/read/update/submit, prerequisite validation, regression-safe mutation routing.

2. `FE-GRANT-001`
   Focus: `grant` feature module, public grant pages, grant apply flow, explicit prerequisite UX, real-API provider wiring.

3. `INT-GRANT-001`
   Focus: real adapter switch verification, end-to-end dependency validation, regression checks against existing conference flow.

No other plan should be written before `BE-GRANT-001` is approved.

## 12. Approval Gate

This document intentionally stops before implementation detail. Once approved, the next step is to write a single detailed implementation plan for `BE-GRANT-001`.
