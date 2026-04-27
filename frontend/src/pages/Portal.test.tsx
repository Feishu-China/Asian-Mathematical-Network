import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { beforeEach, expect, it } from 'vitest';
import { screen, within } from '@testing-library/react';
import { renderWithRouter } from '../test/renderWithRouter';
import Portal from './Portal';

beforeEach(() => {
  localStorage.clear();
});

it('renders an editorial public homepage hero with sign-in and network actions', async () => {
  renderWithRouter(<Portal />, '/portal', '/portal');

  expect(screen.getByText(/regional opportunities/i)).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Newsletter' })).toBeInTheDocument();
  expect(
    screen.getByRole('heading', {
      name: /connecting asia's mathematical community/i,
    })
  ).toBeInTheDocument();
  expect(screen.getByRole('heading', { name: /featured call/i })).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Sign in' })).toHaveAttribute('href', '/login');
  expect(screen.getByRole('link', { name: 'Explore opportunities' })).toHaveAttribute(
    'href',
    '/opportunities'
  );
  expect(screen.queryByRole('link', { name: 'Browse conferences' })).not.toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Meet the scholars' })).toHaveAttribute(
    'href',
    '/scholars'
  );
  expect(await screen.findByText(/open opportunities/i)).toBeInTheDocument();
  expect(screen.getByText(/scholars in network/i)).toBeInTheDocument();
});

it('renders an opportunities section that combines conferences, grants, and schools', async () => {
  renderWithRouter(<Portal />, '/portal', '/portal');

  const opportunitiesHeading = await screen.findByRole('heading', {
    name: /^opportunities$/i,
  });
  const opportunitiesSection = opportunitiesHeading.closest('section');

  expect(opportunitiesSection).not.toBeNull();
  expect(
    within(opportunitiesSection as HTMLElement).getByRole('link', {
      name: 'Asiamath 2026 Workshop',
    })
  ).toHaveAttribute(
    'href',
    '/conferences/asiamath-2026-workshop'
  );
  expect(
    within(opportunitiesSection as HTMLElement).getByRole('link', {
      name: 'Asiamath 2026 Travel Grant',
    })
  ).toHaveAttribute(
    'href',
    '/grants/asiamath-2026-travel-grant'
  );
  expect(
    within(opportunitiesSection as HTMLElement).getByRole('link', {
      name: 'Asia-Pacific Research School in Algebraic Geometry',
    })
  ).toHaveAttribute('href', '/schools/algebraic-geometry-research-school-2026');
  expect(
    within(opportunitiesSection as HTMLElement).getByRole('link', {
      name: 'Discrete Mathematics Training Week 2026',
    })
  ).toHaveAttribute('href', '/schools/discrete-math-training-week-2026');
  expect(within(opportunitiesSection as HTMLElement).getByText('Conference')).toBeInTheDocument();
  expect(within(opportunitiesSection as HTMLElement).getByText('Travel Grant')).toBeInTheDocument();
  expect(within(opportunitiesSection as HTMLElement).getAllByText('School')).not.toHaveLength(0);
  expect(within(opportunitiesSection as HTMLElement).getAllByText(/^Open$/i).length).toBeGreaterThan(0);
  expect(within(opportunitiesSection as HTMLElement).getAllByText(/^Upcoming$/i).length).toBeGreaterThan(0);
  expect(within(opportunitiesSection as HTMLElement).queryByText(/^Closed$/i)).not.toBeInTheDocument();
  expect(
    screen.queryByRole('heading', { name: /training programmes across the network/i })
  ).not.toBeInTheDocument();
});

it('keeps the featured opportunity title in the hero and the rest of the editorial mix in the opportunities section', async () => {
  renderWithRouter(<Portal />, '/portal', '/portal');

  const heroHeading = screen.getByRole('heading', {
    name: /connecting asia's mathematical community/i,
  });
  const heroSection = heroHeading.closest('section');

  const opportunitiesHeading = await screen.findByRole('heading', {
    name: /^opportunities$/i,
  });
  const opportunitiesSection = opportunitiesHeading.closest('section');

  expect(heroSection).not.toBeNull();
  expect(opportunitiesSection).not.toBeNull();
  expect(
    within(heroSection as HTMLElement).getByRole('link', { name: 'Asiamath 2026 Workshop' })
  ).toHaveAttribute('href', '/conferences/asiamath-2026-workshop');
  expect(
    within(opportunitiesSection as HTMLElement).getByRole('link', { name: 'Asiamath 2026 Workshop' })
  ).toHaveAttribute('href', '/conferences/asiamath-2026-workshop');
});

