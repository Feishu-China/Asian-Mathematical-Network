# Portal Homepage UI Priority Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the current homepage’s most visible UI problems in priority order: readability, hero hierarchy, palette quality, and public masthead consistency.

**Architecture:** Keep the existing route structure, homepage data model, and section order. Constrain the work to presentation-layer adjustments on `/portal`, shared public masthead styling, and the minimal homepage markup changes needed to support a cleaner hierarchy.

**Tech Stack:** React 19, React Router 7, TypeScript, Vite, Vitest, React Testing Library, global CSS

---

## Preflight

- Read:
  - `AGENT_HARNESS.md`
  - `PROGRESS.md`
  - `docs/superpowers/specs/2026-04-26-portal-homepage-m4-design.md`
  - `docs/superpowers/specs/2026-04-26-portal-homepage-fidelity-and-return-context-design.md`
  - `docs/superpowers/specs/2026-04-27-portal-homepage-ui-priority-design.md`
- Before code changes, run:

```bash
cd frontend && npm run test:run -- \
  src/pages/Portal.test.tsx \
  src/components/layout/PublicPortalNav.test.tsx \
  src/pages/Schools.test.tsx \
  src/pages/ConferenceDetail.test.tsx
```

Expected: PASS on the current baseline.

- Also run:

```bash
cd frontend && npm run build
```

Expected: PASS.

## File Structure

- `frontend/src/pages/Portal.tsx`
  Remove the hero’s duplicated featured-opportunity card and keep the hero summary informational.
- `frontend/src/pages/Portal.css`
  Rebalance the hero, raise contrast, simplify the effect stack, and unify card / CTA treatment.
- `frontend/src/pages/Portal.test.tsx`
  Lock the updated homepage hierarchy so the hero does not regress into duplicated focal points.
- `frontend/src/components/layout/PublicPortalNav.css`
  Reduce masthead density, lighten the visual weight of the topbar and sign-in button, and keep the nav aligned with the refined homepage palette.
- `frontend/src/styles/tokens.css`
  Introduce explicit dark-surface text tokens and recalibrated navy / stone / accent values for the public-facing surfaces.

## Task 1: Lock The New Hero Hierarchy With Failing Tests

**Files:**
- Modify: `frontend/src/pages/Portal.test.tsx`

- [ ] **Step 1: Add a failing test that removes hero-level opportunity duplication**

Update [`frontend/src/pages/Portal.test.tsx`](/Users/brenda/Projects/Asian-Mathematical-Network/frontend/src/pages/Portal.test.tsx) with a new test like:

```tsx
it('keeps featured opportunity links in the featured section rather than duplicating them inside the hero panel', async () => {
  renderWithRouter(<Portal />, '/portal', '/portal');

  const heroHeading = screen.getByRole('heading', {
    name: /opportunities and scholarly exchange across the asian mathematical network/i,
  });
  const heroSection = heroHeading.closest('section');

  const featuredHeading = await screen.findByRole('heading', {
    name: /featured opportunities/i,
  });
  const featuredSection = featuredHeading.closest('section');

  expect(heroSection).not.toBeNull();
  expect(featuredSection).not.toBeNull();
  expect(
    within(heroSection as HTMLElement).queryByRole('link', { name: 'Asiamath 2026 Workshop' })
  ).not.toBeInTheDocument();
  expect(
    within(featuredSection as HTMLElement).getByRole('link', { name: 'Asiamath 2026 Workshop' })
  ).toHaveAttribute('href', '/conferences/asiamath-2026-workshop');
});
```

- [ ] **Step 2: Run the homepage test and confirm it fails**

Run:

```bash
cd frontend && npm run test:run -- src/pages/Portal.test.tsx
```

Expected: FAIL because the homepage still renders the first featured opportunity inside the hero panel.

## Task 2: Implement P0 Contrast Repair And P1 Hero Simplification

**Files:**
- Modify: `frontend/src/pages/Portal.tsx`
- Modify: `frontend/src/pages/Portal.css`

- [ ] **Step 1: Remove the nested hero feature card from the hero panel**

In [`frontend/src/pages/Portal.tsx`](/Users/brenda/Projects/Asian-Mathematical-Network/frontend/src/pages/Portal.tsx), remove this block from the summary panel:

```tsx
{homepageModel.featuredOpportunities[0] ? (
  <article className="portal-home__hero-feature surface-card">
    ...
  </article>
) : null}
```

Keep the summary note and the summary list. Do not move the featured opportunity into another hero subcomponent in this task.

- [ ] **Step 2: Raise hero readability and reduce atmospheric noise**

In [`frontend/src/pages/Portal.css`](/Users/brenda/Projects/Asian-Mathematical-Network/frontend/src/pages/Portal.css), replace the hero-level contrast strategy with explicit dark-surface tokens and lower-noise effects. The resulting shape should look like:

```css
.portal-home__hero {
  background:
    radial-gradient(circle at top center, rgba(184, 144, 58, 0.14), transparent 34%),
    linear-gradient(180deg, var(--color-navy-950) 0%, #14284a 100%);
}

.portal-home__hero::before {
  background-image:
    linear-gradient(rgba(255, 255, 255, 0.025) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.025) 1px, transparent 1px);
}

.portal-home__hero h1 {
  max-width: 13.5ch;
  color: var(--color-text-on-dark);
}

.portal-home__lede,
.portal-home__summary-note,
.portal-home__stats dt {
  color: var(--color-text-on-dark-muted);
}
```

Also remove the now-unused `.portal-home__hero-feature*` rules from the stylesheet.

- [ ] **Step 3: Rebalance hero proportions**

