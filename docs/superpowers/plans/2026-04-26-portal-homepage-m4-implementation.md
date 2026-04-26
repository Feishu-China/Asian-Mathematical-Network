# Portal Homepage And M4 Directory Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild `/portal` into the approved public homepage, add the public `M4` scholar-directory path, and make `M4` visibly reusable across demo public surfaces without introducing new backend endpoints.

**Architecture:** Continue from the current React/Vite homepage draft and finish it as a hybrid front-end breadth slice. Keep public opportunity aggregation in `homepageViewModel`, keep `M4` data logic in the `profile` feature layer through a hybrid directory provider, and thread scholar-profile links into conference and prize surfaces without changing canonical `M2` / `M7` / `M3` ownership. Respect `AGENT_HARNESS.md`: verify baseline before edits, keep scope to this feature slice, and leave `docs/planning/` plus `docs/product/` read-only.

**Tech Stack:** React 19, React Router 7, TypeScript, Vite, Vitest, React Testing Library, user-event, global CSS

---

## Preflight

- Read:
  - `AGENT_HARNESS.md`
  - `PROGRESS.md`
  - `docs/superpowers/specs/2026-04-26-portal-homepage-m4-design.md`
  - `docs/superpowers/specs/2026-04-24-portal-homepage-design.md`
  - `docs/superpowers/plans/2026-04-24-portal-homepage-implementation.md`
- Do not edit:
  - `docs/planning/*`
  - `docs/product/*`
- Before code changes, run:

```bash
cd frontend && npm run test:run -- \
  src/pages/Portal.test.tsx \
  src/pages/Prizes.test.tsx \
  src/pages/ScholarProfile.test.tsx \
  src/pages/Partners.test.tsx
```

Expected: PASS on the current baseline or fail only on files already touched by this feature branch.

- Also run:

```bash
cd frontend && npm run build
```

Expected: PASS.

## File Structure

- `frontend/src/components/layout/PublicPortalNav.tsx`
  Finalize the public masthead by adding `Scholars` while preserving auth-aware account behavior.
- `frontend/src/components/layout/PublicPortalNav.test.tsx`
  Lock the public navigation contract, including `Scholars`.
- `frontend/src/features/profile/types.ts`
  Extend profile feature types with list-level public scholar summary and expertise-cluster shapes.
- `frontend/src/features/profile/directorySeed.ts`
  Seed stable hybrid/demo scholar-directory preview data used before any real list endpoint exists.
- `frontend/src/features/profile/fakeProfileProvider.ts`
  Export helper data for the directory so the editable public profile can still appear in the list when visibility is on.
- `frontend/src/features/profile/scholarDirectoryProvider.ts`
  Expose one hybrid provider for homepage `M4` teaser data and `/scholars` list data.
- `frontend/src/features/profile/scholarDirectoryProvider.test.ts`
  Cover demo-mode list construction and visibility behavior.
- `frontend/src/features/profile/ScholarSummaryCard.tsx`
  Render compact scholar cards for homepage teaser and `/scholars`.
- `frontend/src/features/profile/ScholarExpertiseClusterList.tsx`
  Render the expertise-cluster grid used on homepage and directory page.
- `frontend/src/pages/Scholars.tsx`
  Add the new public `/scholars` route.
- `frontend/src/pages/Scholars.css`
  Hold page-level styles for the directory layout.
- `frontend/src/pages/Scholars.test.tsx`
  Cover the directory page contract.
- `frontend/src/features/portal/homepageViewModel.ts`
  Extend the homepage model with school spotlight and `M4` mixed teaser data.
- `frontend/src/features/portal/homepageViewModel.test.ts`
  Cover the extended view-model mapping.
- `frontend/src/pages/Portal.tsx`
  Upgrade homepage composition to include schools and `Scholars & Expertise`.
- `frontend/src/pages/Portal.css`
  Extend homepage styles for the new sections.
- `frontend/src/pages/Portal.test.tsx`
  Lock the approved homepage content order and `M4` teaser behavior.
- `frontend/src/pages/ConferenceDetail.tsx`
  Add one visible scholar-context reuse point for `M2`.
- `frontend/src/pages/ConferenceDetail.test.tsx`
  Verify the conference detail scholar handoff.
- `frontend/src/pages/Prizes.tsx`
  Reshape `/prizes` into the hub form already described in the earlier homepage plan and preserve scholar-context entry points.
- `frontend/src/pages/PrizeDetail.tsx`
  Make the scholar-context link read as public scholar reuse, not a vague preview affordance.
- `frontend/src/pages/Prizes.test.tsx`
  Update prize expectations for the hub layout and scholar-context affordance.
- `PROGRESS.md`
  Append the required handoff log after code verification is complete.

## Task 1: Finalize Public Navigation For The M4-Aware Homepage

**Files:**
- Modify: `frontend/src/components/layout/PublicPortalNav.tsx`
- Modify: `frontend/src/components/layout/PublicPortalNav.css`
- Modify: `frontend/src/components/layout/PublicPortalNav.test.tsx`

- [ ] **Step 1: Write the failing navigation test for `Scholars`**

Update [`frontend/src/components/layout/PublicPortalNav.test.tsx`](/Users/brenda/Projects/Asian-Mathematical-Network/frontend/src/components/layout/PublicPortalNav.test.tsx) so the signed-out assertion block includes:

