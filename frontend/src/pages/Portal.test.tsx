import { beforeEach, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithRouter } from '../test/renderWithRouter';
import Portal from './Portal';

beforeEach(() => {
  localStorage.clear();
});

it('renders a compact public homepage hero with sign-in and discovery actions', async () => {
  renderWithRouter(<Portal />, '/portal', '/portal');

  expect(
    screen.getByRole('heading', {
      name: /opportunities and scholarly exchange across the asian mathematical network/i,
    })
  ).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Sign in' })).toHaveAttribute('href', '/login');
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
    await screen.findByText((_content, element) => element?.textContent === '1 open conference')
  ).toBeInTheDocument();
  expect(
    screen.getByText((_content, element) => element?.textContent === '2 open grants')
  ).toBeInTheDocument();
  expect(
    screen.getByText((_content, element) => element?.textContent === '2 active schools')
  ).toBeInTheDocument();
});

it('renders featured public opportunity cards sourced from the public providers', async () => {
  renderWithRouter(<Portal />, '/portal', '/portal');

  expect(
    await screen.findByRole('heading', {
      name: /featured opportunities/i,
    })
  ).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Asiamath 2026 Workshop' })).toHaveAttribute(
    'href',
    '/conferences/asiamath-2026-workshop'
  );
  expect(screen.getByRole('link', { name: 'Asiamath 2026 Travel Grant' })).toHaveAttribute(
    'href',
    '/grants/asiamath-2026-travel-grant'
  );
  expect(
    screen.getByRole('link', { name: 'Asia-Pacific Research School in Algebraic Geometry' })
  ).toHaveAttribute('href', '/schools/algebraic-geometry-research-school-2026');
  expect(screen.getByText('Conference')).toBeInTheDocument();
  expect(screen.getByText('Travel Grant')).toBeInTheDocument();
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
