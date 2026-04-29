# Portal Homepage Supporting Content Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `/portal` read like a live network homepage by moving supporting content ownership out of portal-local mocks and into feature-owned teaser sources, without adding backend dependencies.

**Architecture:** Keep `/portal` as a hybrid aggregator, but stop hardcoding prize, outreach, network, and partner content directly inside `homepageViewModel`. Introduce thin provider boundaries for the current static-preview breadth modules, rewrite fake/static records into realistic public-facing entries, and have the homepage derive its supporting sections from those feature-owned sources.

**Tech Stack:** React 19, React Router 7, TypeScript, Vite, Vitest, React Testing Library, user-event, global CSS

---

## Preflight

- Read:
  - `docs/superpowers/specs/2026-04-27-portal-homepage-supporting-content-design.md`
  - `docs/planning/asiamath-demo-data-source-matrix-d0.md`
  - `frontend/src/features/portal/homepageViewModel.ts`
  - `frontend/src/pages/Portal.tsx`
- Do not edit:
  - `docs/product/*`
  - `docs/planning/*`
  - backend Prisma / migration files
- Before code changes, run:

```bash
cd frontend && npm run test:run -- \
  src/features/portal/homepageViewModel.test.ts \
  src/pages/Portal.test.tsx \
  src/pages/Outreach.test.tsx \
  src/pages/Newsletters.test.tsx \
  src/pages/Publications.test.tsx \
  src/pages/Videos.test.tsx \
  src/pages/Partners.test.tsx \
  src/components/layout/PublicPortalNav.test.tsx
```

Expected: PASS on the current branch baseline or fail only in files already being changed for this slice.

- Also run:

```bash
cd frontend && npm run build
```

Expected: PASS.

## File Structure

- `frontend/src/features/newsletter/types.ts`
  Add a feature-owned provider contract for newsletter records.
- `frontend/src/features/newsletter/staticNewsletterContent.ts`
  Rewrite newsletter source records into realistic editorial issues.
- `frontend/src/features/newsletter/newsletterProvider.ts`
  Expose async list/detail access for newsletter content.
- `frontend/src/features/publication/types.ts`
  Add a provider contract for publication records.
- `frontend/src/features/publication/staticPublicationContent.ts`
  Rewrite publication source records into realistic public outputs.
- `frontend/src/features/publication/publicationProvider.ts`
  Expose async list/detail access for publications.
- `frontend/src/features/video/types.ts`
  Add a provider contract for video records.
- `frontend/src/features/video/staticVideoContent.ts`
  Rewrite video source records into realistic archive entries.
- `frontend/src/features/video/videoProvider.ts`
  Expose async list/detail access for videos.
- `frontend/src/features/outreach/types.ts`
  Define the outreach teaser record and provider contract.
- `frontend/src/features/outreach/staticOutreachContent.ts`
  Rewrite outreach source records into realistic public programmes.
- `frontend/src/features/outreach/outreachProvider.ts`
  Expose async list access for outreach programmes.
- `frontend/src/features/partner/fakePartnerProvider.ts`
  Replace breadth-copy partner seeds with concrete institution-like records.
- `frontend/src/features/prize/fakePrizeProvider.ts`
  Replace preview-style prize copy with archive-style public entries.
- `frontend/src/pages/Newsletters.tsx`
  Consume the newsletter provider instead of directly importing static arrays.
- `frontend/src/pages/NewsletterDetail.tsx`
  Read newsletter issue detail through the provider boundary.
- `frontend/src/pages/Publications.tsx`
  Consume the publication provider.
- `frontend/src/pages/PublicationDetail.tsx`
  Read publication detail through the provider boundary.
- `frontend/src/pages/Videos.tsx`
  Consume the video provider.
- `frontend/src/pages/VideoDetail.tsx`
  Read video detail through the provider boundary.
- `frontend/src/pages/Outreach.tsx`
  Consume the outreach provider.
- `frontend/src/features/portal/homepageViewModel.ts`
  Load feature-owned supporting content and map it into homepage teaser sections.
- `frontend/src/pages/Portal.tsx`
  Remove remaining meta copy and present supporting sections as visitor-facing editorial content.
- `frontend/src/features/portal/homepageViewModel.test.ts`
  Lock provider-sourced homepage content.
- `frontend/src/pages/Portal.test.tsx`
  Lock the homepage supporting-content contract.
- `frontend/src/pages/Outreach.test.tsx`
  Update outreach assertions to realistic program names and provider-backed rendering.
- `frontend/src/pages/Newsletters.test.tsx`
  Update newsletter assertions to realistic issues and provider-backed rendering.
- `frontend/src/pages/Publications.test.tsx`
  Update publication assertions to realistic outputs and provider-backed rendering.
- `frontend/src/pages/Videos.test.tsx`
  Update video assertions to realistic archive entries and provider-backed rendering.
- `frontend/src/pages/Partners.test.tsx`
  Update partner assertions to the refreshed institution-facing fake data.
- `frontend/src/features/portal/supportingContentSources.test.ts`
  Add a focused contract test that the new provider-backed source records contain realistic titles and no preview/placeholders.

## Task 1: Add Feature-Owned Provider Boundaries For Supporting Content