```tsx
    expect(screen.getByRole('link', { name: 'Scholars' })).toHaveAttribute(
      'href',
      '/scholars'
    );
```

and the authenticated assertion block includes:

```tsx
    expect(screen.getByRole('button', { name: /account/i })).toBeInTheDocument();
```

- [ ] **Step 2: Run the targeted test to verify it fails**

Run:

```bash
cd frontend && npm run test:run -- src/components/layout/PublicPortalNav.test.tsx
```

Expected: FAIL because the current `publicLinks` array does not include `/scholars`.

- [ ] **Step 3: Implement the minimal navigation change**

Update [`frontend/src/components/layout/PublicPortalNav.tsx`](/Users/brenda/Projects/Asian-Mathematical-Network/frontend/src/components/layout/PublicPortalNav.tsx) by changing the public link list to:

```tsx
const publicLinks = [
  { to: '/conferences', label: 'Conferences' },
  { to: '/grants', label: 'Travel Grants' },
  { to: '/schools', label: 'Schools' },
  { to: '/prizes', label: 'Prizes' },
  { to: '/scholars', label: 'Scholars' },
] as const;
```

If the desktop links overflow after adding `Scholars`, tighten only the nav spacing in [`frontend/src/components/layout/PublicPortalNav.css`](/Users/brenda/Projects/Asian-Mathematical-Network/frontend/src/components/layout/PublicPortalNav.css):

```css
.portal-nav__links {
  gap: 0.25rem;
}

.portal-nav__link {
  padding-inline: 0.8rem;
}
```

- [ ] **Step 4: Re-run the targeted test**

Run:

```bash
cd frontend && npm run test:run -- src/components/layout/PublicPortalNav.test.tsx
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/layout/PublicPortalNav.tsx \
  frontend/src/components/layout/PublicPortalNav.css \
  frontend/src/components/layout/PublicPortalNav.test.tsx
git commit -m "feat: add scholars to public portal nav"
```

## Task 2: Add A Hybrid Scholar Directory Data Layer

**Files:**
- Create: `frontend/src/features/profile/directorySeed.ts`
- Create: `frontend/src/features/profile/scholarDirectoryProvider.ts`
- Create: `frontend/src/features/profile/scholarDirectoryProvider.test.ts`
- Modify: `frontend/src/features/profile/types.ts`
- Modify: `frontend/src/features/profile/fakeProfileProvider.ts`

- [ ] **Step 1: Write the failing provider tests**

Create [`frontend/src/features/profile/scholarDirectoryProvider.test.ts`](/Users/brenda/Projects/Asian-Mathematical-Network/frontend/src/features/profile/scholarDirectoryProvider.test.ts):

```tsx
import { beforeEach, describe, expect, it } from 'vitest';
import {
  resetProfileFakeState,
  seedProfileFakeState,
} from './fakeProfileProvider';
import { scholarDirectoryProvider } from './scholarDirectoryProvider';

describe('scholarDirectoryProvider', () => {
  beforeEach(() => {
    resetProfileFakeState();
  });

  it('includes the editable public profile at the front of the hybrid directory list', async () => {
    const result = await scholarDirectoryProvider.getDirectoryViewModel();

    expect(result.scholars[0].slug).toBe('alice-chen-demo');
    expect(result.scholars[0].fullName).toBe('Alice Chen');
    expect(result.clusters.map((item) => item.label)).toContain('Algebraic Geometry');
  });

  it('omits the editable profile when public visibility is turned off', async () => {
    seedProfileFakeState({ isProfilePublic: false });

    const result = await scholarDirectoryProvider.getDirectoryViewModel();

    expect(result.scholars.find((item) => item.slug === 'alice-chen-demo')).toBeUndefined();
  });
});
```

- [ ] **Step 2: Run the new provider tests to verify they fail**

Run:

```bash
cd frontend && npm run test:run -- src/features/profile/scholarDirectoryProvider.test.ts
```

Expected: FAIL because `scholarDirectoryProvider.ts` does not exist yet.

- [ ] **Step 3: Add list-level scholar and cluster types**

Extend [`frontend/src/features/profile/types.ts`](/Users/brenda/Projects/Asian-Mathematical-Network/frontend/src/features/profile/types.ts) with:

```tsx
export type PublicScholarSummary = {
  slug: string;
  fullName: string;
  title: string | null;
  institutionNameRaw: string | null;
  countryCode: string | null;
  researchKeywords: string[];
  primaryMscCode: string | null;
  bio: string | null;
};

export type ScholarExpertiseCluster = {
  id: string;
  label: string;
  summary: string;
  scholarCount: number;
  institutionCount: number;
};
```

- [ ] **Step 4: Seed directory preview data**

Create [`frontend/src/features/profile/directorySeed.ts`](/Users/brenda/Projects/Asian-Mathematical-Network/frontend/src/features/profile/directorySeed.ts):

