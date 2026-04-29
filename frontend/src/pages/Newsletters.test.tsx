import { afterEach, describe, expect, it, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import { render } from '@testing-library/react';
import { screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import Opportunities from './Opportunities';
import { renderWithRouter } from '../test/renderWithRouter';
import Newsletters from './Newsletters';
import NewsletterDetail from './NewsletterDetail';
import { newsletterProvider } from '../features/newsletter/newsletterProvider';

describe('newsletter pages', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders the newsletter archive with provider-backed issues', async () => {
    renderWithRouter(<Newsletters />, '/newsletter', '/newsletter');

    expect(screen.getByRole('navigation', { name: /public sections/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Newsletter' })).toBeInTheDocument();
    expect(
      await screen.findByRole('heading', { name: 'Asiamath Monthly Briefing — April 2026' })
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Workshop deadlines, school announcements, and partner updates/i)
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /read issue/i })).toHaveAttribute(
      'href',
      '/newsletter/asiamath-monthly-briefing-april-2026'
    );
  });

  it('renders newsletter detail with issue focus and highlights', async () => {
    renderWithRouter(
      <NewsletterDetail />,
      '/newsletter/asiamath-monthly-briefing-april-2026',
      '/newsletter/:slug'
    );

    expect(
      await screen.findByRole('heading', { name: 'Asiamath Monthly Briefing — April 2026' })
    ).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /issue focus/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /back to newsletter/i })).toHaveAttribute(
      'href',
      '/newsletter'
    );
    expect(
      screen.getByText(
        /This issue follows the Shanghai workshop call, linked travel support, and summer training announcements/i
      )
    ).toBeInTheDocument();
    expect(screen.getByText('Workshop deadline round-up')).toBeInTheDocument();
    expect(screen.getByText('Travel grant calendar')).toBeInTheDocument();
  });

  it('preserves a school-origin return path after opening and leaving an issue detail', async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter
        initialEntries={[
          {
            pathname: '/newsletter',
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
          <Route path="/newsletter" element={<Newsletters />} />
          <Route path="/newsletter/:slug" element={<NewsletterDetail />} />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByRole('link', { name: /back to school/i })).toHaveAttribute(
      'href',
      '/schools/algebraic-geometry-research-school-2026'
    );

    await user.click(screen.getByRole('link', { name: /read issue/i }));

    expect(await screen.findByRole('link', { name: /back to newsletter/i })).toHaveAttribute(
      'href',
      '/newsletter'
    );

    await user.click(screen.getByRole('link', { name: /back to newsletter/i }));

    expect(await screen.findByRole('link', { name: /back to school/i })).toHaveAttribute(
      'href',
      '/schools/algebraic-geometry-research-school-2026'
    );
  });

  it('preserves a return link to the newsletter issue when moving into opportunities', async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter initialEntries={['/newsletter/asiamath-monthly-briefing-april-2026']}>
        <Routes>
          <Route path="/newsletter/:slug" element={<NewsletterDetail />} />
          <Route path="/opportunities" element={<Opportunities />} />
        </Routes>
      </MemoryRouter>
    );

    await screen.findByRole('link', { name: /return to opportunities/i });
    await user.click(screen.getByRole('link', { name: /return to opportunities/i }));

    expect(await screen.findByRole('link', { name: /back to newsletter issue/i })).toHaveAttribute(
      'href',
      '/newsletter/asiamath-monthly-briefing-april-2026'
    );
    expect(screen.getByRole('heading', { name: /browse opportunities/i })).toBeInTheDocument();
  });

  it('renders an error state when the newsletter list request fails', async () => {
    vi.spyOn(newsletterProvider, 'listPublicIssues').mockRejectedValueOnce(
      new Error('Backend unavailable')
    );

    renderWithRouter(<Newsletters />, '/newsletter', '/newsletter');

    expect(await screen.findByText('Newsletter archive unavailable')).toBeInTheDocument();
    expect(
      screen.getByText(/We could not load the public newsletter archive right now/i)
    ).toBeInTheDocument();
  });

  it('renders an error state when the newsletter detail request fails', async () => {
    vi.spyOn(newsletterProvider, 'getIssueBySlug').mockRejectedValueOnce(
      new Error('Backend unavailable')
    );

    renderWithRouter(
      <NewsletterDetail />,
      '/newsletter/asiamath-monthly-briefing-april-2026',
      '/newsletter/:slug'
    );

    expect(await screen.findByText('Newsletter archive unavailable')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /back to newsletter/i })).toHaveAttribute(
      'href',
      '/newsletter'
    );
    expect(
      screen.getByText(/We could not load this newsletter issue right now/i)
    ).toBeInTheDocument();
  });
});
