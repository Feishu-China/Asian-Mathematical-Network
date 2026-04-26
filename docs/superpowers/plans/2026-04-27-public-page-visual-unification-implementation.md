# Public Page Visual Unification Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Unify the public browse page bodies so secondary public routes feel like the same site as `/portal` while staying distinct from authenticated workspace surfaces.

**Architecture:** Keep `PortalShell` as the route shell for visitor-facing pages and add a shared public-browse style layer instead of letting each page CSS file maintain its own near-duplicate card and grid rules. Roll the work out in two phases: the primary opportunity chain first, then secondary breadth surfaces.

**Tech Stack:** React 19, React Router 7, TypeScript, Vite, Vitest, React Testing Library, global CSS

---

## Preflight

- Read:
  - `AGENT_HARNESS.md`
  - `PROGRESS.md`
  - `docs/superpowers/specs/2026-04-27-public-page-visual-unification-design.md`
  - `docs/superpowers/specs/2026-04-27-portal-homepage-ui-priority-design.md`
- Before code changes, run:

```bash
cd frontend && npm run test:run -- \
  src/pages/Conferences.test.tsx \
  src/pages/Grants.test.tsx \
  src/pages/Schools.test.tsx \
  src/pages/Scholars.test.tsx \
  src/pages/Prizes.test.tsx \
  src/pages/Newsletters.test.tsx \
  src/pages/Publications.test.tsx \
  src/pages/Videos.test.tsx \
  src/pages/Partners.test.tsx \
  src/pages/Governance.test.tsx \
  src/pages/Outreach.test.tsx
```

Expected: PASS on the current baseline.

- Also run:

```bash
cd frontend && npm run build
```

Expected: PASS.

## File Structure

- Create: `frontend/src/styles/public-browse.css`
  Shared visual primitives for public browse pages: header adjustments, grid rhythm, shared cards, shared meta rows, shared teaser/aside cards, and shared link hierarchy.
- Modify: `frontend/src/index.css`
  Import the shared public-browse style layer.
- Modify: `frontend/src/styles/layout.css`
  Refine `PortalShell` header rhythm for public pages if required by the shared browse design.
- Modify: `frontend/src/styles/components.css`
  Add or refine shared public CTA and helper styles only if the new public-browse layer cannot express them cleanly alone.
- Modify: `frontend/src/pages/Conference.css`
  Convert conference list/detail pages to the shared public-browse primitives and keep only route-specific layout rules.
- Modify: `frontend/src/pages/School.css`
  Do the same for schools.
- Modify: `frontend/src/pages/Prize.css`
  Do the same for prizes.
- Modify: `frontend/src/pages/Scholars.css`
  Align the scholar directory and cluster cards with the shared public-browse grammar.
- Modify: `frontend/src/pages/Newsletter.css`
  Replace the older fallback-token card system with shared public-browse primitives.
- Modify: `frontend/src/pages/Publication.css`
  Same as newsletter.
- Modify: `frontend/src/pages/Video.css`
  Same as newsletter.
- Modify: `frontend/src/pages/Partner.css`
  Same as newsletter.
- Modify: `frontend/src/pages/Governance.css`
  Align governance preview cards with the same public-body language.
- Modify: `frontend/src/pages/Outreach.css`
  Same as newsletter.
- Modify: route-level tests under `frontend/src/pages/*.test.tsx`
  Add assertions that prove the public pages use the unified structural affordances.

## Task 1: Add Shared Public-Browse Contract Tests

**Files:**
- Modify: `frontend/src/pages/Conferences.test.tsx`
- Modify: `frontend/src/pages/Prizes.test.tsx`
- Modify: `frontend/src/pages/Newsletters.test.tsx`

- [ ] **Step 1: Add a primary-chain header/card contract test**

Extend [`frontend/src/pages/Conferences.test.tsx`](/Users/brenda/Projects/Asian-Mathematical-Network/frontend/src/pages/Conferences.test.tsx) with a test that asserts:

- the page still renders the shared `Public sections` masthead
- the page title is present
- at least one list card shows its metadata row and CTA

The test should use existing accessible text rather than CSS selectors.

- [ ] **Step 2: Add a detail/hub contract test for prizes**

