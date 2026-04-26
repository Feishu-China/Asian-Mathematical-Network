import { beforeEach, describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithRouter } from '../test/renderWithRouter';
import { resetConferenceFakeState } from '../features/conference/fakeConferenceProvider';
import { resetGrantFakeState } from '../features/grant/fakeGrantProvider';
import Portal from './Portal';

describe('Portal public hub', () => {
  beforeEach(() => {
    localStorage.clear();
    resetConferenceFakeState();
    resetGrantFakeState();
  });

  it('renders featured published conferences with links to their detail pages', async () => {
    renderWithRouter(<Portal />, '/portal', '/portal');

    expect(
      await screen.findByRole('link', { name: 'Asiamath 2026 Workshop' })
    ).toHaveAttribute('href', '/conferences/asiamath-2026-workshop');
    expect(screen.queryByText('Organizer Draft 2026')).not.toBeInTheDocument();
    const browseAllHrefs = screen
      .getAllByRole('link', { name: 'Browse all' })
      .map((link) => link.getAttribute('href'));
    expect(browseAllHrefs).toContain('/conferences');
    expect(browseAllHrefs).toContain('/grants');
  });

  it('renders featured published grants and hides draft grants', async () => {
    renderWithRouter(<Portal />, '/portal', '/portal');

    expect(
      await screen.findByRole('link', { name: 'Asiamath 2026 Travel Grant' })
    ).toHaveAttribute('href', '/grants/asiamath-2026-travel-grant');
    expect(screen.queryByText('Asiamath 2026 Draft Grant')).not.toBeInTheDocument();
  });

  it('renders account links to sign in, register, and the applicant dashboard', async () => {
    renderWithRouter(<Portal />, '/portal', '/portal');

    expect(await screen.findByRole('link', { name: 'Sign in' })).toHaveAttribute(
      'href',
      '/login'
    );
    expect(screen.getByRole('link', { name: 'Create an account' })).toHaveAttribute(
      'href',
      '/register'
    );
    expect(screen.getByRole('link', { name: 'My applications' })).toHaveAttribute(
      'href',
      '/me/applications'
    );
  });
});
