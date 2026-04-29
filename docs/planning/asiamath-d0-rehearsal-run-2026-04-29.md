# Asiamath d0 Rehearsal Run

> Date: 2026-04-29  
> Owner: `DR-004` local rehearsal execution result  
> Source checklist: `docs/planning/asiamath-d0-rehearsal-checklist-2026-04-29.md`

## Outcome

This local rehearsal did **not** fully pass.

What did pass:

- `acceptance / real-flow` mode was used consistently for the whole run.
- preflight build, seed, backend start, frontend start, and health checks succeeded after switching this machine to the documented `5433` local override.
- the showcase applicant main story was walked end to end:
  - `/portal`
  - `/conferences`
  - conference detail
  - auth handoff to login
  - showcase applicant login
  - `/me/applications`
  - released conference result detail
  - released accepted grant result detail with submitted post-visit report
- public `/portal`, `/conferences`, `/grants`, `/scholars`, public scholar detail, and `portal -> conferences -> detail -> conferences -> portal` regression all passed.
- organizer queue and organizer detail were reachable, and `detail -> back to queue` worked.

What did not pass:

- reviewer queue had no seeded assignment, so `queue -> detail -> back` could not be exercised.
- multiple rendered CTAs/links did not navigate when clicked during browser rehearsal even though the target route existed and direct `open <href>` worked.
- clean applicant `/me/applications` empty state used section-level public browse CTAs instead of the checklist's older unified `Browse opportunities` wording.

Because the role-workspace extension checks were not fully completed and navigation regressions were observed, the recommended next step is `DR-006 blocker fix`, not `DR-005`.

## Handoff Fields

| Field | Value |
|---|---|
| Date / Time | `2026-04-29 16:09:22 CST` |
| Operator | `Codex` |
| Branch | `codex/demo-d0-postgres-deploy` |
| Commit SHA | `7443fdeb95c2249ef66f9e3e232d915b3c2528d6` |
| Mode | `acceptance / real-flow` |
| Frontend URL | `http://127.0.0.1:5175` |
| Backend URL | `http://127.0.0.1:3001` |
| DB Port | `5433` local override |
| Seed Command Run | `DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5433/asiamath_dev?schema=public TEST_DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5433/asiamath_test?schema=public npm run seed:demo` |
| Accounts Used | `demo.showcase.applicant@asiamath.org`, `demo.applicant@asiamath.org`, `demo.reviewer@asiamath.org`, `demo.organizer@asiamath.org` |
| P0 Count | `0` |
| P1 Count | `2` |
| P2 Count | `1` |
| Screenshots Folder | `tmp/rehearsal/2026-04-29/` |
| Blocking Questions | `No admin-capable seeded account was found locally.` |
| Recommended Next Step | `DR-006 blocker fix` |

## Actual Run Contract

Commands actually used:

- `npm run build --workspace backend`
- `DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5433/asiamath_dev?schema=public TEST_DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5433/asiamath_test?schema=public npm run seed:demo`
- `cd backend && PORT=3001 npm run start` with the same `5433` env override
- `VITE_API_BASE_URL="http://127.0.0.1:3001/api/v1" npm run dev --workspace frontend -- --host 127.0.0.1 --port 5175`
- `curl -i http://127.0.0.1:3001/api/v1/auth/me`
- `curl -I http://127.0.0.1:5175`

Preflight observations:

- `backend/.env` existed, but pointed to `127.0.0.1:5432`.
- Running `npm run seed:demo` against `5432` failed with `Can't reach database server at 127.0.0.1:5432`.
- This machine matched the documented local-exception path, so the run was continued with a shell-only `5433` override for both `DATABASE_URL` and `TEST_DATABASE_URL`.
- Seed succeeded on `5433`.
- Backend health check returned `401 Unauthorized`, which is the expected unauthenticated response.
- Frontend root returned `200 OK`.

## Account Coverage

| Role / Account | Coverage | Result |
|---|---|---|
| showcase applicant | main story, results, grant post-visit report | `Pass with issues logged below` |
| clean applicant | empty state and public return path | `Partial` |
| reviewer | login, dashboard root, workspace switch, reviewer queue shell | `Partial` |
| organizer | login, organizer dashboard, queue, detail, back chain | `Pass with issue logged below` |
| admin | admin-capable landing | `N/A` |
| governance preview route | `/admin/governance` page-load check | `Pass` |

