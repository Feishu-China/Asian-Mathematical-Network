# Portal Homepage Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the first public homepage iteration for `/portal`, including the new public navigation, compact hero, fake-data featured opportunity cards, and the prizes hub entry pattern defined in the approved homepage spec.

**Architecture:** Keep the homepage work narrow and composable. Add one reusable public navigation component for portal-facing pages, one homepage view-model layer that reuses the existing conference/grant/school providers, and a portal-page-specific layout/CSS rewrite for the first screen. Do not redesign the authenticated dashboard or rewrite unrelated public pages in this pass.

**Tech Stack:** React 19, React Router 7, TypeScript, Vite, Vitest, React Testing Library, user-event, global CSS

---

## File Structure

- `frontend/src/components/layout/PortalShell.tsx`
  Adds an optional masthead slot so the homepage can render a distinct top navigation above the existing shell header.
- `frontend/src/components/layout/PublicPortalNav.tsx`
  Renders the public top navigation, `Resources` dropdown, and auth-aware right-side action (`Sign in` or `My Applications`).
- `frontend/src/components/layout/PublicPortalNav.css`
  Holds the navigation-specific styles, including desktop and mobile menu behavior.
- `frontend/src/components/layout/PublicPortalNav.test.tsx`
  Covers signed-out and signed-in navigation behavior plus the `Resources` dropdown interaction.
- `frontend/src/components/layout/Shell.test.tsx`
  Verifies `PortalShell` can render the new masthead slot without breaking the existing header/body contract.
- `frontend/src/features/portal/homepageViewModel.ts`
  Reuses the existing public providers and maps their output into one homepage-friendly view model for the summary panel and three featured opportunity cards.
- `frontend/src/features/portal/homepageViewModel.test.ts`
  Covers provider-backed homepage mapping, counts, and featured-card output.
- `frontend/src/pages/Portal.tsx`
  Replaces the current list-of-links portal landing with the approved homepage composition.
- `frontend/src/pages/Portal.css`
  Holds homepage-only styles for the hero, summary panel, featured cards, and CTA layout.
- `frontend/src/pages/Portal.test.tsx`
  Covers the homepage’s user-visible structure, CTAs, featured cards, and auth-aware right-side action.
- `frontend/src/pages/Prizes.tsx`
  Turns `/prizes` into a hub page with `Current Calls / Nominations` and `Archive / Past Laureates` entry points while retaining the archive grid.
- `frontend/src/pages/Prize.css`
  Adds hub styles above the existing archive/detail styles.
- `frontend/src/pages/Prizes.test.tsx`
  Updates prize page expectations to match the hub behavior.

## Task 1: Add Reusable Public Navigation And PortalShell Masthead Support

**Files:**
- Modify: `frontend/src/components/layout/PortalShell.tsx`
- Create: `frontend/src/components/layout/PublicPortalNav.tsx`
- Create: `frontend/src/components/layout/PublicPortalNav.css`
- Create: `frontend/src/components/layout/PublicPortalNav.test.tsx`
- Modify: `frontend/src/components/layout/Shell.test.tsx`
- Test: `frontend/src/components/layout/PublicPortalNav.test.tsx`
- Test: `frontend/src/components/layout/Shell.test.tsx`

- [ ] **Step 1: Write the failing tests**

Create [`frontend/src/components/layout/PublicPortalNav.test.tsx`](/Users/brenda/Projects/Asian-Mathematical-Network/frontend/src/components/layout/PublicPortalNav.test.tsx):

```tsx
import { beforeEach, describe, expect, it } from 'vitest';
import userEvent from '@testing-library/user-event';
import { screen } from '@testing-library/react';
import { renderWithRouter } from '../../test/renderWithRouter';
import { PublicPortalNav } from './PublicPortalNav';

describe('PublicPortalNav', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('renders public links and a resources dropdown for signed-out visitors', async () => {
    const user = userEvent.setup();

    renderWithRouter(<PublicPortalNav />, '/portal', '/portal');

    expect(screen.getByRole('link', { name: 'Conferences' })).toHaveAttribute(
      'href',
      '/conferences'
    );
    expect(screen.getByRole('link', { name: 'Travel Grants' })).toHaveAttribute(
      'href',
      '/grants'
    );
    expect(screen.getByRole('link', { name: 'Schools' })).toHaveAttribute('href', '/schools');
    expect(screen.getByRole('link', { name: 'Prizes' })).toHaveAttribute('href', '/prizes');
    expect(screen.getByRole('link', { name: 'Sign in' })).toHaveAttribute('href', '/login');

    await user.click(screen.getByRole('button', { name: 'Resources' }));

    expect(screen.getByRole('link', { name: 'Newsletter' })).toHaveAttribute(
      'href',
      '/newsletter'
    );
    expect(screen.getByRole('link', { name: 'Videos' })).toHaveAttribute('href', '/videos');
    expect(screen.getByRole('link', { name: 'Publications' })).toHaveAttribute(
      'href',
      '/publications'
    );
  });

  it('shows My Applications instead of Sign in for authenticated applicants', () => {
    localStorage.setItem('token', 'applicant-1');

    renderWithRouter(<PublicPortalNav />, '/portal', '/portal');

    expect(screen.getByRole('link', { name: 'My Applications' })).toHaveAttribute(
      'href',
      '/me/applications'
    );
    expect(screen.queryByRole('link', { name: 'Sign in' })).not.toBeInTheDocument();
  });
});
```

