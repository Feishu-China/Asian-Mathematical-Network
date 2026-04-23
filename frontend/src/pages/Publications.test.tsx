import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { renderWithRouter } from '../test/renderWithRouter';
import Newsletters from './Newsletters';
import Publications from './Publications';
import PublicationDetail from './PublicationDetail';

describe('publication preview pages', () => {
  it('renders the publication archive as a static breadth surface', async () => {
    renderWithRouter(<Publications />, '/publications', '/publications');

    expect(
      await screen.findByRole('heading', { name: 'Asiamath School Notes Preview' })
    ).toBeInTheDocument();
    expect(await screen.findAllByText('Publication archive')).toHaveLength(2);
    expect(
      screen.getByText(/Working papers, lecture notes, and research digests/i)
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /read preview/i })).toHaveAttribute(
      'href',
      '/publications/asiamath-school-notes-preview'
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

    expect(
      await screen.findByRole('heading', { name: 'Asiamath School Notes Preview' })
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /back to school/i })).toHaveAttribute(
      'href',
      '/schools/algebraic-geometry-research-school-2026'
    );
  });

  it('renders publication detail with archive framing and a parent return link', async () => {
    renderWithRouter(
      <PublicationDetail />,
      '/publications/asiamath-school-notes-preview',
      '/publications/:slug'
    );

    expect(
      await screen.findByRole('heading', { name: 'Asiamath School Notes Preview' })
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /back to publications/i })).toHaveAttribute(
      'href',
      '/publications'
    );
    expect(screen.getByRole('heading', { name: /publication focus/i })).toBeInTheDocument();
    expect(
      screen.getByText(/shows how school outputs can become a reusable publication layer/i)
    ).toBeInTheDocument();
    expect(screen.getByText('Lecture notes preview')).toBeInTheDocument();
    expect(screen.getByText('Research digest teaser')).toBeInTheDocument();
  });

  it('preserves a return link to publication detail when moving into newsletter', async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter initialEntries={['/publications/asiamath-school-notes-preview']}>
        <Routes>
          <Route path="/publications/:slug" element={<PublicationDetail />} />
          <Route path="/newsletter" element={<Newsletters />} />
        </Routes>
      </MemoryRouter>
    );

    await screen.findByRole('link', { name: /continue to editorial layer/i });
    await user.click(screen.getByRole('link', { name: /continue to editorial layer/i }));

    expect(await screen.findByRole('link', { name: /back to publication/i })).toHaveAttribute(
      'href',
      '/publications/asiamath-school-notes-preview'
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

    await user.click(screen.getByRole('link', { name: /read preview/i }));
    await user.click(await screen.findByRole('link', { name: /continue to editorial layer/i }));
    await user.click(await screen.findByRole('link', { name: /back to publication/i }));
    await user.click(await screen.findByRole('link', { name: /back to publications/i }));

    expect(await screen.findByRole('link', { name: /back to school/i })).toHaveAttribute(
      'href',
      '/schools/algebraic-geometry-research-school-2026'
    );
  });
});
