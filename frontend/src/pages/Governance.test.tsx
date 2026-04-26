import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { renderWithRouter } from '../test/renderWithRouter';
import Governance from './Governance';

describe('governance preview page', () => {
  it('renders the governance preview surface with preview-perspective framing and a return link', async () => {
    renderWithRouter(
      <Governance />,
      '/admin/governance',
      '/admin/governance'
    );

    expect(screen.getByRole('navigation', { name: /public sections/i })).toBeInTheDocument();
    expect(await screen.findByRole('heading', { name: 'Governance' })).toBeInTheDocument();
    expect(screen.getAllByText('Governance preview')).toHaveLength(2);
    expect(
      screen.getByText(/static preview of how a future admin governance layer could frame committee boundaries/i)
    ).toBeInTheDocument();
    expect(screen.getByText('Admin preview perspective')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /committee workflow preview/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /decision release controls/i })).toBeInTheDocument();
  });

  it('shows a return link when entered from a prize detail teaser', async () => {
    render(
      <MemoryRouter
        initialEntries={[
          {
            pathname: '/admin/governance',
            state: {
              returnContext: {
                to: '/prizes/asiamath-early-career-prize-2026',
                label: 'Back to prize',
              },
            },
          },
        ]}
      >
        <Routes>
          <Route path="/admin/governance" element={<Governance />} />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByRole('link', { name: /back to prize/i })).toHaveAttribute(
      'href',
      '/prizes/asiamath-early-career-prize-2026'
    );
  });
});