**Files:**
- Create: `frontend/src/features/portal/supportingContentSources.test.ts`
- Modify: `frontend/src/features/newsletter/types.ts`
- Modify: `frontend/src/features/newsletter/staticNewsletterContent.ts`
- Create: `frontend/src/features/newsletter/newsletterProvider.ts`
- Modify: `frontend/src/features/publication/types.ts`
- Modify: `frontend/src/features/publication/staticPublicationContent.ts`
- Create: `frontend/src/features/publication/publicationProvider.ts`
- Modify: `frontend/src/features/video/types.ts`
- Modify: `frontend/src/features/video/staticVideoContent.ts`
- Create: `frontend/src/features/video/videoProvider.ts`
- Create: `frontend/src/features/outreach/types.ts`
- Modify: `frontend/src/features/outreach/staticOutreachContent.ts`
- Create: `frontend/src/features/outreach/outreachProvider.ts`

- [ ] **Step 1: Write the failing cross-feature source-contract test**

Create [`frontend/src/features/portal/supportingContentSources.test.ts`](/Users/brenda/Projects/Asian-Mathematical-Network/frontend/src/features/portal/supportingContentSources.test.ts):

```tsx
import { describe, expect, it } from 'vitest';
import { newsletterProvider } from '../newsletter/newsletterProvider';
import { publicationProvider } from '../publication/publicationProvider';
import { videoProvider } from '../video/videoProvider';
import { outreachProvider } from '../outreach/outreachProvider';

const flattenText = (...values: string[]) => values.join(' ').toLowerCase();

describe('supporting content sources', () => {
  it('returns realistic teaser records without preview or placeholder language', async () => {
    const [issues, publications, videos, outreachPrograms] = await Promise.all([
      newsletterProvider.listPublicIssues(),
      publicationProvider.listPublications(),
      videoProvider.listPublicVideos(),
      outreachProvider.listPublicPrograms(),
    ]);

    expect(issues[0].title).toBe('Asiamath Monthly Briefing — April 2026');
    expect(publications[0].title).toBe('Algebraic Geometry School Notes');
    expect(videos[0].title).toBe('Algebraic Geometry School Session Recap');
    expect(outreachPrograms[0].title).toBe('Tokyo Public Lecture: Moduli After the Workshop');

    for (const record of [...issues, ...publications, ...videos, ...outreachPrograms]) {
      expect(flattenText(record.title, record.summary)).not.toMatch(/preview|placeholder|concept/);
    }
  });
});
```

- [ ] **Step 2: Run the new contract test to verify it fails**

Run:

```bash
cd frontend && npm run test:run -- src/features/portal/supportingContentSources.test.ts
```

Expected: FAIL because the provider files do not exist and the current source titles still contain preview language.

- [ ] **Step 3: Add provider contracts and rewrite the seed content**

Update [`frontend/src/features/newsletter/types.ts`](/Users/brenda/Projects/Asian-Mathematical-Network/frontend/src/features/newsletter/types.ts):

```ts
export type NewsletterIssue = {
  id: string;
  slug: string;
  title: string;
  issueLabel: string;
  ctaLabel: string;
  summary: string;
  issueFocus: string;
  highlights: string[];
};

export type NewsletterProvider = {
  listPublicIssues(): Promise<NewsletterIssue[]>;
  getIssueBySlug(slug: string): Promise<NewsletterIssue | null>;
};
```

Update [`frontend/src/features/newsletter/staticNewsletterContent.ts`](/Users/brenda/Projects/Asian-Mathematical-Network/frontend/src/features/newsletter/staticNewsletterContent.ts):

```ts
import type { NewsletterIssue } from './types';

export const newsletterIssues: NewsletterIssue[] = [
  {
    id: 'newsletter-001',
    slug: 'asiamath-monthly-briefing-april-2026',
    title: 'Asiamath Monthly Briefing — April 2026',
    issueLabel: 'April 2026 issue',
    ctaLabel: 'Read issue',
    summary:
      'Workshop deadlines, school announcements, and partner updates from across the current Asiamath cycle.',
    issueFocus:
      'This issue follows the Shanghai workshop call, linked travel support, and summer training announcements across the network.',
    highlights: ['Workshop deadline round-up', 'Travel grant calendar', 'Partner update digest'],
  },
  {
    id: 'newsletter-002',
    slug: 'research-mobility-digest-march-2026',
    title: 'Research Mobility Digest — March 2026',
    issueLabel: 'March 2026 digest',
    ctaLabel: 'Read digest',
    summary:
      'Mobility funding notes, application reminders, and regional participation guidance for early-career researchers.',
    issueFocus:
      'The March digest centers on travel support, application sequencing, and participation planning around active calls.',
    highlights: ['Mobility advice note', 'Application reminders', 'Profile-preparation checklist'],
  },
];
```

Create [`frontend/src/features/newsletter/newsletterProvider.ts`](/Users/brenda/Projects/Asian-Mathematical-Network/frontend/src/features/newsletter/newsletterProvider.ts):

