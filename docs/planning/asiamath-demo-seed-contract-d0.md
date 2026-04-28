# Asiamath Demo Seed Contract d0

## Purpose

Define the stable contract for the real PostgreSQL-backed `d0` demo seed so future demo changes can preserve the intended story instead of blindly adding or removing records.

This file answers:

- which demo accounts are intentional
- which opportunities are intentionally seeded
- which workflow states should already exist after reseed
- which records are expected to appear in public pages vs authenticated pages

## Design Goals

The `d0` demo seed should support two different presentation needs at the same time:

- a clean applicant path that can start from zero
- a preloaded showcase path that can immediately demonstrate workflow outcomes

The seed is intentionally not "maximal realism". It is shaped to make the hosted preview easy to present.

## Stable Accounts

| Key | Email | Intended use |
|---|---|---|
| `organizer` | `demo.organizer@asiamath.org` | Internal organizer context and ownership |
| `reviewer` | `demo.reviewer@asiamath.org` | Public reviewer/scholar context |
| `applicant` | `demo.applicant@asiamath.org` | Clean applicant walkthrough from zero applications |
| `showcaseApplicant` | `demo.showcase.applicant@asiamath.org` | Ready-made workflow demo with seeded application states |

## Stable Opportunity Set

### Conferences

| Slug | Title | Status | Purpose |
|---|---|---|---|
| `integration-grant-conf-2026` | `Integration Grant Conference 2026` | `published` | Primary conference used by older integration scripts and clean applicant walkthroughs |
| `regional-topology-symposium-2026` | `Regional Topology Symposium 2026` | `published` | Under-review showcase path |
| `number-theory-collaboration-workshop-2026` | `Number Theory Collaboration Workshop 2026` | `published` | Released accepted conference path and linked accepted grant path |
| `applied-pde-exchange-2025` | `Applied PDE Exchange 2025` | `closed` | Released rejected conference path |

### Grants

| Slug | Title | Status | Linked conference | Purpose |
|---|---|---|---|---|
| `integration-grant-2026-travel-support` | `Integration Grant 2026 Travel Support` | `published` | `integration-grant-conf-2026` | Primary grant used by older integration scripts and clean applicant flows |
| `number-theory-collaboration-travel-support-2026` | `Number Theory Collaboration Travel Support 2026` | `published` | `number-theory-collaboration-workshop-2026` | Released accepted grant path with post-visit report already submitted |

## Why One Published Conference Uses Past Dates

`number-theory-collaboration-workshop-2026` is intentionally still `published` even though its dates are earlier in the year.

Reason:

- the public demo needs more than one visible conference
- the applicant demo needs a credible accepted conference and accepted grant with follow-up reporting
- keeping this record `published` preserves public breadth while also supporting the completed workflow story

This is a presentational tradeoff, not a domain-ideal rule.

## Workflow Contract

### Clean applicant

After `npm run seed:demo`:

- `demo.applicant@asiamath.org` must have `0` applications

This account is reserved for:

- conference application from scratch
- grant application from scratch
- showing an empty `/me/applications` starting point

### Showcase applicant

After `npm run seed:demo`:

- `demo.showcase.applicant@asiamath.org` must have `4` applications

Expected records:

1. `Regional Topology Symposium 2026`
   - type: `conference_application`
   - application status: `under_review`
   - no released decision

2. `Number Theory Collaboration Workshop 2026`
   - type: `conference_application`
   - application status: `decided`
   - released decision final status: `accepted`

3. `Applied PDE Exchange 2025`
   - type: `conference_application`
   - application status: `decided`
   - released decision final status: `rejected`

4. `Number Theory Collaboration Travel Support 2026`
   - type: `grant_application`
   - application status: `decided`
   - released decision final status: `accepted`
   - `post_visit_report_status = submitted`

## Decision Semantics

Accepted or rejected outcomes are not represented only by `applications.status`.

For a released result surface, the seed should model:

- `application.status = decided`
- `decision.finalStatus = accepted | rejected`
- `decision.releaseStatus = released`

This matters because applicant-facing surfaces use `releaseStatus` to decide whether the result is visible.

## Public Visibility Rules

The current public controllers only return `published` conferences and grants.

Operational consequence:

- the seed count is `4` conferences total
- only `3` conferences should appear on public `/conferences`
- the `closed` conference exists for applicant realism, not public-list breadth

This is expected and should not be "fixed" by adding more public-only duplicates unless product scope changes.

## Backward Compatibility Rules

Older integration scripts still rely on one primary conference and one primary grant.

To avoid breaking those scripts, `ensureDemoBaseline()` should keep returning:

- `fixture.conference`
- `fixture.grant`

These anchors must continue to point to:

- `integration-grant-conf-2026`
- `integration-grant-2026-travel-support`

The expanded contract adds, but does not replace:

- `fixture.conferences`
- `fixture.grants`
- `summary.counts`
- `summary.accounts.showcaseApplicant`

## Reset and Idempotence Rules

`npm run seed:demo` should be safe to rerun repeatedly.

A rerun must:

- preserve the same account emails
- preserve the same opportunity slugs
- restore the clean applicant to zero applications
- restore the showcase applicant to the four seeded workflow records
- restore the accepted grant record with a submitted post-visit report

## Quick Validation Checklist

After changing `backend/src/lib/demoBaseline.ts`, verify:

1. `ensureDemoBaseline()` still returns the primary `conference` and `grant`.
2. `summary.counts` reports:
   - `conferences: 4`
   - `publishedConferences: 3`
   - `closedConferences: 1`
   - `grants: 2`
3. `demo.applicant@asiamath.org` still has zero applications.
4. `demo.showcase.applicant@asiamath.org` still has the four expected workflow records.
5. Public `/conferences` still shows only the three `published` conferences.
6. Public `/grants` still shows the two `published` grants.

## Change Rule

If a future demo change needs more seed breadth, change this contract first.

Do not add records just because a page looks sparse.

Every added seed record should have one of these roles:

- public breadth
- clean walkthrough support
- showcase workflow support
- backward compatibility for existing real-flow scripts