Extend [`frontend/src/pages/Prizes.test.tsx`](/Users/brenda/Projects/Asian-Mathematical-Network/frontend/src/pages/Prizes.test.tsx) so the route proves:

- hub copy remains present
- archive cards remain present
- detail side teaser links still exist

This locks the layout content that must survive the CSS consolidation.

- [ ] **Step 3: Add a secondary-surface contract test**

Extend [`frontend/src/pages/Newsletters.test.tsx`](/Users/brenda/Projects/Asian-Mathematical-Network/frontend/src/pages/Newsletters.test.tsx) with a test that proves the page still exposes:

- the shared public masthead
- its archive title
- at least one archive-card CTA

- [ ] **Step 4: Run the targeted tests and confirm they still pass before refactor**

Run:

```bash
cd frontend && npm run test:run -- \
  src/pages/Conferences.test.tsx \
  src/pages/Prizes.test.tsx \
  src/pages/Newsletters.test.tsx
```

Expected: PASS. These are contract tests for the structural content that must remain stable while styles are consolidated.

## Task 2: Introduce The Shared Public-Browse Style Layer

**Files:**
- Create: `frontend/src/styles/public-browse.css`
- Modify: `frontend/src/index.css`
- Modify: `frontend/src/styles/layout.css`

- [ ] **Step 1: Create a shared stylesheet for public browse pages**

Create [`frontend/src/styles/public-browse.css`](/Users/brenda/Projects/Asian-Mathematical-Network/frontend/src/styles/public-browse.css) with shared primitives such as:

- `.public-browse-page`
- `.public-browse-grid`
- `.public-browse-card`
- `.public-browse-meta`
- `.public-browse-copy`
- `.public-browse-link`
- `.public-browse-aside-card`
- `.public-browse-list`

The shared rules should define:

- consistent grid gaps
- consistent light-surface card treatment
- consistent title and metadata rhythm
- consistent teaser sidebar treatment

- [ ] **Step 2: Import the new shared stylesheet globally**

In [`frontend/src/index.css`](/Users/brenda/Projects/Asian-Mathematical-Network/frontend/src/index.css), add:

```css
@import './styles/public-browse.css';
```

Place it after `layout.css` and before `components.css` so page-level CSS can still override it when necessary.

- [ ] **Step 3: Refine `PortalShell` public header rhythm if needed**

In [`frontend/src/styles/layout.css`](/Users/brenda/Projects/Asian-Mathematical-Network/frontend/src/styles/layout.css), make only the public-shell-safe refinements needed for body unification:

- tighten public header spacing slightly
- ensure title/description widths remain consistent
- avoid changes that would unintentionally restyle `WorkspaceShell`

- [ ] **Step 4: Run a narrow regression**

Run:

```bash
cd frontend && npm run test:run -- \
  src/pages/Conferences.test.tsx \
  src/pages/Newsletters.test.tsx
```

Expected: PASS.

## Task 3: Phase 1 Unify The Primary Public Browse Chain

**Files:**
- Modify: `frontend/src/pages/Conference.css`
- Modify: `frontend/src/pages/School.css`
- Modify: `frontend/src/pages/Prize.css`
- Modify: `frontend/src/pages/Scholars.css`

- [ ] **Step 1: Convert conference list/detail pages to shared primitives**

Refactor [`frontend/src/pages/Conference.css`](/Users/brenda/Projects/Asian-Mathematical-Network/frontend/src/pages/Conference.css) so:

- list grids use the shared browse grid rhythm
- list cards and detail cards align with the shared card grammar
- route-specific rules remain only for conference-specific content structures such as `dl` blocks or apply teasers

- [ ] **Step 2: Convert schools and prizes**

Refactor:

- [`frontend/src/pages/School.css`](/Users/brenda/Projects/Asian-Mathematical-Network/frontend/src/pages/School.css)
- [`frontend/src/pages/Prize.css`](/Users/brenda/Projects/Asian-Mathematical-Network/frontend/src/pages/Prize.css)

Goals:

- remove duplicated card and grid values
- align detail sidecards and teaser cards with the shared public-aside language
- preserve route-specific content rules such as outline lists or prize signal lists

- [ ] **Step 3: Convert scholar directory**

