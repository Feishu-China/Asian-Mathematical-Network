import { afterEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { outreachProvider } from '../features/outreach/outreachProvider';
import { renderWithRouter } from '../test/renderWithRouter';
import Outreach from './Outreach';

describe('outreach page', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders the outreach landing with provider-backed public programmes', async () => {
    renderWithRouter(<Outreach />, '/outreach', '/outreach');

    expect(screen.getByRole('navigation', { name: /public sections/i })).toBeInTheDocument();
    expect(await screen.findByRole('heading', { name: 'Outreach' })).toBeInTheDocument();
    expect(screen.getByText('Outreach programs')).toBeInTheDocument();
    expect(
      screen.getByText(/public lectures, campus visits, and teacher-facing programmes/i)
    ).toBeInTheDocument();
    expect(
      await screen.findByRole('heading', { name: 'Tokyo Public Lecture: Moduli After the Workshop' })
    ).toBeInTheDocument();
    expect(screen.getByText('Public lecture')).toBeInTheDocument();
    expect(screen.getByText('Campus engagement')).toBeInTheDocument();
    expect(screen.getByText('Teacher workshop')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /community pathway/i })).toBeInTheDocument();
    expect(
      screen.getByText(
        /Outreach programs can later connect scholar profiles, event recaps, and media assets/i
      )
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /open video archive/i })).toHaveAttribute('href', '/videos');
  });

  it('renders an error state when the outreach list request fails', async () => {
    vi.spyOn(outreachProvider, 'listPublicPrograms').mockRejectedValueOnce(
      new Error('Backend unavailable')
    );

    renderWithRouter(<Outreach />, '/outreach', '/outreach');

    expect(await screen.findByText('Outreach programs unavailable')).toBeInTheDocument();
    expect(
      screen.getByText(/We could not load the public outreach programme list right now/i)
    ).toBeInTheDocument();
  });
});