```ts
import { newsletterIssues } from './staticNewsletterContent';
import type { NewsletterProvider } from './types';

export const newsletterProvider: NewsletterProvider = {
  async listPublicIssues() {
    return newsletterIssues.map((issue) => structuredClone(issue));
  },

  async getIssueBySlug(slug) {
    return structuredClone(newsletterIssues.find((issue) => issue.slug === slug) ?? null);
  },
};
```

Update [`frontend/src/features/publication/types.ts`](/Users/brenda/Projects/Asian-Mathematical-Network/frontend/src/features/publication/types.ts):

```ts
export type PublicationPreview = {
  id: string;
  slug: string;
  title: string;
  seriesLabel: string;
  ctaLabel: string;
  summary: string;
  publicationFocus: string;
  highlights: string[];
};

export type PublicationProvider = {
  listPublications(): Promise<PublicationPreview[]>;
  getPublicationBySlug(slug: string): Promise<PublicationPreview | null>;
};
```

Update [`frontend/src/features/publication/staticPublicationContent.ts`](/Users/brenda/Projects/Asian-Mathematical-Network/frontend/src/features/publication/staticPublicationContent.ts):

```ts
import type { PublicationPreview } from './types';

export const publicationPreviews: PublicationPreview[] = [
  {
    id: 'publication-001',
    slug: 'algebraic-geometry-school-notes',
    title: 'Algebraic Geometry School Notes',
    seriesLabel: 'School notes',
    ctaLabel: 'Read notes',
    summary:
      'Lecture notes and reading guidance from the 2026 algebraic geometry school, prepared for regional cohort use.',
    publicationFocus:
      'The notes capture how the school taught core topics, structured the cohort, and extended workshop themes into training material.',
    highlights: ['Lecture notes set', 'Reading list', 'Cohort study prompts'],
  },
  {
    id: 'publication-002',
    slug: 'mobility-and-collaboration-digest',
    title: 'Mobility and Collaboration Digest',
    seriesLabel: 'Research digest',
    ctaLabel: 'Read digest',
    summary:
      'A short-form digest connecting travel support, conference participation, and regional collaboration planning.',
    publicationFocus:
      'This digest records how mobility funding helps turn conference attendance into longer collaboration across institutions.',
    highlights: ['Mobility case note', 'Collaboration route map', 'Follow-up reading'],
  },
];
```

Create [`frontend/src/features/publication/publicationProvider.ts`](/Users/brenda/Projects/Asian-Mathematical-Network/frontend/src/features/publication/publicationProvider.ts):

```ts
import { publicationPreviews } from './staticPublicationContent';
import type { PublicationProvider } from './types';

export const publicationProvider: PublicationProvider = {
  async listPublications() {
    return publicationPreviews.map((item) => structuredClone(item));
  },

  async getPublicationBySlug(slug) {
    return structuredClone(publicationPreviews.find((item) => item.slug === slug) ?? null);
  },
};
```

Update [`frontend/src/features/video/types.ts`](/Users/brenda/Projects/Asian-Mathematical-Network/frontend/src/features/video/types.ts):

```ts
export type VideoPreview = {
  id: string;
  slug: string;
  title: string;
  seriesLabel: string;
  ctaLabel: string;
  summary: string;
  videoFocus: string;
  highlights: string[];
};

export type VideoProvider = {
  listPublicVideos(): Promise<VideoPreview[]>;
  getVideoBySlug(slug: string): Promise<VideoPreview | null>;
};
```

Update [`frontend/src/features/video/staticVideoContent.ts`](/Users/brenda/Projects/Asian-Mathematical-Network/frontend/src/features/video/staticVideoContent.ts):

```ts
import type { VideoPreview } from './types';

export const videoPreviews: VideoPreview[] = [
  {
    id: 'video-001',
    slug: 'algebraic-geometry-school-session-recap',
    title: 'Algebraic Geometry School Session Recap',
    seriesLabel: 'School recap',
    ctaLabel: 'Watch recap',
    summary:
      'Recorded session highlights and speaker notes from the 2026 algebraic geometry training cohort.',
    videoFocus:
      'The recap shows how school activity becomes a reusable public memory layer for later participants and partner institutions.',
    highlights: ['Session recap', 'Speaker segment', 'Student Q&A excerpt'],
  },
  {
    id: 'video-002',
    slug: 'travel-grant-application-explainer',
    title: 'Travel Grant Application Explainer',
    seriesLabel: 'Grant explainer',
    ctaLabel: 'Watch explainer',
    summary:
      'A short guide to preparing a mobility application linked to an active conference or training call.',
    videoFocus:
      'This explainer clarifies how travel support relates to programme participation without collapsing the two application records.',
    highlights: ['Eligibility overview', 'Application sequence', 'Funding timeline'],
  },
];
```

Create [`frontend/src/features/video/videoProvider.ts`](/Users/brenda/Projects/Asian-Mathematical-Network/frontend/src/features/video/videoProvider.ts):

```ts
import { videoPreviews } from './staticVideoContent';
import type { VideoProvider } from './types';

export const videoProvider: VideoProvider = {
  async listPublicVideos() {
    return videoPreviews.map((item) => structuredClone(item));
  },

  async getVideoBySlug(slug) {
    return structuredClone(videoPreviews.find((item) => item.slug === slug) ?? null);
  },
};
```

