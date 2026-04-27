import { beforeEach, expect, it } from 'vitest';
import { screen, within } from '@testing-library/react';
import { renderWithRouter } from '../test/renderWithRouter';
import Portal from './Portal';

beforeEach(() => {
  localStorage.clear();
});

it('renders a compact public homepage hero with sign-in and discovery actions', async () => {
  renderWithRouter(<Portal />, '/portal', '/portal');

  expect(screen.getByText(/regional opportunities/i)).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Newsletter' })).toBeInTheDocument();
  expect(
    screen.getByRole('heading', {
      name: /opportunities and scholarly exchange across the asian mathematical network/i,
    })
  ).toBeInTheDocument();
  expect(screen.getByRole('heading', { name: /network at a glance/i })).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Sign in' })).toHaveAttribute('href', '/login');
  expect(screen.getByRole('link', { name: 'Browse opportunities' })).toHaveAttribute(
    'href',
    '/opportunities'
  );
  expect(screen.getByRole('link', { name: 'Browse Conferences' })).toHaveAttribute(
    'href',
    '/conferences'
  );
  expect(screen.getByRole('link', { name: 'Explore Travel Grants' })).toHaveAttribute(
    'href',
    '/grants'
  );
  expect(screen.getByText('Open now')).toBeInTheDocument();
  expect(await screen.findByText(/conferences open/i)).toBeInTheDocument();
  expect(screen.getByText(/grants open/i)).toBeInTheDocument();
  expect(screen.getByText(/schools active/i)).toBeInTheDocument();
});

it('renders featured public opportunity cards sourced from the public providers', async () => {
  renderWithRouter(<Portal />, '/portal', '/portal');

  const featuredHeading = await screen.findByRole('heading', {
    name: /featured opportunities/i,
  });
  const featuredSection = featuredHeading.closest('section');

  expect(featuredSection).not.toBeNull();
  expect(within(featuredSection as HTMLElement).getByRole('link', { name: 'Asiamath 2026 Workshop' })).toHaveAttribute(
    'href',
    '/conferences/asiamath-2026-workshop'
  );
  expect(within(featuredSection as HTMLElement).getByRole('link', { name: 'Asiamath 2026 Travel Grant' })).toHaveAttribute(
    'href',
    '/grants/asiamath-2026-travel-grant'
  );
  expect(
    screen.getByRole('link', {
      name: 'Asia-Pacific Research School in Algebraic Geometry',
    })
  ).toHaveAttribute('href', '/schools/algebraic-geometry-research-school-2026');
  expect(within(featuredSection as HTMLElement).getByText('Conference')).toBeInTheDocument();
  expect(within(featuredSection as HTMLElement).getByText('Travel Grant')).toBeInTheDocument();
});

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
