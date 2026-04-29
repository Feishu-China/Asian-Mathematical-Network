# Portal Homepage Fidelity And Return-Context Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Raise `/portal` to a high-fidelity implementation close to the approved HTML reference and repair public return-context continuity from portal navigation through affected list/detail chains.

**Architecture:** Keep the existing React route structure, homepage data model, and `M4` placement. Constrain the work to presentation-layer updates on the public masthead and homepage plus the narrow return-context propagation gaps that currently strand users after leaving `/portal`.

**Tech Stack:** React 19, React Router 7, TypeScript, Vite, Vitest, React Testing Library, user-event, global CSS

---

## Preflight

- Read:
  - `AGENT_HARNESS.md`
  - `PROGRESS.md`
  - `docs/superpowers/specs/2026-04-26-portal-homepage-m4-design.md`
  - `docs/superpowers/specs/2026-04-26-portal-homepage-fidelity-and-return-context-design.md`
- Before code changes, run:

```bash
cd frontend && npm run test:run -- \
  src/components/layout/PublicPortalNav.test.tsx \
  src/pages/Portal.test.tsx \
  src/pages/Schools.test.tsx \
  src/pages/Scholars.test.tsx \
  src/pages/ScholarProfile.test.tsx
```

Expected: PASS on the current baseline.

- Also run:

```bash
cd frontend && npm run build
```

Expected: PASS.

## File Structure

- `frontend/src/components/layout/PublicPortalNav.tsx`
  Add the topbar, switch the public links to carry portal-origin return context, and keep account / resources behaviour intact.
- `frontend/src/components/layout/PublicPortalNav.css`
  Re-style the masthead toward the HTML reference: topbar, flatter nav rhythm, underline-style active state, tighter editorial spacing.
- `frontend/src/components/layout/PublicPortalNav.test.tsx`
  Cover portal-origin return state on top-level public navigation.
- `frontend/src/pages/Portal.tsx`
  Upgrade homepage markup for higher-fidelity hero treatment, topbar-aware masthead use, stronger summary panel language, and a visible stat strip.
- `frontend/src/pages/Portal.css`
  Apply the high-fidelity homepage presentation: dark hero, grid/glow treatment, editorial typography, stronger section pacing, and more reference-like card presentation.
- `frontend/src/pages/Portal.test.tsx`
  Lock the new homepage structural affordances that matter for the reference-driven implementation.
- `frontend/src/pages/Schools.tsx`
  Propagate chained return state from the school list into detail pages.
- `frontend/src/pages/SchoolDetail.tsx`
  Read chained return context instead of hardcoding a bare `/schools` back link, while preserving local “Back to school” behaviour for downstream hops.
- `frontend/src/pages/Schools.test.tsx`
  Prove the portal → schools → school detail → back-to-schools chain keeps the portal return entry intact.
- `frontend/src/pages/Scholars.tsx`
  Add portal-origin back action on the directory page and pass return state into scholar detail links.
- `frontend/src/features/profile/ScholarSummaryCard.tsx`
  Accept and forward optional return state when a scholar card is used inside the public directory or homepage teaser.
- `frontend/src/pages/Scholars.test.tsx`
  Verify the directory shows a portal return action when entered from homepage navigation.
- `frontend/src/styles/tokens.css`
  Adjust the public-facing typography / colour variables needed to move the homepage and masthead closer to the approved HTML tone without introducing a separate CSS system.

## Task 1: Lock Portal-Origin Return Context With Failing Tests

**Files:**
- Modify: `frontend/src/components/layout/PublicPortalNav.test.tsx`
- Modify: `frontend/src/pages/Scholars.test.tsx`
- Modify: `frontend/src/pages/Schools.test.tsx`

- [ ] **Step 1: Add a failing nav-state test**

Append this test to [`frontend/src/components/layout/PublicPortalNav.test.tsx`](/Users/brenda/Projects/Asian-Mathematical-Network/frontend/src/components/layout/PublicPortalNav.test.tsx):

```tsx
import { useLocation } from 'react-router-dom';

function ReturnStateProbe() {
  const location = useLocation();
  return <pre>{JSON.stringify(location.state)}</pre>;
}

  it('passes a portal return context through top-level public nav links clicked from the homepage', async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter initialEntries={['/portal']}>
        <Routes>
          <Route path="/portal" element={<PublicPortalNav />} />
          <Route path="/schools" element={<ReturnStateProbe />} />
        </Routes>
      </MemoryRouter>
    );

    await user.click(screen.getByRole('link', { name: 'Schools' }));

    expect(screen.getByText(/"to":"\\/portal"/)).toBeInTheDocument();
    expect(screen.getByText(/"label":"Back to portal"/)).toBeInTheDocument();
  });
```

