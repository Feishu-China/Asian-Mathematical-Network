import { beforeEach, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { renderWithRouter } from '../test/renderWithRouter';
import Scholars from './Scholars';

beforeEach(() => {
  localStorage.clear();
});

function ScholarLocationProbe() {
  const location = useLocation();

  return <div>{location.pathname}</div>;
}

it('renders the public scholar directory with expertise clusters and scholar cards', async () => {
  renderWithRouter(<Scholars />, '/scholars', '/scholars');

  expect(await screen.findByRole('heading', { name: /scholar directory/i })).toBeInTheDocument();
  expect(
    screen.getByText(/browse public scholar profiles and research areas/i)
  ).toBeInTheDocument();
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

it('navigates to a scholar detail when the scholar card body is clicked', async () => {
  const user = userEvent.setup();

  render(
    <MemoryRouter initialEntries={['/scholars']}>
      <Routes>
        <Route path="/scholars" element={<Scholars />} />
        <Route path="/scholars/:slug" element={<ScholarLocationProbe />} />
      </Routes>
    </MemoryRouter>
  );

  expect(await screen.findByRole('heading', { name: /scholar directory/i })).toBeInTheDocument();

  await user.click(
    screen.getByText(
      /Supports review governance, algebraic geometry, and cross-border mathematical collaboration/i
    )
  );

  expect(await screen.findByText('/scholars/prof-reviewer')).toBeInTheDocument();
});