```tsx
import type { PublicScholarSummary, ScholarExpertiseCluster } from './types';

export const scholarDirectorySeed: PublicScholarSummary[] = [
  {
    slug: 'prof-reviewer',
    fullName: 'Prof Reviewer',
    title: 'Professor',
    institutionNameRaw: 'University of Tokyo',
    countryCode: 'JP',
    researchKeywords: ['review governance', 'algebraic geometry', 'cross-border collaboration'],
    primaryMscCode: '14J60',
    bio: 'Supports review governance, algebraic geometry, and cross-border mathematical collaboration.',
  },
  {
    slug: 'mei-lin',
    fullName: 'Dr Mei Lin',
    title: 'Associate Professor',
    institutionNameRaw: 'Academia Sinica',
    countryCode: 'TW',
    researchKeywords: ['PDE', 'harmonic analysis', 'dispersive equations'],
    primaryMscCode: '35Q55',
    bio: 'Works on PDE and harmonic-analysis interfaces across regional research networks.',
  },
  {
    slug: 'arjun-sen',
    fullName: 'Dr Arjun Sen',
    title: 'Reader',
    institutionNameRaw: 'Indian Statistical Institute',
    countryCode: 'IN',
    researchKeywords: ['number theory', 'automorphic forms', 'L-functions'],
    primaryMscCode: '11F70',
    bio: 'Builds number-theory collaborations through conferences, schools, and mobility programmes.',
  },
];

export const scholarExpertiseClusterSeed: ScholarExpertiseCluster[] = [
  {
    id: 'cluster-ag',
    label: 'Algebraic Geometry',
    summary: 'Birational geometry, moduli, and arithmetic interfaces.',
    scholarCount: 18,
    institutionCount: 6,
  },
  {
    id: 'cluster-nt',
    label: 'Number Theory',
    summary: 'Automorphic forms, arithmetic geometry, and analytic methods.',
    scholarCount: 14,
    institutionCount: 5,
  },
  {
    id: 'cluster-pde',
    label: 'PDE',
    summary: 'Dispersive equations, harmonic analysis, and applied models.',
    scholarCount: 16,
    institutionCount: 7,
  },
  {
    id: 'cluster-top',
    label: 'Topology',
    summary: 'Low-dimensional topology and geometry across training cohorts.',
    scholarCount: 11,
    institutionCount: 4,
  },
];
```

- [ ] **Step 5: Export one helper from the fake profile provider**

Add this helper near the bottom of [`frontend/src/features/profile/fakeProfileProvider.ts`](/Users/brenda/Projects/Asian-Mathematical-Network/frontend/src/features/profile/fakeProfileProvider.ts):

```tsx
import type { PublicScholarSummary } from './types';

export const readEditablePublicScholarSummary = (): PublicScholarSummary | null => {
  const publicProfile = toPublicProfile(profileState);

  if (!publicProfile) {
    return null;
  }

  return {
    slug: publicProfile.slug,
    fullName: publicProfile.fullName,
    title: publicProfile.title,
    institutionNameRaw: publicProfile.institutionNameRaw,
    countryCode: publicProfile.countryCode,
    researchKeywords: publicProfile.researchKeywords,
    primaryMscCode: publicProfile.mscCodes.find((item) => item.isPrimary)?.code ?? null,
    bio: publicProfile.bio,
  };
};
```

- [ ] **Step 6: Implement the hybrid directory provider**

Create [`frontend/src/features/profile/scholarDirectoryProvider.ts`](/Users/brenda/Projects/Asian-Mathematical-Network/frontend/src/features/profile/scholarDirectoryProvider.ts):

```tsx
import { shouldUseFakeProvider } from '../providerMode';
import { readEditablePublicScholarSummary } from './fakeProfileProvider';
import { scholarDirectorySeed, scholarExpertiseClusterSeed } from './directorySeed';

const clone = <T,>(value: T): T => structuredClone(value);

export const scholarDirectoryProvider = {
  async getDirectoryViewModel() {
    const baseScholars = clone(scholarDirectorySeed);
    const baseClusters = clone(scholarExpertiseClusterSeed);

    if (!shouldUseFakeProvider(import.meta.env)) {
      return {
        clusters: baseClusters,
        scholars: baseScholars,
      };
    }

    const editableProfile = readEditablePublicScholarSummary();
    const scholars = editableProfile
      ? [
          editableProfile,
          ...baseScholars.filter((item) => item.slug !== editableProfile.slug),
        ]
      : baseScholars;

    return {
      clusters: baseClusters,
      scholars,
    };
  },
};
```

- [ ] **Step 7: Re-run the provider tests**

Run:

```bash
cd frontend && npm run test:run -- src/features/profile/scholarDirectoryProvider.test.ts
```

Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add frontend/src/features/profile/types.ts \
  frontend/src/features/profile/directorySeed.ts \
  frontend/src/features/profile/fakeProfileProvider.ts \
  frontend/src/features/profile/scholarDirectoryProvider.ts \
  frontend/src/features/profile/scholarDirectoryProvider.test.ts
git commit -m "feat: add hybrid scholar directory provider"
```

## Task 3: Add The Public `/scholars` Directory Route

**Files:**
- Create: `frontend/src/features/profile/ScholarSummaryCard.tsx`
- Create: `frontend/src/features/profile/ScholarExpertiseClusterList.tsx`
- Create: `frontend/src/pages/Scholars.tsx`
- Create: `frontend/src/pages/Scholars.css`
- Create: `frontend/src/pages/Scholars.test.tsx`

- [ ] **Step 1: Write the failing directory-page test**

Create [`frontend/src/pages/Scholars.test.tsx`](/Users/brenda/Projects/Asian-Mathematical-Network/frontend/src/pages/Scholars.test.tsx):

```tsx
import { beforeEach, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithRouter } from '../test/renderWithRouter';
import Scholars from './Scholars';

beforeEach(() => {
  localStorage.clear();
});

