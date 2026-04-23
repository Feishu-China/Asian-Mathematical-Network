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
