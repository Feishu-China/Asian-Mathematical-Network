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

  expect(await screen.findByRole('heading', { name: 'Asiamath 2026 Workshop' })).toBeInTheDocument();
  expect(screen.getByRole('link', { name: /alice chen/i })).toHaveAttribute(
    'href',
    '/scholars/alice-chen-demo'
  );
  expect(screen.getByText(/related scholar context/i)).toBeInTheDocument();
});
