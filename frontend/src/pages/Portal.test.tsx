import { expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithRouter } from '../test/renderWithRouter';
import Portal from './Portal';

it('surfaces prizes from the portal browse entrypoints', async () => {
  renderWithRouter(<Portal />, '/portal', '/portal');

  expect(await screen.findByRole('heading', { name: 'Portal' })).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Browse prizes' })).toHaveAttribute('href', '/prizes');
  expect(
    screen.getByText(/Recognition archives that preview nomination, review, and release surfaces/i)
  ).toBeInTheDocument();
});

it('surfaces partners from the portal browse entrypoints', async () => {
  renderWithRouter(<Portal />, '/portal', '/portal');

  expect(await screen.findByRole('heading', { name: 'Portal' })).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Browse partners' })).toHaveAttribute('href', '/partners');
  expect(
    screen.getByText(/Applied collaboration teasers and expertise-matching pathways/i)
  ).toBeInTheDocument();
});

it('surfaces a presenter-safe demo flow from the portal entry', async () => {
  renderWithRouter(<Portal />, '/portal', '/portal');

  expect(await screen.findByRole('heading', { name: 'Portal' })).toBeInTheDocument();
  expect(screen.getByRole('heading', { name: /presenter-safe demo flow/i })).toBeInTheDocument();
  expect(screen.getByRole('link', { name: /start with published conferences/i })).toHaveAttribute(
    'href',
    '/conferences'
  );
  expect(screen.getByRole('link', { name: /continue to sign in/i })).toHaveAttribute(
    'href',
    '/login'
  );
  expect(screen.getByRole('link', { name: /jump to my applications/i })).toHaveAttribute(
    'href',
    '/me/applications'
  );
});