Modify [`frontend/src/components/layout/Shell.test.tsx`](/Users/brenda/Projects/Asian-Mathematical-Network/frontend/src/components/layout/Shell.test.tsx) by adding:

```tsx
  it('renders a portal shell masthead before the standard page header', () => {
    render(
      <PortalShell
        masthead={<nav aria-label="Public portal">Portal navigation</nav>}
        eyebrow="Public portal"
        title="Portal"
        description="Public homepage shell."
      >
        <div>Portal body</div>
      </PortalShell>
    );

    expect(screen.getByRole('navigation', { name: 'Public portal' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Portal' })).toBeInTheDocument();
    expect(screen.getByText('Portal body')).toBeInTheDocument();
  });
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd frontend && npm run test:run -- src/components/layout/PublicPortalNav.test.tsx src/components/layout/Shell.test.tsx`

Expected: FAIL because `PublicPortalNav.tsx` does not exist yet and `PortalShell` does not accept a `masthead` prop.

- [ ] **Step 3: Write the minimal implementation**

Update [`frontend/src/components/layout/PortalShell.tsx`](/Users/brenda/Projects/Asian-Mathematical-Network/frontend/src/components/layout/PortalShell.tsx):

```tsx
import type { ReactNode } from 'react';

type Props = {
  masthead?: ReactNode;
  eyebrow?: string;
  title?: ReactNode;
  description?: ReactNode;
  badges?: ReactNode;
  actions?: ReactNode;
  aside?: ReactNode;
  children: ReactNode;
};

export function PortalShell({
  masthead,
  eyebrow,
  title,
  description,
  badges,
  actions,
  aside,
  children,
}: Props) {
  return (
    <div className="page-shell page-shell--portal">
      {masthead ? <div className="page-shell__masthead">{masthead}</div> : null}
      <div className="page-shell__container">
        <header className="page-shell__header">
          {eyebrow ? <p className="page-shell__eyebrow">{eyebrow}</p> : null}
          {badges ? <div className="page-shell__badges">{badges}</div> : null}
          {title || description || actions ? (
            <div className="page-shell__title-row">
              <div className="page-shell__title-group">
                {title ? <h1>{title}</h1> : null}
                {description ? <p className="page-shell__description">{description}</p> : null}
              </div>
              {actions ? <div className="page-shell__actions">{actions}</div> : null}
            </div>
          ) : null}
        </header>

        <div
          className={
            aside ? 'page-shell__content page-shell__content--with-aside' : 'page-shell__content'
          }
        >
          <div className="page-shell__main">{children}</div>
          {aside ? <aside className="page-shell__aside">{aside}</aside> : null}
        </div>
      </div>
    </div>
  );
}
```

Create [`frontend/src/components/layout/PublicPortalNav.tsx`](/Users/brenda/Projects/Asian-Mathematical-Network/frontend/src/components/layout/PublicPortalNav.tsx):

```tsx
import { useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import './PublicPortalNav.css';

const publicLinks = [
  { to: '/conferences', label: 'Conferences' },
  { to: '/grants', label: 'Travel Grants' },
  { to: '/schools', label: 'Schools' },
  { to: '/prizes', label: 'Prizes' },
] as const;

const resourceLinks = [
  { to: '/newsletter', label: 'Newsletter' },
  { to: '/videos', label: 'Videos' },
  { to: '/publications', label: 'Publications' },
] as const;

export function PublicPortalNav() {
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [resourcesOpen, setResourcesOpen] = useState(false);
  const hasApplicantSession = Boolean(localStorage.getItem('token'));

  const closeMenus = () => {
    setMenuOpen(false);
    setResourcesOpen(false);
  };

  return (
    <div className="portal-nav">
      <div className="portal-nav__inner">
        <Link to="/portal" className="portal-nav__brand" onClick={closeMenus}>
          <span className="portal-nav__brand-word">Asiamath</span>
          <span className="portal-nav__brand-subtitle">Asian Mathematical Network</span>
        </Link>

        <button
          type="button"
          className="portal-nav__toggle"
          aria-expanded={menuOpen}
          aria-controls="portal-nav-links"
          onClick={() => setMenuOpen((value) => !value)}
        >
          Menu
        </button>

        <div
          id="portal-nav-links"
          className={`portal-nav__panel${menuOpen ? ' portal-nav__panel--open' : ''}`}
        >
          <nav className="portal-nav__links" aria-label="Public sections">
            {publicLinks.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={closeMenus}
                className={({ isActive }) =>
                  `portal-nav__link${isActive ? ' portal-nav__link--active' : ''}`
                }
              >
                {item.label}
              </NavLink>
            ))}

            <div className="portal-nav__dropdown">
              <button
                type="button"
                className="portal-nav__link portal-nav__link--button"
                aria-expanded={resourcesOpen}
                onClick={() => setResourcesOpen((value) => !value)}
              >
                Resources
              </button>
              {resourcesOpen ? (
                <div className="portal-nav__menu" role="menu">
                  {resourceLinks.map((item) => (
                    <Link
                      key={item.to}
                      to={item.to}
                      role="menuitem"
                      className="portal-nav__menu-link"
                      onClick={closeMenus}
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              ) : null}
            </div>
          </nav>

          <div className="portal-nav__actions">
            {hasApplicantSession ? (
              <Link to="/me/applications" className="portal-nav__primary">
                My Applications
              </Link>
            ) : (
              <Link
                to="/login"
                state={{ returnTo: location.pathname }}
                className="portal-nav__primary"
              >
                Sign in
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
```