## Checklist Result Matrix

| Checklist Area | Result | Notes |
|---|---|---|
| 3.1 branch / commit recorded | `Pass` | Branch and SHA captured above. |
| 3.2 env and DB contract | `Pass with local override` | `5432` failed; run continued on documented `5433` override. |
| 3.3 service start and health checks | `Pass` | Backend `3001`, frontend `5175`, health checks returned expected HTTP responses. |
| 3.4 seed and data expectations | `Pass` | Seed reported `publishedConferences=3`, `grants=2`; browser results matched. |
| 3.5 account preparation | `Pass with admin N/A` | Shared demo password `demo123456` worked for seeded applicant/reviewer/organizer accounts. |
| 4.1 showcase applicant portal -> conferences -> detail -> auth handoff | `Pass` | Auth handoff preserved return to the conference-apply context. |
| 4.1 showcase applicant `/me/applications = 4` | `Pass` | Verified four seeded records and status mix. |
| 4.1 released conference result detail + back | `Pass` | Accepted conference result detail opened; `Back to my applications` returned correctly. |
| 4.1 released accepted grant result + report status | `Pass` | Grant result showed `Decision: Awarded` and `Status: submitted`. |
| 4.1 applicant public return affordance | `Fail` | `Restart from portal` did not navigate on click from grant detail. |
| 4.2 clean applicant empty state | `Pass` | No conference applications and no travel grant applications. |
| 4.2 clean applicant public browse CTA | `Fail` | The page used section-level `Browse conferences` / `Browse grants` instead of a unified `Browse opportunities` CTA, and `Browse conferences` did not navigate on click in this run. |
| 5.1 reviewer login and workspace switcher | `Pass` | Reviewer reached applicant root and switched into reviewer workspace. |
| 5.1 reviewer queue -> detail -> back | `Fail` | Queue had no assignments, so detail/back could not be exercised. |
| 5.1 reviewer `Back to portal` and `Account` | `Pass` | Both visible; `Back to portal` worked; `Account` menu expanded correctly. |
| 5.2 organizer landing semantics | `Pass` | Organizer landed on organizer dashboard, not applicant aggregation. |
| 5.2 organizer workspace / queue entry | `Fail` | `Open conference workspace` CTA rendered but did not navigate on click. |
| 5.2 organizer detail -> back | `Pass` | Direct queue/detail route worked; `Back to conference queue` returned correctly. |
| 5.2 organizer `Back to portal` and `Account` | `Pass` | Both visible and usable. |
| 5.3 admin landing | `N/A` | No local admin-capable seeded account found. |
| 5.3 `/admin/governance` | `Pass` | Page opened and clearly stated `Static preview only`. |
| 6 public `/portal` logged-out and logged-in | `Pass` | Both states opened correctly. |
| 6 public `/scholars` directory data | `Pass` | Visible scholars and clusters included `Number Theory`, `PDE`, `Topology`. |
| 6 public scholar detail | `Pass with issue` | Direct URL opened correctly; list click did not navigate. |
| 6 public `/conferences` list | `Pass` | Three published conferences matched the seed contract. |
| 6 public `/grants` list | `Pass` | Two published grants matched the seed contract. |
| 6 public return chain | `Pass` | `portal -> conferences -> detail -> conferences -> portal` worked. |

## Key Observations

### Post-run clarification

- The grant-detail `Restart from portal` shortcut recorded in this run reflected an older demo affordance, not a stable product requirement.
- Current rehearsal interpretation should treat that item as a historical observation from this round, not as a reason to restore the shortcut in applicant detail after the product flow was simplified.
- `R1` should therefore be read as a broader click-navigation regression across still-supported CTA/card surfaces, not as a mandate to keep a detail-page portal reset entry.

### Showcase applicant

- `/me/applications` displayed exactly four seeded records.
- Observed status mix:
  - `Regional Topology Symposium 2026`: `Under review`
  - `Number Theory Collaboration Workshop 2026`: `Accepted`
  - `Applied PDE Exchange 2025`: `Rejected`
  - `Number Theory Collaboration Travel Support 2026`: `Awarded`
