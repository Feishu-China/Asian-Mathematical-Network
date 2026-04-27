import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, within } from '@testing-library/react';
import { conferenceProvider } from '../features/conference/conferenceProvider';
import { renderWithRouter } from '../test/renderWithRouter';
import { resetConferenceFakeState } from '../features/conference/fakeConferenceProvider';
import Conferences from './Conferences';
import ConferenceDetail from './ConferenceDetail';

describe('conference public pages', () => {
  beforeEach(() => {
    localStorage.clear();
    resetConferenceFakeState();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders the public conference list and hides organizer-only drafts', async () => {
    renderWithRouter(<Conferences />, '/conferences', '/conferences');

    const workshopHeading = await screen.findByRole('heading', { name: 'Asiamath 2026 Workshop' });
    const workshopCard = workshopHeading.closest('article');

    expect(workshopHeading).toBeInTheDocument();
    expect(screen.queryByText('Organizer Draft 2026')).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Seoul Number Theory Forum 2026' })).toBeInTheDocument();
    expect(workshopCard).not.toBeNull();
    expect(within(workshopCard as HTMLElement).getByRole('link', { name: /view details/i })).toHaveAttribute(
      'href',
      '/conferences/asiamath-2026-workshop'
    );
  });

  it('keeps the shared public browse header, metadata row, and detail CTA visible on the list page', async () => {
    renderWithRouter(<Conferences />, '/conferences', '/conferences');

    const workshopHeading = await screen.findByRole('heading', { name: 'Asiamath 2026 Workshop' });
    const workshopCard = workshopHeading.closest('article');

    expect(screen.getByRole('navigation', { name: /public sections/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Conferences' })).toBeInTheDocument();
    expect(workshopHeading).toBeInTheDocument();
    expect(screen.getByText('Singapore')).toBeInTheDocument();
    expect(screen.getByText('2026-08-10')).toBeInTheDocument();
    expect(screen.getByText('Applications open')).toBeInTheDocument();
    expect(workshopCard).not.toBeNull();
    expect(within(workshopCard as HTMLElement).getByRole('link', { name: /view details/i })).toHaveAttribute(
      'href',
      '/conferences/asiamath-2026-workshop'
    );
  });

  it('shows a return link to the dashboard when an applicant token is present', async () => {
    localStorage.setItem('token', 'applicant-1');

    renderWithRouter(<Conferences />, '/conferences', '/conferences');

    expect(await screen.findByRole('heading', { name: 'Asiamath 2026 Workshop' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /back to dashboard/i })).toHaveAttribute(
      'href',
      '/dashboard'
    );
  });

  it('renders conference detail with an apply CTA when applications are open', async () => {
    renderWithRouter(
      <ConferenceDetail />,
      '/conferences/asiamath-2026-workshop',
      '/conferences/:slug'
    );

    expect(
      await screen.findByText('An MVP conference entry for algebra and geometry researchers.')
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /apply for conference/i })).toHaveAttribute(
      'href',
      '/conferences/asiamath-2026-workshop/apply'
    );
  });

  it('shows a return link from conference detail back to the conference list', async () => {
    renderWithRouter(
      <ConferenceDetail />,
      '/conferences/asiamath-2026-workshop',
      '/conferences/:slug'
    );

    expect(
      await screen.findByText('An MVP conference entry for algebra and geometry researchers.')
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /back to conferences/i })).toHaveAttribute(
      'href',
      '/conferences'
    );
  });

  it('renders an error state when the public conference list request fails', async () => {
    vi.spyOn(conferenceProvider, 'listPublicConferences').mockRejectedValueOnce(
      new Error('Backend unavailable')
    );

    renderWithRouter(<Conferences />, '/conferences', '/conferences');

    expect(await screen.findByText('Conference list unavailable')).toBeInTheDocument();
    expect(
      screen.getByText(/we could not load the published conference list right now/i)
    ).toBeInTheDocument();
    expect(screen.queryByText('Loading conferences...')).not.toBeInTheDocument();
  });

  it('renders an error state when the conference detail request fails', async () => {
    vi.spyOn(conferenceProvider, 'getConferenceBySlug').mockRejectedValueOnce(
      new Error('Backend unavailable')
    );

    renderWithRouter(
      <ConferenceDetail />,
      '/conferences/asiamath-2026-workshop',
      '/conferences/:slug'
    );

    expect(await screen.findByText('Conference detail unavailable')).toBeInTheDocument();
    expect(screen.getByText(/we could not load this conference right now/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /back to conferences/i })).toHaveAttribute(
      'href',
      '/conferences'
    );
  });
});
