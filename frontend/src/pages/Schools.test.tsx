import { beforeEach, describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { renderWithRouter } from '../test/renderWithRouter';
import { resetSchoolFakeState } from '../features/school/fakeSchoolProvider';
import Schools from './Schools';
import SchoolDetail from './SchoolDetail';

describe('school public pages', () => {
  beforeEach(() => {
    localStorage.clear();
    resetSchoolFakeState();
  });

  it('renders the public school list as a distinct opportunity family', async () => {
    renderWithRouter(<Schools />, '/schools', '/schools');

    expect(screen.getByRole('navigation', { name: /public sections/i })).toBeInTheDocument();
    expect(
      await screen.findByRole('heading', { name: 'Asia-Pacific Research School in Algebraic Geometry' })
    ).toBeInTheDocument();
    expect(screen.getByText('Training programs')).toBeInTheDocument();
    expect(screen.getByText(/School and training opportunities distinct from conferences/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /view school/i })).toHaveAttribute(
      'href',
      '/schools/algebraic-geometry-research-school-2026'
    );
  });

  it('renders school detail with travel-support and outputs teasers', async () => {
    renderWithRouter(
      <SchoolDetail />,
      '/schools/algebraic-geometry-research-school-2026',
      '/schools/:slug'
    );

    expect(screen.getByRole('navigation', { name: /public sections/i })).toBeInTheDocument();
    expect(
      await screen.findByRole('heading', {
        name: 'Asia-Pacific Research School in Algebraic Geometry',
      })
    ).toBeInTheDocument();
    expect(screen.getByText('Travel support available')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /back to schools/i })).toHaveAttribute(
      'href',
      '/schools'
    );
    expect(screen.getByRole('link', { name: /explore travel support/i })).toHaveAttribute(
      'href',
      '/grants'
    );
    expect(screen.getByRole('heading', { name: /outputs teaser/i })).toBeInTheDocument();
    expect(screen.getByText(/Videos, publications, and newsletters can grow from school activity/i)).toBeInTheDocument();
  });

  it('preserves the portal return chain through school list and detail navigation', async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter
        initialEntries={[
          {
            pathname: '/schools',
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
          <Route path="/schools" element={<Schools />} />
          <Route path="/schools/:slug" element={<SchoolDetail />} />
        </Routes>
      </MemoryRouter>
    );

    await screen.findByRole('link', { name: /view school/i });
    await user.click(screen.getByRole('link', { name: /view school/i }));
    expect(await screen.findByRole('link', { name: /back to schools/i })).toHaveAttribute(
      'href',
      '/schools'
    );

    await user.click(screen.getByRole('link', { name: /back to schools/i }));
    expect(await screen.findByRole('link', { name: /back to portal/i })).toHaveAttribute(
      'href',
      '/portal'
    );
  });
});
