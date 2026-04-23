import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithRouter } from '../test/renderWithRouter';
import Newsletters from './Newsletters';
import NewsletterDetail from './NewsletterDetail';

describe('newsletter preview pages', () => {
  it('renders the newsletter archive as a static breadth surface', async () => {
    renderWithRouter(<Newsletters />, '/newsletter', '/newsletter');

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
});
