import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { renderWithRouter } from '../test/renderWithRouter';
import Opportunities from './Opportunities';

describe('opportunities aggregate page', () => {
  it('renders the public opportunity families with direct browse links', async () => {
    renderWithRouter(<Opportunities />, '/opportunities', '/opportunities');

    expect(await screen.findByRole('heading', { name: /browse opportunities/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /back to portal/i })).toHaveAttribute('href', '/portal');
    expect(screen.getByRole('link', { name: /browse conferences/i })).toHaveAttribute(
      'href',
      '/conferences'
    );
    expect(screen.getByRole('link', { name: /browse travel grants/i })).toHaveAttribute(
      'href',
      '/grants'
    );
    expect(screen.getByRole('link', { name: /browse schools/i })).toHaveAttribute(
      'href',
      '/schools'
    );
  });

  it('preserves a dashboard-origin return path when opened from the applicant workspace', async () => {
    render(
      <MemoryRouter
        initialEntries={[
          {
            pathname: '/opportunities',
            state: {
              returnContext: {
                to: '/dashboard',
                label: 'Back to dashboard',
              },
            },
          },
        ]}
      >
        <Routes>
          <Route path="/opportunities" element={<Opportunities />} />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByRole('link', { name: /back to dashboard/i })).toHaveAttribute(
      'href',
      '/dashboard'
    );
  });
});