Create [`frontend/src/components/layout/PublicPortalNav.css`](/Users/brenda/Projects/Asian-Mathematical-Network/frontend/src/components/layout/PublicPortalNav.css):

```css
.portal-nav {
  position: sticky;
  top: 0;
  z-index: 20;
  border-bottom: 1px solid var(--border-subtle);
  background: rgba(251, 250, 247, 0.92);
  backdrop-filter: blur(14px);
}

.portal-nav__inner {
  max-width: var(--layout-max);
  margin: 0 auto;
  padding: 0.9rem 1rem;
  display: flex;
  align-items: center;
  gap: 1rem;
}

.portal-nav__brand {
  display: grid;
  gap: 0.1rem;
  min-width: max-content;
}

.portal-nav__brand-word {
  font-family: var(--font-heading);
  font-size: 1.35rem;
  color: var(--color-navy-900);
  font-weight: 700;
}

.portal-nav__brand-subtitle {
  font-size: 0.72rem;
  text-transform: uppercase;
  letter-spacing: 0.14em;
  color: var(--color-text-subtle);
}

.portal-nav__toggle {
  display: none;
}

.portal-nav__panel {
  display: flex;
  flex: 1;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.portal-nav__links,
.portal-nav__actions {
  display: flex;
  align-items: center;
  gap: 0.35rem;
}

.portal-nav__link {
  padding: 0.65rem 0.8rem;
  border-radius: var(--radius-pill);
  color: var(--color-text-muted);
  font-weight: 600;
  text-decoration: none;
}

.portal-nav__link:hover,
.portal-nav__link--active {
  background: rgba(42, 70, 111, 0.08);
  color: var(--color-navy-900);
}

.portal-nav__link--button {
  border: 0;
  background: transparent;
  cursor: pointer;
}

.portal-nav__dropdown {
  position: relative;
}

.portal-nav__menu {
  position: absolute;
  top: calc(100% + 0.35rem);
  left: 0;
  min-width: 12rem;
  display: grid;
  gap: 0.2rem;
  padding: 0.55rem;
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  background: var(--surface-panel-strong);
  box-shadow: var(--shadow-md);
}

.portal-nav__menu-link {
  padding: 0.65rem 0.75rem;
  border-radius: var(--radius-sm);
  font-weight: 600;
  color: var(--color-text);
}

.portal-nav__menu-link:hover {
  background: rgba(42, 70, 111, 0.08);
}

.portal-nav__primary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 2.75rem;
  padding: 0.75rem 1.05rem;
  border-radius: var(--radius-pill);
  background: var(--color-navy-800);
  color: #fff;
  font-weight: 700;
}

.portal-nav__primary:hover {
  color: #fff;
  background: var(--color-navy-900);
}

@media (max-width: 920px) {
  .portal-nav__inner {
    flex-wrap: wrap;
  }

  .portal-nav__toggle {
    display: inline-flex;
    margin-left: auto;
    align-items: center;
    justify-content: center;
    min-height: 2.5rem;
    padding: 0.5rem 0.9rem;
    border: 1px solid var(--border-subtle);
    border-radius: var(--radius-pill);
    background: rgba(255, 255, 255, 0.8);
    color: var(--color-text);
    font-weight: 700;
  }

  .portal-nav__panel {
    display: none;
    width: 100%;
    flex-direction: column;
    align-items: stretch;
  }

  .portal-nav__panel--open {
    display: flex;
  }

  .portal-nav__links,
  .portal-nav__actions {
    flex-direction: column;
    align-items: stretch;
  }

  .portal-nav__menu {
    position: static;
    margin-top: 0.35rem;
  }
}
```

Append this block to [`frontend/src/styles/layout.css`](/Users/brenda/Projects/Asian-Mathematical-Network/frontend/src/styles/layout.css):

