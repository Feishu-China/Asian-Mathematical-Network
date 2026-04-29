# Asiamath Sprint 1 Closeout

> Date: 2026-04-29  
> Scope: `Sprint 1: Demo Readiness`  
> Baseline branch: `codex/demo-d0-postgres-deploy`

## Outcome

Sprint 1 is now considered `completed`.

The project entered Sprint 1 with a functional MVP but without one stable, repeatable demo baseline.  
Sprint 1's job was to turn that MVP into a `d0` candidate that can be:

- started locally with a documented contract
- reseeded and smoked in hosted preview
- rehearsed against one stable applicant + role-workspace storyline
- handed off to another operator without relying on oral context

That closeout bar is now met.

## Exit Gate Check

| Gate | Status | Evidence |
|---|---|---|
| `d0` baseline explicit | `Pass` | `docs/planning/asiamath-d0-baseline-freeze-2026-04-29.md` |
| local dev / acceptance contract explicit | `Pass` | `README.md`, `docs/planning/asiamath-postgres-dev-test-contract-2026-04-29.md` |
| full local rehearsal completed | `Pass` | `docs/planning/asiamath-d0-rehearsal-run-2026-04-29.md` |
| hosted preview reseed + smoke completed | `Pass` | `docs/planning/asiamath-d0-hosted-smoke-run-2026-04-29.md` |
| no known `P0` demo blocker | `Pass` | original `DR-004` blockers `R1` / `R2` / `R3` all closed in rerun closeout |
| presenter-safe demo kit prepared | `Pass` | `docs/planning/asiamath-demo-kit-d0-2026-04-29.md` |

## Completed Work Map

### `DR-001` / `PMB-001`

- froze `codex/demo-d0-postgres-deploy` as the current `d0` baseline
- documented the temporary split between code trunk and active demo deployment source

Primary references:

- `docs/planning/asiamath-d0-baseline-freeze-2026-04-29.md`
- `docs/planning/asiamath-demo-preview-ops-d0.md`

### `DR-002` / `PMB-002`

- formalized two local modes instead of leaving port drift implicit:
  - default dev: `5173 -> 3000`
  - acceptance / real-flow: `5175 -> 3001`

Primary references:

- `README.md`
- `SMOKE_TEST_CHECKLIST.md`

### `DR-003` / `PMB-003`

- formalized the Postgres dev/test contract
- clarified that `5432` is the official default and `5433` is an allowed local override
- documented env-loading differences between backend runtime, backend tests, and root-level seed/integration scripts

Primary references:

- `docs/planning/asiamath-postgres-dev-test-contract-2026-04-29.md`
- `backend/.env.example`

### `DR-004` / `PMB-004`

- completed the initial local rehearsal
- identified `R1`, `R2`, `R3`
- fixed the blocking product issues
- re-ran the blocker-focused local rehearsal and recorded it as `Pass`

Primary references:

- `docs/planning/asiamath-d0-rehearsal-checklist-2026-04-29.md`
- `docs/planning/asiamath-d0-rehearsal-run-2026-04-29.md`

### `DR-005` / `PMB-005`

- confirmed hosted preview still points at the intended `d0` source branch
- executed real Railway reseed and API/browser smoke
- recorded hosted result as `Pass`

Primary reference:

- `docs/planning/asiamath-d0-hosted-smoke-run-2026-04-29.md`

### `PMB-006`

- cleared the remaining frozen `passes: false` implementation leftovers in the feature list
- confirmed frozen MVP feature list now reads as fully completed

Primary references:

- `docs/planning/asiamath-feature-list-v4.0-optimized.json`
- `docs/planning/asiamath-feature-list-passes-resolution-2026-04-29.md`

### `DR-007` / `PMB-007`

- prepared a presenter-safe demo kit
- fixed the baseline account set, demo sequence, fallback route, and safe claims boundary

Primary reference:

- `docs/planning/asiamath-demo-kit-d0-2026-04-29.md`

## What Changed During Closeout

The most important closure work after the first failed rehearsal was not “new feature work.”  
It was tightening product and demo boundaries:

- reviewer queue now has a seeded assignment for real queue/detail/back verification
- organizer and scholar card entry points were verified as real navigable surfaces
- obsolete applicant-side `Restart from portal` shortcuts were intentionally removed instead of being preserved as fake requirements
- clean applicant empty-state expectations were aligned to current section-level public browse CTAs instead of an outdated unified `Browse opportunities` expectation

## Remaining Caveats

These are not Sprint 1 blockers anymore, but they remain true:

- local database access on this machine may require the documented `5433` override because the host Postgres path is mediated by `colima/lima` SSH forwarding
- browser automation may occasionally emit transport-level CDP route-transition noise even when the resulting page state is correct
- hosted preview still has its own branch/source cutover question; Sprint 1 proves the baseline, not the final deployment governance decision

## Recommended Next Decision

Sprint 1 closeout leaves two legitimate next paths:

1. **Demo / Delivery continuation**
   - use this when external demos remain the immediate priority
   - likely next items: preview branch strategy, mobile polish, operator rehearsal cadence

2. **Return to product growth**
   - use this when the team wants to resume roadmap work from a stable base
   - likely next items: `PMB-008` scholar directory search/filter, `PMB-009` reviewer enablement, `PMB-010` language/state copy unification

The key point is that Sprint 1 no longer needs to stay open.