Refactor [`frontend/src/pages/Scholars.css`](/Users/brenda/Projects/Asian-Mathematical-Network/frontend/src/pages/Scholars.css) so scholar cards and expertise-cluster cards feel like the same family as the other Phase 1 browse cards while preserving keyword chips and directory-specific structure.

- [ ] **Step 4: Run Phase 1 regression**

Run:

```bash
cd frontend && npm run test:run -- \
  src/pages/Conferences.test.tsx \
  src/pages/Grants.test.tsx \
  src/pages/Schools.test.tsx \
  src/pages/Scholars.test.tsx \
  src/pages/Prizes.test.tsx \
  src/pages/ConferenceDetail.test.tsx \
  src/pages/ScholarProfile.test.tsx
```

Expected: PASS.

## Task 4: Phase 2 Unify Secondary Breadth Surfaces

**Files:**
- Modify: `frontend/src/pages/Newsletter.css`
- Modify: `frontend/src/pages/Publication.css`
- Modify: `frontend/src/pages/Video.css`
- Modify: `frontend/src/pages/Partner.css`
- Modify: `frontend/src/pages/Governance.css`
- Modify: `frontend/src/pages/Outreach.css`

- [ ] **Step 1: Remove fallback-token card systems**

Refactor:

- [`frontend/src/pages/Newsletter.css`](/Users/brenda/Projects/Asian-Mathematical-Network/frontend/src/pages/Newsletter.css)
- [`frontend/src/pages/Publication.css`](/Users/brenda/Projects/Asian-Mathematical-Network/frontend/src/pages/Publication.css)
- [`frontend/src/pages/Video.css`](/Users/brenda/Projects/Asian-Mathematical-Network/frontend/src/pages/Video.css)
- [`frontend/src/pages/Partner.css`](/Users/brenda/Projects/Asian-Mathematical-Network/frontend/src/pages/Partner.css)
- [`frontend/src/pages/Outreach.css`](/Users/brenda/Projects/Asian-Mathematical-Network/frontend/src/pages/Outreach.css)

Replace fallback variables like `--surface-bg`, `--surface-border`, `--text-muted`, and `--brand-strong` with the shared token system plus the new public-browse primitives.

- [ ] **Step 2: Align governance preview**

Refactor [`frontend/src/pages/Governance.css`](/Users/brenda/Projects/Asian-Mathematical-Network/frontend/src/pages/Governance.css) so governance cards and teaser cards use the same public-browse body treatment rather than a separate sparse grammar.

- [ ] **Step 3: Run Phase 2 regression**

Run:

```bash
cd frontend && npm run test:run -- \
  src/pages/Newsletters.test.tsx \
  src/pages/Publications.test.tsx \
  src/pages/Videos.test.tsx \
  src/pages/Partners.test.tsx \
  src/pages/Governance.test.tsx \
  src/pages/Outreach.test.tsx
```

Expected: PASS.

## Task 5: Final Verification And Browser Acceptance

**Files:**
- Modify: `PROGRESS.md`

- [ ] **Step 1: Run the combined public-page verification set**

Run:

```bash
cd frontend && npm run test:run -- \
  src/pages/Conferences.test.tsx \
  src/pages/Grants.test.tsx \
  src/pages/Schools.test.tsx \
  src/pages/Scholars.test.tsx \
  src/pages/Prizes.test.tsx \
  src/pages/Newsletters.test.tsx \
  src/pages/Publications.test.tsx \
  src/pages/Videos.test.tsx \
  src/pages/Partners.test.tsx \
  src/pages/Governance.test.tsx \
  src/pages/Outreach.test.tsx
```

Expected: PASS.

- [ ] **Step 2: Run production build**

Run:

```bash
cd frontend && npm run build
```

Expected: PASS.

- [ ] **Step 3: Browser acceptance**

With the local dev server running, inspect:

- `/conferences`
- `/schools`
- `/prizes`
- `/newsletter`

Acceptance checklist:

- each route clearly belongs to the same public site as `/portal`
- no secondary page looks like a dashboard or unrelated template
- cards, metadata, and teaser sidebars feel related across routes
- the homepage still remains visually stronger than the secondary pages
- no runtime or navigation regressions appear

- [ ] **Step 4: Update handoff docs**

Append the implementation outcome and verification summary to:

- `PROGRESS.md`

Do not touch unrelated planning artifacts.