```css
.page-shell__masthead {
  position: relative;
  z-index: 2;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd frontend && npm run test:run -- src/components/layout/PublicPortalNav.test.tsx src/components/layout/Shell.test.tsx`

Expected: PASS with both the new nav behavior and the shell masthead slot covered.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/layout/PortalShell.tsx frontend/src/components/layout/PublicPortalNav.tsx frontend/src/components/layout/PublicPortalNav.css frontend/src/components/layout/PublicPortalNav.test.tsx frontend/src/components/layout/Shell.test.tsx frontend/src/styles/layout.css
git commit -m "feat: add public portal navigation shell"
```

## Task 2: Add A Homepage View Model That Reuses Existing Public Providers

**Files:**
- Create: `frontend/src/features/portal/homepageViewModel.ts`
- Create: `frontend/src/features/portal/homepageViewModel.test.ts`
- Test: `frontend/src/features/portal/homepageViewModel.test.ts`

- [ ] **Step 1: Write the failing test**

Create [`frontend/src/features/portal/homepageViewModel.test.ts`](/Users/brenda/Projects/Asian-Mathematical-Network/frontend/src/features/portal/homepageViewModel.test.ts):

```tsx
import { beforeEach, describe, expect, it } from 'vitest';
import { resetConferenceFakeState } from '../conference/fakeConferenceProvider';
import { resetGrantFakeState } from '../grant/fakeGrantProvider';
import { resetSchoolFakeState } from '../school/fakeSchoolProvider';
import { loadPortalHomepageViewModel } from './homepageViewModel';

