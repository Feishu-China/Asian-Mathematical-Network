import { afterEach, describe, expect, it, vi } from 'vitest';
import { render } from '@testing-library/react';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { renderWithRouter } from '../test/renderWithRouter';
import Newsletters from './Newsletters';
import Publications from './Publications';
import PublicationDetail from './PublicationDetail';
import { publicationProvider } from '../features/publication/publicationProvider';

describe('publication pages', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders the publication archive with provider-backed records', async () => {
    renderWithRouter(<Publications />, '/publications', '/publications');

    expect(
      await screen.findByRole('heading', { name: 'Algebraic Geometry School Notes' })
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Browse lecture notes, digests, and public research outputs/i)
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /read notes/i })).toHaveAttribute(
      'href',
      '/publications/algebraic-geometry-school-notes'
    );
  });

  it('preserves a return link to school when the archive is opened from school outputs', async () => {
    render(
      <MemoryRouter
        initialEntries={[
          {
            pathname: '/publications',
            state: {
              returnContext: {
                to: '/schools/algebraic-geometry-research-school-2026',
                label: 'Back to school',
              },
            },
          },
        ]}
      >
        <Routes>
          <Route path="/publications" element={<Publications />} />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByRole('heading', { name: 'Algebraic Geometry School Notes' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /back to school/i })).toHaveAttribute(
      'href',
      '/schools/algebraic-geometry-research-school-2026'
    );
  });

  it('renders publication detail with archive framing and a parent return link', async () => {
    renderWithRouter(
      <PublicationDetail />,
      '/publications/algebraic-geometry-school-notes',
      '/publications/:slug'
    );

    expect(await screen.findByRole('heading', { name: 'Algebraic Geometry School Notes' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /back to publications/i })).toHaveAttribute(
      'href',
      '/publications'
    );
    expect(screen.getByRole('heading', { name: /publication focus/i })).toBeInTheDocument();
    expect(
      screen.getByText(
        /The notes capture how the school taught core topics, structured the cohort, and extended workshop themes/i
      )
    ).toBeInTheDocument();
    expect(screen.getByText('Lecture notes set')).toBeInTheDocument();
    expect(screen.getByText('Reading list')).toBeInTheDocument();
  });

  it('preserves a return link to publication detail when moving into newsletter', async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter initialEntries={['/publications/algebraic-geometry-school-notes']}>
        <Routes>
          <Route path="/publications/:slug" element={<PublicationDetail />} />
          <Route path="/newsletter" element={<Newsletters />} />
        </Routes>
      </MemoryRouter>
    );

    await screen.findByRole('link', { name: /open newsletter archive/i });
    await user.click(screen.getByRole('link', { name: /open newsletter archive/i }));

    expect(await screen.findByRole('link', { name: /back to publication/i })).toHaveAttribute(
      'href',
      '/publications/algebraic-geometry-school-notes'
    );
  });

  it('restores the school return path after going from publication detail into newsletter and back out', async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter
        initialEntries={[
          {
            pathname: '/publications',
            state: {
              returnContext: {
                to: '/schools/algebraic-geometry-research-school-2026',
                label: 'Back to school',
              },
            },
          },
        ]}
      >
        <Routes>
          <Route path="/publications" element={<Publications />} />
          <Route path="/publications/:slug" element={<PublicationDetail />} />
          <Route path="/newsletter" element={<Newsletters />} />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByRole('link', { name: /back to school/i })).toHaveAttribute(
      'href',
      '/schools/algebraic-geometry-research-school-2026'
    );

    await user.click(screen.getByRole('link', { name: /read notes/i }));
    await user.click(await screen.findByRole('link', { name: /open newsletter archive/i }));
    await user.click(await screen.findByRole('link', { name: /back to publication/i }));
    await user.click(await screen.findByRole('link', { name: /back to publications/i }));

    expect(await screen.findByRole('link', { name: /back to school/i })).toHaveAttribute(
      'href',
      '/schools/algebraic-geometry-research-school-2026'
    );
  });

  it('renders an error state when the publication list request fails', async () => {
    vi.spyOn(publicationProvider, 'listPublications').mockRejectedValueOnce(
      new Error('Backend unavailable')
    );

    renderWithRouter(<Publications />, '/publications', '/publications');

    expect(await screen.findByText('Publication archive unavailable')).toBeInTheDocument();
    expect(
      screen.getByText(/We could not load the public publication archive right now/i)
    ).toBeInTheDocument();
  });

  it('renders an error state when the publication detail request fails', async () => {
    vi.spyOn(publicationProvider, 'getPublicationBySlug').mockRejectedValueOnce(
      new Error('Backend unavailable')
    );

    renderWithRouter(
      <PublicationDetail />,
      '/publications/algebraic-geometry-school-notes',
      '/publications/:slug'
    );

    expect(await screen.findByText('Publication archive unavailable')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /back to publications/i })).toHaveAttribute(
      'href',
      '/publications'
    );
    expect(screen.getByText(/We could not load this publication right now/i)).toBeInTheDocument();
  });
});