it('renders the public scholar directory with expertise clusters and scholar cards', async () => {
  renderWithRouter(<Scholars />, '/scholars', '/scholars');

  expect(
    await screen.findByRole('heading', { name: /scholar directory/i })
  ).toBeInTheDocument();
  expect(screen.getByText(/browse public scholar profiles and research areas/i)).toBeInTheDocument();
  expect(screen.getByText('Algebraic Geometry')).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Alice Chen' })).toHaveAttribute(
    'href',
    '/scholars/alice-chen-demo'
  );
  expect(screen.getByRole('link', { name: 'Prof Reviewer' })).toHaveAttribute(
    'href',
    '/scholars/prof-reviewer'
  );
});
```

- [ ] **Step 2: Run the directory-page test to verify it fails**

Run:

```bash
cd frontend && npm run test:run -- src/pages/Scholars.test.tsx
```

Expected: FAIL because `Scholars.tsx` does not exist yet.

- [ ] **Step 3: Create the reusable summary components**

Create [`frontend/src/features/profile/ScholarSummaryCard.tsx`](/Users/brenda/Projects/Asian-Mathematical-Network/frontend/src/features/profile/ScholarSummaryCard.tsx):

```tsx
import { Link } from 'react-router-dom';
import { buildScholarRoute, formatCountryCode } from './profilePresentation';
import type { PublicScholarSummary } from './types';

type Props = {
  scholar: PublicScholarSummary;
};

export function ScholarSummaryCard({ scholar }: Props) {
  return (
    <article className="surface-card scholar-summary-card">
      <p className="scholar-summary-card__eyebrow">Public scholar profile</p>
      <Link className="scholar-summary-card__title" to={buildScholarRoute(scholar.slug)}>
        {scholar.fullName}
      </Link>
      <p className="scholar-summary-card__meta">
        {[scholar.title, scholar.institutionNameRaw, formatCountryCode(scholar.countryCode)]
          .filter(Boolean)
          .join(' · ')}
      </p>
      <p className="scholar-summary-card__summary">{scholar.bio ?? 'Research profile available.'}</p>
      <ul className="profile-pill-list">
        {scholar.researchKeywords.slice(0, 3).map((keyword) => (
          <li key={keyword}>{keyword}</li>
        ))}
        {scholar.primaryMscCode ? <li>{scholar.primaryMscCode}</li> : null}
      </ul>
    </article>
  );
}
```

Create [`frontend/src/features/profile/ScholarExpertiseClusterList.tsx`](/Users/brenda/Projects/Asian-Mathematical-Network/frontend/src/features/profile/ScholarExpertiseClusterList.tsx):

```tsx
import type { ScholarExpertiseCluster } from './types';

type Props = {
  clusters: ScholarExpertiseCluster[];
};

export function ScholarExpertiseClusterList({ clusters }: Props) {
  return (
    <ul className="scholar-cluster-list">
      {clusters.map((cluster) => (
        <li key={cluster.id} className="surface-card scholar-cluster-card">
          <h3>{cluster.label}</h3>
          <p>{cluster.summary}</p>
          <p className="scholar-cluster-card__meta">
            {cluster.scholarCount} scholars · {cluster.institutionCount} institutions
          </p>
        </li>
      ))}
    </ul>
  );
}
```

- [ ] **Step 4: Implement the new page**

Create [`frontend/src/pages/Scholars.tsx`](/Users/brenda/Projects/Asian-Mathematical-Network/frontend/src/pages/Scholars.tsx):

```tsx
import { useEffect, useState } from 'react';
import { PortalShell } from '../components/layout/PortalShell';
import { PublicPortalNav } from '../components/layout/PublicPortalNav';
import { PageModeBadge } from '../components/ui/PageModeBadge';
import { RoleBadge } from '../components/ui/RoleBadge';
import { DemoStatePanel } from '../features/demo/DemoStatePanel';
import { ScholarExpertiseClusterList } from '../features/profile/ScholarExpertiseClusterList';
import { ScholarSummaryCard } from '../features/profile/ScholarSummaryCard';
import { scholarDirectoryProvider } from '../features/profile/scholarDirectoryProvider';
import type { PublicScholarSummary, ScholarExpertiseCluster } from '../features/profile/types';
import './Scholars.css';

export const routePath = '/scholars';