Create [`frontend/src/features/outreach/types.ts`](/Users/brenda/Projects/Asian-Mathematical-Network/frontend/src/features/outreach/types.ts):

```ts
export type OutreachProgram = {
  id: string;
  title: string;
  formatLabel: string;
  summary: string;
};

export type OutreachProvider = {
  listPublicPrograms(): Promise<OutreachProgram[]>;
};
```

Update [`frontend/src/features/outreach/staticOutreachContent.ts`](/Users/brenda/Projects/Asian-Mathematical-Network/frontend/src/features/outreach/staticOutreachContent.ts):

```ts
import type { OutreachProgram } from './types';

export const outreachPrograms: OutreachProgram[] = [
  {
    id: 'outreach-001',
    title: 'Tokyo Public Lecture: Moduli After the Workshop',
    formatLabel: 'Public lecture',
    summary:
      'A public lecture that extends workshop themes into an open audience programme hosted with regional partners in Tokyo.',
  },
  {
    id: 'outreach-002',
    title: 'Academia Sinica School Visit Series',
    formatLabel: 'Campus engagement',
    summary:
      'A school-visit programme linking Asiamath scholars with students and teachers through short lectures and mentoring sessions.',
  },
  {
    id: 'outreach-003',
    title: 'Discrete Mathematics Teacher Session',
    formatLabel: 'Teacher workshop',
    summary:
      'A classroom-facing workshop translating training-week material into reusable school resources and teacher discussion prompts.',
  },
];
```

Create [`frontend/src/features/outreach/outreachProvider.ts`](/Users/brenda/Projects/Asian-Mathematical-Network/frontend/src/features/outreach/outreachProvider.ts):

```ts
import { outreachPrograms } from './staticOutreachContent';
import type { OutreachProvider } from './types';

export const outreachProvider: OutreachProvider = {
  async listPublicPrograms() {
    return outreachPrograms.map((item) => structuredClone(item));
  },
};
```

- [ ] **Step 4: Re-run the new contract test**

Run:

```bash
cd frontend && npm run test:run -- src/features/portal/supportingContentSources.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/features/portal/supportingContentSources.test.ts \
  frontend/src/features/newsletter/types.ts \
  frontend/src/features/newsletter/staticNewsletterContent.ts \
  frontend/src/features/newsletter/newsletterProvider.ts \
  frontend/src/features/publication/types.ts \
  frontend/src/features/publication/staticPublicationContent.ts \
  frontend/src/features/publication/publicationProvider.ts \
  frontend/src/features/video/types.ts \
  frontend/src/features/video/staticVideoContent.ts \
  frontend/src/features/video/videoProvider.ts \
  frontend/src/features/outreach/types.ts \
  frontend/src/features/outreach/staticOutreachContent.ts \
  frontend/src/features/outreach/outreachProvider.ts
git commit -m "feat: add provider-backed supporting content sources"
```

## Task 2: Refactor Supporting Public Pages To Consume Providers

**Files:**
- Modify: `frontend/src/pages/Outreach.tsx`
- Modify: `frontend/src/pages/Outreach.test.tsx`
- Modify: `frontend/src/pages/Newsletters.tsx`
- Modify: `frontend/src/pages/Newsletters.test.tsx`
- Modify: `frontend/src/pages/NewsletterDetail.tsx`
- Modify: `frontend/src/pages/Publications.tsx`
- Modify: `frontend/src/pages/Publications.test.tsx`
- Modify: `frontend/src/pages/PublicationDetail.tsx`
- Modify: `frontend/src/pages/Videos.tsx`
- Modify: `frontend/src/pages/Videos.test.tsx`
- Modify: `frontend/src/pages/VideoDetail.tsx`

- [ ] **Step 1: Update the page tests to expect provider-backed, realistic content**

Change [`frontend/src/pages/Outreach.test.tsx`](/Users/brenda/Projects/Asian-Mathematical-Network/frontend/src/pages/Outreach.test.tsx):

```tsx
    expect(
      await screen.findByRole('heading', { name: 'Tokyo Public Lecture: Moduli After the Workshop' })
    ).toBeInTheDocument();
    expect(screen.getByText('Public lecture')).toBeInTheDocument();
    expect(screen.getByText('Campus engagement')).toBeInTheDocument();
    expect(screen.getByText('Teacher workshop')).toBeInTheDocument();
```

Change [`frontend/src/pages/Newsletters.test.tsx`](/Users/brenda/Projects/Asian-Mathematical-Network/frontend/src/pages/Newsletters.test.tsx):

```tsx
    expect(
      await screen.findByRole('heading', { name: 'Asiamath Monthly Briefing — April 2026' })
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Workshop deadlines, school announcements, and partner updates/i)
    ).toBeInTheDocument();
    expect(screen.queryByText(/static preview/i)).not.toBeInTheDocument();
```

and update the detail assertions in the same file:

```tsx
    expect(
      screen.getByText(/This issue follows the Shanghai workshop call, linked travel support, and summer training announcements/i)
    ).toBeInTheDocument();
    expect(screen.getByText('Workshop deadline round-up')).toBeInTheDocument();
    expect(screen.getByText('Travel grant calendar')).toBeInTheDocument();
```

