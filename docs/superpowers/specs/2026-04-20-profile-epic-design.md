# PROFILE Epic Design

**Date:** 2026-04-20
**Epic:** `PROFILE`
**Covered Features:** `BE-PROFILE-001`, `FE-PROFILE-001`, `INT-PROFILE-001`

## Goal

Deliver the MVP scholar profile flow as one continuous delivery chain:

1. a persisted authenticated "my profile" surface
2. a public scholar profile surface keyed by stable slug
3. a clean frontend integration path that can switch from feature-local fake data to the real API without reshaping fields

This design keeps implementation strictly one Feature at a time while preserving the full epic sequence upfront, which matches the harness rule in `AGENT_HARNESS.md`.

## Recommended Delivery Order

`BE-PROFILE-001 -> FE-PROFILE-001 -> INT-PROFILE-001`

### Why this order is the best fit for the current repository

The repo is not in the ideal v4 "mock-ready and contract-stable" state for `PROFILE` yet:

- formal profile requirements in `docs/specs/asiamath-api-spec-v2.1.md` require:
  - `GET /api/v1/profile/me`
  - `PUT /api/v1/profile/me`
  - `GET /api/v1/scholars/:slug`
- the code-side OpenAPI file `docs/specs/openapi.yaml` currently defines only `PUT /profiles/me`
- the shared TypeScript `Profile` model exists, but does not yet carry `mscCodes`
- the backend Prisma schema currently contains only `User`
- the frontend dev proxy currently points straight to the real backend on port `3000`

Because of that mismatch, implementing frontend first would force the UI onto an incomplete contract and create predictable rework. Backend-first is the shortest path to a stable typed shape that the frontend can then consume without guessing.

## Read-Only Source of Truth

For this epic, implementation must treat these documents as authoritative and read-only:

- `docs/product/asiamath-mvp-prd-v3.2.md`
- `docs/specs/asiamath-technical-spec-v2.1.md`
- `docs/specs/asiamath-api-spec-v2.1.md`
- `docs/specs/asiamath-database-schema-v1.1.md`

If implementation finds drift in code-side contracts such as `src/types/models.ts` or `docs/specs/openapi.yaml`, the implementation should align runtime code to the formal specs rather than rewriting the formal specs. Because `docs/specs/` is read-only under the harness, drift in `docs/specs/openapi.yaml` should be recorded as a known mismatch unless the user explicitly authorizes a contract-maintenance pass.

## MVP Scope for PROFILE

### In scope

- create and update my own scholar profile
- fetch my own scholar profile
- public scholar page by slug
- stable slug-backed public URL
- public visibility toggle
- ORCID field as placeholder/link value only
- minimum COI declaration text field
- research keywords
- MSC code selection with one optional primary marker
- shared field definitions between edit view and public view

### Out of scope for this epic

- admin profile seeding
- reviewer candidate sourcing
- conflict engine behavior beyond storing the minimum COI text
- ORCID OAuth
- publication sync
- advanced scholar directory browse/search
- a new standalone file subsystem

## Contract Baseline

### Canonical profile field set

The profile feature should use one canonical domain object with at least:

- `userId`
- `slug`
- `fullName`
- `title`
- `institutionId`
- `institutionNameRaw`
- `countryCode`
- `careerStage`
- `bio`
- `personalWebsite`
- `researchKeywords`
- `mscCodes`
- `orcidId`
- `coiDeclarationText`
- `isProfilePublic`
- `verificationStatus`
- `verifiedAt`
- `createdAt`
- `updatedAt`

`mscCodes` should be represented at the application layer as an array of objects:

```ts
type ProfileMscCode = {
  code: string;
  isPrimary: boolean;
};
```

### Endpoint baseline

Implementation should align to the formal API spec:

- `GET /api/v1/profile/me`
- `PUT /api/v1/profile/me`
- `GET /api/v1/scholars/:slug`

The pluralized `/profiles/me` path in `docs/specs/openapi.yaml` should be treated as code-side drift, not as the canonical endpoint shape for this epic.

### Transport vs domain naming

The formal API spec examples use storage-aligned `snake_case` fields such as `full_name`, `institution_name_raw`, and `msc_codes`. The shared TypeScript model file currently uses `camelCase`.

For this epic, the clean split should be:

- HTTP transport layer follows the formal API spec field names
- frontend/backend application-domain types may remain `camelCase`
- mapping happens only in dedicated adapter/serializer code
- page components and route handlers must not perform ad hoc inline key reshaping

### Privacy rule

Public scholar pages expose only public-facing profile fields. Internal fields such as `coiDeclarationText`, user email, and reviewer/admin-only metadata must never be returned from `GET /api/v1/scholars/:slug`.

## Current Repo Gaps That Must Be Explicitly Closed

### Backend/data gaps

- Prisma schema lacks `profiles`
- Prisma schema lacks `msc_codes`
- Prisma schema lacks `profile_msc_codes`
- auth registration side effects do not create an initial profile record yet
- `auth/me` returns a hardcoded mock profile instead of persisted data

### Contract/type gaps

- `src/types/models.ts` lacks `mscCodes` on `Profile`
- `docs/specs/openapi.yaml` lacks `GET /profile/me`
- `docs/specs/openapi.yaml` lacks `GET /scholars/:slug`
- `docs/specs/openapi.yaml` uses `/profiles/me` instead of the formal `/profile/me`
- the formal API spec examples are `snake_case`, while the shared TypeScript profile model is `camelCase`

### Frontend gaps

- current route auto-loader cannot express nested or parameterized routes such as `/me/profile` or `/scholars/:slug`
- current auth pages call axios directly and do not yet use a provider/adapter abstraction for mock-vs-real switching
- there is no profile-specific form/view component structure yet