export default function Scholars() {
  const [scholars, setScholars] = useState<PublicScholarSummary[] | null>(null);
  const [clusters, setClusters] = useState<ScholarExpertiseCluster[]>([]);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    let active = true;

    scholarDirectoryProvider
      .getDirectoryViewModel()
      .then((value) => {
        if (!active) return;
        setScholars(value.scholars);
        setClusters(value.clusters);
      })
      .catch(() => {
        if (!active) return;
        setHasError(true);
        setScholars([]);
      });

    return () => {
      active = false;
    };
  }, []);

  return (
    <PortalShell masthead={<PublicPortalNav />}>
      <section className="scholar-directory-page" aria-labelledby="scholar-directory-heading">
        <div className="scholar-directory-page__intro">
          <p className="page-shell__eyebrow">Academic directory</p>
          <h1 id="scholar-directory-heading">Scholar directory</h1>
          <p>
            Browse public scholar profiles and research areas that support conference, grant,
            prize, and partner-facing network discovery.
          </p>
          <div className="page-shell__badges">
            <RoleBadge role="visitor" />
            <PageModeBadge mode="hybrid" />
          </div>
        </div>

        {scholars === null ? (
          <DemoStatePanel
            badgeLabel={hasError ? 'Error' : 'Loading'}
            title={hasError ? 'Scholar directory unavailable' : 'Loading scholar directory'}
            description={
              hasError
                ? 'We could not load the scholar directory right now.'
                : 'Preparing the public academic-directory surface for the demo.'
            }
            tone={hasError ? 'danger' : 'info'}
          />
        ) : (
          <>
            <section className="scholar-directory-page__clusters" aria-labelledby="scholar-clusters-heading">
              <div className="scholar-directory-page__section-copy">
                <p className="page-shell__eyebrow">Expertise areas</p>
                <h2 id="scholar-clusters-heading">Research clusters across the network</h2>
              </div>
              <ScholarExpertiseClusterList clusters={clusters} />
            </section>

            <section className="scholar-directory-page__list" aria-labelledby="scholar-list-heading">
              <div className="scholar-directory-page__section-copy">
                <p className="page-shell__eyebrow">Featured scholars</p>
                <h2 id="scholar-list-heading">Public scholar profiles</h2>
              </div>
              <div className="scholar-directory-page__grid">
                {scholars.map((scholar) => (
                  <ScholarSummaryCard key={scholar.slug} scholar={scholar} />
                ))}
              </div>
            </section>
          </>
        )}
      </section>
    </PortalShell>
  );
}
```

- [ ] **Step 5: Add the page styles**

Create [`frontend/src/pages/Scholars.css`](/Users/brenda/Projects/Asian-Mathematical-Network/frontend/src/pages/Scholars.css):

```css
.scholar-directory-page,
.scholar-directory-page__intro,
.scholar-directory-page__clusters,
.scholar-directory-page__list,
.scholar-directory-page__section-copy {
  display: grid;
  gap: var(--space-4);
}

.scholar-directory-page__grid,
.scholar-cluster-list {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--space-4);
  list-style: none;
  margin: 0;
  padding: 0;
}

.scholar-summary-card,
.scholar-cluster-card {
  display: grid;
  gap: var(--space-3);
}

.scholar-summary-card__title {
  font-family: var(--font-heading);
  font-size: 1.35rem;
  color: var(--color-navy-900);
  text-decoration: none;
}

.scholar-summary-card__meta,
.scholar-cluster-card__meta {
  color: var(--color-text-subtle);
}

@media (max-width: 900px) {
  .scholar-directory-page__grid,
  .scholar-cluster-list {
    grid-template-columns: 1fr;
  }
}
```

- [ ] **Step 6: Re-run the directory-page test**

Run:

```bash
cd frontend && npm run test:run -- src/pages/Scholars.test.tsx
```

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add frontend/src/features/profile/ScholarSummaryCard.tsx \
  frontend/src/features/profile/ScholarExpertiseClusterList.tsx \
  frontend/src/pages/Scholars.tsx \
  frontend/src/pages/Scholars.css \
  frontend/src/pages/Scholars.test.tsx
git commit -m "feat: add public scholar directory page"
```

## Task 4: Extend The Homepage With Schools And The M4 Mixed Teaser

**Files:**
- Modify: `frontend/src/features/portal/homepageViewModel.ts`
- Create: `frontend/src/features/portal/homepageViewModel.test.ts`
- Modify: `frontend/src/pages/Portal.tsx`
- Modify: `frontend/src/pages/Portal.css`
- Modify: `frontend/src/pages/Portal.test.tsx`

- [ ] **Step 1: Write the failing homepage tests**

Create [`frontend/src/features/portal/homepageViewModel.test.ts`](/Users/brenda/Projects/Asian-Mathematical-Network/frontend/src/features/portal/homepageViewModel.test.ts):

```tsx
import { describe, expect, it } from 'vitest';
import { loadPortalHomepageViewModel } from './homepageViewModel';

describe('loadPortalHomepageViewModel', () => {
  it('returns opportunity, school, and scholar teaser data for the homepage', async () => {
    const model = await loadPortalHomepageViewModel();

    expect(model.featuredOpportunities).toHaveLength(2);
    expect(model.schoolSpotlights.length).toBeGreaterThan(0);
    expect(model.scholarTeaser.clusters.length).toBeGreaterThan(0);
    expect(model.scholarTeaser.scholars.length).toBeGreaterThan(0);
  });
});
```

Extend [`frontend/src/pages/Portal.test.tsx`](/Users/brenda/Projects/Asian-Mathematical-Network/frontend/src/pages/Portal.test.tsx) with:

```tsx
it('renders a scholars and expertise teaser after the opportunity-led sections', async () => {
  renderWithRouter(<Portal />, '/portal', '/portal');

  expect(await screen.findByRole('heading', { name: /featured opportunities/i })).toBeInTheDocument();
  expect(screen.getByRole('heading', { name: /scholars & expertise/i })).toBeInTheDocument();
  expect(screen.getByText('Algebraic Geometry')).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Browse Scholar Directory' })).toHaveAttribute(
    'href',
    '/scholars'
  );
});
```

- [ ] **Step 2: Run the homepage tests to verify they fail**

Run:

```bash
cd frontend && npm run test:run -- \
  src/features/portal/homepageViewModel.test.ts \
  src/pages/Portal.test.tsx
```

Expected: FAIL because the current homepage model does not expose school or scholar teaser data.

- [ ] **Step 3: Extend the homepage view model**