- Grant detail body showed:
  - `Decision: Awarded`
  - `Post-visit report`
  - `Status: submitted`
  - `Attendance: Confirmed`

### Clean applicant

- `/me/applications` was empty for both conferences and grants.
- The page offered `Start from published conferences`, `Restart from portal`, `Browse conferences`, and `Browse grants`; later product cleanup confirmed that section-level browse CTAs were acceptable and the older unified `Browse opportunities` wording was the stale part of the checklist.

### Reviewer

- Login succeeded.
- Reviewer account reached shared applicant root at `/dashboard`.
- Workspace switcher showed `Applicant` and `Reviewer`.
- Switching to `/reviewer` succeeded.
- Reviewer queue shell was present, but the page text was `No reviewer assignments yet.`

### Organizer

- Login succeeded.
- Organizer landed on organizer-scoped `/dashboard`.
- Organizer queue route had one queue item:
  - `Portal Browser Acceptance`
- Organizer detail route loaded correctly and showed internal decision state.
- `Back to conference queue` worked.

### Governance preview

- No local admin-capable seeded account was identified.
- `/admin/governance` opened anyway and the body explicitly stated:
  - `Page mode: Static preview`
  - `This surface stays public in the demo`
  - `Static preview only`

## Issue Log

| Issue ID | Priority | Surface / Route | Role / Account | Repro Steps | Expected | Actual | Screenshot Path | Notes / Next Action |
|---|---|---|---|---|---|---|---|---|
| `R1` | `P1` | `/me/applications/:id`, `/me/applications`, `/dashboard`, `/scholars` | showcase applicant, clean applicant, organizer, visitor | `1. Open the route. 2. Click the rendered CTA or card link. 3. Observe URL.` | The clicked link should navigate to its visible target. | Multiple rendered links kept the browser on the same URL after repeated click attempts. Reproduced on the then-visible `Restart from portal` affordance in grant detail, `Browse conferences` in clean applicant empty state, `Open conference workspace` in organizer dashboard, and scholar card links in `/scholars`. Direct `open <href>` worked for the same targets. | `tmp/rehearsal/2026-04-29/r1-restart-from-portal.png` | Investigate a navigation interaction regression across several routed links before re-running `DR-004`. The grant-detail shortcut itself was later confirmed to be an obsolete demo affordance rather than a current product requirement. |
| `R2` | `P1` | `/reviewer` | reviewer | `1. Log in as reviewer. 2. Open /dashboard. 3. Switch to Reviewer. 4. Inspect queue.` | At least one seeded reviewer assignment should exist so `queue -> detail -> back` can be validated. | Reviewer queue loaded with shell controls, but the only content state was `No reviewer assignments yet.` No detail route could be exercised from the queue. | `not captured` | Decide whether `seed:demo` should include at least one reviewer assignment, or mark reviewer detail coverage out of scope for this round. |
| `R3` | `P2` | `/me/applications` | clean applicant | `1. Log in as clean applicant. 2. Open /me/applications. 3. Inspect empty-state CTA wording.` | Applicant-safe public browse CTAs should be self-explanatory and consistent with the current product walkthrough. | The page used multiple CTAs (`Start from published conferences`, `Restart from portal`, `Browse conferences`, `Browse grants`) instead of the checklist's older unified wording. | `not captured` | Cleanup obsolete shortcut copy and align the checklist to current section-level public browse CTA expectations. |

## Priority Summary

- `P0`: `0`
- `P1`: `2`
- `P2`: `1`

## Recommendation

Recommended next step: `DR-006 blocker fix`

Reason:

- The applicant main story is strong enough to prove the core `d0-story`.
- But this round did not satisfy the full local rehearsal success standard because:
  - reviewer sample touchpoint could not complete `queue -> detail -> back`
  - multiple on-page navigation affordances did not navigate when clicked
  - clean applicant empty-state CTA behavior diverged from the checklist

Do **not** move directly to `DR-005` as if local rehearsal is fully green. Fix the `P1` issues first, then re-run `DR-004`.