## Feature-by-Feature Design

## 1. `BE-PROFILE-001`

### Purpose

Establish the real contract and persistence layer for scholar profiles before any frontend commits to a field shape.

### Deliverables

- Prisma models for `profiles`, `msc_codes`, `profile_msc_codes`
- profile serialization layer that maps DB vocabulary to app/API vocabulary
- authenticated endpoints for get/update my profile
- public endpoint for profile lookup by slug
- backend tests covering persistence, visibility, and validation

### Backend design decisions

- create `backend/src/routes/profile.ts` for `/api/v1/profile/*`
- create `backend/src/routes/scholars.ts` for `/api/v1/scholars/*`
- isolate profile business logic into dedicated controller/service modules instead of growing `auth.ts`
- keep database-facing names compatible with the existing storage vocabulary, but expose app-facing names consistently
- add explicit serializer helpers so outward HTTP payloads follow the formal `snake_case` contract
- update auth registration flow so a newly registered user gets a starter profile record immediately
- keep `orcidId` as nullable plain text/link placeholder only

### Validation rules

- `fullName` required
- one of `institutionId` or `institutionNameRaw` required
- `countryCode` required
- `careerStage` required
- at most one primary MSC code
- duplicate MSC codes rejected
- public lookup returns only visible profiles

### Public visibility behavior

Recommended behavior:

- hidden profile slug lookup returns `404`
- visible profile slug lookup returns only public-safe fields

This is an implementation choice inferred from the privacy requirements and should be applied consistently.

## 2. `FE-PROFILE-001`

### Purpose

Build the profile editing and public display surfaces against a stable typed contract, without coupling the page logic directly to raw HTTP response handling.

### Deliverables

- `/me/profile` private profile page
- `/scholars/:slug` public profile page
- typed profile adapter/provider boundary
- reusable field rendering between edit and public surfaces
- local fake provider for UI development and state coverage

### Frontend design decisions

- extend the page auto-loader so a page module may optionally export its own `routePath`
- keep filename-based routing as the default for simple pages
- introduce profile-specific transport and domain types, with transport-to-domain mapping isolated in the adapter layer
- create a `profile` provider boundary so `FE-PROFILE-001` can use local fake data and `INT-PROFILE-001` can switch to the real HTTP provider without changing page components
- reuse the same field definitions for edit view labels and public view presentation

### UI states

Private profile page:

- loading
- incomplete draft
- saved
- validation error
- save in progress

Public scholar page:

- loading
- visible profile
- not found / hidden

### CV / resume handling

The feature list mentions resume upload, but M4 formal profile scope does not define CV as a first-class profile field. If a CV affordance is included in the UI, it should be framed as integration with the platform-wide file contract rather than a new profile-owned file backend. That means:

- no new file storage subsystem inside `BE-PROFILE-001`
- no independent upload API invented inside `PROFILE`
- any UI placeholder must clearly depend on the shared `/files` capability already defined elsewhere

## 3. `INT-PROFILE-001`

### Purpose

Replace the fake provider with the real HTTP provider and prove that profile edits persist and public visibility behaves correctly end to end.

### Deliverables

- adapter switch from fake/local provider to real API provider
- persistence verification for profile updates
- end-to-end verification for public visibility
- feature status handoff updates after validation

### Integration acceptance checks

- authenticated user can load `/me/profile`
- authenticated user can save profile changes and see persisted values on reload
- visible profile can be opened at `/scholars/:slug`
- hidden profile is not publicly exposed
- public payload does not leak internal-only fields

## Cross-Cutting Design Rules

### Type alignment

- `src/types/models.ts` is the shared application-domain contract and must be updated to reflect the formal profile field set before frontend integration
- transport DTOs must follow the formal API spec naming, even if the shared application model remains `camelCase`
- backend response serializers and frontend adapters must be the only places where casing or field-name mapping happens
- do not allow page components to manually reshape backend payloads inline

### Testing

- `BE-PROFILE-001` owns backend route/integration tests
- `FE-PROFILE-001` owns component/page state coverage and build validation
- `INT-PROFILE-001` owns real API persistence verification and smoke validation

### Handoff discipline

Each Feature completion must still do the standard harness work:

- run smoke checks before and after
- update `PROGRESS.md`
- update the feature status in `docs/planning/asiamath-feature-list-v4.0-optimized.json`
- leave API/schema notes if code-side contracts were corrected

## Risks and Controls

### Risk: route architecture drift

The repo README describes zero-conflict routing, but the current frontend auto-loader cannot support parameterized routes. Control: make one minimal extension that allows per-page `routePath` export while preserving the default auto-discovery behavior.

### Risk: code-side contract drift

The formal API spec, shared models, and code-side OpenAPI file are currently out of sync. Control: treat the formal specs as source of truth and make code-side artifacts converge before frontend integration.

### Risk: profile scope expands into directory product work

Public scholar pages can easily expand into search, discovery, and review tooling. Control: keep this epic limited to single-profile CRUD plus single-profile public exposure.

### Risk: CV upload balloons scope

Profile UI wording can accidentally pull in a full upload subsystem. Control: keep CV handling as either a placeholder or a thin reuse of the existing shared file contract, not a new vertical slice under `PROFILE`.

## Execution Result

This design deliberately turns `PROFILE` into a strict three-step chain:

1. stabilize real contract and persistence
2. build UI against that stable typed contract
3. perform one clean integration swap and verify persistence/public behavior

That sequence satisfies the harness rule of one Feature per implementation session while still designing the whole epic as a continuous delivery path upfront.