Still in [`frontend/src/pages/Portal.css`](/Users/brenda/Projects/Asian-Mathematical-Network/frontend/src/pages/Portal.css), shift the hero grid and spacing so the headline remains dominant without over-consuming the viewport:

```css
.portal-home__hero {
  grid-template-columns: minmax(0, 1.6fr) minmax(280px, 0.78fr);
  gap: clamp(1.5rem, 3vw, 3rem);
  padding: clamp(4rem, 7vw, 5.4rem) clamp(1.25rem, 3vw, 2rem) clamp(2.7rem, 5vw, 3.5rem);
}

.portal-home__hero-panel {
  padding: clamp(1.2rem, 2.4vw, 1.6rem);
}
```

Do not change section order or the CTA labels in this task.

- [ ] **Step 4: Run the homepage test again**

Run:

```bash
cd frontend && npm run test:run -- src/pages/Portal.test.tsx
```

Expected: PASS.

## Task 3: Recalibrate Palette And Unify Public Component Language

**Files:**
- Modify: `frontend/src/styles/tokens.css`
- Modify: `frontend/src/pages/Portal.css`

- [ ] **Step 1: Add explicit dark-surface text tokens**

In [`frontend/src/styles/tokens.css`](/Users/brenda/Projects/Asian-Mathematical-Network/frontend/src/styles/tokens.css), add:

```css
  --color-text-on-dark: #f5f0e7;
  --color-text-on-dark-muted: rgba(245, 240, 231, 0.78);
  --color-accent-on-dark: #e3c980;
```

Recalibrate these existing values so the public surfaces feel cleaner:

```css
  --color-navy-950: #0c1830;
  --color-navy-900: #13233f;
  --color-accent: #b68a2f;
  --surface-canvas: #f7f3ec;
  --surface-muted: #f1eadf;
```

- [ ] **Step 2: Unify the public card grammar**

In [`frontend/src/pages/Portal.css`](/Users/brenda/Projects/Asian-Mathematical-Network/frontend/src/pages/Portal.css), make the lower homepage cards use the same light-surface grammar:

```css
.portal-home__card,
.portal-home__school-card,
.portal-home__scholars .scholar-summary-card,
.portal-home__scholars .scholar-cluster-card {
  border: 1px solid rgba(15, 31, 61, 0.12);
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.92);
  box-shadow: 0 10px 24px rgba(15, 26, 45, 0.05);
}
```

Do not introduce a second translucent-card style outside the hero.

- [ ] **Step 3: Normalize CTA rhythm**

Still in [`frontend/src/pages/Portal.css`](/Users/brenda/Projects/Asian-Mathematical-Network/frontend/src/pages/Portal.css), make the hero CTAs read as one system:

```css
.conference-primary-link,
.portal-home__secondary-link {
  min-height: 46px;
  border-radius: 999px;
}

.portal-home__secondary-link {
  background: rgba(255, 255, 255, 0.06);
  border-color: rgba(255, 255, 255, 0.2);
}
```

The goal is matching rhythm, not identical fill treatment.

- [ ] **Step 4: Run targeted homepage regression**

Run:

```bash
cd frontend && npm run test:run -- src/pages/Portal.test.tsx
```

Expected: PASS.

## Task 4: Lighten Masthead Weight Without Reworking Navigation

**Files:**
- Modify: `frontend/src/components/layout/PublicPortalNav.css`

- [ ] **Step 1: Reduce topbar prominence**

In [`frontend/src/components/layout/PublicPortalNav.css`](/Users/brenda/Projects/Asian-Mathematical-Network/frontend/src/components/layout/PublicPortalNav.css), soften the topbar:

```css
.portal-nav__topbar {
  color: rgba(255, 255, 255, 0.62);
}

.portal-nav__topbar-inner {
  min-height: 1.9rem;
  padding-block: 0.35rem;
}
```

Keep the links and copy in place. Do not remove topbar items in this pass.

- [ ] **Step 2: Reduce nav visual heaviness**

Adjust the public nav so it feels more refined than bulky:

```css
.portal-nav__bar {
  background: rgba(247, 243, 236, 0.94);
}

.portal-nav__inner {
  min-height: 3.75rem;
}

.portal-nav__primary {
  min-height: 2.5rem;
  padding: 0.58rem 0.95rem;
  border-radius: 0.4rem;
}
```

Also slightly reduce `portal-nav__link` padding so the nav breathes better before the hero.

- [ ] **Step 3: Run the shared public-shell regression**

Run:

```bash
cd frontend && npm run test:run -- \
  src/components/layout/PublicPortalNav.test.tsx \
  src/pages/Schools.test.tsx \
  src/pages/ConferenceDetail.test.tsx
```

Expected: PASS.

## Task 5: Final Verification And Browser Acceptance

**Files:**
- No source edits expected unless verification reveals a regression

- [ ] **Step 1: Run the combined verification set**

Run:

```bash
cd frontend && npm run test:run -- \
  src/pages/Portal.test.tsx \
  src/components/layout/PublicPortalNav.test.tsx \
  src/pages/Schools.test.tsx \
  src/pages/ConferenceDetail.test.tsx
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

- `/portal`
- `/schools`

Acceptance checklist:

- the hero headline is immediately readable
- the hero now has one clear primary focal point
- the right-side panel reads as support, not as a competing feature block
- the `Browse Conferences` and `Explore Travel Grants` buttons feel like one CTA family
- the masthead feels quieter than the current version
- no console/runtime errors appear while navigating

- [ ] **Step 4: Update handoff docs**

Append the implementation outcome and verification summary to:

- `PROGRESS.md`

Do not modify unrelated planning artifacts.