- [ ] **Step 2: Add a failing scholars-page return-link test**

Extend [`frontend/src/pages/Scholars.test.tsx`](/Users/brenda/Projects/Asian-Mathematical-Network/frontend/src/pages/Scholars.test.tsx) with:

```tsx
import { MemoryRouter, Route, Routes } from 'react-router-dom';

it('shows a back-to-portal action when entered from portal navigation', async () => {
  render(
    <MemoryRouter
      initialEntries={[
        {
          pathname: '/scholars',
          state: {
            returnContext: {
              to: '/portal',
              label: 'Back to portal',
            },
          },
        },
      ]}
    >
      <Routes>
        <Route path="/scholars" element={<Scholars />} />
      </Routes>
    </MemoryRouter>
  );

  expect(await screen.findByRole('link', { name: /back to portal/i })).toHaveAttribute(
    'href',
    '/portal'
  );
});
```

- [ ] **Step 3: Add a failing schools-chain continuity test**

Append this integration-style test to [`frontend/src/pages/Schools.test.tsx`](/Users/brenda/Projects/Asian-Mathematical-Network/frontend/src/pages/Schools.test.tsx):

```tsx
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

  it('preserves the portal return chain through school list and detail navigation', async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter
        initialEntries={[
          {
            pathname: '/schools',
            state: {
              returnContext: {
                to: '/portal',
                label: 'Back to portal',
              },
            },
          },
        ]}
      >
        <Routes>
          <Route path="/schools" element={<Schools />} />
          <Route path="/schools/:slug" element={<SchoolDetail />} />
        </Routes>
      </MemoryRouter>
    );

    await screen.findByRole('link', { name: /view school/i });
    await user.click(screen.getByRole('link', { name: /view school/i }));
    expect(await screen.findByRole('link', { name: /back to schools/i })).toHaveAttribute(
      'href',
      '/schools'
    );

    await user.click(screen.getByRole('link', { name: /back to schools/i }));
    expect(await screen.findByRole('link', { name: /back to portal/i })).toHaveAttribute(
      'href',
      '/portal'
    );
  });
```

- [ ] **Step 4: Run the targeted tests and confirm they fail**

Run:

```bash
cd frontend && npm run test:run -- \
  src/components/layout/PublicPortalNav.test.tsx \
  src/pages/Scholars.test.tsx \
  src/pages/Schools.test.tsx
```

Expected: FAIL because the nav currently drops portal-origin state, `Scholars` does not render a back action, and the school list/detail chain does not preserve the upstream portal return entry.

## Task 2: Implement Public Return-Context Repair

**Files:**
- Modify: `frontend/src/components/layout/PublicPortalNav.tsx`
- Modify: `frontend/src/pages/Scholars.tsx`
- Modify: `frontend/src/features/profile/ScholarSummaryCard.tsx`
- Modify: `frontend/src/pages/Schools.tsx`
- Modify: `frontend/src/pages/SchoolDetail.tsx`

- [ ] **Step 1: Reuse the existing portal return helper in nav**

In [`frontend/src/components/layout/PublicPortalNav.tsx`](/Users/brenda/Projects/Asian-Mathematical-Network/frontend/src/components/layout/PublicPortalNav.tsx), import:

```tsx
import { PORTAL_RETURN_CONTEXT, buildChainedReturnState } from '../../features/demo/demoWalkthrough';
import { toReturnContextState } from '../../features/navigation/returnContext';
```

Then derive the per-link state:

```tsx
  const portalState = toReturnContextState(PORTAL_RETURN_CONTEXT);
```

and update public links to use:

```tsx
                state={location.pathname === '/portal' ? portalState : undefined}
```

Use the same pattern for resource links so homepage-origin clicks into `Newsletter`, `Videos`, and `Publications` also carry `Back to portal`.

- [ ] **Step 2: Add a return action and detail-state propagation on the scholars page**

In [`frontend/src/pages/Scholars.tsx`](/Users/brenda/Projects/Asian-Mathematical-Network/frontend/src/pages/Scholars.tsx):

