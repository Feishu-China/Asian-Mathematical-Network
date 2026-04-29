# Asiamath Feature-List Passes Resolution

> Date: 2026-04-29  
> Task: `PMB-006`  
> Truth sources: `asiamath-post-mvp-backlog-v1.md`, `asiamath-mvp-status-inventory-2026-04-29.md`, `asiamath-sprint-1-demo-readiness-2026-04-29.md`, `asiamath-feature-list-v4.0-optimized.json`, `PROGRESS.md`

## 1. Resolution summary

Before this resolution, the frozen MVP feature list still had `8` items with `passes: false`, even though:

- all `24/24` feature entries were already `status: completed`
- the matching `INT-*` integration items had already been completed
- post-MVP inventory had already called these `passes: false` values a legacy convention rather than evidence of missing implementation

Decision:

- backfill all `8` remaining implementation items from `passes: false` to `passes: true`
- keep `passes` as a valid historical field for the frozen MVP feature list
- explicitly stop using leftover `passes: false` values to represent post-MVP readiness work, because those checks now live in the post-MVP backlog and Sprint 1 demo-readiness documents

Interpretation after this resolution:

- `passes: true` means the feature has enough repository and verification evidence to treat the MVP feature scope as verified
- post-MVP gaps such as hosted preview recovery, full demo rehearsal, or environment hardening are real, but they are no longer reasons to leave old MVP implementation entries at `passes: false`

## 2. Item-by-item decisions