Replace the current `PortalHomepageViewModel` shape in [`frontend/src/features/portal/homepageViewModel.ts`](/Users/brenda/Projects/Asian-Mathematical-Network/frontend/src/features/portal/homepageViewModel.ts) with:

```tsx
import { scholarDirectoryProvider } from '../profile/scholarDirectoryProvider';
import type { PublicScholarSummary, ScholarExpertiseCluster } from '../profile/types';

export type FeaturedOpportunityCard = {
  kind: 'conference' | 'grant';
  href: string;
  title: string;
  location: string;
  dateLabel: string;
  statusLabel: 'Open' | 'Upcoming';
  summary: string;
};

export type FeaturedSchoolSpotlight = {
  href: string;
  title: string;
  location: string;
  summary: string;
  travelSupportAvailable: boolean;
};

export type PortalHomepageViewModel = {
  summary: {
    openConferences: number;
    openGrants: number;
    openSchools: number;
    note: string;
  };
  featuredOpportunities: FeaturedOpportunityCard[];
  schoolSpotlights: FeaturedSchoolSpotlight[];
  scholarTeaser: {
    clusters: ScholarExpertiseCluster[];
    scholars: PublicScholarSummary[];
  };
};
```

and update `loadPortalHomepageViewModel()` so it:

```tsx
  const [conferences, grants, schools, scholarDirectory] = await Promise.all([
    conferenceProvider.listPublicConferences(),
    grantProvider.listPublicGrants(),
    schoolProvider.listPublicSchools(),
    scholarDirectoryProvider.getDirectoryViewModel(),
  ]);
```

then returns:

```tsx
  return {
    summary: {
      openConferences: conferences.filter((item) => item.isApplicationOpen).length,
      openGrants: grants.filter((item) => item.isApplicationOpen).length,
      openSchools: schools.length,
      note: 'Travel support is available for eligible participants in selected programmes.',
    },
    featuredOpportunities: featuredCards.slice(0, 2),
    schoolSpotlights: schools.slice(0, 2).map((school) => ({
      href: `/schools/${school.slug}`,
      title: school.title,
      location: school.locationText ?? 'Regional cohort',
      summary: school.summary,
      travelSupportAvailable: school.travelSupportAvailable,
    })),
    scholarTeaser: {
      clusters: scholarDirectory.clusters.slice(0, 4),
      scholars: scholarDirectory.scholars.slice(0, 3),
    },
  };
```

- [ ] **Step 4: Upgrade the homepage composition**

In [`frontend/src/pages/Portal.tsx`](/Users/brenda/Projects/Asian-Mathematical-Network/frontend/src/pages/Portal.tsx):

1. Change `homepageModel.featuredCards` references to `homepageModel.featuredOpportunities`
2. Add a dedicated schools section:

```tsx
      <section className="portal-home__schools" aria-labelledby="portal-home-schools-heading">
        <div className="portal-home__section-copy">
          <p className="portal-home__section-kicker">Schools & training</p>
          <h2 id="portal-home-schools-heading">Training programmes across the network</h2>
          <p>
            School formats stay distinct from conferences and foreground pedagogy, cohort learning,
            and early-career support.
          </p>
        </div>

        <div className="portal-home__school-grid">
          {homepageModel?.schoolSpotlights.map((school) => (
            <article key={school.href} className="surface-card portal-home__school-card">
              <Link to={school.href} state={portalReturnState} className="portal-home__card-title">
                {school.title}
              </Link>
              <p className="portal-home__card-meta">{school.location}</p>
              <p className="portal-home__card-summary">{school.summary}</p>
            </article>
          ))}
        </div>
      </section>
```

3. Add the `M4` mixed teaser:

```tsx
      <section className="portal-home__scholars" aria-labelledby="portal-home-scholars-heading">
        <div className="portal-home__section-copy">
          <p className="portal-home__section-kicker">M4 · Academic directory</p>
          <h2 id="portal-home-scholars-heading">Scholars & expertise</h2>
          <p>
            The network is not only a set of opportunities. Public scholar profiles and expertise
            clusters show the people and fields that support conferences, grants, prizes, and
            partner-facing collaboration.
          </p>
        </div>

        <ScholarExpertiseClusterList clusters={homepageModel?.scholarTeaser.clusters ?? []} />

        <div className="portal-home__scholar-grid">
          {homepageModel?.scholarTeaser.scholars.map((scholar) => (
            <ScholarSummaryCard key={scholar.slug} scholar={scholar} />
          ))}
        </div>

        <Link to="/scholars" className="conference-primary-link">
          Browse Scholar Directory
        </Link>
      </section>
```

- [ ] **Step 5: Add the homepage styles for the new sections**

Extend [`frontend/src/pages/Portal.css`](/Users/brenda/Projects/Asian-Mathematical-Network/frontend/src/pages/Portal.css) with:

```css
.portal-home__schools,
.portal-home__scholars {
  display: grid;
  gap: var(--space-5);
}

.portal-home__school-grid,
.portal-home__scholar-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--space-4);
}

.portal-home__school-card {
  display: grid;
  gap: var(--space-3);
}

@media (max-width: 900px) {
  .portal-home__school-grid,
  .portal-home__scholar-grid {
    grid-template-columns: 1fr;
  }
}
```

- [ ] **Step 6: Re-run the homepage tests**

Run:

```bash
cd frontend && npm run test:run -- \
  src/features/portal/homepageViewModel.test.ts \
  src/pages/Portal.test.tsx
```

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add frontend/src/features/portal/homepageViewModel.ts \
  frontend/src/features/portal/homepageViewModel.test.ts \
  frontend/src/pages/Portal.tsx \
  frontend/src/pages/Portal.css \
  frontend/src/pages/Portal.test.tsx
git commit -m "feat: add schools and m4 teaser to homepage"
```

## Task 5: Make M4 Reuse Visible In Conference And Prize Surfaces

**Files:**
- Modify: `frontend/src/pages/ConferenceDetail.tsx`
- Modify: `frontend/src/pages/Conference.css`
- Create: `frontend/src/pages/ConferenceDetail.test.tsx`
- Modify: `frontend/src/pages/Prizes.tsx`
- Modify: `frontend/src/pages/PrizeDetail.tsx`
- Modify: `frontend/src/pages/Prize.css`
- Modify: `frontend/src/pages/Prizes.test.tsx`

- [ ] **Step 1: Write the failing cross-module reuse tests**

Create [`frontend/src/pages/ConferenceDetail.test.tsx`](/Users/brenda/Projects/Asian-Mathematical-Network/frontend/src/pages/ConferenceDetail.test.tsx):

```tsx
import { beforeEach, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithRouter } from '../test/renderWithRouter';
import ConferenceDetail from './ConferenceDetail';

beforeEach(() => {
  localStorage.clear();
});

it('shows related scholar context on the public conference detail page', async () => {
  renderWithRouter(
    <ConferenceDetail />,
    '/conferences/asiamath-2026-workshop',
    '/conferences/:slug'
  );

  expect(
    await screen.findByRole('heading', { name: 'Asiamath 2026 Workshop' })
  ).toBeInTheDocument();
  expect(screen.getByRole('link', { name: /alice chen/i })).toHaveAttribute(
    'href',
    '/scholars/alice-chen-demo'
  );
  expect(screen.getByText(/related scholar context/i)).toBeInTheDocument();
});
```

Update [`frontend/src/pages/Prizes.test.tsx`](/Users/brenda/Projects/Asian-Mathematical-Network/frontend/src/pages/Prizes.test.tsx) so the list-page test asserts:

```tsx
    expect(screen.getByRole('heading', { name: /prize pathways/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /browse prize archive/i })).toHaveAttribute(
      'href',
      '#prize-archive-list'
    );
```

and the detail-page test asserts:

```tsx
    expect(screen.getByRole('link', { name: /view sample laureate profile/i })).toHaveAttribute(
      'href',
      '/scholars/prof-reviewer'
    );
```

- [ ] **Step 2: Run the targeted tests to verify they fail**

Run:

```bash
cd frontend && npm run test:run -- \
  src/pages/ConferenceDetail.test.tsx \
  src/pages/Prizes.test.tsx
```

Expected: FAIL because conference detail has no scholar card and prizes still render as a flat archive page.

- [ ] **Step 3: Add a scholar-context card to conference detail**

In [`frontend/src/pages/ConferenceDetail.tsx`](/Users/brenda/Projects/Asian-Mathematical-Network/frontend/src/pages/ConferenceDetail.tsx), add this second aside block below the application CTA:

```tsx
          <div className="conference-detail-card conference-scholar-card">
            <h2>Related scholar context</h2>
            <p>
              Public scholar profiles give this conference surface a visible connection to the
              academic directory that also supports review, prizes, and expert matching.
            </p>
            <Link
              className="conference-primary-link"
              to="/scholars/alice-chen-demo"
              state={{
                returnContext: {
                  to: `/conferences/${conference.slug}`,
                  label: 'Back to conference',
                  state: toReturnContextState(returnContext),
                },
              }}
            >
              Alice Chen
            </Link>
          </div>
```

If the existing `aside` prop currently only accepts one card, wrap both cards in a fragment:

```tsx
      aside={
        conference ? (
          <>
            {/* existing application CTA card */}
            {/* new scholar context card */}
          </>
        ) : null
      }
```

Add the supporting style in [`frontend/src/pages/Conference.css`](/Users/brenda/Projects/Asian-Mathematical-Network/frontend/src/pages/Conference.css):

```css
.conference-scholar-card {
  display: grid;
  gap: var(--space-3);
}
```

- [ ] **Step 4: Upgrade prizes into the hub form and sharpen the scholar link**

In [`frontend/src/pages/Prizes.tsx`](/Users/brenda/Projects/Asian-Mathematical-Network/frontend/src/pages/Prizes.tsx), replace the flat archive render with:

```tsx
          <>
            <section className="prize-hub" aria-labelledby="prize-hub-heading">
              <div className="prize-hub__copy">
                <h2 id="prize-hub-heading">Prize pathways</h2>
                <p>
                  Public prize pages should separate active nomination direction from archive-style
                  recognition history while staying linked to scholar context and governance.
                </p>
              </div>

              <div className="prize-hub__grid">
                <article id="prize-current-calls" className="surface-card prize-hub__card">
                  <h3>Current calls / nominations</h3>
                  <p>Use the detail surfaces to preview how nomination intake and scholar context can align.</p>
                  <a href="#prize-current-calls" className="prize-primary-link">
                    Review nomination direction
                  </a>
                </article>

                <article className="surface-card prize-hub__card">
                  <h3>Archive / past laureates</h3>
                  <p>The archive remains the public record of recognition across the network.</p>
                  <a href="#prize-archive-list" className="prize-primary-link">
                    Browse prize archive
                  </a>
                </article>
              </div>
            </section>

            <section id="prize-archive-list" className="prize-archive">
              <div className="prize-grid">{/* existing mapped cards */}</div>
            </section>
          </>