- read `useLocation()` plus `readReturnContext(location.state)`
- add `actions={...}` on `PortalShell` so portal-origin visits show `Back to portal`
- build a chained detail state:

```tsx
const scholarDetailState = returnContext
  ? buildChainedReturnState(
      {
        to: '/scholars',
        label: 'Back to scholars',
      },
      returnContext
    )
  : undefined;
```

Pass that into each scholar card:

```tsx
<ScholarSummaryCard key={scholar.slug} scholar={scholar} detailState={scholarDetailState} />
```

- [ ] **Step 3: Let scholar cards forward optional link state**

Change [`frontend/src/features/profile/ScholarSummaryCard.tsx`](/Users/brenda/Projects/Asian-Mathematical-Network/frontend/src/features/profile/ScholarSummaryCard.tsx) to:

```tsx
import type { ReturnContextState } from '../navigation/returnContext';

type Props = {
  scholar: PublicScholarSummary;
  detailState?: ReturnContextState;
};

export function ScholarSummaryCard({ scholar, detailState }: Props) {
  ...
      <Link
        className="scholar-summary-card__title"
        to={buildScholarRoute(scholar.slug)}
        state={detailState}
      >
```

- [ ] **Step 4: Chain school list → detail → portal**

In [`frontend/src/pages/Schools.tsx`](/Users/brenda/Projects/Asian-Mathematical-Network/frontend/src/pages/Schools.tsx):

- import `toReturnContextState` and `buildChainedReturnState`
- build:

```tsx
const detailState = returnContext
  ? buildChainedReturnState(
      {
        to: '/schools',
        label: 'Back to schools',
      },
      returnContext
    )
  : undefined;
```

- pass `state={detailState}` into the school detail link

In [`frontend/src/pages/SchoolDetail.tsx`](/Users/brenda/Projects/Asian-Mathematical-Network/frontend/src/pages/SchoolDetail.tsx):

- import `useLocation`, `readReturnContext`, and `toReturnContextState`
- replace the hardcoded back link with:

```tsx
  const location = useLocation();
  const returnContext = readReturnContext(location.state);
```

and:

```tsx
      actions={
        <Link
          to={returnContext?.to ?? '/schools'}
          state={returnContext?.state}
          className="my-applications__section-link"
        >
          {returnContext?.label ?? 'Back to schools'}
        </Link>
      }
```

Keep the existing downstream teaser links, but nest them with `state: toReturnContextState(returnContext)` so the upstream portal state survives.

- [ ] **Step 5: Re-run the targeted tests**

Run:

```bash
cd frontend && npm run test:run -- \
  src/components/layout/PublicPortalNav.test.tsx \
  src/pages/Scholars.test.tsx \
  src/pages/Schools.test.tsx
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add \
  frontend/src/components/layout/PublicPortalNav.tsx \
  frontend/src/pages/Scholars.tsx \
  frontend/src/features/profile/ScholarSummaryCard.tsx \
  frontend/src/pages/Schools.tsx \
  frontend/src/pages/SchoolDetail.tsx \
  frontend/src/components/layout/PublicPortalNav.test.tsx \
  frontend/src/pages/Scholars.test.tsx \
  frontend/src/pages/Schools.test.tsx
git commit -m "fix: preserve portal return context across public browsing"
```

## Task 3: Lock High-Fidelity Homepage Structure With Failing Tests

**Files:**
- Modify: `frontend/src/pages/Portal.test.tsx`

- [ ] **Step 1: Replace the old compact-hero assertions with fidelity-oriented structure checks**

Update [`frontend/src/pages/Portal.test.tsx`](/Users/brenda/Projects/Asian-Mathematical-Network/frontend/src/pages/Portal.test.tsx) so the first test asserts the new public structures:

```tsx
it('renders a high-fidelity public homepage masthead and hero summary', async () => {
  renderWithRouter(<Portal />, '/portal', '/portal');

  expect(screen.getByText(/regional opportunities/i)).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Newsletter' })).toBeInTheDocument();
  expect(
    screen.getByRole('heading', {
      name: /opportunities and scholarly exchange across the asian mathematical network/i,
    })
  ).toBeInTheDocument();
  expect(screen.getByRole('heading', { name: /network at a glance/i })).toBeInTheDocument();
  expect(screen.getByText(/conferences open/i)).toBeInTheDocument();
  expect(screen.getByText(/grants open/i)).toBeInTheDocument();
  expect(screen.getByText(/schools active/i)).toBeInTheDocument();
});
```