describe('loadPortalHomepageViewModel', () => {
  beforeEach(() => {
    resetConferenceFakeState();
    resetGrantFakeState();
    resetSchoolFakeState();
  });

  it('returns three featured cards and live counts backed by existing public providers', async () => {
    const model = await loadPortalHomepageViewModel();

    expect(model.summary.openConferences).toBe(1);
    expect(model.summary.openGrants).toBe(1);
    expect(model.summary.openSchools).toBe(2);
    expect(model.summary.note).toMatch(/travel support/i);

    expect(model.featuredCards).toHaveLength(3);
    expect(model.featuredCards[0]).toMatchObject({
      kind: 'conference',
      href: '/conferences/asiamath-2026-workshop',
      title: 'Asiamath 2026 Workshop',
      statusLabel: 'Open',
    });
    expect(model.featuredCards[1]).toMatchObject({
      kind: 'grant',
      href: '/grants/asiamath-2026-travel-grant',
      title: 'Asiamath 2026 Travel Grant',
      location: 'Singapore',
    });
    expect(model.featuredCards[2]).toMatchObject({
      kind: 'school',
      href: '/schools/algebraic-geometry-research-school-2026',
      title: 'Asia-Pacific Research School in Algebraic Geometry',
    });
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `cd frontend && npm run test:run -- src/features/portal/homepageViewModel.test.ts`

Expected: FAIL because `homepageViewModel.ts` does not exist yet.

- [ ] **Step 3: Write the minimal implementation**

Create [`frontend/src/features/portal/homepageViewModel.ts`](/Users/brenda/Projects/Asian-Mathematical-Network/frontend/src/features/portal/homepageViewModel.ts):

```ts
import { conferenceProvider } from '../conference/conferenceProvider';
import { grantProvider } from '../grant/grantProvider';
import { schoolProvider } from '../school/schoolProvider';

export type FeaturedOpportunityCard = {
  kind: 'conference' | 'grant' | 'school';
  href: string;
  title: string;
  location: string;
  dateLabel: string;
  statusLabel: 'Open' | 'Upcoming';
  summary: string;
};

export type PortalHomepageViewModel = {
  summary: {
    openConferences: number;
    openGrants: number;
    openSchools: number;
    note: string;
  };
  featuredCards: FeaturedOpportunityCard[];
};

const formatDateLabel = (start: string | null, end?: string | null) => {
  if (!start) return 'Date to be announced';
  const startDate = new Date(start);
  if (!end) {
    return startDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  }
  const endDate = new Date(end);
  return `${startDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} - ${endDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}`;
};

export const loadPortalHomepageViewModel = async (): Promise<PortalHomepageViewModel> => {
  const [conferences, grants, schools] = await Promise.all([
    conferenceProvider.listPublicConferences(),
    grantProvider.listPublicGrants(),
    schoolProvider.listPublicSchools(),
  ]);

  const featuredConference = conferences[0];
  const featuredGrant = grants[0];
  const featuredSchool = schools[0];
  const linkedGrantConference = conferences.find(
    (conference) => conference.id === featuredGrant?.linkedConferenceId
  );

  const featuredCards: FeaturedOpportunityCard[] = [];

  if (featuredConference) {
    featuredCards.push({
      kind: 'conference',
      href: `/conferences/${featuredConference.slug}`,
      title: featuredConference.title,
      location: featuredConference.locationText ?? 'Location to be announced',
      dateLabel: formatDateLabel(featuredConference.startDate, featuredConference.endDate),
      statusLabel: featuredConference.isApplicationOpen ? 'Open' : 'Upcoming',
      summary: 'Published conference applications open across the network.',
    });
  }

  if (featuredGrant) {
    featuredCards.push({
      kind: 'grant',
      href: `/grants/${featuredGrant.slug}`,
      title: featuredGrant.title,
      location: linkedGrantConference?.locationText ?? 'Network-wide support',
      dateLabel: featuredGrant.applicationDeadline
        ? `Deadline ${new Date(featuredGrant.applicationDeadline).toLocaleDateString()}`
        : 'Deadline to be announced',
      statusLabel: featuredGrant.isApplicationOpen ? 'Open' : 'Upcoming',
      summary: 'Travel support for eligible participants attending network programmes.',
    });
  }

  if (featuredSchool) {
    featuredCards.push({
      kind: 'school',
      href: `/schools/${featuredSchool.slug}`,
      title: featuredSchool.title,
      location: featuredSchool.locationText ?? 'Regional cohort',
      dateLabel: formatDateLabel(featuredSchool.startDate),
      statusLabel: 'Open',
      summary: featuredSchool.summary,
    });
  }

  return {
    summary: {
      openConferences: conferences.filter((item) => item.isApplicationOpen).length,
      openGrants: grants.filter((item) => item.isApplicationOpen).length,
      openSchools: schools.length,
      note: 'Travel support is available for eligible participants in selected programmes.',
    },
    featuredCards,
  };
};
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `cd frontend && npm run test:run -- src/features/portal/homepageViewModel.test.ts`

Expected: PASS with the homepage counts and featured-card mapping covered.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/features/portal/homepageViewModel.ts frontend/src/features/portal/homepageViewModel.test.ts
git commit -m "feat: add portal homepage view model"
```

## Task 3: Rebuild `/portal` As The Approved Homepage

**Files:**
- Modify: `frontend/src/pages/Portal.tsx`
- Create: `frontend/src/pages/Portal.css`
- Modify: `frontend/src/pages/Portal.test.tsx`
- Test: `frontend/src/pages/Portal.test.tsx`

- [ ] **Step 1: Rewrite the page test first**

Replace [`frontend/src/pages/Portal.test.tsx`](/Users/brenda/Projects/Asian-Mathematical-Network/frontend/src/pages/Portal.test.tsx) with:

```tsx
import { beforeEach, describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithRouter } from '../test/renderWithRouter';
import { resetConferenceFakeState } from '../features/conference/fakeConferenceProvider';
import { resetGrantFakeState } from '../features/grant/fakeGrantProvider';
import { resetSchoolFakeState } from '../features/school/fakeSchoolProvider';
import Portal from './Portal';

describe('Portal homepage', () => {
  beforeEach(() => {
    localStorage.clear();
    resetConferenceFakeState();
    resetGrantFakeState();
    resetSchoolFakeState();
  });

  it('renders the compact homepage hero and three featured opportunity cards', async () => {
    renderWithRouter(<Portal />, '/portal', '/portal');

    expect(
      await screen.findByRole('heading', {
        name: /discover conferences, mobility grants, and training across the asian mathematical network/i,
      })
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Browse Conferences' })).toHaveAttribute(
      'href',
      '/conferences'
    );
    expect(screen.getByRole('link', { name: 'Explore Travel Grants' })).toHaveAttribute(
      'href',
      '/grants'
    );
    expect(screen.getByText('Open now')).toBeInTheDocument();

    expect(
      screen.getByRole('heading', { name: 'Asiamath 2026 Workshop' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'Asiamath 2026 Travel Grant' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'Asia-Pacific Research School in Algebraic Geometry' })
    ).toBeInTheDocument();
  });

  it('switches the right-side action from Sign in to My Applications for signed-in users', async () => {
    localStorage.setItem('token', 'applicant-1');

    renderWithRouter(<Portal />, '/portal', '/portal');

    expect(await screen.findByRole('link', { name: 'My Applications' })).toHaveAttribute(
      'href',
      '/me/applications'
    );
    expect(screen.queryByRole('link', { name: 'Sign in' })).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run the page test to verify it fails**

Run: `cd frontend && npm run test:run -- src/pages/Portal.test.tsx`

Expected: FAIL because `Portal.tsx` still renders the old browse/account card lists.

- [ ] **Step 3: Write the minimal implementation**

Replace [`frontend/src/pages/Portal.tsx`](/Users/brenda/Projects/Asian-Mathematical-Network/frontend/src/pages/Portal.tsx) with:

```tsx
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { PortalShell } from '../components/layout/PortalShell';
import { PublicPortalNav } from '../components/layout/PublicPortalNav';
import { loadPortalHomepageViewModel, type PortalHomepageViewModel } from '../features/portal/homepageViewModel';
import './Portal.css';

export const routePath = '/portal';

export default function Portal() {
  const [model, setModel] = useState<PortalHomepageViewModel | null>(null);

  useEffect(() => {
    let active = true;

    loadPortalHomepageViewModel().then((value) => {
      if (active) {
        setModel(value);
      }
    });

    return () => {
      active = false;
    };
  }, []);

  if (!model) {
    return (
      <PortalShell masthead={<PublicPortalNav />} title="Portal">
        <div className="conference-empty">Loading portal homepage...</div>
      </PortalShell>
    );
  }

  return (
    <PortalShell masthead={<PublicPortalNav />}>
      <section className="portal-home__hero">
        <div className="surface-card portal-home__hero-main">
          <p className="portal-home__eyebrow">Asian Mathematical Network</p>
          <h1>Discover conferences, mobility grants, and training across the Asian Mathematical Network.</h1>
          <p className="portal-home__intro">
            Browse published opportunities, follow current calls, and enter the application flow only when you are ready to sign in.
          </p>
          <div className="portal-home__actions">
            <Link to="/conferences" className="conference-primary-link">
              Browse Conferences
            </Link>
            <Link to="/grants" className="portal-home__secondary-link">
              Explore Travel Grants
            </Link>
          </div>
        </div>

        <aside className="surface-card portal-home__summary">
          <p className="portal-home__summary-label">Open now</p>
          <dl className="portal-home__summary-grid">
            <div>
              <dt>Conferences</dt>
              <dd>{model.summary.openConferences}</dd>
            </div>
            <div>
              <dt>Travel Grants</dt>
              <dd>{model.summary.openGrants}</dd>
            </div>
            <div>
              <dt>Schools</dt>
              <dd>{model.summary.openSchools}</dd>
            </div>
          </dl>
          <p className="portal-home__summary-note">{model.summary.note}</p>
        </aside>
      </section>

      <section className="portal-home__featured" aria-labelledby="portal-featured-heading">
        <div className="section-header">
          <div>
            <p className="page-shell__eyebrow">Public opportunities</p>
            <h2 id="portal-featured-heading">Featured opportunities</h2>
          </div>
        </div>

        <div className="portal-home__featured-grid">
          {model.featuredCards.map((card) => (
            <article key={card.href} className="surface-card portal-home__card">
              <div className="portal-home__card-meta">
                <span className={`portal-home__pill portal-home__pill--${card.kind}`}>{card.kind}</span>
                <span className="portal-home__status">{card.statusLabel}</span>
              </div>
              <h3>{card.title}</h3>
              <p className="portal-home__card-location">{card.location}</p>
              <p className="portal-home__card-date">{card.dateLabel}</p>
              <p className="portal-home__card-summary">{card.summary}</p>
              <Link to={card.href} className="portal-home__card-link">
                View details
              </Link>
            </article>
          ))}
        </div>
      </section>
    </PortalShell>
  );
}
```

Create [`frontend/src/pages/Portal.css`](/Users/brenda/Projects/Asian-Mathematical-Network/frontend/src/pages/Portal.css):

```css
.portal-home__hero {
  display: grid;
  grid-template-columns: minmax(0, 1.45fr) minmax(280px, 0.9fr);
  gap: var(--space-5);
  align-items: start;
}

.portal-home__hero-main,
.portal-home__summary,
.portal-home__card {
  padding: clamp(1.25rem, 2vw, 1.75rem);
}

.portal-home__hero-main {
  display: grid;
  gap: var(--space-4);
}

.portal-home__eyebrow {
  margin: 0;
  font-size: 0.82rem;
  font-weight: 700;
  line-height: 1.2;
  text-transform: uppercase;
  letter-spacing: 0.18em;
  color: var(--color-navy-700);
}

.portal-home__hero-main h1 {
  margin: 0;
  font-size: clamp(2rem, 4vw, 3.35rem);
  line-height: 1.05;
  color: var(--color-navy-900);
}

.portal-home__intro,
.portal-home__card-location,
.portal-home__card-date,
.portal-home__card-summary,
.portal-home__summary-note {
  margin: 0;
  color: var(--color-text-muted);
}

.portal-home__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.portal-home__secondary-link {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 44px;
  padding: 0.75rem 1.15rem;
  border-radius: var(--radius-pill);
  background: rgba(255, 255, 255, 0.82);
  color: var(--color-navy-800);
  border: 1px solid var(--border-subtle);
  font-weight: 600;
}

.portal-home__summary {
  display: grid;
  gap: var(--space-4);
}

.portal-home__summary-label {
  margin: 0;
  font-size: 0.82rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.16em;
  color: var(--color-accent);
}

.portal-home__summary-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: var(--space-3);
  margin: 0;
}

.portal-home__summary-grid dt {
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: var(--color-text-subtle);
}

.portal-home__summary-grid dd {
  margin: 0.35rem 0 0;
  font-family: var(--font-heading);
  font-size: 2rem;
  color: var(--color-navy-900);
}

.portal-home__featured {
  display: grid;
  gap: var(--space-5);
}

.portal-home__featured-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: var(--space-5);
}

.portal-home__card {
  display: grid;
  gap: var(--space-3);
}

.portal-home__card-meta {
  display: flex;
  justify-content: space-between;
  gap: 0.75rem;
  align-items: center;
}

.portal-home__pill {
  display: inline-flex;
  align-items: center;
  min-height: 1.9rem;
  padding: 0.3rem 0.7rem;
  border-radius: var(--radius-pill);
  font-size: 0.78rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.portal-home__pill--conference {
  background: rgba(58, 95, 145, 0.12);
  color: var(--color-info);
}

.portal-home__pill--grant {
  background: rgba(153, 104, 22, 0.12);
  color: var(--color-warning);
}

.portal-home__pill--school {
  background: rgba(29, 107, 81, 0.12);
  color: var(--color-success);
}

.portal-home__status {
  font-weight: 700;
  color: var(--color-navy-800);
}

.portal-home__card-link {
  font-weight: 700;
  color: var(--color-navy-800);
}

@media (max-width: 980px) {
  .portal-home__hero,
  .portal-home__featured-grid {
    grid-template-columns: 1fr;
  }
}
```

- [ ] **Step 4: Run the page test to verify it passes**

Run: `cd frontend && npm run test:run -- src/pages/Portal.test.tsx`

Expected: PASS with the homepage hero and featured-card assertions covered.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/pages/Portal.tsx frontend/src/pages/Portal.css frontend/src/pages/Portal.test.tsx
git commit -m "feat: implement portal homepage first screen"
```

## Task 4: Turn `/prizes` Into A Two-Path Hub While Keeping The Archive Grid

**Files:**
- Modify: `frontend/src/pages/Prizes.tsx`
- Modify: `frontend/src/pages/Prize.css`
- Modify: `frontend/src/pages/Prizes.test.tsx`
- Test: `frontend/src/pages/Prizes.test.tsx`

- [ ] **Step 1: Update the failing test first**

Replace the first test in [`frontend/src/pages/Prizes.test.tsx`](/Users/brenda/Projects/Asian-Mathematical-Network/frontend/src/pages/Prizes.test.tsx) with:

```tsx
  it('renders prizes as a hub with current-calls and archive entry points', async () => {
    renderWithRouter(<Prizes />, '/prizes', '/prizes');

    expect(await screen.findByRole('heading', { name: 'Prizes' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /current calls \/ nominations/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /archive \/ past laureates/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /open nominations hub/i })).toHaveAttribute(
      'href',
      '#prize-current-calls'
    );
    expect(screen.getByRole('link', { name: /browse prize archive/i })).toHaveAttribute(
      'href',
      '#prize-archive-list'
    );
    expect(
      screen.getByRole('heading', { name: 'Asiamath Early Career Prize 2026' })
    ).toBeInTheDocument();
  });
```

- [ ] **Step 2: Run the prize test to verify it fails**

Run: `cd frontend && npm run test:run -- src/pages/Prizes.test.tsx`

Expected: FAIL because `/prizes` still renders only the archive grid.

- [ ] **Step 3: Write the minimal implementation**

Update [`frontend/src/pages/Prizes.tsx`](/Users/brenda/Projects/Asian-Mathematical-Network/frontend/src/pages/Prizes.tsx):

```tsx
import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { PortalShell } from '../components/layout/PortalShell';
import { PageModeBadge } from '../components/ui/PageModeBadge';
import { RoleBadge } from '../components/ui/RoleBadge';
import { StatusBadge } from '../components/ui/StatusBadge';
import { readReturnContext, toReturnContextState } from '../features/navigation/returnContext';
import { prizeProvider } from '../features/prize/prizeProvider';
import type { PrizeListItem } from '../features/prize/types';
import './Prize.css';

export const routePath = '/prizes';

export default function Prizes() {
  const [items, setItems] = useState<PrizeListItem[] | null>(null);
  const location = useLocation();
  const returnContext = readReturnContext(location.state);
  const detailState = toReturnContextState(returnContext);

  useEffect(() => {
    prizeProvider.listPublicPrizes().then(setItems);
  }, []);

  if (items === null) {
    return <div className="prize-page">Loading prizes...</div>;
  }

  return (
    <PortalShell
      eyebrow="Recognition surfaces"
      title="Prizes"
      description="A public hub that separates active nomination pathways from archival prize history."
      badges={
        <>
          <RoleBadge role="visitor" />
          <PageModeBadge mode="hybrid" />
          <StatusBadge tone="info">Prize hub</StatusBadge>
        </>
      }
      actions={
        returnContext ? (
          <Link
            to={returnContext.to}
            state={returnContext.state}
            className="my-applications__section-link"
          >
            {returnContext.label}
          </Link>
        ) : null
      }
    >
      <div className="prize-page">
        <section className="prize-hub" aria-labelledby="prize-hub-heading">
          <div>
            <h2 id="prize-hub-heading">Prize pathways</h2>
            <p className="prize-card__summary">
              Use the public hub to move either into active nomination guidance or into the archive of past laureates and award cycles.
            </p>
          </div>

          <div className="prize-hub__grid">
            <article id="prize-current-calls" className="surface-card prize-hub__card">
              <h3>Current Calls / Nominations</h3>
              <p className="prize-card__summary">
                Active nomination guidance, cycle framing, and committee-facing expectations surface here before the live governance engine is added.
              </p>
              <a href="#prize-current-calls" className="prize-primary-link">
                Open nominations hub
              </a>
            </article>

            <article className="surface-card prize-hub__card">
              <h3>Archive / Past Laureates</h3>
              <p className="prize-card__summary">
                Browse award history, cycle context, and detail pages for released laureate records.
              </p>
              <a href="#prize-archive-list" className="prize-primary-link">
                Browse prize archive
              </a>
            </article>
          </div>
        </section>

        <section id="prize-archive-list" className="prize-archive">
          <div className="section-header">
            <div>
              <p className="conference-eyebrow">Archive / Past Laureates</p>
              <h2>Archive / Past Laureates</h2>
            </div>
          </div>

          <div className="prize-grid">
            {items.map((prize) => (
              <article key={prize.id} className="prize-card">
                <div className="prize-card__meta">
                  <span>{prize.cycleLabel}</span>
                  <span>{prize.stageLabel}</span>
                </div>
                <h3>{prize.title}</h3>
                <p className="prize-card__subtitle">{prize.shortLabel}</p>
                <p className="prize-card__summary">{prize.summary}</p>
                <div className="prize-card__actions">
                  <StatusBadge tone="warning">Governance signals included</StatusBadge>
                  <Link to={`/prizes/${prize.slug}`} state={detailState}>
                    {prize.ctaLabel}
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>
    </PortalShell>
  );
}
```

Append this block to [`frontend/src/pages/Prize.css`](/Users/brenda/Projects/Asian-Mathematical-Network/frontend/src/pages/Prize.css):

```css
.prize-hub,
.prize-archive {
  display: grid;
  gap: var(--space-5);
}

.prize-hub__grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: var(--space-5);
}

.prize-hub__card {
  display: grid;
  gap: var(--space-3);
  padding: 1.5rem;
}
```

- [ ] **Step 4: Run the prize test to verify it passes**

Run: `cd frontend && npm run test:run -- src/pages/Prizes.test.tsx`

Expected: PASS with the new hub headings and archive entry points covered.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/pages/Prizes.tsx frontend/src/pages/Prize.css frontend/src/pages/Prizes.test.tsx
git commit -m "feat: reshape prizes into a public hub"
```

## Task 5: Run Focused Regression And Build Verification

**Files:**
- Modify: none
- Test: `frontend/src/components/layout/PublicPortalNav.test.tsx`
- Test: `frontend/src/features/portal/homepageViewModel.test.ts`
- Test: `frontend/src/pages/Portal.test.tsx`
- Test: `frontend/src/pages/Prizes.test.tsx`

- [ ] **Step 1: Run the focused frontend tests**

Run: `cd frontend && npm run test:run -- src/components/layout/PublicPortalNav.test.tsx src/features/portal/homepageViewModel.test.ts src/pages/Portal.test.tsx src/pages/Prizes.test.tsx`

Expected: PASS with all homepage and prize-hub coverage green.

- [ ] **Step 2: Run the frontend build**

Run: `cd frontend && npm run build`

Expected: PASS with the rebuilt portal homepage and prize hub compiled successfully.

- [ ] **Step 3: Run the root frontend smoke command**

Run: `npm run test:frontend`

Expected: PASS with the repository’s standard frontend smoke/build command still green.

## Self-Review

### Spec coverage

- Public top navigation: covered by Task 1
- `Sign in` as distinct solid action and `My Applications` for signed-in state: covered by Task 1 and Task 3
- Compact homepage hero: covered by Task 3
- Featured fake-data public opportunity cards: covered by Task 2 and Task 3
- `Resources` as a simple dropdown: covered by Task 1
- `Prizes` as a hub with current-call and archive entry points: covered by Task 4
- Mobile navigation behavior: covered by Task 1 CSS structure

### Placeholder scan

- No `TBD`, `TODO`, or “implement later” placeholders remain in tasks
- Each code-edit step includes concrete file content
- Each verification step includes an exact command and expected result

### Type consistency

- Homepage data loading is isolated in `PortalHomepageViewModel`
- The portal page consumes only that view model instead of raw provider-specific shapes
- The new nav component owns signed-in vs signed-out rendering consistently in one place

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-04-24-portal-homepage-implementation.md`. Two execution options:

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

Which approach?
