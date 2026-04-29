# Demo Seed Breadth And Workflow Enrichment Design

Date: 2026-04-28
Status: Draft for review
Type: Demo data enrichment for `demo/d0`

References:
- `backend/src/lib/demoBaseline.ts`
- `backend/tests/demoBaseline.test.ts`
- `scripts/seed-demo-baseline.mjs`
- `frontend/src/features/portal/homepageViewModel.ts`
- `frontend/src/pages/MyApplications.tsx`
- `frontend/src/features/dashboard/dashboardMappers.ts`
- `packages/shared/src/models.ts`

## 1. Purpose

This design expands the demo seed in a controlled way so the hosted preview feels fuller in two specific dimensions:

1. public opportunity breadth
2. authenticated applicant workflow completeness

The goal is not to add data everywhere. The goal is to make the existing public and applicant-facing routes look intentional during demos without changing the page architecture.

## 2. Current Problem

The current real backend seed is credible but too thin for presentation:

- public opportunity surfaces are anchored by one main conference and one linked grant
- `/portal` has real data but does not yet feel like a populated network with multiple active calls
- `/me/applications` is empty for the clean demo applicant, so a presenter must build all workflow states live
- conference and grant pages prove the architecture works, but they do not yet show much range in timing or decision states

This creates an avoidable tradeoff during demos:

- the clean applicant is good for showing the first-run flow
- the same account is weak for showing a mature system with multiple outcomes already in motion

## 3. Goals

### 3.1 In scope

- enrich the real PostgreSQL-backed seed
- keep the existing clean applicant for first-run walkthroughs
- add one separate showcase applicant with pre-existing application records
- raise the public opportunity count to a medium but still curated level
- introduce one closed opportunity so the public surfaces have time depth, not only open items
- make `/me/applications` and related applicant views immediately useful in a hosted demo

### 3.2 Out of scope

- redesigning public or applicant page layouts
- expanding fake-provider-only breadth modules such as prizes, partners, schools, newsletters, publications, or videos
- adding reviewer assignment or organizer dashboard complexity beyond what is strictly needed for applicant-facing display
- creating a large synthetic dataset

## 4. Core Decision

The preferred approach is:

1. keep the real seed as the source of truth for this round
2. add a small set of carefully chosen conferences, grants, and applicant records
3. separate the demo personas into:
   - a clean applicant for first-run walkthroughs
   - a showcase applicant for pre-seeded workflow states

This is preferred over:

- stuffing the existing clean applicant with pre-existing records
- adding large amounts of fake content to pages that already use the hosted backend
- trying to make every module denser before the core public and applicant storylines are convincing

## 5. Proposed Seed Shape

### 5.1 Demo accounts

Keep the existing three accounts:

- organizer
- reviewer
- clean applicant

Add one new account:

- showcase applicant

The showcase applicant exists only to make applicant-facing surfaces presentation-ready on first login.

### 5.2 Opportunity totals

After seeding, the real opportunity baseline should contain:

- `4` conferences total
- `2` grants total

This gives enough variety for `/portal`, `/conferences`, `/grants`, and detail pages without turning the seed into a maintenance burden.

### 5.3 Conference mix

Use this distribution:

- `3` published conferences that still read as active or upcoming
- `1` closed conference

Recommended shape:

1. keep the existing main conference as the anchor for the primary grant story
2. add one second published conference with no linked grant
3. add one additional published conference that does have a linked grant
4. add one closed conference representing a recently finished or past cycle

This produces visible variety across public lists and applicant records:

- an anchor opportunity
- an extra standalone conference
- a second grant-bearing conference
- a historical closed record

### 5.4 Grant mix

Use this distribution:

- keep the existing linked grant for the main conference
- add one second published grant linked to the second grant-bearing conference

No closed grant is required in this batch. One closed conference is enough to establish time layering without making the seed harder to reason about.

## 6. Workflow State Strategy

### 6.1 Important status mapping

The shared model does not store applicant-facing statuses exactly as `approved` or `rejected`.

The actual backend contract is:

- `application.status = draft | submitted | under_review | decided`
- released outcomes are represented through `decision.finalStatus = accepted | rejected | waitlisted`

For this reason, the display goals map to persistence like this:

- `under_review` demo state
  - `application.status = under_review`
  - no released decision
- `approved` demo state
  - `application.status = decided`
  - `decision.finalStatus = accepted`
  - `decision.releaseStatus = released`
- `rejected` demo state
  - `application.status = decided`
  - `decision.finalStatus = rejected`
  - `decision.releaseStatus = released`

This matches the current applicant list and dashboard mapping logic instead of inventing a new shortcut status.

### 6.2 Showcase applicant records

The showcase applicant should receive pre-existing records that cover these visible states:

- one conference application in `under_review`
- one conference application with a released `accepted` outcome
- one conference application with a released `rejected` outcome
- one grant application with a released `accepted` outcome

The fourth record is intentional, not accidental. A convincing approved grant story should be attached to a legitimate conference participation path rather than appearing as an isolated grant artifact.

## 7. Time And Status Design

The dates must feel internally consistent, not random.

### 7.1 Active and upcoming opportunities

Active or upcoming published conferences should satisfy at least one of these conditions:

- application deadline still in the future
- event date still in the future
- status remains `published`

### 7.2 Closed opportunity

The closed conference should feel like a recently completed or finished cycle:

- deadline already passed
- event dates in the past or clearly finished
- status explicitly `closed`
- optional released rejection can attach to this record naturally

### 7.3 Approved path

The approved path should read like a coherent success story:

- accepted conference application on a published conference
- accepted linked grant on the same story line
- release dates after submission dates

### 7.4 Under-review path

The under-review path should sit on a currently open or recently active conference so the reviewer/organizer processing state feels believable.

## 8. Expected UI Effects

### 8.1 `/portal`

The homepage summary and opportunity rails should benefit immediately:

- more open conferences
- more than one grant
- visible mix of conference and grant stories
- one closed record excluded from open counters but still part of the broader opportunity universe

This should make the portal look like a network with multiple live calls rather than a single demo thread.

### 8.2 `/conferences` and conference detail

These views should stop feeling single-purpose:

- multiple published conference cards
- one closed item for realism
- at least two independent detail narratives
- a clearer distinction between conferences that do and do not unlock linked grants

### 8.3 `/grants`

The grant list should no longer depend on one seeded item carrying the whole story.

### 8.4 `/me/applications`

This is the main workflow win:

- the clean applicant still starts empty
- the showcase applicant lands on a full applicant record list
- visible states include `Under review`, `Accepted`, and `Rejected`
- detail navigation becomes presentation-ready without requiring a live create-submit-decide sequence first

## 9. File-Level Change Boundary

### 9.1 Expected to change

- `backend/src/lib/demoBaseline.ts`
- `backend/tests/demoBaseline.test.ts`
- optionally small supporting backend tests if they currently assume a single seeded opportunity

### 9.2 Expected not to change in this batch

- page component architecture
- frontend routing
- fake-provider-only breadth content modules
- deployment configuration

## 10. Validation Requirements

This batch is only complete when all of the following are true:

1. the seed remains deterministic and idempotent
2. the clean applicant still has no pre-existing application records
3. the showcase applicant receives the intended pre-seeded records
4. seeded opportunity counts are stable at `4` conferences and `2` grants
5. at least one conference is `closed`
6. released `accepted` and `rejected` decisions surface correctly through applicant-facing list mapping
7. hosted preview smoke confirms that:
   - `/portal` shows richer opportunity coverage
   - `/conferences` and `/grants` show the new breadth
   - `/me/applications` is visibly populated for the showcase applicant

## 11. Recommendation

Implement the medium seed expansion exactly as scoped above:

- `4` conferences
- `2` grants
- `1` new showcase applicant
- one clean applicant retained
- one closed conference
- pre-seeded `under_review`, released `accepted`, and released `rejected` application states

This is the smallest real-data expansion that materially improves presentation quality across both the public and authenticated demos.