- [ ] **Step 2: Keep the section-order and content tests but align them with the richer hero**

Retain the later assertions for featured opportunities and `Scholars & expertise`, but remove wording tied to the old “compact public homepage hero” phrasing.

- [ ] **Step 3: Run the homepage test and confirm it fails**

Run:

```bash
cd frontend && npm run test:run -- src/pages/Portal.test.tsx
```

Expected: FAIL because the topbar, hero summary heading, and stat-strip labels do not exist yet.

## Task 4: Implement The High-Fidelity Homepage Pass

**Files:**
- Modify: `frontend/src/styles/tokens.css`
- Modify: `frontend/src/components/layout/PublicPortalNav.tsx`
- Modify: `frontend/src/components/layout/PublicPortalNav.css`
- Modify: `frontend/src/pages/Portal.tsx`
- Modify: `frontend/src/pages/Portal.css`

- [ ] **Step 1: Move typography and palette closer to the reference**

In [`frontend/src/styles/tokens.css`](/Users/brenda/Projects/Asian-Mathematical-Network/frontend/src/styles/tokens.css), switch the font import to:

```css
@import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;1,9..40,300&family=EB+Garamond:ital,wght@0,400;0,500;0,600;1,400;1,500&display=swap');
```

and update:

```css
  --font-heading: 'EB Garamond', Georgia, serif;
  --font-body: 'DM Sans', system-ui, sans-serif;
  --font-mono: 'DM Mono', monospace;
```

Tighten the public-facing accent/background values toward the approved HTML palette:

```css
  --color-accent: #b8903a;
  --color-accent-soft: #f2e6c9;
  --surface-canvas: #f5f2ec;
  --surface-panel: rgba(255, 255, 255, 0.94);
  --surface-panel-strong: #ffffff;
```

- [ ] **Step 2: Add a topbar and flatter editorial nav treatment**

In [`frontend/src/components/layout/PublicPortalNav.tsx`](/Users/brenda/Projects/Asian-Mathematical-Network/frontend/src/components/layout/PublicPortalNav.tsx), wrap the existing nav in:

```tsx
    <div className="portal-nav">
      <div className="portal-nav__topbar">
        <div className="portal-nav__topbar-inner">
          <p className="portal-nav__topbar-copy">
            Regional opportunities • public pathways • scholarly network
          </p>
          <div className="portal-nav__topbar-links">
            <Link to="/newsletter" state={location.pathname === '/portal' ? portalState : undefined}>
              Newsletter
            </Link>
            <Link to="/videos" state={location.pathname === '/portal' ? portalState : undefined}>
              Videos
            </Link>
            <Link
              to="/publications"
              state={location.pathname === '/portal' ? portalState : undefined}
            >
              Publications
            </Link>
          </div>
        </div>
      </div>
      <div className="portal-nav__bar">
        ...
      </div>
    </div>
```

In [`frontend/src/components/layout/PublicPortalNav.css`](/Users/brenda/Projects/Asian-Mathematical-Network/frontend/src/components/layout/PublicPortalNav.css), replace the current rounded app-nav feel with:

```css
.portal-nav {
  position: sticky;
  top: 0;
  z-index: 30;
}

.portal-nav__topbar {
  background: var(--color-navy-950);
  color: rgba(255, 255, 255, 0.72);
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.portal-nav__topbar-inner,
.portal-nav__inner {
  max-width: 1200px;
  margin: 0 auto;
  padding-inline: 2rem;
}

.portal-nav__bar {
  background: var(--surface-canvas);
  border-bottom: 1px solid rgba(15, 31, 61, 0.14);
}

.portal-nav__link {
  min-height: 64px;
  padding: 0 0.9rem;
  border-radius: 0;
  border-bottom: 2px solid transparent;
  font-weight: 500;
}

.portal-nav__link:hover,
.portal-nav__link--active {
  background: transparent;
  border-bottom-color: var(--color-accent);
}
```

Adapt the remaining selectors to this flatter nav shell rather than reintroducing pill buttons.

- [ ] **Step 3: Rebuild the hero markup toward the reference**

In [`frontend/src/pages/Portal.tsx`](/Users/brenda/Projects/Asian-Mathematical-Network/frontend/src/pages/Portal.tsx), keep the same data model but restructure the hero into:

```tsx
      <section className="portal-home__hero" aria-labelledby="portal-home-heading">
        <div className="portal-home__hero-main">
          <p className="portal-home__eyebrow">Asian Mathematical Network</p>
          <h1 id="portal-home-heading">
            Opportunities and scholarly exchange across the Asian Mathematical Network
          </h1>
          <p className="portal-home__lede">...</p>
          <div className="portal-home__actions">...</div>

          {homepageModel ? (
            <dl className="portal-home__stats" aria-label="Network activity summary">
              <div>
                <dt>Conferences open</dt>
                <dd>{homepageModel.summary.openConferences}</dd>
              </div>
              <div>
                <dt>Grants open</dt>
                <dd>{homepageModel.summary.openGrants}</dd>
              </div>
              <div>
                <dt>Schools active</dt>
                <dd>{homepageModel.summary.openSchools}</dd>
              </div>
            </dl>
          ) : null}
        </div>

        <aside className="portal-home__hero-panel" aria-labelledby="portal-home-glance-heading">
          <p className="portal-home__summary-kicker">Open now</p>
          <h2 id="portal-home-glance-heading">Network at a glance</h2>
          ...
        </aside>
      </section>
```

Keep the rest of the homepage sections and `M4` ordering intact.

- [ ] **Step 4: Re-style the homepage sections for fidelity**

In [`frontend/src/pages/Portal.css`](/Users/brenda/Projects/Asian-Mathematical-Network/frontend/src/pages/Portal.css), shift the page from the current neutral portal treatment to a more editorial one:

```css
.portal-home__hero {
  position: relative;
  overflow: hidden;
  margin-top: -1px;
  padding: clamp(4.5rem, 8vw, 6.25rem) clamp(1.25rem, 3vw, 2rem) clamp(3rem, 6vw, 4rem);
  border-radius: 0 0 var(--radius-lg) var(--radius-lg);
  background: linear-gradient(180deg, #0f1f3d 0%, #13284e 100%);
  color: #fff;
}

.portal-home__hero::before {
  content: '';
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(255, 255, 255, 0.04) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.04) 1px, transparent 1px);
  background-size: 60px 60px;
  pointer-events: none;
}

.portal-home__hero-main,
.portal-home__hero-panel {
  position: relative;
  z-index: 1;
}

.portal-home__hero-panel {
  padding: 1.5rem;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(255, 255, 255, 0.06);
  box-shadow: 0 18px 40px rgba(0, 0, 0, 0.18);
}

.portal-home__stats {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 1rem;
  margin-top: 2rem;
  padding-top: 1.5rem;
  border-top: 1px solid rgba(255, 255, 255, 0.12);
}
```

Also re-tune headings, section labels, card tags, and grid spacing so they feel closer to the reference HTML than the current generic portal cards.

- [ ] **Step 5: Re-run the homepage test**

Run:

```bash
cd frontend && npm run test:run -- src/pages/Portal.test.tsx
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add \
  frontend/src/styles/tokens.css \
  frontend/src/components/layout/PublicPortalNav.tsx \
  frontend/src/components/layout/PublicPortalNav.css \
  frontend/src/pages/Portal.tsx \
  frontend/src/pages/Portal.css \
  frontend/src/pages/Portal.test.tsx
git commit -m "feat: raise portal homepage visual fidelity"
```

## Task 5: Final Verification And Handoff

**Files:**
- Modify: `PROGRESS.md` if implementation completes in this session

- [ ] **Step 1: Run the focused regression suite**

Run:

```bash
cd frontend && npm run test:run -- \
  src/components/layout/PublicPortalNav.test.tsx \
  src/pages/Portal.test.tsx \
  src/pages/Schools.test.tsx \
  src/pages/Scholars.test.tsx \
  src/pages/ScholarProfile.test.tsx
```

Expected: PASS.

- [ ] **Step 2: Run the broader public-breadth suite**

Run:

```bash
cd frontend && npm run test:run -- \
  src/pages/ConferenceDetail.test.tsx \
  src/pages/Prizes.test.tsx \
  src/pages/Partners.test.tsx
```

Expected: PASS.

- [ ] **Step 3: Run the production build**

Run:

```bash
cd frontend && npm run build
```

Expected: PASS.

- [ ] **Step 4: Update `PROGRESS.md`**

Append a short handoff entry summarising:

- homepage high-fidelity visual pass
- public return-context repair
- exact verification commands that passed

- [ ] **Step 5: Commit the handoff log**

```bash
git add PROGRESS.md
git commit -m "docs: log homepage fidelity rollout"
```
