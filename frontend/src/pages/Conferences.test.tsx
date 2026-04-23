import { beforeEach, describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithRouter } from '../test/renderWithRouter';
import { resetConferenceFakeState } from '../features/conference/fakeConferenceProvider';
import Conferences from './Conferences';
import ConferenceDetail from './ConferenceDetail';

describe('conference public pages', () => {
  beforeEach(() => {
    localStorage.clear();
    resetConferenceFakeState();
  });

  it('renders the public conference list and hides organizer-only drafts', async () => {
    renderWithRouter(<Conferences />, '/conferences', '/conferences');

    expect(await screen.findByRole('heading', { name: 'Asiamath 2026 Workshop' })).toBeInTheDocument();
    expect(screen.queryByText('Organizer Draft 2026')).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: /view details/i })).toHaveAttribute(
      'href',
      '/conferences/asiamath-2026-workshop'
    );
  });

  it('shows a return link to my applications when an applicant token is present', async () => {
    localStorage.setItem('token', 'applicant-1');

    renderWithRouter(<Conferences />, '/conferences', '/conferences');

    expect(await screen.findByRole('heading', { name: 'Asiamath 2026 Workshop' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /back to my applications/i })).toHaveAttribute(
      'href',
      '/me/applications'
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
});
