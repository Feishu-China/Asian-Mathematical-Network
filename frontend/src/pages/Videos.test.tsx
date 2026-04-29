import { afterEach, describe, expect, it, vi } from 'vitest';
import { render } from '@testing-library/react';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { renderWithRouter } from '../test/renderWithRouter';
import Newsletters from './Newsletters';
import Videos from './Videos';
import VideoDetail from './VideoDetail';
import { videoProvider } from '../features/video/videoProvider';

describe('video pages', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders the video archive with provider-backed records', async () => {
    renderWithRouter(<Videos />, '/videos', '/videos');

    expect(
      await screen.findByRole('heading', { name: 'Algebraic Geometry School Session Recap' })
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Browse recorded sessions, explainers, and media recaps/i)
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /watch recap/i })).toHaveAttribute(
      'href',
      '/videos/algebraic-geometry-school-session-recap'
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
      await screen.findByRole('heading', { name: 'Algebraic Geometry School Session Recap' })
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /back to school/i })).toHaveAttribute(
      'href',
      '/schools/algebraic-geometry-research-school-2026'
    );
  });

  it('renders video detail with recap framing and a parent return link', async () => {
    renderWithRouter(
      <VideoDetail />,
      '/videos/algebraic-geometry-school-session-recap',
      '/videos/:slug'
    );

    expect(
      await screen.findByRole('heading', { name: 'Algebraic Geometry School Session Recap' })
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /back to videos/i })).toHaveAttribute(
      'href',
      '/videos'
    );
    expect(screen.getByRole('heading', { name: /video focus/i })).toBeInTheDocument();
    expect(
      screen.getByText(/The recap shows how school activity becomes a reusable public memory layer/i)
    ).toBeInTheDocument();
    expect(screen.getByText('Session recap')).toBeInTheDocument();
    expect(screen.getByText('Speaker segment')).toBeInTheDocument();
  });

  it('preserves a return link to video detail when moving from the archive into newsletter', async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter initialEntries={['/videos/algebraic-geometry-school-session-recap']}>
        <Routes>
          <Route path="/videos/:slug" element={<VideoDetail />} />
          <Route path="/newsletter" element={<Newsletters />} />
        </Routes>
      </MemoryRouter>
    );

    await screen.findByRole('link', { name: /open newsletter archive/i });
    await user.click(screen.getByRole('link', { name: /open newsletter archive/i }));

    expect(await screen.findByRole('link', { name: /back to video/i })).toHaveAttribute(
      'href',
      '/videos/algebraic-geometry-school-session-recap'
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

    await user.click(screen.getByRole('link', { name: /watch recap/i }));
    await user.click(await screen.findByRole('link', { name: /open newsletter archive/i }));
    await user.click(await screen.findByRole('link', { name: /back to video/i }));
    await user.click(await screen.findByRole('link', { name: /back to videos/i }));

    expect(await screen.findByRole('link', { name: /back to school/i })).toHaveAttribute(
      'href',
      '/schools/algebraic-geometry-research-school-2026'
    );
  });

  it('renders an error state when the video list request fails', async () => {
    vi.spyOn(videoProvider, 'listPublicVideos').mockRejectedValueOnce(new Error('Backend unavailable'));

    renderWithRouter(<Videos />, '/videos', '/videos');

    expect(await screen.findByText('Video archive unavailable')).toBeInTheDocument();
    expect(screen.getByText(/We could not load the public video archive right now/i)).toBeInTheDocument();
  });

  it('renders an error state when the video detail request fails', async () => {
    vi.spyOn(videoProvider, 'getVideoBySlug').mockRejectedValueOnce(new Error('Backend unavailable'));

    renderWithRouter(
      <VideoDetail />,
      '/videos/algebraic-geometry-school-session-recap',
      '/videos/:slug'
    );

    expect(await screen.findByText('Video archive unavailable')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /back to videos/i })).toHaveAttribute(
      'href',
      '/videos'
    );
    expect(screen.getByText(/We could not load this video right now/i)).toBeInTheDocument();
  });
});