| Feature | Current state | Repository evidence | Verification evidence | Decision | Why |
|---|---|---|---|---|---|
| `FE-PROFILE-001` | Implemented | `frontend/src/pages/MeProfile.tsx`, profile provider/mappers, public scholar UI are present in repo | `PROGRESS.md` Session 14 records `/me/profile` and `/scholars/:slug` landing with build + smoke; Session 15 (`INT-PROFILE-001`) verifies real API persistence and public profile visibility; Session 45 (`INT-PROFILE-002`) adds browser/runtime evidence for `/scholars` and portal scholar teaser | `passes: true` | This was left false only because the original implementation session deferred final verification to integration. That integration evidence now exists. |
| `BE-PROFILE-001` | Implemented | `backend/src/routes/profile.ts`, `backend/src/controllers/profile.ts`, `backend/src/serializers/profile.ts`, `backend/tests/profile.test.ts` | `PROGRESS.md` Session 13 and follow-up fixes record profile CRUD, validation, slug/privacy fixes, backend auth/profile tests, typecheck, and smoke; Session 15 verifies real save/readback and public/hidden profile behavior | `passes: true` | Backend profile scope is implemented and later real-API verification already closed the loop. |
| `FE-CONF-001` | Implemented | `frontend/src/features/conference/*`, `frontend/src/pages/ConferenceApply.tsx`, `ConferenceApplyForm.tsx`, related tests | `PROGRESS.md` Session 17 records public conference list/detail, organizer editor, applicant apply flow, frontend tests, build, and smoke; Sessions 18-19 (`INT-CONF-001`) verify real organizer publish + applicant draft/save/submit + route availability | `passes: true` | Original note explicitly said to wait for `INT-CONF-001`; that integration has long since passed. |
| `BE-CONF-001` | Implemented | `backend/src/routes/conferences.ts`, `backend/src/controllers/conferences.ts`, `backend/src/serializers/conference.ts`, `backend/tests/conferences.test.ts` | `PROGRESS.md` Session 16 records conference CRUD/application APIs plus backend tests; Sessions 18-19 (`INT-CONF-001`) verify the real end-to-end organizer/applicant flow including draft hydrate | `passes: true` | Same legacy pattern as `FE-CONF-001`: implementation was complete, `passes` was never backfilled after integration closed. |
| `FE-GRANT-001` | Implemented, with later scope completed across follow-up sessions | `frontend/src/pages/GrantDetail.tsx`, `GrantApply.tsx`, `frontend/src/features/grant/*`, `frontend/src/pages/MyApplicationDetail.tsx` now contain grant detail/apply/released-result/post-visit-report UI | `PROGRESS.md` Session 21 (`INT-GRANT-001`) verifies `/grants`, `/grants/:slug`, `/grants/:slug/apply` and real grant submit flow; Session 22 stabilizes grant applicant flow; Session 43 adds post-visit report UI/tests/build and verifies it through `npm run test:portal:int` | `passes: true` | This item did not have one neat standalone final handoff entry, but the repo and later verification evidence together show the full frontend grant scope is live. |
| `BE-GRANT-001` | Implemented, with later post-visit endpoint evidence now present | `backend/src/routes/grants.ts`, `backend/src/controllers/grants.ts`, grant serializers/tests, plus `backend/src/controllers/me.ts` and `backend/tests/postVisitReport.test.ts` for post-visit report | `PROGRESS.md` Session 20 records real grant APIs, prerequisite enforcement, backend tests, and full backend suite; Session 21 (`INT-GRANT-001`) verifies the real linked conference/grant flow; Session 43 verifies `/api/v1/me/applications/:id/post-visit-report` through real flow | `passes: true` | The original implementation entry left post-visit report outside its first backend slice, but current repository and later verification now cover that missing part. |
| `FE-PORTAL-001` | Implemented | `frontend/src/pages/MyApplications.tsx`, `frontend/src/features/dashboard/*`, portal homepage view model, applicant detail UI, later grant-result/post-visit detail behavior | `PROGRESS.md` Session 24 records `/portal` and `/me/applications` UI with tests/build; later follow-ups add applicant detail parity and workspace contract fixes; Sessions 43-44 (`INT-PORTAL-001` close-out) verify released result + post-visit report in real flow and browser | `passes: true` | The feature was initially complete at MVP scope, but released-result semantics and browser proof arrived later. Those later proofs now justify backfilling `true`. |
| `BE-PORTAL-001` | Implemented | `backend/src/controllers/me.ts`, `backend/src/routes/me.ts`, `backend/src/serializers/applicationDashboard.ts`, `backend/tests/meApplications.test.ts` | `PROGRESS.md` Session 23 records `GET /api/v1/me/applications` with backend tests + smoke; later REVIEW/PORTAL follow-ups add released-decision semantics and Session 43-44 verify real dashboard/detail/released-result/post-visit-report behavior | `passes: true` | This entry was originally blocked on later decision-release semantics. That ambiguity is now resolved by the subsequent review + portal integration evidence, so leaving it `false` would be misleading. |

## 3. Why no item stays `passes: false`

None of the `8` legacy items remain `false`, because none of them are currently in the state of:

- code missing from the repository
- only mock-level evidence and no later real integration evidence
- known unverified MVP scope that still maps cleanly to the old feature-list item

The unresolved work that still exists today is no longer feature-list work. It belongs to the post-MVP execution layer instead.

## 4. Remaining real risks that are not feature-list `passes` gaps

These are still real and should not be hidden, but they should also not keep old MVP implementation items at `passes: false`:

- `DR-004` / `PMB-004`: full `d0` rehearsal still needs to be executed as an operational acceptance activity
- `DR-005` / `PMB-005`: hosted preview reseed + smoke is still an ops/runbook verification problem
- `PMB-002` / `PMB-003`: local port and Postgres env-loading contracts needed separate cleanup because environment drift can create false negatives during validation
- preview/demo breadth, hosted recovery, and presenter-safe handoff remain post-MVP readiness concerns rather than missing MVP implementation evidence

## 5. Final state

- `docs/planning/asiamath-feature-list-v4.0-optimized.json` now has `0` remaining `passes: false`
- the frozen MVP feature list is now internally consistent with the current repository reality
- future readiness tracking should stay in post-MVP planning artifacts, not by leaving legacy implementation entries artificially red