Change [`frontend/src/pages/Publications.test.tsx`](/Users/brenda/Projects/Asian-Mathematical-Network/frontend/src/pages/Publications.test.tsx):

```tsx
    // Replace every old slug literal `asiamath-school-notes-preview`
    // with `algebraic-geometry-school-notes` in this test file.

    expect(
      await screen.findByRole('heading', { name: 'Algebraic Geometry School Notes' })
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /read notes/i })).toHaveAttribute(
      'href',
      '/publications/algebraic-geometry-school-notes'
    );
```

and update the detail assertions in the same file:

```tsx
    renderWithRouter(
      <PublicationDetail />,
      '/publications/algebraic-geometry-school-notes',
      '/publications/:slug'
    );

    expect(
      screen.getByText(/The notes capture how the school taught core topics, structured the cohort, and extended workshop themes/i)
    ).toBeInTheDocument();
    expect(screen.getByText('Lecture notes set')).toBeInTheDocument();
    expect(screen.getByText('Reading list')).toBeInTheDocument();
```

Change [`frontend/src/pages/Videos.test.tsx`](/Users/brenda/Projects/Asian-Mathematical-Network/frontend/src/pages/Videos.test.tsx):

```tsx
    // Replace every old slug literal `asiamath-research-school-session-recap`
    // with `algebraic-geometry-school-session-recap` in this test file.

    expect(
      await screen.findByRole('heading', { name: 'Algebraic Geometry School Session Recap' })
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /watch recap/i })).toHaveAttribute(
      'href',
      '/videos/algebraic-geometry-school-session-recap'
    );
```

and update the detail assertions in the same file:

```tsx
    renderWithRouter(
      <VideoDetail />,
      '/videos/algebraic-geometry-school-session-recap',
      '/videos/:slug'
    );

    expect(
      screen.getByText(/The recap shows how school activity becomes a reusable public memory layer/i)
    ).toBeInTheDocument();
    expect(screen.getByText('Session recap')).toBeInTheDocument();
    expect(screen.getByText('Speaker segment')).toBeInTheDocument();
```

- [ ] **Step 2: Run the page tests and verify they fail**

Run:

```bash
cd frontend && npm run test:run -- \
  src/pages/Outreach.test.tsx \
  src/pages/Newsletters.test.tsx \
  src/pages/Publications.test.tsx \
  src/pages/Videos.test.tsx
```

Expected: FAIL because the pages still import the old static arrays and the old preview-language titles.

- [ ] **Step 3: Switch the list/detail pages to provider-backed loading**

Update [`frontend/src/pages/Newsletters.tsx`](/Users/brenda/Projects/Asian-Mathematical-Network/frontend/src/pages/Newsletters.tsx) to use async provider loading:

```tsx
import { useEffect, useState } from 'react';
import { newsletterProvider } from '../features/newsletter/newsletterProvider';
import type { NewsletterIssue } from '../features/newsletter/types';

const [issues, setIssues] = useState<NewsletterIssue[] | null>(null);

useEffect(() => {
  let active = true;

  newsletterProvider.listPublicIssues().then((value) => {
    if (active) {
      setIssues(value);
    }
  });

  return () => {
    active = false;
  };
}, []);
```

and render from `issues ?? []` instead of directly importing `newsletterIssues`.

Update [`frontend/src/pages/NewsletterDetail.tsx`](/Users/brenda/Projects/Asian-Mathematical-Network/frontend/src/pages/NewsletterDetail.tsx) to read issue detail through the provider:

```tsx
import { useEffect, useState } from 'react';
import { newsletterProvider } from '../features/newsletter/newsletterProvider';
import type { NewsletterIssue } from '../features/newsletter/types';

const [issue, setIssue] = useState<NewsletterIssue | null | undefined>(undefined);

useEffect(() => {
  let active = true;

  newsletterProvider.getIssueBySlug(slug).then((value) => {
    if (active) {
      setIssue(value);
    }
  });

  return () => {
    active = false;
  };
}, [slug]);
```

Use the same async pattern in [`frontend/src/pages/Publications.tsx`](/Users/brenda/Projects/Asian-Mathematical-Network/frontend/src/pages/Publications.tsx), [`frontend/src/pages/PublicationDetail.tsx`](/Users/brenda/Projects/Asian-Mathematical-Network/frontend/src/pages/PublicationDetail.tsx), [`frontend/src/pages/Videos.tsx`](/Users/brenda/Projects/Asian-Mathematical-Network/frontend/src/pages/Videos.tsx), and [`frontend/src/pages/VideoDetail.tsx`](/Users/brenda/Projects/Asian-Mathematical-Network/frontend/src/pages/VideoDetail.tsx) with the matching provider names:

```tsx
publicationProvider.listPublications()
publicationProvider.getPublicationBySlug(slug)
videoProvider.listPublicVideos()
videoProvider.getVideoBySlug(slug)
```

Update [`frontend/src/pages/Outreach.tsx`](/Users/brenda/Projects/Asian-Mathematical-Network/frontend/src/pages/Outreach.tsx) similarly:

```tsx
import { useEffect, useState } from 'react';
import { outreachProvider } from '../features/outreach/outreachProvider';
import type { OutreachProgram } from '../features/outreach/types';

const [programs, setPrograms] = useState<OutreachProgram[] | null>(null);

useEffect(() => {
  let active = true;

  outreachProvider.listPublicPrograms().then((value) => {
    if (active) {
      setPrograms(value);
    }
  });

  return () => {
    active = false;
  };
}, []);
```

Preserve current `PortalShell`, return-context logic, and CTA destinations. Do not introduce new routes in this task.

- [ ] **Step 4: Re-run the targeted page tests**

Run:

```bash
cd frontend && npm run test:run -- \
  src/pages/Outreach.test.tsx \
  src/pages/Newsletters.test.tsx \
  src/pages/Publications.test.tsx \
  src/pages/Videos.test.tsx
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/pages/Outreach.tsx \
  frontend/src/pages/Outreach.test.tsx \
  frontend/src/pages/Newsletters.tsx \
  frontend/src/pages/Newsletters.test.tsx \
  frontend/src/pages/NewsletterDetail.tsx \
  frontend/src/pages/Publications.tsx \
  frontend/src/pages/Publications.test.tsx \
  frontend/src/pages/PublicationDetail.tsx \
  frontend/src/pages/Videos.tsx \
  frontend/src/pages/Videos.test.tsx \
  frontend/src/pages/VideoDetail.tsx
git commit -m "refactor: load public support pages through feature providers"
```

## Task 3: Move Homepage Supporting Sections To Feature-Owned Sources

**Files:**
- Modify: `frontend/src/features/prize/fakePrizeProvider.ts`
- Modify: `frontend/src/features/partner/fakePartnerProvider.ts`
- Modify: `frontend/src/pages/Partners.tsx`
- Modify: `frontend/src/pages/Partners.test.tsx`
- Modify: `frontend/src/features/portal/homepageViewModel.ts`
- Modify: `frontend/src/features/portal/homepageViewModel.test.ts`

- [ ] **Step 1: Update the homepage view-model test to expect provider-owned supporting content**

Change [`frontend/src/features/portal/homepageViewModel.test.ts`](/Users/brenda/Projects/Asian-Mathematical-Network/frontend/src/features/portal/homepageViewModel.test.ts):

```tsx
    expect(model.prizeTeaser.items[0]).toEqual({
      label: 'Asiamath Early Career Prize 2026',
      meta: '2026 cycle · Selection process',
    });

    expect(model.outreachTeaser.links[0]).toEqual({
      label: 'Tokyo Public Lecture: Moduli After the Workshop',
      description:
        'A public lecture that extends workshop themes into an open audience programme hosted with regional partners in Tokyo.',
      href: '/outreach',
    });

    expect(model.networkStories[0]).toEqual({
      kind: 'Newsletter',
      title: 'Asiamath Monthly Briefing — April 2026',
      meta: 'April 2026 issue',
      summary:
        'Workshop deadlines, school announcements, and partner updates from across the current Asiamath cycle.',
      href: '/newsletter',
    });

    expect(model.partnerStrip.map((item) => item.label)).toEqual([
      'National University of Singapore',
      'Indian Statistical Institute',
      'Academia Sinica',
      'Tsinghua University',
    ]);
```

Update [`frontend/src/pages/Partners.test.tsx`](/Users/brenda/Projects/Asian-Mathematical-Network/frontend/src/pages/Partners.test.tsx):

```tsx
    expect(
      await screen.findByRole('heading', { name: 'National University of Singapore' })
    ).toBeInTheDocument();
    expect(screen.getByText('Member institution')).toBeInTheDocument();
    expect(screen.getByText('Singapore')).toBeInTheDocument();
    expect(
      screen.getByText(/regional workshops, training programmes, and scholar collaboration/i)
    ).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /collaboration pathway/i })).toBeInTheDocument();
```

- [ ] **Step 2: Run the view-model test to verify it fails**

Run:

```bash
cd frontend && npm run test:run -- \
  src/features/portal/homepageViewModel.test.ts \
  src/pages/Partners.test.tsx
```

Expected: FAIL because `homepageViewModel.ts` still hardcodes portal-local teaser arrays and the partners surface still reflects the old breadth-copy seed data.

- [ ] **Step 3: Rewrite feature seeds and aggregate them in the portal view model**

Update [`frontend/src/features/prize/fakePrizeProvider.ts`](/Users/brenda/Projects/Asian-Mathematical-Network/frontend/src/features/prize/fakePrizeProvider.ts):

```ts
const prizeSeed: PrizeDetail[] = [
  {
    id: 'prize-001',
    slug: 'asiamath-early-career-prize-2026',
    title: 'Asiamath Early Career Prize 2026',
    cycleLabel: '2026 cycle',
    shortLabel: 'Prize archive',
    ctaLabel: 'View prize',
    summary:
      'A public archive record for early-career recognition across the Asiamath network.',
    positioning:
      'This prize highlights research distinction, regional contribution, and scholar visibility across member institutions.',
    audience:
      'Early-career mathematicians, nominators, and committee members working across the network.',
    selectionPreview:
      'Nominations, committee review, and citation release remain visible as one public recognition pathway.',
    governanceSignals: ['Nomination record', 'Committee review', 'Released citation'],
  },
];

const toListItem = (prize: PrizeDetail): PrizeListItem => ({
  id: prize.id,
  slug: prize.slug,
  title: prize.title,
  cycleLabel: prize.cycleLabel,
  shortLabel: prize.shortLabel,
  ctaLabel: prize.ctaLabel,
  summary: prize.summary,
  stageLabel: 'Selection process',
});
```

