import { describe, expect, it } from 'vitest';
import userEvent from '@testing-library/user-event';
import { render } from '@testing-library/react';
import { screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import Opportunities from './Opportunities';
import { renderWithRouter } from '../test/renderWithRouter';
import Newsletters from './Newsletters';
import NewsletterDetail from './NewsletterDetail';

describe('newsletter preview pages', () => {
  it('renders the newsletter archive as a static breadth surface', async () => {
    renderWithRouter(<Newsletters />, '/newsletter', '/newsletter');

    expect(screen.getByRole('navigation', { name: /public sections/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Newsletter' })).toBeInTheDocument();
    expect(
      await screen.findByRole('heading', { name: 'Asiamath Monthly Briefing - April 2026' })
    ).toBeInTheDocument();
    expect(screen.getByText('Newsletter archive')).toBeInTheDocument();
    expect(
      screen.getByText(/Editorial snapshots, program recaps, and platform signals/i)
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
      await screen.findByRole('heading', { name: 'Asiamath Monthly Briefing - April 2026' })
    ).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /issue focus/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /back to newsletter/i })).toHaveAttribute(
      'href',
      '/newsletter'
    );
    expect(
      screen.getByText(/Conference deadlines, school cohorts, and partner teasers are framed as one narrative layer/i)
    ).toBeInTheDocument();
    expect(screen.getByText('Program recap preview')).toBeInTheDocument();
    expect(screen.getByText('Call-for-action round-up')).toBeInTheDocument();
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
});