```

In [`frontend/src/pages/PrizeDetail.tsx`](/Users/brenda/Projects/Asian-Mathematical-Network/frontend/src/pages/PrizeDetail.tsx), rename the scholar CTA to:

```tsx
            <Link
              className="prize-primary-link"
              to="/scholars/prof-reviewer"
              state={{
                returnContext: {
                  to: `/prizes/${prize.slug}`,
                  label: 'Back to prize',
                  state: toReturnContextState(returnContext),
                },
              }}
            >
              View sample laureate profile
            </Link>
```

and add hub styles to [`frontend/src/pages/Prize.css`](/Users/brenda/Projects/Asian-Mathematical-Network/frontend/src/pages/Prize.css):

```css
.prize-hub,
.prize-archive {
  display: grid;
  gap: var(--space-4);
}

.prize-hub__grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--space-4);
}

.prize-hub__card {
  display: grid;
  gap: var(--space-3);
}

@media (max-width: 900px) {
  .prize-hub__grid {
    grid-template-columns: 1fr;
  }
}
```

- [ ] **Step 5: Re-run the cross-module tests**

Run:

```bash
cd frontend && npm run test:run -- \
  src/pages/ConferenceDetail.test.tsx \
  src/pages/Prizes.test.tsx
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add frontend/src/pages/ConferenceDetail.tsx \
  frontend/src/pages/Conference.css \
  frontend/src/pages/ConferenceDetail.test.tsx \
  frontend/src/pages/Prizes.tsx \
  frontend/src/pages/PrizeDetail.tsx \
  frontend/src/pages/Prize.css \
  frontend/src/pages/Prizes.test.tsx
git commit -m "feat: surface scholar reuse across conference and prize pages"
```

## Task 6: Verify End-To-End Frontend Scope And Leave Handoff Artifacts

**Files:**
- Modify: `PROGRESS.md`

- [ ] **Step 1: Run the focused frontend verification suite**

Run:

```bash
cd frontend && npm run test:run -- \
  src/components/layout/PublicPortalNav.test.tsx \
  src/features/profile/scholarDirectoryProvider.test.ts \
  src/pages/Scholars.test.tsx \
  src/features/portal/homepageViewModel.test.ts \
  src/pages/Portal.test.tsx \
  src/pages/ConferenceDetail.test.tsx \
  src/pages/Prizes.test.tsx \
  src/pages/ScholarProfile.test.tsx \
  src/pages/Partners.test.tsx
```

Expected: PASS.

- [ ] **Step 2: Run the frontend build**

Run:

```bash
cd frontend && npm run build
```

Expected: PASS.

- [ ] **Step 3: Append the handoff log**

Add a new top entry to [`PROGRESS.md`](/Users/brenda/Projects/Asian-Mathematical-Network/PROGRESS.md) in this shape:

```md
### 2026-04-26 (Session XX)
*   **Agent 角色**: Coding Agent (Portal + M4 breadth refinement)
*   **完成 Feature**: homepage + M4 public directory refinement
*   **变更记录**:
    *   公共首页升级为新的 public-home composition，新增 `Scholars` 顶导、schools section 与 `Scholars & Expertise` mixed teaser。
    *   新增 `/scholars` 公共目录页，并保留 `/scholars/:slug` 作为详情页。
    *   `M4` scholar context 现在也出现在 conference detail 和 prize surfaces 中，强化目录基座角色。
*   **验证记录**:
    *   执行通过 `cd frontend && npm run test:run -- ...`
    *   执行通过 `cd frontend && npm run build`
*   **边界与说明**:
    *   本轮未新增 backend scholar list endpoint，也未修改 `docs/planning/` 与 `docs/product/`。
*   **下一步**: 如果需要，再补内容 feeds / member institutions 等 secondary homepage breadth。
```

- [ ] **Step 4: Commit the verified slice**

```bash
git add PROGRESS.md
git commit -m "chore: record homepage and m4 refinement handoff"
```

## Self-Review

### Spec coverage

- Homepage React rebuild: covered by Tasks 1 and 4.
- `Scholars` in public nav: covered by Task 1.
- Homepage `M4` mixed teaser: covered by Task 4.
- `/scholars` directory page: covered by Tasks 2 and 3.
- `/scholars/:slug` continuing as detail page: preserved by Tasks 2 and 6 verification.
- Visible `M4` reuse in other modules: covered by Task 5, while `M3` and `M14` reuse remain preserved through existing tests in Task 6.
- AGENT_HARNESS verification + handoff discipline: covered by Preflight and Task 6.

### Placeholder scan

- No `TODO`, `TBD`, or “implement later” markers remain.
- Every task includes concrete file paths, commands, and expected results.

### Type consistency

- `PublicScholarSummary` and `ScholarExpertiseCluster` are introduced once in Task 2 and reused consistently in Tasks 3 and 4.
- Homepage data names use `featuredOpportunities`, `schoolSpotlights`, and `scholarTeaser` consistently across the provider, tests, and page composition.

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-04-26-portal-homepage-m4-implementation.md`. Two execution options:

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

Which approach?