Update [`frontend/src/features/partner/fakePartnerProvider.ts`](/Users/brenda/Projects/Asian-Mathematical-Network/frontend/src/features/partner/fakePartnerProvider.ts):

```ts
const partnerSeed: PartnerListItem[] = [
  {
    id: 'partner-001',
    slug: 'national-university-of-singapore',
    title: 'National University of Singapore',
    sectorLabel: 'Member institution',
    geographyLabel: 'Singapore',
    summary:
      'A member institution participating in regional workshops, training programmes, and scholar collaboration across the network.',
    matchingFocus:
      'Active in geometry, analysis, and cross-institution training collaborations.',
  },
  {
    id: 'partner-002',
    slug: 'indian-statistical-institute',
    title: 'Indian Statistical Institute',
    sectorLabel: 'Member institution',
    geographyLabel: 'India',
    summary:
      'A long-standing mathematical research institution contributing to training, collaboration, and network visibility.',
    matchingFocus:
      'Interested in combinatorics, probability, and joint student-facing programmes.',
  },
  {
    id: 'partner-003',
    slug: 'academia-sinica',
    title: 'Academia Sinica',
    sectorLabel: 'Member institution',
    geographyLabel: 'Taiwan',
    summary:
      'A research anchor for scholar exchange, school visits, and advanced training partnerships.',
    matchingFocus:
      'Strong in PDE, analysis, and public-facing mathematical programming.',
  },
  {
    id: 'partner-004',
    slug: 'tsinghua-university',
    title: 'Tsinghua University',
    sectorLabel: 'Member institution',
    geographyLabel: 'China',
    summary:
      'A network institution supporting conferences, thematic schools, and long-term academic exchange.',
    matchingFocus:
      'Interested in algebraic geometry, number theory, and collaborative supervision routes.',
  },
];
```

Update [`frontend/src/pages/Partners.tsx`](/Users/brenda/Projects/Asian-Mathematical-Network/frontend/src/pages/Partners.tsx):

```tsx
      description="Institutional collaborations and member-network relationships across the Asiamath region."
```

and replace the aside block copy with:

```tsx
          <h2>Collaboration pathway</h2>
          <p className="public-browse-copy">
            Many collaborations begin with a public scholar profile, a clear research fit, and a
            visible institutional host across the network.
          </p>
```

Update [`frontend/src/features/portal/homepageViewModel.ts`](/Users/brenda/Projects/Asian-Mathematical-Network/frontend/src/features/portal/homepageViewModel.ts) so `loadPortalHomepageViewModel()` loads supporting content through providers:

```ts
import { prizeProvider } from '../prize/prizeProvider';
import { partnerProvider } from '../partner/partnerProvider';
import { outreachProvider } from '../outreach/outreachProvider';
import { newsletterProvider } from '../newsletter/newsletterProvider';
import { publicationProvider } from '../publication/publicationProvider';
import { videoProvider } from '../video/videoProvider';
```

and extends the `Promise.all` bundle:

```ts
  const [
    conferences,
    grants,
    schools,
    scholarDirectory,
    prizes,
    partners,
    outreachPrograms,
    newsletters,
    publications,
    videos,
  ] = await Promise.all([
    conferenceProvider.listPublicConferences(),
    grantProvider.listPublicGrants(),
    schoolProvider.listPublicSchools(),
    scholarDirectoryProvider.getDirectoryViewModel(),
    prizeProvider.listPublicPrizes(),
    partnerProvider.listPublicPartners(),
    outreachProvider.listPublicPrograms(),
    newsletterProvider.listPublicIssues(),
    publicationProvider.listPublications(),
    videoProvider.listPublicVideos(),
  ]);
```

Then replace the portal-local hardcoded arrays with provider-backed mappings:

```ts
    prizeTeaser: {
      title: 'Prize archive & nominations',
      summary:
        'Current and recent prize cycles across the network, with public-facing records of recognition and committee release.',
      href: '/prizes',
      items: prizes.slice(0, 3).map((item) => ({
        label: item.title,
        meta: `${item.cycleLabel} · ${item.stageLabel}`,
      })),
    },
    outreachTeaser: {
      title: 'Outreach & engagement',
      summary:
        'Public lectures, school visits, and classroom-facing programmes extend network activity beyond the application cycle.',
      href: '/outreach',
      links: outreachPrograms.slice(0, 3).map((item) => ({
        label: item.title,
        description: item.summary,
        href: '/outreach',
      })),
    },
    networkStories: [
      ...newsletters.slice(0, 1).map((item) => ({
        kind: 'Newsletter' as const,
        title: item.title,
        meta: item.issueLabel,
        summary: item.summary,
        href: '/newsletter',
      })),
      ...publications.slice(0, 1).map((item) => ({
        kind: 'Publication' as const,
        title: item.title,
        meta: item.seriesLabel,
        summary: item.summary,
        href: '/publications',
      })),
      ...videos.slice(0, 1).map((item) => ({
        kind: 'Video' as const,
        title: item.title,
        meta: item.seriesLabel,
        summary: item.summary,
        href: '/videos',
      })),
    ],
    partnerStrip: partners.slice(0, 4).map((item) => ({
      label: item.title,
      href: '/partners',
    })),
```

