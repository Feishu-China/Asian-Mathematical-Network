import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { renderWithRouter } from '../test/renderWithRouter';
import Newsletters from './Newsletters';
import Videos from './Videos';
import VideoDetail from './VideoDetail';

describe('video preview pages', () => {
  it('renders the video archive as a static breadth surface', async () => {
    renderWithRouter(<Videos />, '/videos', '/videos');

    expect(
      await screen.findByRole('heading', { name: 'Asiamath Research School Session Recap' })
    ).toBeInTheDocument();
    expect(screen.getByText('Video archive')).toBeInTheDocument();
    expect(
      screen.getByText(/Session recaps, scholar spotlights, and community explainers/i)
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /watch preview/i })).toHaveAttribute(
      'href',
      '/videos/asiamath-research-school-session-recap'
    );
  });

  it('preserves a return link to school when the archive is opened from school outputs', async () => {
    render(
      <MemoryRouter
        initialEntries={[
          {
            pathname: '/videos',
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
          <Route path="/videos" element={<Videos />} />
        </Routes>
      </MemoryRouter>
    );

    expect(
      await screen.findByRole('heading', { name: 'Asiamath Research School Session Recap' })
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /back to school/i })).toHaveAttribute(
      'href',
      '/schools/algebraic-geometry-research-school-2026'
    );
  });

  it('renders video detail with recap framing and a parent return link', async () => {
    renderWithRouter(
      <VideoDetail />,
      '/videos/asiamath-research-school-session-recap',
      '/videos/:slug'
    );

    expect(
      await screen.findByRole('heading', { name: 'Asiamath Research School Session Recap' })
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /back to videos/i })).toHaveAttribute(
      'href',
      '/videos'
    );
    expect(screen.getByRole('heading', { name: /video focus/i })).toBeInTheDocument();
    expect(
      screen.getByText(/shows how school activity can turn into a reusable content layer/i)
    ).toBeInTheDocument();
    expect(screen.getByText('Session recap preview')).toBeInTheDocument();
    expect(screen.getByText('Speaker highlight snippet')).toBeInTheDocument();
  });

  it('preserves a return link to video detail when moving from a video preview into newsletter', async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter initialEntries={['/videos/asiamath-research-school-session-recap']}>
        <Routes>
          <Route path="/videos/:slug" element={<VideoDetail />} />
          <Route path="/newsletter" element={<Newsletters />} />
        </Routes>
      </MemoryRouter>
    );

    await screen.findByRole('link', { name: /continue to editorial layer/i });
    await user.click(screen.getByRole('link', { name: /continue to editorial layer/i }));

    expect(await screen.findByRole('link', { name: /back to video/i })).toHaveAttribute(
      'href',
      '/videos/asiamath-research-school-session-recap'
    );
  });

  it('restores the school return path after going from video detail into newsletter and back out', async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter
        initialEntries={[
          {
            pathname: '/videos',
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
          <Route path="/videos" element={<Videos />} />
          <Route path="/videos/:slug" element={<VideoDetail />} />
          <Route path="/newsletter" element={<Newsletters />} />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByRole('link', { name: /back to school/i })).toHaveAttribute(
      'href',
      '/schools/algebraic-geometry-research-school-2026'
    );

    await user.click(screen.getByRole('link', { name: /watch preview/i }));
    await user.click(await screen.findByRole('link', { name: /continue to editorial layer/i }));
    await user.click(await screen.findByRole('link', { name: /back to video/i }));
    await user.click(await screen.findByRole('link', { name: /back to videos/i }));

    expect(await screen.findByRole('link', { name: /back to school/i })).toHaveAttribute(
      'href',
      '/schools/algebraic-geometry-research-school-2026'
    );
  });
});
