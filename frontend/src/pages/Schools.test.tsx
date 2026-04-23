import { beforeEach, describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
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

    expect(
      await screen.findByRole('heading', {
        name: 'Asia-Pacific Research School in Algebraic Geometry',
      })
    ).toBeInTheDocument();
    expect(screen.getByText('Travel support available')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /explore travel support/i })).toHaveAttribute(
      'href',
      '/grants'
    );
    expect(screen.getByRole('heading', { name: /outputs teaser/i })).toBeInTheDocument();
    expect(screen.getByText(/Videos, publications, and newsletters can grow from school activity/i)).toBeInTheDocument();
  });
});