Do not change opportunity and scholar loading behavior in this task.

- [ ] **Step 4: Re-run the view-model test**
- [ ] **Step 4: Re-run the view-model and partner-page tests**

Run:

```bash
cd frontend && npm run test:run -- \
  src/features/portal/homepageViewModel.test.ts \
  src/pages/Partners.test.tsx
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/features/prize/fakePrizeProvider.ts \
  frontend/src/features/partner/fakePartnerProvider.ts \
  frontend/src/pages/Partners.tsx \
  frontend/src/pages/Partners.test.tsx \
  frontend/src/features/portal/homepageViewModel.ts \
  frontend/src/features/portal/homepageViewModel.test.ts
git commit -m "refactor: source portal supporting teasers from feature data"
```

## Task 4: Remove Remaining Homepage Meta Copy And Verify The Final Contract

**Files:**
- Modify: `frontend/src/pages/Portal.tsx`
- Modify: `frontend/src/pages/Portal.test.tsx`
- Modify: `frontend/src/features/portal/homepageViewModel.ts`

- [ ] **Step 1: Tighten the homepage test around visitor-facing copy**

Update [`frontend/src/pages/Portal.test.tsx`](/Users/brenda/Projects/Asian-Mathematical-Network/frontend/src/pages/Portal.test.tsx):

```tsx
  expect(
    within(opportunitiesSection as HTMLElement).getByRole('heading', {
      name: /current pathway: workshop, travel support, and summer training/i,
    })
  ).toBeInTheDocument();

  expect(
    within(opportunitiesSection as HTMLElement).getByText(
      /start with the asiamath 2026 workshop in shanghai, follow the related travel grant, and continue into the july algebraic geometry school/i
    )
  ).toBeInTheDocument();

  expect(screen.getByText(/recent issues, notes, and recordings from across the network/i)).toBeInTheDocument();
  expect(screen.getByText(/member institutions and collaborating organisations across the region/i)).toBeInTheDocument();

  expect(screen.queryByText(/module index|placeholder|static preview|current application moment/i)).not.toBeInTheDocument();
```

- [ ] **Step 2: Run the homepage tests to verify they fail**

Run:

```bash
cd frontend && npm run test:run -- src/pages/Portal.test.tsx
```

Expected: FAIL because `Portal.tsx` still contains meta copy about homepage structure and network proof.

- [ ] **Step 3: Rewrite the homepage copy to visitor-facing editorial text**

Update [`frontend/src/pages/Portal.tsx`](/Users/brenda/Projects/Asian-Mathematical-Network/frontend/src/pages/Portal.tsx) in the opportunities sidebar card:

```tsx
              <article className="portal-home__editorial-note surface-card">
                <p className="portal-home__section-kicker">Current pathway</p>
                <h3>Current pathway: workshop, travel support, and summer training</h3>
                <p>
                  Start with the Asiamath 2026 Workshop in Shanghai, follow the related travel
                  grant, and continue into the July algebraic geometry school. These linked calls
                  mark the current cycle across the network.
                </p>
              </article>
```

Update the `From the Network` section copy:

```tsx
              <p>
                Recent issues, notes, and recordings from across the network.
              </p>
```

Update the `Institutions & partners` section copy:

```tsx
            <p>
              Member institutions and collaborating organisations across the region.
            </p>
```

Rewrite the remaining homepage summary/callout strings in [`frontend/src/features/portal/homepageViewModel.ts`](/Users/brenda/Projects/Asian-Mathematical-Network/frontend/src/features/portal/homepageViewModel.ts) to visitor-facing programme language:

```ts
      note: 'Current cycle includes the Shanghai workshop, linked travel support, and July training cohorts.',
```

and:

```ts
      callout:
        'Programme details, linked travel support, and related training pathways are available from this call.',
```

- [ ] **Step 4: Run the final homepage and breadth verification suite**

Run:

```bash
cd frontend && npm run test:run -- \
  src/features/portal/supportingContentSources.test.ts \
  src/features/portal/homepageViewModel.test.ts \
  src/pages/Portal.test.tsx \
  src/pages/Outreach.test.tsx \
  src/pages/Newsletters.test.tsx \
  src/pages/Publications.test.tsx \
  src/pages/Videos.test.tsx \
  src/pages/Partners.test.tsx \
  src/components/layout/PublicPortalNav.test.tsx
```

Expected: PASS.

Then run:

```bash
cd frontend && npm run build
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/pages/Portal.tsx \
  frontend/src/pages/Portal.test.tsx \
  frontend/src/features/portal/homepageViewModel.ts
git commit -m "feat: make portal supporting sections feel live"
```