it('renders the required homepage sections in the new order', async () => {
  renderWithRouter(<Portal />, '/portal', '/portal');

  const heroHeading = screen.getByRole('heading', {
    name: /connecting asia's mathematical community/i,
  });
  const opportunitiesHeading = await screen.findByRole('heading', { name: /^opportunities$/i });
  const scholarsHeading = screen.getByRole('heading', { name: /scholars & expertise/i });
  const prizeHeading = screen.getByRole('heading', { name: /prize archive & nominations/i });
  const outreachHeading = screen.getByRole('heading', { name: /outreach & engagement/i });
  const networkHeading = screen.getByRole('heading', { name: /from the network/i });
  const partnersHeading = screen.getByRole('heading', { name: /institutions & partners/i });

  expect(heroHeading.compareDocumentPosition(opportunitiesHeading)).toBe(
    Node.DOCUMENT_POSITION_FOLLOWING
  );
  expect(opportunitiesHeading.compareDocumentPosition(scholarsHeading)).toBe(
    Node.DOCUMENT_POSITION_FOLLOWING
  );
  expect(scholarsHeading.compareDocumentPosition(prizeHeading)).toBe(
    Node.DOCUMENT_POSITION_FOLLOWING
  );
  expect(scholarsHeading.compareDocumentPosition(outreachHeading)).toBe(
    Node.DOCUMENT_POSITION_FOLLOWING
  );
  expect(prizeHeading.compareDocumentPosition(networkHeading)).toBe(
    Node.DOCUMENT_POSITION_FOLLOWING
  );
  expect(outreachHeading.compareDocumentPosition(networkHeading)).toBe(
    Node.DOCUMENT_POSITION_FOLLOWING
  );
  expect(networkHeading.compareDocumentPosition(partnersHeading)).toBe(
    Node.DOCUMENT_POSITION_FOLLOWING
  );
});

it('keeps network stories and the partner strip inside the same closing page', async () => {
  renderWithRouter(<Portal />, '/portal', '/portal');

  const networkHeading = await screen.findByRole('heading', { name: /from the network/i });
  const partnersHeading = screen.getByRole('heading', { name: /institutions & partners/i });

  expect(networkHeading.closest('section')).toBe(partnersHeading.closest('section'));
});

it('keeps scholars and expertise as a major homepage section after opportunities', async () => {
  renderWithRouter(<Portal />, '/portal', '/portal');

  const scholarsHeading = await screen.findByRole('heading', { name: /scholars & expertise/i });
  const scholarsSection = scholarsHeading.closest('section');

  expect(scholarsSection).not.toBeNull();
  expect(within(scholarsSection as HTMLElement).getByText('Algebraic Geometry')).toBeInTheDocument();
  expect(
    within(scholarsSection as HTMLElement).getByRole('link', { name: 'Prof Reviewer' })
  ).toHaveAttribute('href', '/scholars/prof-reviewer');
  expect(
    within(scholarsSection as HTMLElement).getByRole('link', { name: 'Browse Scholar Directory' })
  ).toHaveAttribute('href', '/scholars');
});

it('defines viewport-sized homepage modules so each major section can occupy one screen responsively', () => {
  const css = readFileSync(resolve(process.cwd(), 'src/pages/Portal.css'), 'utf8');

  expect(css).toMatch(/--portal-home-screen-min:\s*calc\(100svh\s*-\s*var\(--portal-home-nav-offset\)\);/);
  expect(css).toMatch(/html:has\(\.page-shell--portal\)/);
  expect(css).toMatch(/scroll-snap-type:\s*y mandatory;/);
  expect(css).toMatch(/scroll-padding-top:\s*var\(--portal-home-nav-offset\);/);
  expect(css).toMatch(/scroll-snap-align:\s*start;/);
  expect(css).toMatch(/scroll-snap-stop:\s*always;/);
  expect(css).toMatch(/min-height:\s*var\(--portal-home-screen-min\);/);
  expect(css).toMatch(/\.portal-home__closing-page/);
});

it('defines equal-height opportunity sidebar cards for the editorial mix row', () => {
  const css = readFileSync(resolve(process.cwd(), 'src/pages/Portal.css'), 'utf8');

  expect(css).toMatch(/\.portal-home__opportunity-sidebar\s*\{[^}]*grid-auto-rows:\s*1fr;/s);
  expect(css).toMatch(/\.portal-home__opportunity-sidebar\s*>\s*\*\s*\{[^}]*height:\s*100%;/s);
});
